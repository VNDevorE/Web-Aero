"use client";

import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    // Real-time ban check on mount only
    useEffect(() => {
        const checkBanStatus = async () => {
            try {
                const res = await fetch("/api/auth/check-ban");
                const data = await res.json();

                if (data.banned) {
                    router.replace("/banned");
                    return;
                }
            } catch (error) {
                console.error("Error checking ban status:", error);
            }
            setIsChecking(false);
        };

        if (status === "authenticated") {
            checkBanStatus();
            // Removed interval - middleware will catch bans on navigation
        } else if (status !== "loading") {
            setIsChecking(false);
        }
    }, [status, router]);

    // Redirect to login if not authenticated
    if (status === "loading" || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        redirect("/login");
    }

    // Also check session isBanned as backup
    if (session?.user?.isBanned) {
        redirect("/banned");
    }

    const user = session?.user
        ? {
            name: session.user.name || "User",
            avatar: session.user.image || undefined,
            role: session.user.role || "PILOT",
        }
        : undefined;

    const isAdmin = session?.user?.isAdmin || false;
    const userRole = session?.user?.role || "PILOT";

    return (
        <div className="min-h-screen bg-background-primary">
            {/* Sidebar */}
            <Sidebar userRole={userRole} isAdmin={isAdmin} />

            {/* Main Content */}
            <div className="ml-64">
                <Header user={user} />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
