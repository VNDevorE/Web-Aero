import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Check if user is admin
async function isAdmin(session: any): Promise<boolean> {
    return session?.user?.discordId === ADMIN_DISCORD_ID;
}

// GET - List all airlines
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!await isAdmin(session)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("airlines")
            .select("*")
            .order("name");

        if (error) throw error;

        return NextResponse.json({ airlines: data });
    } catch (error) {
        console.error("Error fetching airlines:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST - Create airline
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!await isAdmin(session)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ error: "Name required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("airlines")
            .insert({
                name: name.trim(),
                money: 0,
                created_by: session?.user?.discordId,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ airline: data });
    } catch (error: any) {
        console.error("Error creating airline:", error);
        if (error.code === "23505") {
            return NextResponse.json({ error: "Airline already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE - Delete airline
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!await isAdmin(session)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("airlines")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting airline:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
