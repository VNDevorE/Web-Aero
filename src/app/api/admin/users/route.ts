import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all active users (excluding banned and archived)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.discordId !== ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all profiles (excluding archived)
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("*")
            .or("is_archived.is.null,is_archived.eq.false")
            .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        // Get all blacklisted discord_ids
        const { data: blacklist, error: blacklistError } = await supabase
            .from("blacklist")
            .select("discord_id");

        if (blacklistError) throw blacklistError;

        const blacklistedIds = new Set(blacklist?.map(b => b.discord_id) || []);

        // Filter out blacklisted users from profiles list
        const users = (profiles || []).filter(p => !blacklistedIds.has(p.discord_id));

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE - Archive user (hide from list but preserve balance and role)
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.discordId !== ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const discordId = request.nextUrl.searchParams.get("discord_id");
        if (!discordId) {
            return NextResponse.json({ error: "discord_id required" }, { status: 400 });
        }

        // Cannot archive admin
        if (discordId === ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Cannot archive admin" }, { status: 400 });
        }

        // Archive user: hide from list but keep balance, role, and airline_id
        const { error } = await supabase
            .from("profiles")
            .update({ is_archived: true })
            .eq("discord_id", discordId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error archiving user:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

