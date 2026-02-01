import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID, AIRCRAFT_PRICES, AIRCRAFT_DEPRECIATION } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to get owner's airline ID
async function getOwnerAirlineId(discordId: string): Promise<string | null> {
    if (discordId === ADMIN_DISCORD_ID) {
        const { data } = await supabase.from("airlines").select("id").limit(1);
        return data?.[0]?.id || null;
    }

    const { data } = await supabase
        .from("owners")
        .select("airline_id")
        .eq("discord_id", discordId)
        .single();

    return data?.airline_id || null;
}

// GET - List fleet (aircraft belonging to airline)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.discordId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const airlineId = await getOwnerAirlineId(session.user.discordId);
        if (!airlineId) {
            return NextResponse.json({ error: "Not an owner" }, { status: 403 });
        }

        const { data, error } = await supabase
            .from("aircraft")
            .select("*")
            .eq("airline_id", airlineId)
            .order("purchase_date", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ aircraft: data || [] });
    } catch (error) {
        console.error("Error fetching fleet:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST - Buy aircraft
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.discordId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const airlineId = await getOwnerAirlineId(session.user.discordId);
        if (!airlineId) {
            return NextResponse.json({ error: "Not an owner" }, { status: 403 });
        }

        const { aircraftName } = await request.json();
        if (!aircraftName || !AIRCRAFT_PRICES[aircraftName]) {
            return NextResponse.json({ error: "Invalid aircraft" }, { status: 400 });
        }

        const price = AIRCRAFT_PRICES[aircraftName];

        // Get current airline balance
        const { data: airline, error: fetchError } = await supabase
            .from("airlines")
            .select("money")
            .eq("id", airlineId)
            .single();

        if (fetchError) throw fetchError;

        if ((airline.money || 0) < price) {
            return NextResponse.json({ error: "Không đủ tiền!" }, { status: 400 });
        }

        // Deduct from airline
        const { error: updateError } = await supabase
            .from("airlines")
            .update({ money: airline.money - price })
            .eq("id", airlineId);

        if (updateError) throw updateError;

        // Add aircraft
        const { error: insertError } = await supabase.from("aircraft").insert({
            aircraft_name: aircraftName,
            price: price,
            airline_id: airlineId,
        });

        if (insertError) throw insertError;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error buying aircraft:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE - Sell aircraft
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.discordId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const airlineId = await getOwnerAirlineId(session.user.discordId);
        if (!airlineId) {
            return NextResponse.json({ error: "Not an owner" }, { status: 403 });
        }

        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        // Get aircraft info
        const { data: aircraft, error: fetchError } = await supabase
            .from("aircraft")
            .select("*")
            .eq("id", id)
            .eq("airline_id", airlineId)
            .single();

        if (fetchError || !aircraft) {
            return NextResponse.json({ error: "Aircraft not found" }, { status: 404 });
        }

        // Calculate sell price with depreciation
        const depreciation = AIRCRAFT_DEPRECIATION[aircraft.aircraft_name] || 0.2;
        const sellPrice = Math.floor(aircraft.price * (1 - depreciation));

        // Get current airline balance
        const { data: airline } = await supabase
            .from("airlines")
            .select("money")
            .eq("id", airlineId)
            .single();

        // Add sell price to airline
        await supabase
            .from("airlines")
            .update({ money: (airline?.money || 0) + sellPrice })
            .eq("id", airlineId);

        // Delete aircraft
        const { error: deleteError } = await supabase
            .from("aircraft")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true, sellPrice });
    } catch (error) {
        console.error("Error selling aircraft:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
