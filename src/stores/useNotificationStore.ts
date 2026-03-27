/**
 * Notification Store — Zustand
 * Manages real-time alerts, SLA breaches, and notification state
 */
import { create } from "zustand";

export type NotificationType = "complaint" | "order" | "finance" | "system" | "sla" | "approval";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  moduleId?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: AdminNotification[];
  loading: boolean;

  // Actions
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<AdminNotification, "id" | "createdAt" | "read">) => void;
  removeNotification: (id: string) => void;

  // Selectors
  getUnreadCount: () => number;
  getByType: (type: NotificationType) => AdminNotification[];
  getUrgent: () => AdminNotification[];
}

// Mock notifications for initial state
const MOCK_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "ntf-001",
    type: "sla",
    priority: "urgent",
    title: "تجاوز SLA — وقت استجابة الشكاوى",
    message: "وقت الاستجابة تجاوز 4.5 ساعات (الحد: 2 ساعة)",
    read: false,
    link: "/admin-panel/sla",
    moduleId: "complaints",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "ntf-002",
    type: "approval",
    priority: "high",
    title: "اعتماد دفعة رواتب بانتظار الموافقة",
    message: "دفعة فبراير — 128,000 ر.س — 47 سائق",
    read: false,
    link: "/admin-panel/approvals",
    moduleId: "payouts",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "ntf-003",
    type: "complaint",
    priority: "high",
    title: "7 شكاوى معلقة تنتظر المعالجة",
    message: "3 شكاوى عاجلة من منصة جاهز",
    read: false,
    link: "/admin-panel/complaints",
    moduleId: "complaints",
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "ntf-004",
    type: "finance",
    priority: "normal",
    title: "تقرير المطابقة المالية جاهز",
    message: "مطابقة مارس 2026 — variance 1.2%",
    read: true,
    link: "/admin-panel/reconciliation",
    moduleId: "reconciliation",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "ntf-005",
    type: "system",
    priority: "low",
    title: "تحديث نظام — نسخة 2.0.0",
    message: "تم تفعيل مركز التحكم الجديد بنجاح",
    read: true,
    moduleId: "dashboard",
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: MOCK_NOTIFICATIONS,
  loading: false,

  loadNotifications: async () => {
    set({ loading: true });
    // TODO: Fetch from API — GET /api/notifications
    // For now, using mock data
    set({ loading: false });
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  addNotification: (notification) => {
    const newNotif: AdminNotification = {
      ...notification,
      id: `ntf-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },

  getByType: (type) => {
    return get().notifications.filter((n) => n.type === type);
  },

  getUrgent: () => {
    return get().notifications.filter(
      (n) => !n.read && (n.priority === "urgent" || n.priority === "high")
    );
  },
}));
