import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all airlines (public endpoint for dropdown)
export async function GET() {
    try {
        const { data, error } = await supabase
            .from("airlines")
            .select("id, name")
            .order("name");

        if (error) throw error;

        return NextResponse.json({ airlines: data });
    } catch (error) {
        console.error("Error fetching airlines:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
