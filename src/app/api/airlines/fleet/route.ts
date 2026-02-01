import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get fleet (aircraft) of a specific airline
export async function GET(request: NextRequest) {
    try {
        const airlineId = request.nextUrl.searchParams.get("airlineId");

        if (!airlineId) {
            return NextResponse.json({ error: "airlineId required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("aircraft")
            .select("id, aircraft_name, price, purchase_date")
            .eq("airline_id", airlineId)
            .order("aircraft_name");

        if (error) throw error;

        return NextResponse.json({ aircraft: data || [] });
    } catch (error) {
        console.error("Error fetching fleet:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
