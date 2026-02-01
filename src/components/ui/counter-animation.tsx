"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface CounterAnimationProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    formatFn?: (value: number) => string;
}

export function CounterAnimation({
    value,
    duration = 1000,
    prefix = "",
    suffix = "",
    className,
    formatFn,
}: CounterAnimationProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;
        const startValue = displayValue;
        const endValue = value;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function (ease-out)
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);

            setDisplayValue(currentValue);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [value, duration]);

    const formattedValue = formatFn
        ? formatFn(displayValue)
        : displayValue.toLocaleString("en-US");

    return (
        <span className={cn("font-mono tabular-nums", className)}>
            {prefix}
            {formattedValue}
            {suffix}
        </span>
    );
}
