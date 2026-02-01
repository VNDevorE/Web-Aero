import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to get user's airline ID
async function getOwnerAirlineId(discordId: string): Promise<string | null> {
    // Check owners table first (for everyone including admin)
    const { data: ownerData } = await supabase
        .from("owners")
        .select("airline_id")
        .eq("discord_id", discordId)
        .single();

    if (ownerData?.airline_id) {
        return ownerData.airline_id;
    }

    // Admin fallback: if not in owners table, return first airline
    if (discordId === ADMIN_DISCORD_ID) {
        const { data } = await supabase.from("airlines").select("id").order("name").limit(1);
        return data?.[0]?.id || null;
    }

    return null;
}

// GET - List members (profiles with airline_id matching owner's airline)
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
            .from("profiles")
            .select("*")
            .eq("airline_id", airlineId)
            .order("created_at");

        if (error) throw error;

        return NextResponse.json({ members: data || [] });
    } catch (error) {
        console.error("Error fetching members:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST - Add member to airline
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

        const { discordId } = await request.json();
        if (!discordId) {
            return NextResponse.json({ error: "discordId required" }, { status: 400 });
        }

        // Check if user exists in profiles
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("discord_id", discordId.trim())
            .single();

        if (existingProfile) {
            // Check if already in another airline
            if (existingProfile.airline_id && existingProfile.airline_id !== airlineId) {
                return NextResponse.json({ error: "User đã thuộc về hãng khác!" }, { status: 400 });
            }

            // Update existing profile
            const { error } = await supabase
                .from("profiles")
                .update({ airline_id: airlineId })
                .eq("discord_id", discordId.trim());

            if (error) throw error;
        } else {
            // Create new profile
            const { error } = await supabase.from("profiles").insert({
                id: discordId.trim(),
                discord_id: discordId.trim(),
                airline_id: airlineId,
                role: "PILOT",
            });

            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error adding member:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE - Remove member from airline
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

        // Remove from airline (set airline_id to null)
        const { error } = await supabase
            .from("profiles")
            .update({ airline_id: null })
            .eq("id", id)
            .eq("airline_id", airlineId); // Ensure they're actually in this airline

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing member:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
