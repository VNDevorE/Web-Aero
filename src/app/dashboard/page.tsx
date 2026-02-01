"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
    DollarSign,
    Plane,
    TrendingUp,
    Users,
    ArrowUpRight,
    Clock,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { FlightTimer } from "@/components/ui/flight-timer";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";

// Real stats state (will be fetched from API)
const defaultStats = {
    activeFlights: 12,
    kpiScore: 156,
    totalMembers: 48,
};

const mockActiveFlights = [
    {
        id: "1",
        flightNumber: "AF123",
        airline: "Air France",
        route: "ITKO → IPPH",
        aircraftType: "A350",
        captain: "DevorE",
        firstOfficer: "John Doe",
        gate: "A12",
        declaredAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        status: "IN_FLIGHT",
    },
    {
        id: "2",
        flightNumber: "DHL456",
        airline: "DHL",
        route: "IRFD → ILAR",
        aircraftType: "Boeing 777",
        captain: "Pilot2",
        firstOfficer: "N/A",
        gate: "C5",
        declaredAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        status: "IN_FLIGHT",
    },
    {
        id: "3",
        flightNumber: "KA789",
        airline: "Korean Air",
        route: "ISKP → IBTH",
        aircraftType: "A380",
        captain: "Captain3",
        firstOfficer: "FO3",
        gate: "B8",
        declaredAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        status: "EMERGENCY",
    },
];

const mockAirlines = [
    { name: "Air France", balance: 45000000, change: 5.2 },
    { name: "DHL", balance: 32000000, change: -2.1 },
    { name: "Korean Air", balance: 28000000, change: 8.7 },
    { name: "Hi-Fly", balance: 15000000, change: 3.4 },
];

export default function DashboardPage() {
    const { data: session } = useSession();
    const [balance, setBalance] = useState<number>(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);

    // Fetch real balance from API
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await fetch("/api/users/balance");
                const data = await res.json();
                setBalance(data.balance || 0);
            } catch (error) {
                console.error("Error fetching balance:", error);
            } finally {
                setIsLoadingBalance(false);
            }
        };

        fetchBalance();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Chào mừng, {session?.user?.name || "Pilot"}! 👋
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Đây là tổng quan về hoạt động hàng không của bạn
                    </p>
                </div>
                <Link href="/flights">
                    <GlowButton>
                        <Plane className="w-4 h-4" />
                        Khai báo chuyến bay
                    </GlowButton>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Số dư tài khoản"
                    value={isLoadingBalance ? 0 : balance}
                    prefix="$"
                    icon={DollarSign}
                    iconBgClass="bg-emerald-500/10"
                    iconTextClass="text-emerald-400"
                />
                <StatsCard
                    title="Chuyến bay đang hoạt động"
                    value={defaultStats.activeFlights}
                    icon={Plane}
                    iconBgClass="bg-cyan-500/10"
                    iconTextClass="text-cyan-400"
                />
                <StatsCard
                    title="Điểm KPI"
                    value={defaultStats.kpiScore}
                    icon={TrendingUp}
                    iconBgClass="bg-amber-500/10"
                    iconTextClass="text-amber-400"
                />
                <StatsCard
                    title="Thành viên"
                    value={defaultStats.totalMembers}
                    icon={Users}
                    iconBgClass="bg-blue-500/10"
                    iconTextClass="text-blue-400"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Flights */}
                <div className="lg:col-span-2">
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Plane className="w-5 h-5 text-cyan-400" />
                                Chuyến bay đang hoạt động
                            </h2>
                            <Link href="/flights">
                                <GlowButton variant="ghost" size="sm">
                                    Xem tất cả
                                    <ArrowUpRight className="w-4 h-4" />
                                </GlowButton>
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {mockActiveFlights.map((flight) => (
                                <div
                                    key={flight.id}
                                    className={`p-4 rounded-lg border transition-all ${flight.status === "EMERGENCY"
                                        ? "bg-red-500/10 border-red-500/30"
                                        : "bg-gray-900/50 border-white/10 hover:border-cyan-500/30"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`flex items-center justify-center w-12 h-12 rounded-lg ${flight.status === "EMERGENCY"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-cyan-500/20 text-cyan-400"
                                                    }`}
                                            >
                                                <Plane className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white">
                                                        {flight.flightNumber}
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        {flight.airline}
                                                    </span>
                                                    {flight.status === "EMERGENCY" && (
                                                        <span className="badge badge-danger">EMERGENCY</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400">
                                                    {flight.route} • {flight.aircraftType}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-cyan-400">
                                                <Clock className="w-4 h-4" />
                                                <FlightTimer startTime={flight.declaredAt} />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Gate {flight.gate}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Crew Info */}
                                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-gray-400">
                                                👨‍✈️ <span className="text-white">{flight.captain}</span>
                                            </span>
                                            <span className="text-gray-400">
                                                👨‍✈️ <span className="text-white">{flight.firstOfficer}</span>
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <GlowButton variant="success" size="sm">
                                                Đã hạ cánh
                                            </GlowButton>
                                            <GlowButton variant="warning" size="sm">
                                                Ground Crew
                                            </GlowButton>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Airlines Portfolio */}
                <div>
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                Chứng khoán Hãng bay
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {mockAirlines.map((airline) => (
                                <div
                                    key={airline.name}
                                    className="p-4 rounded-lg bg-gray-900/50 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-white">{airline.name}</span>
                                        <span
                                            className={`text-sm ${airline.change >= 0
                                                ? "text-emerald-400"
                                                : "text-red-400"
                                                }`}
                                        >
                                            {airline.change >= 0 ? "+" : ""}
                                            {airline.change}%
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-cyan-400 mt-1">
                                        {formatMoney(airline.balance)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
