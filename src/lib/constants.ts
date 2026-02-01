// Airport data from main.py
export const AIRPORTS = [
    { code: "IRFD", name: "Greater Rockford" },
    { code: "IPPH", name: "Perth" },
    { code: "ITKO", name: "Tokyo" },
    { code: "ILAR", name: "Larnaca" },
    { code: "IBTH", name: "Saint Barthélemy" },
    { code: "IGRV", name: "Grindavik" },
    { code: "ISAU", name: "Sauthemptona" },
    { code: "IZOL", name: "Inzolirani" },
    { code: "ISKP", name: "Skopelos" },
    { code: "IPAP", name: "Paphos" },
] as const;

// Aircraft prices from main.py
export const AIRCRAFT_PRICES: Record<string, number> = {
    A220: 90_000_000,
    A320: 105_000_000,
    A330: 280_000_000,
    A340: 219_000_000,
    A350: 304_000_000,
    A380: 445_000_000,
    "Boeing 737 MAX 8": 125_000_000,
    "Boeing 747": 415_000_000,
    "Boeing 757": 80_000_000,
    "Boeing 777": 400_000_000,
    "Boeing 787-8": 260_000_000,
    "Boeing 787-9": 300_000_000,
    "Boeing 787-10": 330_000_000,
};

// Aircraft depreciation rates for selling
export const AIRCRAFT_DEPRECIATION: Record<string, number> = {
    A220: 0.2,
    A320: 0.2,
    A330: 0.2,
    A340: 0.2,
    A350: 0.2,
    A380: 0.25,
    "Boeing 737 MAX 8": 0.2,
    "Boeing 747": 0.3,
    "Boeing 757": 0.3,
    "Boeing 777": 0.2,
    "Boeing 787-8": 0.2,
    "Boeing 787-9": 0.2,
    "Boeing 787-10": 0.2,
};

// List of aircraft names
export const AIRCRAFT_LIST = Object.keys(AIRCRAFT_PRICES);

// Admin Discord ID
export const ADMIN_DISCORD_ID = "836913117366714369";

// Support Discord Link
export const DISCORD_SUPPORT_LINK = "https://discord.gg/yourlinkhere";

// Role display names
export const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrator",
    OWNER: "Airline Owner",
    ATC: "Air Traffic Control",
    GROUND_CREW: "Ground Crew",
    PILOT: "Pilot",
};

// Flight status display
export const FLIGHT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    IN_FLIGHT: { label: "In Flight", color: "info" },
    LANDED: { label: "Landed", color: "success" },
    EMERGENCY: { label: "Emergency", color: "danger" },
    REQUESTING_GROUND_CREW: { label: "Ground Crew Requested", color: "warning" },
};

// Ground crew services
export const GROUND_CREW_SERVICES = [
    { value: "flowme", label: "Follow Me (Guide to Gate)" },
    { value: "pushback", label: "Pushback" },
] as const;

// Default income range
export const DEFAULT_INCOME_RANGE = {
    min: 10_000,
    max: 15_000,
};

// Tax rate for flight income
export const FLIGHT_TAX_RATE = 0.2;

// Fuel and service fee
export const FUEL_SERVICE_FEE = 1500;
