import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Primary - Cyan/Teal (Aviation)
                primary: {
                    DEFAULT: "#00D4FF",
                    dark: "#00A8CC",
                    light: "#33DDFF",
                },
                // Accent - Electric Blue
                accent: {
                    DEFAULT: "#0066FF",
                    dark: "#0052CC",
                    light: "#3385FF",
                    glow: "rgba(0, 102, 255, 0.4)",
                },
                // Background - Deep Space
                background: {
                    primary: "#0A0E1A",
                    secondary: "#111827",
                    tertiary: "#1F2937",
                },
                // Glass Effect
                glass: {
                    bg: "rgba(255, 255, 255, 0.05)",
                    border: "rgba(255, 255, 255, 0.1)",
                    hover: "rgba(255, 255, 255, 0.08)",
                },
                // Status Colors
                status: {
                    success: "#10B981",
                    danger: "#EF4444",
                    warning: "#F59E0B",
                    info: "#3B82F6",
                },
                // Surface colors for cards
                surface: {
                    DEFAULT: "rgba(17, 24, 39, 0.8)",
                    hover: "rgba(31, 41, 55, 0.9)",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            backdropBlur: {
                xs: "2px",
            },
            boxShadow: {
                glow: "0 0 20px rgba(0, 212, 255, 0.3)",
                "glow-lg": "0 0 40px rgba(0, 212, 255, 0.4)",
                "glow-accent": "0 0 20px rgba(0, 102, 255, 0.3)",
                glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
            },
            animation: {
                "pulse-glow": "pulse-glow 2s ease-in-out infinite",
                "fade-in": "fade-in 0.3s ease-out",
                "slide-up": "slide-up 0.4s ease-out",
                "slide-in-right": "slide-in-right 0.3s ease-out",
                float: "float 6s ease-in-out infinite",
                shimmer: "shimmer 2s linear infinite",
            },
            keyframes: {
                "pulse-glow": {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" },
                    "50%": { boxShadow: "0 0 40px rgba(0, 212, 255, 0.6)" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "slide-up": {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-in-right": {
                    "0%": { opacity: "0", transform: "translateX(20px)" },
                    "100%": { opacity: "1", transform: "translateX(0)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "glass-gradient":
                    "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                shimmer:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
            },
        },
    },
    plugins: [],
} satisfies Config;
