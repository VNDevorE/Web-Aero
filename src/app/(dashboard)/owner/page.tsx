"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
    Building2,
    Users,
    Plane,
    DollarSign,
    Plus,
    Minus,
    ShoppingCart,
    Trash2,
    Loader2,
    Crown,
    User,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { AIRCRAFT_PRICES, AIRCRAFT_DEPRECIATION, ADMIN_DISCORD_ID } from "@/lib/constants";

type TabType = "members" | "fleet" | "salary";

interface AirlineInfo {
    id: string;
    name: string;
    money: number;
}

interface Member {
    id: string;
    discord_id: string;
    username: string;
    display_name: string | null;
    balance: number;
    role: string;
}

interface Aircraft {
    id: string;
    aircraft_name: string;
    price: number;
    purchase_date: string;
}

export default function OwnerPanelPage() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState<TabType>("members");
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);

    // Airline info
    const [airline, setAirline] = useState<AirlineInfo | null>(null);

    // Members
    const [members, setMembers] = useState<Member[]>([]);
    const [newMemberDiscordId, setNewMemberDiscordId] = useState("");

    // Fleet
    const [fleet, setFleet] = useState<Aircraft[]>([]);
    const [selectedAircraft, setSelectedAircraft] = useState("");

    // Salary
    const [selectedMember, setSelectedMember] = useState("");
    const [salaryAmount, setSalaryAmount] = useState("");

    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (status === "authenticated") {
            checkOwnership();
        }
    }, [session, status]);

    const checkOwnership = async () => {
        try {
            const res = await fetch("/api/owner/check");
            const data = await res.json();

            if (data.isOwner || session?.user?.discordId === ADMIN_DISCORD_ID) {
                setIsOwner(true);
                setAirline(data.airline);
                loadMembers();
                loadFleet();
            } else {
                setIsOwner(false);
            }
        } catch (e) {
            console.error("Error checking ownership:", e);
        }
        setLoading(false);
    };

    const loadMembers = async () => {
        try {
            const res = await fetch("/api/owner/members");
            const data = await res.json();
            setMembers(data.members || []);
        } catch (e) {
            console.error("Failed to load members:", e);
        }
    };

    const loadFleet = async () => {
        try {
            const res = await fetch("/api/owner/fleet");
            const data = await res.json();
            setFleet(data.aircraft || []);
        } catch (e) {
            console.error("Failed to load fleet:", e);
        }
    };

    const showMessage = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

    // Member operations
    const addMember = async () => {
        if (!newMemberDiscordId.trim()) return;
        setLoading(true);
        try {
            const res = await fetch("/api/owner/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ discordId: newMemberDiscordId.trim() }),
            });
            if (res.ok) {
                showMessage("success", "Thêm thành viên thành công!");
                setNewMemberDiscordId("");
                loadMembers();
            } else {
                const err = await res.json();
                showMessage("error", err.error || "Thêm thất bại!");
            }
        } catch (e) {
            showMessage("error", "Lỗi hệ thống!");
        }
        setLoading(false);
    };

    const removeMember = async (memberId: string) => {
        if (!confirm("Xóa thành viên này?")) return;
        try {
            const res = await fetch(`/api/owner/members?id=${memberId}`, { method: "DELETE" });
            if (res.ok) {
                showMessage("success", "Đã xóa thành viên!");
                loadMembers();
            }
        } catch (e) {
            showMessage("error", "Xóa thất bại!");
        }
    };

    // Fleet operations
    const buyAircraft = async () => {
        if (!selectedAircraft) return;
        const price = AIRCRAFT_PRICES[selectedAircraft];
        if (!confirm(`Mua ${selectedAircraft} với giá $${price.toLocaleString()}?`)) return;

        setLoading(true);
        try {
            const res = await fetch("/api/owner/fleet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ aircraftName: selectedAircraft }),
            });
            if (res.ok) {
                showMessage("success", `Đã mua ${selectedAircraft}!`);
                setSelectedAircraft("");
                loadFleet();
                checkOwnership(); // Refresh balance
            } else {
                const err = await res.json();
                showMessage("error", err.error || "Mua thất bại!");
            }
        } catch (e) {
            showMessage("error", "Lỗi hệ thống!");
        }
        setLoading(false);
    };

    const sellAircraft = async (aircraftId: string, aircraftName: string) => {
        const originalPrice = AIRCRAFT_PRICES[aircraftName] || 0;
        const depreciation = AIRCRAFT_DEPRECIATION[aircraftName] || 0.2;
        const sellPrice = Math.floor(originalPrice * (1 - depreciation));

        if (!confirm(`Bán ${aircraftName} với giá $${sellPrice.toLocaleString()} (giảm ${depreciation * 100}%)?`)) return;

        try {
            const res = await fetch(`/api/owner/fleet?id=${aircraftId}`, { method: "DELETE" });
            if (res.ok) {
                showMessage("success", `Đã bán ${aircraftName}!`);
                loadFleet();
                checkOwnership();
            }
        } catch (e) {
            showMessage("error", "Bán thất bại!");
        }
    };

    // Salary operations
    const modifySalary = async (action: "pay" | "deduct") => {
        if (!selectedMember || !salaryAmount) return;
        setLoading(true);
        try {
            const amount = parseInt(salaryAmount);
            const res = await fetch("/api/owner/salary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memberId: selectedMember,
                    amount: action === "deduct" ? -amount : amount,
                    action,
                }),
            });
            if (res.ok) {
                showMessage("success", action === "pay" ? "Trả lương thành công!" : "Trừ lương thành công!");
                setSalaryAmount("");
                loadMembers();
                checkOwnership();
            } else {
                const err = await res.json();
                showMessage("error", err.error || "Thao tác thất bại!");
            }
        } catch (e) {
            showMessage("error", "Lỗi hệ thống!");
        }
        setLoading(false);
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
        );
    }

    if (!isOwner) {
        return (
            <GlassCard className="p-8 text-center">
                <Crown className="w-16 h-16 mx-auto text-amber-400 mb-4" />
                <h2 className="text-xl font-bold text-white">Bạn không phải Owner</h2>
                <p className="text-gray-400">Liên hệ Admin để được cấp quyền Owner.</p>
            </GlassCard>
        );
    }

    const tabs = [
        { id: "members", label: "Thành viên", icon: Users },
        { id: "fleet", label: "Đội bay", icon: Plane },
        { id: "salary", label: "Lương", icon: DollarSign },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20">
                        <Crown className="w-7 h-7 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Owner Panel</h1>
                        <p className="text-amber-400">{airline?.name}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-gray-400 text-sm">Số dư hãng</p>
                    <p className="text-2xl font-bold text-emerald-400">${airline?.money?.toLocaleString()}</p>
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
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-gray-800/50 text-gray-400 border border-white/5 hover:text-white"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Members Tab */}
            {activeTab === "members" && (
                <div className="space-y-6">
                    {/* Add Member */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Thêm thành viên</h3>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newMemberDiscordId}
                                onChange={(e) => setNewMemberDiscordId(e.target.value)}
                                placeholder="Discord ID..."
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                            />
                            <button
                                onClick={addMember}
                                disabled={!newMemberDiscordId.trim()}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm
                            </button>
                        </div>
                    </GlassCard>

                    {/* Members List */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Danh sách ({members.length})</h3>
                        <div className="space-y-3">
                            {members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{member.display_name || member.username}</p>
                                            <p className="text-gray-400 text-sm">ID: {member.discord_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-emerald-400">${member.balance?.toLocaleString()}</p>
                                        <button
                                            onClick={() => removeMember(member.id)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {members.length === 0 && (
                                <p className="text-gray-500 text-center py-4">Chưa có thành viên</p>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Fleet Tab */}
            {activeTab === "fleet" && (
                <div className="space-y-6">
                    {/* Buy Aircraft */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-cyan-400" />
                            Mua máy bay
                        </h3>
                        <div className="flex gap-3">
                            <select
                                value={selectedAircraft}
                                onChange={(e) => setSelectedAircraft(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white focus:outline-none"
                            >
                                <option value="">Chọn máy bay...</option>
                                {Object.entries(AIRCRAFT_PRICES).map(([name, price]) => (
                                    <option key={name} value={name}>
                                        {name} - ${price.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={buyAircraft}
                                disabled={!selectedAircraft}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                Mua
                            </button>
                        </div>
                    </GlassCard>

                    {/* Fleet List */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Đội bay ({fleet.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fleet.map((aircraft) => {
                                const depreciation = AIRCRAFT_DEPRECIATION[aircraft.aircraft_name] || 0.2;
                                const sellPrice = Math.floor(aircraft.price * (1 - depreciation));
                                return (
                                    <div key={aircraft.id} className="p-4 rounded-lg bg-gray-800/50 border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Plane className="w-8 h-8 text-cyan-400" />
                                                <div>
                                                    <p className="text-white font-medium">{aircraft.aircraft_name}</p>
                                                    <p className="text-gray-400 text-sm">
                                                        Bán: ${sellPrice.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => sellAircraft(aircraft.id, aircraft.aircraft_name)}
                                                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-sm"
                                            >
                                                Bán
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {fleet.length === 0 && (
                                <p className="text-gray-500 text-center py-4 md:col-span-2">Chưa có máy bay</p>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Salary Tab */}
            {activeTab === "salary" && (
                <div className="space-y-6">
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                            Quản lý lương
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select
                                value={selectedMember}
                                onChange={(e) => setSelectedMember(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white focus:outline-none"
                            >
                                <option value="">Chọn thành viên...</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.display_name || m.username} (${m.balance?.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={salaryAmount}
                                onChange={(e) => setSalaryAmount(e.target.value)}
                                placeholder="Số tiền..."
                                className="px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => modifySalary("pay")}
                                disabled={!selectedMember || !salaryAmount}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Trả lương
                            </button>
                            <button
                                onClick={() => modifySalary("deduct")}
                                disabled={!selectedMember || !salaryAmount}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                            >
                                <Minus className="w-4 h-4" />
                                Trừ lương
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm mt-4">
                            * Trả lương: Trừ từ quỹ hãng, cộng vào số dư thành viên
                            <br />
                            * Trừ lương: Trừ từ số dư thành viên, cộng vào quỹ hãng
                        </p>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
