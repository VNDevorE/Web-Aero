"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Settings,
    User,
    Save,
    Check,
    Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const [displayName, setDisplayName] = useState("");
    const [originalName, setOriginalName] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (session?.user?.name) {
            setDisplayName(session.user.name);
            setOriginalName(session.user.name);
        }
    }, [session]);

    const handleSave = async () => {
        if (!displayName.trim()) {
            setError("Tên không được để trống");
            return;
        }

        if (displayName === originalName) {
            return; // No change
        }

        setSaving(true);
        setError("");

        try {
            const response = await fetch("/api/users/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName: displayName.trim() }),
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }

            setOriginalName(displayName);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);

            // Update session locally
            await updateSession({ name: displayName.trim() });
        } catch (err) {
            setError("Không thể lưu cài đặt. Vui lòng thử lại.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = displayName !== originalName;

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-500/20">
                    <Settings className="w-7 h-7 text-gray-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Cài đặt</h1>
                    <p className="text-gray-400">Quản lý thông tin cá nhân</p>
                </div>
            </div>

            {/* Profile Section */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    Thông tin cá nhân
                </h2>

                <div className="space-y-4">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        {session?.user?.image ? (
                            <img
                                src={session.user.image}
                                alt="Avatar"
                                className="w-16 h-16 rounded-full border-2 border-cyan-500/30"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                                <User className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-400">Avatar từ Discord</p>
                            <p className="text-xs text-gray-500">Không thể thay đổi trực tiếp</p>
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tên hiển thị
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                            placeholder="Nhập tên hiển thị..."
                        />
                        {error && (
                            <p className="text-red-400 text-sm mt-1">{error}</p>
                        )}
                    </div>

                    {/* Discord ID (read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Discord ID
                        </label>
                        <div className="px-4 py-3 rounded-lg bg-gray-800/30 border border-white/5 text-gray-400">
                            {session?.user?.discordId || "Loading..."}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Không thể thay đổi</p>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${hasChanges && !saving
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                            : "bg-gray-700/30 text-gray-500 border border-gray-600/30 cursor-not-allowed"
                            }`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : saved ? (
                            <>
                                <Check className="w-4 h-4" />
                                Đã lưu!
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Lưu thay đổi
                            </>
                        )}
                    </button>
                </div>
            </GlassCard>

            {/* Account Info */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Thông tin tài khoản
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-400">Role</p>
                        <p className="text-white font-medium">{session?.user?.role || "PILOT"}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Trạng thái</p>
                        <p className="text-emerald-400 font-medium">✓ Đang hoạt động</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
