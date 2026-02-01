"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Truck,
    AlertTriangle,
    CheckCircle,
    Clock,
    Plane,
    MapPin,
    User,
    Bell,
    BellOff,
    Car,
    RotateCcw,
    Siren,
    Disc,
    Flame,
    Wind,
    Play,
    Trash2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import {
    FlightNotification,
    getNotificationsForPanel,
    acknowledgeNotification,
    updateNotificationStatus,
    removeNotificationFromPanel,
    clearNotificationsForPanel,
    subscribeToNotifications,
    getEmergencyLabel,
    getGroundCrewLabel,
} from "@/lib/notifications";

export default function GroundCrewPanelPage() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<FlightNotification[]>([]);
    const [filter, setFilter] = useState<"all" | "pending" | "in_progress">("all");

    // Load and subscribe to notifications
    useEffect(() => {
        const loadNotifications = () => {
            const groundCrewNotifications = getNotificationsForPanel("GROUND_CREW");
            setNotifications(groundCrewNotifications);
        };

        loadNotifications();

        const unsubscribe = subscribeToNotifications(() => {
            loadNotifications();
        });

        return () => unsubscribe();
    }, []);

    const handleAccept = (notificationId: string) => {
        const userName = session?.user?.name || "Ground Crew";
        acknowledgeNotification(notificationId, userName);
        updateNotificationStatus(notificationId, "IN_PROGRESS");
        setNotifications(getNotificationsForPanel("GROUND_CREW"));
    };

    const handleComplete = (notificationId: string) => {
        updateNotificationStatus(notificationId, "COMPLETED");
        setNotifications(getNotificationsForPanel("GROUND_CREW"));
    };

    const handleDelete = (notificationId: string) => {
        removeNotificationFromPanel(notificationId, "GROUND_CREW");
        setNotifications(getNotificationsForPanel("GROUND_CREW"));
    };

    const handleClearAll = () => {
        if (confirm("Bạn có chắc muốn xóa tất cả yêu cầu khỏi Ground Crew Panel?")) {
            clearNotificationsForPanel("GROUND_CREW");
            setNotifications([]);
        }
    };

    const filteredNotifications = notifications.filter((n) => {
        if (filter === "pending") return n.status === "PENDING";
        if (filter === "in_progress") return n.status === "IN_PROGRESS" || n.status === "ACKNOWLEDGED";
        return n.status !== "COMPLETED";
    });

    const pendingCount = notifications.filter((n) => n.status === "PENDING").length;
    const inProgressCount = notifications.filter((n) => n.status === "IN_PROGRESS" || n.status === "ACKNOWLEDGED").length;

    const getSubTypeIcon = (notification: FlightNotification) => {
        switch (notification.subType) {
            case "FOLLOW_ME": return <Car className="w-6 h-6" />;
            case "PUSHBACK": return <RotateCcw className="w-6 h-6" />;
            case "FIRE_TRUCK": return <Siren className="w-6 h-6" />;
            case "LANDING_GEAR": return <Disc className="w-6 h-6" />;
            case "ENGINE_EXPLOSION": return <Flame className="w-6 h-6" />;
            case "WING_CONTROL": return <Wind className="w-6 h-6" />;
            default: return <Truck className="w-6 h-6" />;
        }
    };

    const getSubTypeLabel = (notification: FlightNotification) => {
        if (notification.type === "EMERGENCY") {
            return getEmergencyLabel(notification.subType as any);
        }
        return getGroundCrewLabel(notification.subType as any);
    };

    const getTimeSince = (isoString: string) => {
        const ms = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(ms / 60000);
        if (mins < 1) return "Vừa xong";
        if (mins < 60) return `${mins} phút trước`;
        const hours = Math.floor(mins / 60);
        return `${hours} giờ trước`;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/20">
                            <Truck className="w-7 h-7 text-amber-400" />
                        </div>
                        Ground Crew Panel
                    </h1>
                    <p className="text-gray-400 mt-1">Quản lý dịch vụ mặt đất</p>
                </div>
                <div className="flex items-center gap-3">
                    {pendingCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 animate-pulse">
                            <Bell className="w-5 h-5 text-amber-400" />
                            <span className="text-amber-400 font-semibold">{pendingCount} Yêu cầu mới</span>
                        </div>
                    )}
                    {inProgressCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30">
                            <Play className="w-5 h-5 text-blue-400" />
                            <span className="text-blue-400 font-semibold">{inProgressCount} Đang xử lý</span>
                        </div>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-500/20 border border-gray-500/30 text-gray-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span className="font-medium">Xóa tất cả</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {[
                    { key: "all", label: "Đang hoạt động", count: notifications.filter(n => n.status !== "COMPLETED").length },
                    { key: "pending", label: "Chờ nhận", count: pendingCount },
                    { key: "in_progress", label: "Đang xử lý", count: inProgressCount },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as any)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${filter === tab.key
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-gray-800/50 text-gray-400 border border-white/5 hover:text-white hover:bg-gray-800"
                            }`}
                    >
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${filter === tab.key ? "bg-amber-500/30" : "bg-white/10"
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <GlassCard className="p-12 text-center">
                    <BellOff className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 text-lg">Không có yêu cầu nào</p>
                    <p className="text-gray-500 text-sm mt-1">Các yêu cầu dịch vụ mặt đất sẽ hiển thị ở đây</p>
                </GlassCard>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredNotifications.map((notification) => (
                        <GlassCard
                            key={notification.id}
                            className={`p-5 transition-all ${notification.type === "EMERGENCY"
                                ? "border-red-500/50 bg-red-500/5"
                                : notification.status === "PENDING"
                                    ? "border-amber-500/30"
                                    : notification.status === "IN_PROGRESS"
                                        ? "border-blue-500/30 bg-blue-500/5"
                                        : "border-white/10"
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${notification.type === "EMERGENCY"
                                        ? "bg-red-500/20 text-red-400"
                                        : notification.subType === "FIRE_TRUCK"
                                            ? "bg-orange-500/20 text-orange-400"
                                            : "bg-amber-500/20 text-amber-400"
                                        }`}>
                                        {getSubTypeIcon(notification)}
                                    </div>
                                    <div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${notification.type === "EMERGENCY"
                                            ? "bg-red-500/20 text-red-400"
                                            : "bg-amber-500/20 text-amber-400"
                                            }`}>
                                            {notification.type === "EMERGENCY" ? "KHẨN CẤP" : "YÊU CẦU"}
                                        </span>
                                        <h3 className="text-lg font-bold text-white mt-1">
                                            {getSubTypeLabel(notification)}
                                        </h3>
                                    </div>
                                </div>
                                <span className="text-gray-500 text-sm flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {getTimeSince(notification.createdAt)}
                                </span>
                            </div>

                            {/* Flight Info */}
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-gray-800/50 mb-4">
                                <div className="flex items-center gap-2">
                                    <Plane className="w-4 h-4 text-cyan-400" />
                                    <span className="text-white font-semibold">{notification.flightNumber}</span>
                                    <span className="text-gray-400 text-sm">({notification.airline})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-cyan-400" />
                                    <span className="text-gray-300 text-sm">{notification.route}</span>
                                </div>
                                <div className="flex items-center gap-2 col-span-2">
                                    <User className="w-4 h-4 text-cyan-400" />
                                    <span className="text-gray-300">Cơ trưởng: {notification.captain}</span>
                                </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center justify-between">
                                {notification.status === "IN_PROGRESS" && (
                                    <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
                                        ⏳ {notification.acknowledgedBy} đang xử lý
                                    </span>
                                )}
                                {notification.status === "PENDING" && (
                                    <span className="px-3 py-1 rounded-full text-sm bg-amber-500/20 text-amber-400">
                                        🔔 Đang chờ
                                    </span>
                                )}

                                <div className="flex gap-2 ml-auto">
                                    {notification.status === "PENDING" && (
                                        <button
                                            onClick={() => handleAccept(notification.id)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
                                        >
                                            <Play className="w-4 h-4" />
                                            Nhận
                                        </button>
                                    )}
                                    {(notification.status === "IN_PROGRESS" || notification.status === "ACKNOWLEDGED") && (
                                        <button
                                            onClick={() => handleComplete(notification.id)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Hoàn thành
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notification.id)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
