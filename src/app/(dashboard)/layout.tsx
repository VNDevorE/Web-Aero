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
    const [balance, setBalance] = useState<number>(0);
    const [isOwner, setIsOwner] = useState<boolean>(false);

    // Fetch user balance
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await fetch("/api/users/balance");
                const data = await res.json();
                setBalance(data.balance || 0);
            } catch (error) {
                console.error("Error fetching balance:", error);
            }
        };
        if (status === "authenticated") {
            fetchBalance();
        }
    }, [status]);

    // Real-time ban and archive check on mount only
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch("/api/auth/check-ban");
                const data = await res.json();

                if (data.banned) {
                    router.replace("/banned");
                    return;
                }

                // If archived, sign out and redirect to login
                if (data.archived) {
                    const { signOut } = await import("next-auth/react");
                    await signOut({ callbackUrl: "/login" });
                    return;
                }
            } catch (error) {
                console.error("Error checking status:", error);
            }
            setIsChecking(false);
        };

        if (status === "authenticated") {
            checkStatus();
        } else if (status !== "loading") {
            setIsChecking(false);
        }
    }, [status, router]);

    // Real-time owner check
    useEffect(() => {
        const checkOwnerStatus = async () => {
            try {
                const res = await fetch("/api/owner/check");
                const data = await res.json();
                setIsOwner(data.isOwner === true);
            } catch (error) {
                console.error("Error checking owner status:", error);
            }
        };

        if (status === "authenticated") {
            checkOwnerStatus();
        }
    }, [status]);

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
            balance: balance,
        }
        : undefined;

    const isAdmin = session?.user?.isAdmin || false;
    // Use real-time owner check combined with session role
    const userRole = isOwner ? "OWNER" : (session?.user?.role || "PILOT");

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
