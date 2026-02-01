import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Ban or unban user by Discord ID (uses blacklist table)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.discordId !== ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { discordId, ban } = await request.json();
        if (!discordId || ban === undefined) {
            return NextResponse.json({ error: "discordId and ban required" }, { status: 400 });
        }

        // Check if trying to ban self
        if (discordId === ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Cannot ban admin" }, { status: 400 });
        }

        const trimmedId = discordId.trim();

        if (ban) {
            // Add to blacklist
            const { error: insertError } = await supabase
                .from("blacklist")
                .upsert({
                    discord_id: trimmedId,
                    banned_by: session?.user?.discordId,
                    reason: "Banned by admin",
                    created_at: new Date().toISOString(),
                }, {
                    onConflict: "discord_id"
                });

            if (insertError) throw insertError;

            // Also update profile if exists
            await supabase
                .from("profiles")
                .update({ is_banned: true, banned_at: new Date().toISOString() })
                .eq("discord_id", trimmedId);

        } else {
            // Remove from blacklist (unban)
            const { error: deleteError } = await supabase
                .from("blacklist")
                .delete()
                .eq("discord_id", trimmedId);

            if (deleteError) throw deleteError;

            // Also update profile if exists
            await supabase
                .from("profiles")
                .update({ is_banned: false, banned_at: null })
                .eq("discord_id", trimmedId);
        }

        return NextResponse.json({ success: true, banned: ban });
    } catch (error) {
        console.error("Error banning user:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// GET - Get all blacklisted users
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.discordId !== ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("blacklist")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error("Error fetching blacklist:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
