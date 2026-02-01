"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
    Home,
    Plane,
    Building2,
    Radio,
    Users,
    Settings,
    Shield,
    LogOut,
    Truck,
} from "lucide-react";

interface SidebarProps {
    userRole?: string;
    isAdmin?: boolean;
}

const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home, roles: ["all"] },
    { href: "/flights", label: "Flights", icon: Plane, roles: ["all"] },
    { href: "/airlines", label: "Airlines", icon: Building2, roles: ["ADMIN", "OWNER"] },
    { href: "/atc", label: "ATC Panel", icon: Radio, roles: ["all"] },
    { href: "/ground-crew", label: "Ground Crew", icon: Truck, roles: ["all"] },
    { href: "/settings", label: "Cài đặt", icon: Settings, roles: ["all"] },
    { href: "/owner", label: "Owner Panel", icon: Building2, roles: ["ADMIN", "OWNER"] },
];

const adminItems = [
    { href: "/admin", label: "Admin Panel", icon: Shield },
];

export function Sidebar({ userRole = "PILOT", isAdmin = false }: SidebarProps) {
    const pathname = usePathname();

    const filteredNav = navigationItems.filter(
        (item) => item.roles.includes("all") || item.roles.includes(userRole)
    );

    const handleSignOut = () => {
        signOut({ callbackUrl: "/login" });
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 glass border-r border-white/10">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Plane className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white">Aero</h1>
                    <p className="text-xs text-gray-400">Aviation Dashboard</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 p-4">
                <span className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Main Menu
                </span>

                {filteredNav.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                "text-gray-400 hover:text-white hover:bg-white/5",
                                isActive && [
                                    "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400",
                                ]
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}

                {/* Admin Section */}
                {isAdmin && (
                    <>
                        <span className="px-3 mt-6 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Administration
                        </span>
                        {adminItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                        "text-gray-400 hover:text-white hover:bg-white/5",
                                        isActive && [
                                            "bg-red-500/10 text-red-400 border-l-2 border-red-400",
                                        ]
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* Bottom Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                <button
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
