-- =============================================
-- Aero Aviation Dashboard - Database Schema
-- DROP & RECREATE (Clean Installation)
-- =============================================

-- Drop existing tables (CASCADE handles foreign keys)
DROP TABLE IF EXISTS flight_kpis CASCADE;
DROP TABLE IF EXISTS flights CASCADE;
DROP TABLE IF EXISTS aircraft CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS airlines CASCADE;

-- Drop and recreate enums
DROP TYPE IF EXISTS flight_status CASCADE;
DROP TYPE IF EXISTS role_type CASCADE;

CREATE TYPE role_type AS ENUM ('ADMIN', 'OWNER', 'ATC', 'GROUND_CREW', 'PILOT');
CREATE TYPE flight_status AS ENUM ('IN_FLIGHT', 'LANDED', 'EMERGENCY', 'REQUESTING_GROUND_CREW');

-- =============================================
-- Airlines Table
-- =============================================
CREATE TABLE airlines (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL UNIQUE,
    money BIGINT NOT NULL DEFAULT 0,
    server_id TEXT NOT NULL,
    min_income INTEGER NOT NULL DEFAULT 10000,
    max_income INTEGER NOT NULL DEFAULT 15000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Profiles Table (extends Supabase Auth users)
-- =============================================
CREATE TABLE profiles (
    id TEXT PRIMARY KEY,  -- References auth.users.id
    discord_id TEXT UNIQUE,
    username TEXT,
    display_name TEXT,
    avatar TEXT,
    balance BIGINT NOT NULL DEFAULT 0,
    last_daily_date DATE,
    daily_streak INTEGER NOT NULL DEFAULT 0,
    role role_type NOT NULL DEFAULT 'PILOT',
    airline_id TEXT REFERENCES airlines(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Aircraft Table
-- =============================================
CREATE TABLE aircraft (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    price BIGINT NOT NULL,
    airline_id TEXT NOT NULL REFERENCES airlines(id) ON DELETE CASCADE,
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Flights Table
-- =============================================
CREATE TABLE flights (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    flight_number TEXT NOT NULL,
    gate TEXT NOT NULL,
    aircraft_type TEXT NOT NULL,
    departure_airport TEXT NOT NULL,
    arrival_airport TEXT NOT NULL,
    captain_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    first_officer_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    airline_id TEXT NOT NULL REFERENCES airlines(id) ON DELETE CASCADE,
    status flight_status NOT NULL DEFAULT 'IN_FLIGHT',
    ground_crew_service TEXT,
    declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    landed_at TIMESTAMPTZ,
    income_earned BIGINT
);

-- =============================================
-- Flight KPIs Table
-- =============================================
CREATE TABLE flight_kpis (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    server_id TEXT NOT NULL,
    flight_count INTEGER NOT NULL DEFAULT 0,
    last_flight_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, server_id)
);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE airlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_kpis ENABLE ROW LEVEL SECURITY;

-- Read policies (anyone can read)
CREATE POLICY "Allow read access" ON airlines FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON aircraft FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON flights FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON flight_kpis FOR SELECT USING (true);

-- Insert policies
CREATE POLICY "Allow insert for authenticated" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated" ON flights FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated" ON flight_kpis FOR INSERT WITH CHECK (true);

-- Update policies
CREATE POLICY "Allow update for authenticated" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Allow update for authenticated" ON flights FOR UPDATE USING (true);
CREATE POLICY "Allow update for authenticated" ON flight_kpis FOR UPDATE USING (true);

-- =============================================
-- Seed Data: Airlines
-- =============================================
INSERT INTO airlines (name, money, server_id, min_income, max_income) VALUES
    ('Air France', 100000000, '1401079685105848431', 10230, 13400),
    ('DHL', 80000000, '1413161694162628660', 10400, 13000),
    ('Hi-Fly', 50000000, '1413161694162628661', 10000, 12500),
    ('Korean Air', 75000000, '1413161694162628662', 10500, 13200),
    ('Devore', 120000000, '1413161694162628663', 11000, 14000);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX idx_profiles_discord_id ON profiles(discord_id);
CREATE INDEX idx_flights_status ON flights(status);
CREATE INDEX idx_flights_airline_id ON flights(airline_id);
CREATE INDEX idx_flight_kpis_user_server ON flight_kpis(user_id, server_id);
