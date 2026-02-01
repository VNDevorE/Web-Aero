import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all owners
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.discordId !== ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("owners")
            .select("*, airlines(name)")
            .order("assigned_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ owners: data });
    } catch (error) {
        console.error("Error fetching owners:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST - Add owner
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.discordId !== ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { discordId, airlineId } = await request.json();
        if (!discordId || !airlineId) {
            return NextResponse.json({ error: "discordId and airlineId required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("owners")
            .insert({
                discord_id: discordId.trim(),
                airline_id: airlineId,
                assigned_by: session?.user?.discordId,
            })
            .select()
            .single();

        if (error) throw error;

        // Also update profile role to OWNER if exists
        await supabase
            .from("profiles")
            .update({ role: "OWNER" })
            .eq("discord_id", discordId.trim());

        return NextResponse.json({ owner: data });
    } catch (error: any) {
        console.error("Error adding owner:", error);
        if (error.code === "23505") {
            return NextResponse.json({ error: "Owner already assigned to this airline" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE - Remove owner
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.discordId !== ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        // Get owner info before deleting
        const { data: owner } = await supabase
            .from("owners")
            .select("discord_id")
            .eq("id", id)
            .single();

        const { error } = await supabase
            .from("owners")
            .delete()
            .eq("id", id);

        if (error) throw error;

        // Check if user is still owner of any airline
        if (owner) {
            const { data: remainingOwnerships } = await supabase
                .from("owners")
                .select("id")
                .eq("discord_id", owner.discord_id);

            if (!remainingOwnerships || remainingOwnerships.length === 0) {
                // Demote to PILOT if no more ownerships
                await supabase
                    .from("profiles")
                    .update({ role: "PILOT" })
                    .eq("discord_id", owner.discord_id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing owner:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
