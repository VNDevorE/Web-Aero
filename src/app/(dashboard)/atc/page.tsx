"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Radio,
    AlertTriangle,
    CheckCircle,
    Clock,
    Plane,
    MapPin,
    User,
    Bell,
    BellOff,
    RefreshCw,
    Siren,
    Disc,
    Flame,
    Wind,
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

export default function ATCPanelPage() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<FlightNotification[]>([]);
    const [filter, setFilter] = useState<"all" | "pending" | "acknowledged">("all");

    // Load and subscribe to notifications
    useEffect(() => {
        const loadNotifications = () => {
            const atcNotifications = getNotificationsForPanel("ATC");
            setNotifications(atcNotifications);
        };

        loadNotifications();

        const unsubscribe = subscribeToNotifications(() => {
            loadNotifications();
        });

        return () => unsubscribe();
    }, []);

    const handleAcknowledge = (notificationId: string) => {
        const userName = session?.user?.name || "ATC Controller";
        acknowledgeNotification(notificationId, userName);
        // Refresh list
        setNotifications(getNotificationsForPanel("ATC"));
    };

    const handleComplete = (notificationId: string) => {
        updateNotificationStatus(notificationId, "COMPLETED");
        setNotifications(getNotificationsForPanel("ATC"));
    };

    const handleDelete = (notificationId: string) => {
        removeNotificationFromPanel(notificationId, "ATC");
        setNotifications(getNotificationsForPanel("ATC"));
    };

    const handleClearAll = () => {
        if (confirm("Bạn có chắc muốn xóa tất cả thông báo khỏi ATC Panel?")) {
            clearNotificationsForPanel("ATC");
            setNotifications([]);
        }
    };

    const filteredNotifications = notifications.filter((n) => {
        if (filter === "pending") return n.status === "PENDING";
        if (filter === "acknowledged") return n.status === "ACKNOWLEDGED" || n.status === "IN_PROGRESS";
        return true;
    });

    const pendingCount = notifications.filter((n) => n.status === "PENDING").length;
    const criticalCount = notifications.filter((n) => n.priority === "CRITICAL" && n.status === "PENDING").length;

    const getSubTypeIcon = (notification: FlightNotification) => {
        if (notification.type === "EMERGENCY") {
            switch (notification.subType) {
                case "LANDING_GEAR": return <Disc className="w-6 h-6" />;
                case "ENGINE_EXPLOSION": return <Flame className="w-6 h-6" />;
                case "WING_CONTROL": return <Wind className="w-6 h-6" />;
            }
        }
        if (notification.subType === "FIRE_TRUCK") {
            return <Siren className="w-6 h-6" />;
        }
        return <AlertTriangle className="w-6 h-6" />;
    };

    const getSubTypeLabel = (notification: FlightNotification) => {
        if (notification.type === "EMERGENCY") {
            return getEmergencyLabel(notification.subType as any);
        }
        return getGroundCrewLabel(notification.subType as any);
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
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
                        <div className="p-2 rounded-xl bg-cyan-500/20">
                            <Radio className="w-7 h-7 text-cyan-400" />
                        </div>
                        ATC Control Panel
                    </h1>
                    <p className="text-gray-400 mt-1">Quản lý điều khiển không lưu</p>
                </div>
                <div className="flex items-center gap-3">
                    {criticalCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 animate-pulse">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400 font-semibold">{criticalCount} Khẩn cấp</span>
                        </div>
                    )}
                    {pendingCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30">
                            <Bell className="w-5 h-5 text-amber-400" />
                            <span className="text-amber-400 font-semibold">{pendingCount} Chờ xử lý</span>
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
                    { key: "all", label: "Tất cả", count: notifications.length },
                    { key: "pending", label: "Chờ xử lý", count: pendingCount },
                    { key: "acknowledged", label: "Đã xác nhận", count: notifications.filter(n => n.status !== "PENDING" && n.status !== "COMPLETED").length },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as any)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${filter === tab.key
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : "bg-gray-800/50 text-gray-400 border border-white/5 hover:text-white hover:bg-gray-800"
                            }`}
                    >
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${filter === tab.key ? "bg-cyan-500/30" : "bg-white/10"
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
                    <p className="text-gray-400 text-lg">Không có thông báo nào</p>
                    <p className="text-gray-500 text-sm mt-1">Các tình huống khẩn cấp sẽ hiển thị ở đây</p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <GlassCard
                            key={notification.id}
                            className={`p-5 transition-all ${notification.priority === "CRITICAL" && notification.status === "PENDING"
                                ? "border-red-500/50 bg-red-500/5 animate-pulse"
                                : notification.status === "PENDING"
                                    ? "border-amber-500/30"
                                    : "border-white/10"
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`p-3 rounded-xl ${notification.priority === "CRITICAL"
                                    ? "bg-red-500/20 text-red-400"
                                    : notification.priority === "HIGH"
                                        ? "bg-orange-500/20 text-orange-400"
                                        : "bg-amber-500/20 text-amber-400"
                                    }`}>
                                    {getSubTypeIcon(notification)}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${notification.type === "EMERGENCY"
                                            ? "bg-red-500/20 text-red-400"
                                            : "bg-amber-500/20 text-amber-400"
                                            }`}>
                                            {notification.type === "EMERGENCY" ? "🚨 KHẨN CẤP" : "📞 YÊU CẦU"}
                                        </span>
                                        <span className="text-gray-500 text-sm flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {getTimeSince(notification.createdAt)}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-1">
                                        {getSubTypeLabel(notification)}
                                    </h3>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                        <div className="flex items-center gap-2">
                                            <Plane className="w-4 h-4 text-cyan-400" />
                                            <span className="text-white font-semibold">{notification.flightNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">{notification.airline}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-cyan-400" />
                                            <span className="text-gray-300">{notification.route}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-cyan-400" />
                                            <span className="text-gray-300">{notification.captain}</span>
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    {notification.status !== "PENDING" && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-sm ${notification.status === "ACKNOWLEDGED"
                                                ? "bg-blue-500/20 text-blue-400"
                                                : notification.status === "COMPLETED"
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : "bg-gray-500/20 text-gray-400"
                                                }`}>
                                                {notification.status === "ACKNOWLEDGED" && "✓ Đã xác nhận"}
                                                {notification.status === "IN_PROGRESS" && "⏳ Đang xử lý"}
                                                {notification.status === "COMPLETED" && "✓ Hoàn thành"}
                                            </span>
                                            {notification.acknowledgedBy && (
                                                <span className="text-gray-500 text-sm">
                                                    bởi {notification.acknowledgedBy}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    {notification.status === "PENDING" && (
                                        <button
                                            onClick={() => handleAcknowledge(notification.id)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Xác nhận
                                        </button>
                                    )}
                                    {notification.status === "ACKNOWLEDGED" && (
                                        <button
                                            onClick={() => handleComplete(notification.id)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Hoàn thành
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notification.id)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Xóa
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
