"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
    DollarSign,
    Plane,
    Building2,
    TrendingUp,
    ArrowUpRight,
    Clock,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { FlightTimer } from "@/components/ui/flight-timer";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";

// Airlines data will be fetched from API
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
    const [airlineCount, setAirlineCount] = useState(0);

    // Fetch real data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch balance
                const balanceRes = await fetch("/api/users/balance");
                const balanceData = await balanceRes.json();
                setBalance(balanceData.balance || 0);

                // Fetch airline count
                const airlinesRes = await fetch("/api/airlines");
                const airlinesData = await airlinesRes.json();
                setAirlineCount(airlinesData.airlines?.length || 0);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoadingBalance(false);
            }
        };

        fetchData();
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    value={0}
                    icon={Plane}
                    iconBgClass="bg-cyan-500/10"
                    iconTextClass="text-cyan-400"
                />
                <StatsCard
                    title="Số hãng hiện có"
                    value={airlineCount}
                    icon={Building2}
                    iconBgClass="bg-amber-500/10"
                    iconTextClass="text-amber-400"
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

                        <div className="text-center py-12">
                            <Plane className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-400">Không có chuyến bay nào đang hoạt động</p>
                            <Link href="/flights">
                                <GlowButton className="mt-4">
                                    <Plane className="w-4 h-4" />
                                    Khai báo chuyến bay mới
                                </GlowButton>
                            </Link>
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
