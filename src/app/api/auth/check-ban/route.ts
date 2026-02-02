import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Check if current user is banned or archived (real-time check)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.discordId) {
            return NextResponse.json({ banned: false, archived: false });
        }

        const discordId = session.user.discordId;

        // Check blacklist table
        const { data: blacklistData } = await supabase
            .from("blacklist")
            .select("id")
            .eq("discord_id", discordId)
            .limit(1);

        const isBanned = blacklistData && blacklistData.length > 0;

        // Check if archived
        const { data: profileData } = await supabase
            .from("profiles")
            .select("is_archived")
            .eq("discord_id", discordId)
            .single();

        const isArchived = profileData?.is_archived === true;

        return NextResponse.json({ banned: isBanned, archived: isArchived });
    } catch (error) {
        console.error("Error checking ban/archive status:", error);
        return NextResponse.json({ banned: false, archived: false });
    }
}

