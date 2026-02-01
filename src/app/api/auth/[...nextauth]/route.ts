import NextAuth, { NextAuthOptions, Profile } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

// Supabase client for auth operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extend the Profile type for Discord
interface DiscordProfile extends Profile {
    id: string;
    username?: string;
    avatar?: string;
}

// Extend the Session type
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            discordId: string;
            role: string;
            isAdmin: boolean;
            isBanned: boolean;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        discordId?: string;
        role?: string;
        isAdmin?: boolean;
        isBanned?: boolean;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "identify email guilds",
                },
            },
        }),
    ],

    callbacks: {
        async jwt({ token, account, profile }) {
            if (account && profile) {
                const discordProfile = profile as DiscordProfile;
                token.discordId = discordProfile.id;
                token.isAdmin = discordProfile.id === ADMIN_DISCORD_ID;

                // Check if user is in blacklist (banned permanently by discord_id)
                try {
                    const { data: blacklistData } = await supabase
                        .from("blacklist")
                        .select("id")
                        .eq("discord_id", discordProfile.id)
                        .limit(1);

                    if (blacklistData && blacklistData.length > 0) {
                        token.isBanned = true;
                        token.role = "BANNED";
                        return token;
                    }

                    token.isBanned = false;

                    // Check if user is an owner
                    const { data: ownerData } = await supabase
                        .from("owners")
                        .select("id")
                        .eq("discord_id", discordProfile.id)
                        .limit(1);

                    const isOwner = ownerData && ownerData.length > 0;

                    // Determine role
                    let role = "PILOT";
                    if (token.isAdmin) {
                        role = "ADMIN";
                    } else if (isOwner) {
                        role = "OWNER";
                    }

                    token.role = role;

                    // Upsert profile to database (only for non-banned users)
                    await supabase
                        .from("profiles")
                        .upsert({
                            id: token.sub,
                            discord_id: discordProfile.id,
                            username: discordProfile.username || discordProfile.name,
                            display_name: discordProfile.name,
                            avatar: discordProfile.image,
                            role: role,
                            updated_at: new Date().toISOString(),
                        }, {
                            onConflict: "id"
                        });
                } catch (error) {
                    console.error("Error syncing profile:", error);
                    token.role = token.isAdmin ? "ADMIN" : "PILOT";
                    token.isBanned = false;
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.discordId = token.discordId as string;
                session.user.id = token.sub!;
                session.user.isAdmin = token.isAdmin as boolean;

                // Use token.isBanned from JWT callback (set during login)
                session.user.isBanned = token.isBanned || false;

                // If already banned from JWT, return early
                if (token.isBanned) {
                    session.user.role = "BANNED";
                    return session;
                }

                // Check blacklist for real-time ban status (in case admin banned after login)
                try {
                    const discordId = token.discordId as string;

                    const { data: blacklistData } = await supabase
                        .from("blacklist")
                        .select("id")
                        .eq("discord_id", discordId)
                        .limit(1);

                    if (blacklistData && blacklistData.length > 0) {
                        session.user.isBanned = true;
                        session.user.role = "BANNED";
                        return session;
                    }

                    // Check if user is admin first
                    if (discordId === ADMIN_DISCORD_ID) {
                        session.user.role = "ADMIN";
                    } else {
                        // Check owners table for real-time role
                        const { data: ownerData } = await supabase
                            .from("owners")
                            .select("id")
                            .eq("discord_id", discordId)
                            .limit(1);

                        session.user.role = (ownerData && ownerData.length > 0) ? "OWNER" : "PILOT";
                    }
                } catch (error) {
                    console.error("Error fetching role:", error);
                    session.user.role = token.role as string || "PILOT";
                }
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

