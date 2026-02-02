import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to get user's airline ID
async function getOwnerAirlineId(discordId: string): Promise<string | null> {
    // Check owners table first (for everyone including admin)
    const { data: ownerData } = await supabase
        .from("owners")
        .select("airline_id")
        .eq("discord_id", discordId)
        .single();

    if (ownerData?.airline_id) {
        return ownerData.airline_id;
    }

    // Admin fallback: if not in owners table, return first airline
    if (discordId === ADMIN_DISCORD_ID) {
        const { data } = await supabase.from("airlines").select("id").order("name").limit(1);
        return data?.[0]?.id || null;
    }

    return null;
}

// GET - List members (profiles with airline_id matching owner's airline)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.discordId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const airlineId = await getOwnerAirlineId(session.user.discordId);
        if (!airlineId) {
            return NextResponse.json({ error: "Not an owner" }, { status: 403 });
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("airline_id", airlineId)
            .order("created_at");

        if (error) throw error;

        return NextResponse.json({ members: data || [] });
    } catch (error) {
        console.error("Error fetching members:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST - Add member to airline
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.discordId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const airlineId = await getOwnerAirlineId(session.user.discordId);
        if (!airlineId) {
            return NextResponse.json({ error: "Not an owner" }, { status: 403 });
        }

        const { discordId } = await request.json();
        if (!discordId) {
            return NextResponse.json({ error: "discordId required" }, { status: 400 });
        }

        const trimmedDiscordId = discordId.trim();

        // Check if user exists in profiles
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("discord_id", trimmedDiscordId)
            .single();

        if (existingProfile) {
            // Check if already in another airline
            if (existingProfile.airline_id && existingProfile.airline_id !== airlineId) {
                return NextResponse.json({ error: "User đã thuộc về hãng khác!" }, { status: 400 });
            }

            // Prepare update data
            const updateData: { airline_id: string; avatar?: string; username?: string; display_name?: string } = {
                airline_id: airlineId
            };

            // If avatar is missing, fetch from Discord
            if (!existingProfile.avatar) {
                try {
                    const discordResponse = await fetch(`https://discord.com/api/v10/users/${trimmedDiscordId}`, {
                        headers: {
                            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                        },
                    });

                    if (discordResponse.ok) {
                        const discordUser = await discordResponse.json();
                        if (discordUser.avatar) {
                            const ext = discordUser.avatar.startsWith('a_') ? 'gif' : 'png';
                            updateData.avatar = `https://cdn.discordapp.com/avatars/${trimmedDiscordId}/${discordUser.avatar}.${ext}`;
                        }
                        if (!existingProfile.username && discordUser.username) {
                            updateData.username = discordUser.username;
                            updateData.display_name = discordUser.username;
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch Discord user for update:", e);
                }
            }

            // Update existing profile
            const { error } = await supabase
                .from("profiles")
                .update(updateData)
                .eq("discord_id", trimmedDiscordId);

            if (error) throw error;
        } else {
            // Fetch user info from Discord API
            let username = trimmedDiscordId;
            let avatarUrl: string | null = null;

            try {
                const discordResponse = await fetch(`https://discord.com/api/v10/users/${trimmedDiscordId}`, {
                    headers: {
                        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                    },
                });

                if (discordResponse.ok) {
                    const discordUser = await discordResponse.json();
                    username = discordUser.username || trimmedDiscordId;

                    // Build avatar URL
                    if (discordUser.avatar) {
                        const ext = discordUser.avatar.startsWith('a_') ? 'gif' : 'png';
                        avatarUrl = `https://cdn.discordapp.com/avatars/${trimmedDiscordId}/${discordUser.avatar}.${ext}`;
                    }
                }
            } catch (discordError) {
                console.error("Failed to fetch Discord user:", discordError);
                // Continue without Discord data
            }

            // Create new profile with Discord info
            const { error } = await supabase.from("profiles").insert({
                id: trimmedDiscordId,
                discord_id: trimmedDiscordId,
                username: username,
                display_name: username,
                avatar: avatarUrl,
                airline_id: airlineId,
                role: "PILOT",
            });

            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error adding member:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE - Remove member from airline
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.discordId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const airlineId = await getOwnerAirlineId(session.user.discordId);
        if (!airlineId) {
            return NextResponse.json({ error: "Not an owner" }, { status: 403 });
        }

        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        // Remove from airline (set airline_id to null)
        const { error } = await supabase
            .from("profiles")
            .update({ airline_id: null })
            .eq("id", id)
            .eq("airline_id", airlineId); // Ensure they're actually in this airline

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing member:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
