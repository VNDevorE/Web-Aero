"use client";

import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { CounterAnimation } from "@/components/ui/counter-animation";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: number;
    prefix?: string;
    suffix?: string;
    icon: LucideIcon;
    iconBgClass?: string;
    iconTextClass?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export function StatsCard({
    title,
    value,
    prefix = "",
    suffix = "",
    icon: Icon,
    iconBgClass = "bg-cyan-500/10",
    iconTextClass = "text-cyan-400",
    trend,
    className,
}: StatsCardProps) {
    return (
        <GlassCard className={cn("p-6", className)}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">
                            {prefix}
                            <CounterAnimation value={value} />
                            {suffix}
                        </span>
                    </div>

                    {trend && (
                        <p
                            className={cn(
                                "text-xs mt-2 flex items-center gap-1",
                                trend.isPositive ? "text-emerald-400" : "text-red-400"
                            )}
                        >
                            <span>{trend.isPositive ? "↑" : "↓"}</span>
                            <span>{Math.abs(trend.value)}% from last week</span>
                        </p>
                    )}
                </div>

                <div
                    className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl",
                        iconBgClass,
                        iconTextClass
                    )}
                >
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </GlassCard>
    );
}
