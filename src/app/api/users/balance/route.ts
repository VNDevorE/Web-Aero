import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch current user's balance
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.discordId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user balance from profiles table
        const { data, error } = await supabase
            .from("profiles")
            .select("balance")
            .eq("discord_id", session.user.discordId)
            .single();

        if (error) {
            console.error("Error fetching balance:", error);
            return NextResponse.json({ balance: 0 });
        }

        return NextResponse.json({ balance: data?.balance || 0 });
    } catch (error) {
        console.error("Error in balance API:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
