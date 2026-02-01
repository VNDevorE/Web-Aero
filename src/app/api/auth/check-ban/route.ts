import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Check if current user is banned (real-time check)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.discordId) {
            return NextResponse.json({ banned: false });
        }

        // Check blacklist table directly
        const { data } = await supabase
            .from("blacklist")
            .select("id")
            .eq("discord_id", session.user.discordId)
            .limit(1);

        const isBanned = data && data.length > 0;

        return NextResponse.json({ banned: isBanned });
    } catch (error) {
        console.error("Error checking ban status:", error);
        return NextResponse.json({ banned: false });
    }
}
