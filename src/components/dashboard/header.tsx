"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Bell, Search, User, LogOut, Settings, Wallet, ChevronDown } from "lucide-react";

interface HeaderProps {
    user?: {
        name: string;
        avatar?: string;
        role: string;
        balance?: number;
    };
}

export function Header({ user }: HeaderProps) {
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = () => {
        signOut({ callbackUrl: "/login" });
    };

    return (
        <header className="sticky top-0 z-30 glass border-b border-white/10">
            <div className="flex h-16 items-center justify-between px-6">
                {/* Search - Fixed width and no overlap */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search flights, members, airlines..."
                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-900/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4 ml-4">
                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full pulse-dot" />
                    </button>

                    {/* User Profile Dropdown */}
                    {user && (
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setShowProfile(!showProfile)}
                                className="flex items-center gap-3 pl-4 border-l border-white/10 hover:bg-white/5 rounded-lg pr-2 py-1 transition-all"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-white">{user.name}</p>
                                    <p className="text-xs text-gray-400">{user.role}</p>
                                </div>
                                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-cyan-400/30">
                                    {user.avatar ? (
                                        <Image
                                            src={user.avatar}
                                            alt={user.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfile ? "rotate-180" : ""}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showProfile && (
                                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-gray-900/95 border border-white/10 shadow-xl shadow-black/50 backdrop-blur-xl overflow-hidden animate-fade-in">
                                    {/* User Info */}
                                    <div className="p-4 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-cyan-400/30">
                                                {user.avatar ? (
                                                    <Image
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{user.name}</p>
                                                <p className="text-sm text-gray-400">{user.role}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Balance */}
                                    <div className="p-4 border-b border-white/10 bg-cyan-500/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Wallet className="w-4 h-4" />
                                                <span className="text-sm">Số dư</span>
                                            </div>
                                            <span className="text-lg font-bold text-cyan-400">
                                                {(user.balance || 0).toLocaleString("vi-VN")}đ
                                            </span>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        <Link href="/settings" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                            <User className="w-4 h-4" />
                                            <span>Hồ sơ cá nhân</span>
                                        </Link>
                                        <Link href="/settings" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                            <Settings className="w-4 h-4" />
                                            <span>Cài đặt</span>
                                        </Link>
                                    </div>

                                    {/* Sign Out */}
                                    <div className="p-2 border-t border-white/10">
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
