import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to get owner's airline ID
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

// POST - Pay or deduct salary
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

        const { memberId, amount, action } = await request.json();
        if (!memberId || !amount || !action) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const absAmount = Math.abs(amount);

        // Get member info
        const { data: member, error: memberError } = await supabase
            .from("profiles")
            .select("balance, airline_id")
            .eq("id", memberId)
            .single();

        if (memberError || !member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Verify member belongs to this airline
        if (member.airline_id !== airlineId) {
            return NextResponse.json({ error: "Member not in your airline" }, { status: 400 });
        }

        // Get airline info
        const { data: airline } = await supabase
            .from("airlines")
            .select("money")
            .eq("id", airlineId)
            .single();

        if (action === "pay") {
            // Pay salary: Deduct from airline, add to member
            if ((airline?.money || 0) < absAmount) {
                return NextResponse.json({ error: "Quỹ hãng không đủ!" }, { status: 400 });
            }

            await supabase
                .from("airlines")
                .update({ money: (airline?.money || 0) - absAmount })
                .eq("id", airlineId);

            await supabase
                .from("profiles")
                .update({ balance: (member.balance || 0) + absAmount })
                .eq("id", memberId);

        } else if (action === "deduct") {
            // Deduct salary: Deduct from member, add to airline
            if ((member.balance || 0) < absAmount) {
                return NextResponse.json({ error: "Số dư thành viên không đủ!" }, { status: 400 });
            }

            await supabase
                .from("profiles")
                .update({ balance: (member.balance || 0) - absAmount })
                .eq("id", memberId);

            await supabase
                .from("airlines")
                .update({ money: (airline?.money || 0) + absAmount })
                .eq("id", airlineId);
        }

        // Log transaction
        await supabase.from("transactions").insert({
            airline_id: airlineId,
            amount: action === "pay" ? -absAmount : absAmount,
            description: action === "pay" ? "Trả lương" : "Trừ lương",
            type: action === "pay" ? "SALARY_PAY" : "SALARY_DEDUCT",
            user_id: memberId,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error processing salary:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
