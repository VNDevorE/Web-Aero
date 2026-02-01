"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface FlightTimerProps {
    startTime: Date;
    className?: string;
    showSeconds?: boolean;
}

export function FlightTimer({ startTime, className, showSeconds = true }: FlightTimerProps) {
    const [elapsed, setElapsed] = useState("00:00:00");

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            const parts = [
                hours.toString().padStart(2, "0"),
                minutes.toString().padStart(2, "0"),
            ];

            if (showSeconds) {
                parts.push(seconds.toString().padStart(2, "0"));
            }

            setElapsed(parts.join(":"));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [startTime, showSeconds]);

    return (
        <span
            className={cn(
                "font-mono tabular-nums text-cyan-400 text-glow",
                className
            )}
        >
            {elapsed}
        </span>
    );
}
