import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Check if user is owner and get their airline info
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.discordId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const discordId = session.user.discordId;

        // Admin has access to first airline (or should select)
        if (discordId === ADMIN_DISCORD_ID) {
            const { data: airlines } = await supabase
                .from("airlines")
                .select("*")
                .limit(1);

            return NextResponse.json({
                isOwner: true,
                isAdmin: true,
                airline: airlines?.[0] || null,
            });
        }

        // Check owners table
        const { data: ownership, error } = await supabase
            .from("owners")
            .select("*, airlines(*)")
            .eq("discord_id", discordId)
            .limit(1)
            .single();

        if (error || !ownership) {
            return NextResponse.json({ isOwner: false, airline: null });
        }

        return NextResponse.json({
            isOwner: true,
            airline: ownership.airlines,
        });
    } catch (error) {
        console.error("Error checking ownership:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
