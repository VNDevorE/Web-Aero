"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "ghost";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    icon?: React.ReactNode;
}

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
    (
        {
            className,
            variant = "primary",
            size = "md",
            loading = false,
            icon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={cn(
                    // Base styles  
                    "btn",
                    // Size variants
                    size === "sm" && "px-3 py-1.5 text-sm",
                    size === "md" && "px-4 py-2.5 text-sm",
                    size === "lg" && "px-6 py-3 text-base",
                    // Color variants - using CSS classes from globals.css
                    variant === "primary" && "btn-primary",
                    variant === "secondary" && "btn-secondary",
                    variant === "success" && "btn-success",
                    variant === "danger" && "btn-danger",
                    variant === "warning" && "btn-warning",
                    variant === "ghost" && "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
                    // Disabled state
                    isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
                    className
                )}
                {...props}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : icon ? (
                    <span className="w-4 h-4">{icon}</span>
                ) : null}
                {children}
            </button>
        );
    }
);

GlowButton.displayName = "GlowButton";

export { GlowButton };
