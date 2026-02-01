"use client";

// ============================================
// NOTIFICATION SYSTEM FOR ATC & GROUND CREW
// ============================================

export type EmergencyType = "LANDING_GEAR" | "ENGINE_EXPLOSION" | "WING_CONTROL";
export type GroundCrewRequestType = "FOLLOW_ME" | "PUSHBACK" | "FIRE_TRUCK";
export type NotificationType = "EMERGENCY" | "GROUND_CREW_REQUEST";
export type NotificationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type TargetPanel = "ATC" | "GROUND_CREW";
export type NotificationStatus = "PENDING" | "ACKNOWLEDGED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface FlightNotification {
    id: string;
    flightId: string;
    flightNumber: string;
    airline: string;
    captain: string;
    captainId: string;
    route: string; // e.g., "ITKO → IPPH"
    type: NotificationType;
    subType: EmergencyType | GroundCrewRequestType;
    priority: NotificationPriority;
    status: NotificationStatus;
    createdAt: string; // ISO string for localStorage
    acknowledgedAt?: string;
    completedAt?: string;
    acknowledgedBy?: string;
    targetPanels: TargetPanel[];
    message?: string;
}

// Storage keys
const NOTIFICATIONS_KEY = "aero_notifications";
const NOTIFICATION_HANDLERS_KEY = "aero_notification_handlers";

// ============================================
// NOTIFICATION HELPERS
// ============================================

export function generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getNotificationPriority(
    type: NotificationType,
    subType: EmergencyType | GroundCrewRequestType
): NotificationPriority {
    if (type === "EMERGENCY") {
        return "CRITICAL";
    }
    if (subType === "FIRE_TRUCK") {
        return "HIGH";
    }
    return "MEDIUM";
}

export function getTargetPanels(
    type: NotificationType,
    subType: EmergencyType | GroundCrewRequestType
): TargetPanel[] {
    // All emergencies go to both ATC and Ground Crew
    if (type === "EMERGENCY") {
        return ["ATC", "GROUND_CREW"];
    }

    // Fire truck also notifies ATC
    if (subType === "FIRE_TRUCK") {
        return ["ATC", "GROUND_CREW"];
    }

    // Other ground crew requests only go to Ground Crew
    return ["GROUND_CREW"];
}

export function getEmergencyLabel(type: EmergencyType): string {
    switch (type) {
        case "LANDING_GEAR": return "Gãy càng đáp";
        case "ENGINE_EXPLOSION": return "Nổ động cơ";
        case "WING_CONTROL": return "Hỏng điều khiển cánh";
    }
}

export function getGroundCrewLabel(type: GroundCrewRequestType): string {
    switch (type) {
        case "FOLLOW_ME": return "Xe Follow Me";
        case "PUSHBACK": return "Pushback";
        case "FIRE_TRUCK": return "Xe cứu hỏa";
    }
}

export function getNotificationMessage(
    type: NotificationType,
    subType: EmergencyType | GroundCrewRequestType
): string {
    if (type === "EMERGENCY") {
        return `🚨 KHẨN CẤP: ${getEmergencyLabel(subType as EmergencyType)}`;
    }
    return `🚛 YÊU CẦU: ${getGroundCrewLabel(subType as GroundCrewRequestType)}`;
}

// ============================================
// NOTIFICATION STORE (localStorage-based)
// ============================================

export function getNotifications(): FlightNotification[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(NOTIFICATIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to get notifications:", e);
        return [];
    }
}

export function saveNotifications(notifications: FlightNotification[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        // Trigger storage event for cross-tab sync
        window.dispatchEvent(new Event("notifications-updated"));
    } catch (e) {
        console.error("Failed to save notifications:", e);
    }
}

export function createNotification(params: {
    flightId: string;
    flightNumber: string;
    airline: string;
    captain: string;
    captainId: string;
    route: string;
    type: NotificationType;
    subType: EmergencyType | GroundCrewRequestType;
}): FlightNotification {
    const notification: FlightNotification = {
        id: generateNotificationId(),
        flightId: params.flightId,
        flightNumber: params.flightNumber,
        airline: params.airline,
        captain: params.captain,
        captainId: params.captainId,
        route: params.route,
        type: params.type,
        subType: params.subType,
        priority: getNotificationPriority(params.type, params.subType),
        status: "PENDING",
        createdAt: new Date().toISOString(),
        targetPanels: getTargetPanels(params.type, params.subType),
        message: getNotificationMessage(params.type, params.subType),
    };

    const existing = getNotifications();
    saveNotifications([notification, ...existing]);

    console.log(`📬 Notification created:`, notification);
    return notification;
}

