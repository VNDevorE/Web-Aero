import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Add/deduct funds
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.discordId !== ADMIN_DISCORD_ID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { airlineId, amount, reason } = await request.json();
        if (!airlineId || amount === undefined) {
            return NextResponse.json({ error: "airlineId and amount required" }, { status: 400 });
        }

        // Get current balance
        const { data: airline, error: fetchError } = await supabase
            .from("airlines")
            .select("money")
            .eq("id", airlineId)
            .single();

        if (fetchError) throw fetchError;

        const newBalance = (airline.money || 0) + amount;

        // Update balance
        const { error: updateError } = await supabase
            .from("airlines")
            .update({ money: newBalance })
            .eq("id", airlineId);

        if (updateError) throw updateError;

        // Log transaction
        await supabase.from("transactions").insert({
            airline_id: airlineId,
            amount: amount,
            description: reason || (amount > 0 ? "Admin thêm tiền" : "Admin trừ tiền"),
            type: amount > 0 ? "DEPOSIT" : "WITHDRAWAL",
            user_id: session?.user?.id,
        });

        return NextResponse.json({ success: true, newBalance });
    } catch (error) {
        console.error("Error modifying funds:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
