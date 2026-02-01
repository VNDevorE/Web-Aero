import { createClient } from "@supabase/supabase-js";

// Supabase client for browser (public)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables (matching Prisma schema)
export type Role = "ADMIN" | "OWNER" | "ATC" | "GROUND_CREW" | "PILOT";
export type FlightStatus = "IN_FLIGHT" | "LANDED" | "EMERGENCY" | "REQUESTING_GROUND_CREW";

export interface User {
    id: string;
    discord_id: string;
    username: string;
    display_name?: string;
    avatar?: string;
    balance: number;
    last_daily_date?: string;
    daily_streak: number;
    role: Role;
    airline_id?: string;
    created_at: string;
    updated_at: string;
}

export interface Airline {
    id: string;
    name: string;
    money: number;
    server_id: string;
    min_income: number;
    max_income: number;
    created_at: string;
    updated_at: string;
}

export interface Aircraft {
    id: string;
    name: string;
    price: number;
    airline_id: string;
    purchase_date: string;
}

export interface Flight {
    id: string;
    flight_number: string;
    gate: string;
    aircraft_type: string;
    departure_airport: string;
    arrival_airport: string;
    captain_id?: string;
    first_officer_id?: string;
    airline_id: string;
    status: FlightStatus;
    ground_crew_service?: string;
    declared_at: string;
    landed_at?: string;
    income_earned?: number;
}

export interface FlightKpi {
    id: string;
    user_id: string;
    server_id: string;
    flight_count: number;
    last_flight_date: string;
}