export function getNotificationsForPanel(panel: TargetPanel): FlightNotification[] {
    return getNotifications().filter(n => n.targetPanels.includes(panel));
}

export function getPendingNotificationsForPanel(panel: TargetPanel): FlightNotification[] {
    return getNotificationsForPanel(panel).filter(n => n.status === "PENDING");
}

export function acknowledgeNotification(
    notificationId: string,
    acknowledgedBy: string
): FlightNotification | null {
    const notifications = getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);

    if (index === -1) return null;

    notifications[index] = {
        ...notifications[index],
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy,
    };

    saveNotifications(notifications);
    console.log(`✅ Notification acknowledged:`, notifications[index]);
    return notifications[index];
}

export function updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus
): FlightNotification | null {
    const notifications = getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);

    if (index === -1) return null;

    const updates: Partial<FlightNotification> = { status };

    if (status === "COMPLETED") {
        updates.completedAt = new Date().toISOString();
    }

    notifications[index] = {
        ...notifications[index],
        ...updates,
    };

    saveNotifications(notifications);
    console.log(`📝 Notification status updated:`, notifications[index]);
    return notifications[index];
}

export function deleteNotification(notificationId: string): boolean {
    const notifications = getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);

    if (filtered.length === notifications.length) return false;

    saveNotifications(filtered);
    console.log(`🗑️ Notification deleted:`, notificationId);
    return true;
}

// Remove notification from a specific panel only (keeps it for other panels)
export function removeNotificationFromPanel(notificationId: string, panel: TargetPanel): boolean {
    const notifications = getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);

    if (index === -1) return false;

    const notification = notifications[index];
    const updatedPanels = notification.targetPanels.filter(p => p !== panel);

    if (updatedPanels.length === 0) {
        // No panels left, delete entirely
        notifications.splice(index, 1);
    } else {
        // Update to remove this panel
        notifications[index] = {
            ...notification,
            targetPanels: updatedPanels,
        };
    }

    saveNotifications(notifications);
    console.log(`🗑️ Notification removed from ${panel}:`, notificationId);
    return true;
}

// Clear all notifications for a specific panel only
export function clearNotificationsForPanel(panel: TargetPanel): void {
    const notifications = getNotifications();

    const updatedNotifications = notifications
        .map(n => {
            if (!n.targetPanels.includes(panel)) return n;

            const updatedPanels = n.targetPanels.filter(p => p !== panel);
            if (updatedPanels.length === 0) return null; // Mark for deletion

            return { ...n, targetPanels: updatedPanels };
        })
        .filter((n): n is FlightNotification => n !== null);

    saveNotifications(updatedNotifications);
    console.log(`🧹 Notifications cleared for ${panel}`);
}

export function clearAllNotifications(): void {
    saveNotifications([]);
    console.log(`🧹 All notifications cleared`);
}

// ============================================
// NOTIFICATION COUNTS (for badges)
// ============================================

export function getNotificationCounts(): {
    atc: { pending: number; total: number };
    groundCrew: { pending: number; total: number };
    critical: number;
} {
    const notifications = getNotifications();

    const atcNotifications = notifications.filter(n => n.targetPanels.includes("ATC"));
    const groundCrewNotifications = notifications.filter(n => n.targetPanels.includes("GROUND_CREW"));

    return {
        atc: {
            pending: atcNotifications.filter(n => n.status === "PENDING").length,
            total: atcNotifications.length,
        },
        groundCrew: {
            pending: groundCrewNotifications.filter(n => n.status === "PENDING").length,
            total: groundCrewNotifications.length,
        },
        critical: notifications.filter(n => n.priority === "CRITICAL" && n.status === "PENDING").length,
    };
}

// ============================================
// HOOK FOR REAL-TIME UPDATES
// ============================================

export function subscribeToNotifications(callback: (notifications: FlightNotification[]) => void): () => void {
    if (typeof window === "undefined") return () => { };

    const handler = () => {
        callback(getNotifications());
    };

    // Listen for our custom event
    window.addEventListener("notifications-updated", handler);

    // Also listen for storage events (cross-tab sync)
    window.addEventListener("storage", (e) => {
        if (e.key === NOTIFICATIONS_KEY) {
            handler();
        }
    });

    return () => {
        window.removeEventListener("notifications-updated", handler);
    };
}
