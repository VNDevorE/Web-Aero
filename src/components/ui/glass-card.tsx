"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "bordered" | "glow";
    hover?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, variant = "default", hover = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    // Base glass effect - using CSS custom styles 
                    "rounded-xl glass",
                    // Variants
                    variant === "bordered" && "border-[color:var(--color-primary)]/20",
                    variant === "glow" && "glow",
                    // Hover effect
                    hover && [
                        "transition-all duration-300 cursor-pointer",
                        "hover:glass-hover hover:-translate-y-0.5",
                    ],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
