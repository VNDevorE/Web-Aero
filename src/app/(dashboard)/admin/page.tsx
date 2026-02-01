"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
    Shield,
    Building2,
    Users,
    UserPlus,
    Trash2,
    Plus,
    Minus,
    Ban,
    CheckCircle,
    Search,
    Loader2,
    DollarSign,
    Crown,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { ADMIN_DISCORD_ID } from "@/lib/constants";

type TabType = "airlines" | "owners" | "users";

interface Airline {
    id: string;
    name: string;
    money: number;
    created_at: string;
}

interface Owner {
    id: string;
    discord_id: string;
    airline_id: string;
    airline_name?: string;
    assigned_at: string;
}

interface UserProfile {
    id: string;
    discord_id: string;
    username: string;
    display_name: string | null;
    role: string;
    is_banned: boolean;
    created_at: string;
}

export default function AdminPanelPage() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState<TabType>("airlines");

    // Airlines state
    const [airlines, setAirlines] = useState<Airline[]>([]);
    const [newAirlineName, setNewAirlineName] = useState("");
    const [fundAmount, setFundAmount] = useState("");
    const [fundReason, setFundReason] = useState("");
    const [selectedAirlineId, setSelectedAirlineId] = useState("");

    // Owners state
    const [owners, setOwners] = useState<Owner[]>([]);
    const [newOwnerDiscordId, setNewOwnerDiscordId] = useState("");
    const [newOwnerAirlineId, setNewOwnerAirlineId] = useState("");

    // Users state
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [blacklist, setBlacklist] = useState<{ id: string; discord_id: string; reason?: string; created_at: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [banDiscordId, setBanDiscordId] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Delete confirmation modal
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; name: string }>({ show: false, id: "", name: "" });
    // Delete owner confirmation modal
    const [deleteOwnerConfirm, setDeleteOwnerConfirm] = useState<{ show: boolean; id: string; discordId: string }>({ show: false, id: "", discordId: "" });
    // Delete user confirmation modal
    const [deleteUserConfirm, setDeleteUserConfirm] = useState<{ show: boolean; discordId: string; name: string }>({ show: false, discordId: "", name: "" });

    // Access control - only admin
    useEffect(() => {
        if (status === "authenticated" && session?.user?.discordId !== ADMIN_DISCORD_ID) {
            redirect("/dashboard");
        }
    }, [session, status]);

    // Load data on mount
    useEffect(() => {
        if (session?.user?.discordId === ADMIN_DISCORD_ID) {
            loadAirlines();
            loadOwners();
            loadUsers();
            loadBlacklist();
        }
    }, [session]);

    const loadAirlines = async () => {
        try {
            const res = await fetch("/api/admin/airlines");
            const data = await res.json();
            setAirlines(data.airlines || []);
        } catch (e) {
            console.error("Failed to load airlines:", e);
        }
    };

    const loadOwners = async () => {
        try {
            const res = await fetch("/api/admin/owners");
            const data = await res.json();
            setOwners(data.owners || []);
        } catch (e) {
            console.error("Failed to load owners:", e);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            setUsers(data.users || []);
        } catch (e) {
            console.error("Failed to load users:", e);
        }
    };

    const loadBlacklist = async () => {
        try {
            const res = await fetch("/api/admin/users/ban");
            const data = await res.json();
            setBlacklist(data || []);
        } catch (e) {
            console.error("Failed to load blacklist:", e);
        }
    };

    const showMessage = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

    // Airline operations
    const createAirline = async () => {
        if (!newAirlineName.trim()) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/airlines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newAirlineName.trim() }),
            });
            if (res.ok) {
                showMessage("success", "Tạo hãng thành công!");
                setNewAirlineName("");
                loadAirlines();
            } else {
                showMessage("error", "Tạo hãng thất bại!");
            }
        } catch (e) {
            showMessage("error", "Lỗi hệ thống!");
        }
        setLoading(false);
    };

    const deleteAirline = async (id: string, name: string) => {
        setDeleteConfirm({ show: true, id, name });
    };

    const confirmDeleteAirline = async () => {
        const id = deleteConfirm.id;
        setDeleteConfirm({ show: false, id: "", name: "" });
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/airlines?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                showMessage("success", "Xóa hãng thành công!");
                loadAirlines();
            } else {
                const data = await res.json();
                showMessage("error", data.error || "Xóa thất bại!");
            }
        } catch (e) {
            showMessage("error", "Xóa thất bại!");
        }
        setLoading(false);
    };

    const modifyFunds = async (action: "add" | "deduct") => {
        if (!selectedAirlineId || !fundAmount) return;
        setLoading(true);
        try {
            const amount = parseInt(fundAmount) * (action === "deduct" ? -1 : 1);
            const res = await fetch("/api/admin/airlines/funds", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    airlineId: selectedAirlineId,
                    amount,
                    reason: fundReason || (action === "add" ? "Admin thêm tiền" : "Admin trừ tiền"),
                }),
            });
            if (res.ok) {
                showMessage("success", action === "add" ? "Thêm tiền thành công!" : "Trừ tiền thành công!");
                setFundAmount("");
                setFundReason("");
                loadAirlines();
            }
        } catch (e) {
            showMessage("error", "Thao tác thất bại!");
        }
        setLoading(false);
    };

    // Owner operations
    const addOwner = async () => {
        if (!newOwnerDiscordId.trim() || !newOwnerAirlineId) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/owners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    discordId: newOwnerDiscordId.trim(),
                    airlineId: newOwnerAirlineId,
                }),
            });
            if (res.ok) {
                showMessage("success", "Thêm Owner thành công!");
                setNewOwnerDiscordId("");
                setNewOwnerAirlineId("");
                loadOwners();
            } else {
                showMessage("error", "Thêm Owner thất bại!");
            }
        } catch (e) {
            showMessage("error", "Lỗi hệ thống!");
        }
        setLoading(false);
    };

    const removeOwner = async (id: string, discordId: string) => {
        setDeleteOwnerConfirm({ show: true, id, discordId });
    };

    const confirmRemoveOwner = async () => {
        const id = deleteOwnerConfirm.id;
        setDeleteOwnerConfirm({ show: false, id: "", discordId: "" });
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/owners?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                showMessage("success", "Xóa Owner thành công!");
                loadOwners();
            } else {
                showMessage("error", "Xóa thất bại!");
            }
        } catch (e) {
            showMessage("error", "Xóa thất bại!");
        }
        setLoading(false);
    };

    // User operations
    const toggleBan = async (discordId: string, isBanned: boolean) => {
        try {
            const res = await fetch("/api/admin/users/ban", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ discordId, ban: !isBanned }),
            });
            if (res.ok) {
                showMessage("success", isBanned ? "Đã gỡ ban!" : "Đã ban user!");
                loadUsers();
                loadBlacklist();
            }
        } catch (e) {
            showMessage("error", "Thao tác thất bại!");
        }
    };

    const banByDiscordId = async () => {
        if (!banDiscordId.trim()) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users/ban", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ discordId: banDiscordId.trim(), ban: true }),
            });
            if (res.ok) {
                showMessage("success", "Đã ban user!");
                setBanDiscordId("");
                loadUsers();
                loadBlacklist();
            }
        } catch (e) {
            showMessage("error", "Ban thất bại!");
        }
        setLoading(false);
    };

    // Unban from blacklist
    const unbanUser = async (discordId: string) => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users/ban", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ discordId, ban: false }),
            });
            if (res.ok) {
                showMessage("success", "Đã gỡ ban user!");
                loadUsers();
                loadBlacklist();
            }
        } catch (e) {
            showMessage("error", "Gỡ ban thất bại!");
        }
        setLoading(false);
    };

    // Delete user (soft delete)
    const deleteUser = (discordId: string, name: string) => {
        setDeleteUserConfirm({ show: true, discordId, name });
    };

    const confirmDeleteUser = async () => {
        const discordId = deleteUserConfirm.discordId;
        setDeleteUserConfirm({ show: false, discordId: "", name: "" });
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?discord_id=${discordId}`, { method: "DELETE" });
            if (res.ok) {
                showMessage("success", "Đã xóa user!");
                loadUsers();
            } else {
                showMessage("error", "Xóa thất bại!");
            }
        } catch (e) {
            showMessage("error", "Xóa thất bại!");
        }
        setLoading(false);
    };

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.discord_id?.includes(searchQuery)
    );

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
        );
    }

    if (session?.user?.discordId !== ADMIN_DISCORD_ID) {
        return (
            <GlassCard className="p-8 text-center">
                <Shield className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <h2 className="text-xl font-bold text-white">Không có quyền truy cập</h2>
                <p className="text-gray-400">Bạn không có quyền truy cập trang này.</p>
            </GlassCard>
        );
    }

    const tabs = [
        { id: "airlines", label: "Hãng bay", icon: Building2 },
        { id: "owners", label: "Owners", icon: Crown },
        { id: "users", label: "Users", icon: Users },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/20">
                    <Shield className="w-7 h-7 text-red-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                    <p className="text-gray-400">Quản trị hệ thống</p>
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-gray-800/50 text-gray-400 border border-white/5 hover:text-white"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Airlines Tab */}
            {activeTab === "airlines" && (
                <div className="space-y-6">
                    {/* Create Airline */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Tạo hãng mới</h3>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newAirlineName}
                                onChange={(e) => setNewAirlineName(e.target.value)}
                                placeholder="Tên hãng bay..."
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                            />
                            <button
                                onClick={createAirline}
                                disabled={loading || !newAirlineName.trim()}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Tạo
                            </button>
                        </div>
                    </GlassCard>

                    {/* Manage Funds */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                            Quản lý quỹ
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select
                                value={selectedAirlineId}
                                onChange={(e) => setSelectedAirlineId(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white focus:outline-none"
                            >
                                <option value="">Chọn hãng...</option>
                                {airlines.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name} (${a.money?.toLocaleString()})</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={fundAmount}
                                onChange={(e) => setFundAmount(e.target.value)}
                                placeholder="Số tiền..."
                                className="px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none"
                            />
                            <input
                                type="text"
                                value={fundReason}
                                onChange={(e) => setFundReason(e.target.value)}
                                placeholder="Lý do (tùy chọn)..."
                                className="px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none md:col-span-2"
                            />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => modifyFunds("add")}
                                disabled={loading || !selectedAirlineId || !fundAmount}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm tiền
                            </button>
                            <button
                                onClick={() => modifyFunds("deduct")}
                                disabled={loading || !selectedAirlineId || !fundAmount}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                            >
                                <Minus className="w-4 h-4" />
                                Trừ tiền
                            </button>
                        </div>
                    </GlassCard>

                    {/* Airlines List */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Danh sách hãng ({airlines.length})</h3>
                        <div className="space-y-3">
                            {airlines.map((airline) => (
                                <div key={airline.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                                    <div>
                                        <p className="text-white font-medium">{airline.name}</p>
                                        <p className="text-emerald-400 text-sm">${airline.money?.toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => deleteAirline(airline.id, airline.name)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {airlines.length === 0 && (
                                <p className="text-gray-500 text-center py-4">Chưa có hãng nào</p>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Owners Tab */}
            {activeTab === "owners" && (
                <div className="space-y-6">
                    {/* Add Owner */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-amber-400" />
                            Thêm Owner
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                value={newOwnerDiscordId}
                                onChange={(e) => setNewOwnerDiscordId(e.target.value)}
                                placeholder="Discord ID..."
                                className="px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none"
                            />
                            <select
                                value={newOwnerAirlineId}
                                onChange={(e) => setNewOwnerAirlineId(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white focus:outline-none"
                            >
                                <option value="">Chọn hãng...</option>
                                {airlines.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={addOwner}
                                disabled={loading || !newOwnerDiscordId.trim() || !newOwnerAirlineId}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm Owner
                            </button>
                        </div>
                    </GlassCard>

                    {/* Owners List */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Danh sách Owners ({owners.length})</h3>
                        <div className="space-y-3">
                            {owners.map((owner) => (
                                <div key={owner.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                                    <div>
                                        <p className="text-white font-medium">Discord ID: {owner.discord_id}</p>
                                        <p className="text-amber-400 text-sm">
                                            Hãng: {airlines.find(a => a.id === owner.airline_id)?.name || owner.airline_id}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeOwner(owner.id, owner.discord_id)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {owners.length === 0 && (
                                <p className="text-gray-500 text-center py-4">Chưa có Owner nào</p>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
                <div className="space-y-6">
                    {/* Ban by Discord ID */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Ban className="w-5 h-5 text-red-400" />
                            Ban user bằng Discord ID
                        </h3>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={banDiscordId}
                                onChange={(e) => setBanDiscordId(e.target.value)}
                                placeholder="Discord ID để ban..."
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none"
                            />
                            <button
                                onClick={banByDiscordId}
                                disabled={loading || !banDiscordId.trim()}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                            >
                                <Ban className="w-4 h-4" />
                                Ban
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm mt-2">
                            User bị ban sẽ vào Blacklist và không thể truy cập web ngay cả khi đăng nhập lại.
                        </p>
                    </GlassCard>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tên hoặc Discord ID..."
                            className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>

                    {/* Users List */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-cyan-400" />
                            Danh sách Users ({filteredUsers.length})
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">Những user đã đăng nhập vào web qua OAuth Discord</p>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                                    <div>
                                        <p className="text-white font-medium">
                                            {user.display_name || user.username || "Unknown User"}
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            ID: {user.discord_id} • Role: {user.role}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleBan(user.discord_id, false)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                                        >
                                            <Ban className="w-4 h-4" />
                                            Ban
                                        </button>
                                        <button
                                            onClick={() => deleteUser(user.discord_id, user.display_name || user.username || user.discord_id)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50 text-gray-300 border border-white/10 hover:bg-gray-600/50 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && (
                                <p className="text-gray-500 text-center py-4">Không tìm thấy user nào</p>
                            )}
                        </div>
                    </GlassCard>

                    {/* Blacklist */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-400" />
                            Blacklist ({blacklist.length})
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">User bị ban sẽ không thể truy cập web dù có đăng nhập lại</p>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {blacklist.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                    <div>
                                        <p className="text-white font-medium">
                                            Discord ID: <span className="text-red-400">{item.discord_id}</span>
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            Lý do: {item.reason || "Không có"} • Ngày ban: {new Date(item.created_at).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => unbanUser(item.discord_id)}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Gỡ Ban
                                    </button>
                                </div>
                            ))}
                            {blacklist.length === 0 && (
                                <p className="text-gray-500 text-center py-4">Không có user nào trong blacklist</p>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Xác nhận xóa</h3>
                        <p className="text-gray-400 mb-6">
                            Bạn chắc chắn muốn xóa hãng <span className="text-red-400 font-semibold">{deleteConfirm.name}</span>?
                            <br />
                            <span className="text-sm text-gray-500">Hành động này không thể hoàn tác.</span>
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, id: "", name: "" })}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDeleteAirline}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
                            >
                                {loading ? "Đang xóa..." : "Xóa hãng"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Owner Confirmation Modal */}
            {deleteOwnerConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Xác nhận xóa Owner</h3>
                        <p className="text-gray-400 mb-6">
                            Bạn chắc chắn muốn xóa Owner với Discord ID <span className="text-amber-400 font-semibold">{deleteOwnerConfirm.discordId}</span>?
                            <br />
                            <span className="text-sm text-gray-500">User sẽ mất quyền quản lý hãng bay.</span>
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteOwnerConfirm({ show: false, id: "", discordId: "" })}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmRemoveOwner}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
                            >
                                {loading ? "Đang xóa..." : "Xóa Owner"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete User Confirmation Modal */}
            {deleteUserConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Xác nhận xóa User</h3>
                        <p className="text-gray-400 mb-6">
                            Bạn chắc chắn muốn xóa user <span className="text-cyan-400 font-semibold">{deleteUserConfirm.name}</span>?
                            <br />
                            <span className="text-sm text-gray-500">User có thể đăng nhập lại qua OAuth Discord. Nếu đã bị ban, họ vẫn sẽ bị ban.</span>
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteUserConfirm({ show: false, discordId: "", name: "" })}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
                            >
                                {loading ? "Đang xóa..." : "Xóa User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

