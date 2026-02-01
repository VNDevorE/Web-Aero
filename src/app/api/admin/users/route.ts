import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all users (excluding banned users from blacklist)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.discordId !== ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all profiles
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("*")
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

// DELETE - Remove user from profiles (soft delete - they can re-register)
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

        // Cannot delete admin
        if (discordId === ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Cannot delete admin" }, { status: 400 });
        }

        // Delete user from profiles table
        const { error } = await supabase
            .from("profiles")
            .delete()
            .eq("discord_id", discordId);

        if (error) throw error;

        // Note: Blacklist entry is NOT deleted, so if user is banned they stay banned
        // When they re-login via OAuth, a new profile will be created but they'll still be blocked

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
