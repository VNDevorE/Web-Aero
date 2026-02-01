import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.discordId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { displayName } = body;

        if (!displayName || typeof displayName !== "string") {
            return NextResponse.json(
                { error: "Display name is required" },
                { status: 400 }
            );
        }

        // Update display name in profiles table
        const { data, error } = await supabase
            .from("profiles")
            .update({ display_name: displayName.trim() })
            .eq("discord_id", session.user.discordId)
            .select()
            .single();

        if (error) {
            console.error("Supabase error:", error);

            // If profile doesn't exist, create it
            if (error.code === "PGRST116") {
                const { data: newProfile, error: insertError } = await supabase
                    .from("profiles")
                    .insert({
                        id: session.user.id,
                        discord_id: session.user.discordId,
                        username: session.user.name,
                        display_name: displayName.trim(),
                    })
                    .select()
                    .single();

                if (insertError) {
                    throw insertError;
                }

                return NextResponse.json({ success: true, profile: newProfile });
            }

            throw error;
        }

        return NextResponse.json({ success: true, profile: data });
    } catch (error) {
        console.error("Settings update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.discordId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("discord_id", session.user.discordId)
            .single();

        if (error && error.code !== "PGRST116") {
            throw error;
        }

        return NextResponse.json({ profile: data || null });
    } catch (error) {
        console.error("Settings fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
