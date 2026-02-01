"use client";

import { Shield, Ban } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { DISCORD_SUPPORT_LINK } from "@/lib/constants";

export default function BannedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/40 animate-pulse">
                        <Ban className="w-12 h-12 text-red-400" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-4">
                    Tài khoản đã bị khóa
                </h1>

                {/* Description */}
                <div className="bg-gray-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-semibold">Thông báo từ hệ thống</span>
                    </div>
                    <p className="text-gray-400 mb-4">
                        Tài khoản Discord của bạn đã bị quản trị viên tạm khóa và không thể truy cập vào hệ thống Aero Aviation.
                    </p>
                    <p className="text-gray-500 text-sm">
                        Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ quản trị viên qua Discord để được hỗ trợ.
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full px-6 py-3 rounded-xl bg-gray-800/50 text-gray-300 border border-white/10 hover:bg-gray-700/50 transition-all font-medium"
                    >
                        Đăng xuất
                    </button>
                    <Link
                        href={DISCORD_SUPPORT_LINK}
                        target="_blank"
                        className="block w-full px-6 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all font-medium"
                    >
                        Liên hệ hỗ trợ
                    </Link>
                </div>

                {/* Footer */}
                <p className="mt-8 text-gray-600 text-sm">
                    Aero Aviation Dashboard • Hệ thống quản lý hàng không
                </p>
            </div>
        </div>
    );
}
