/**
 * Notification Store — Zustand + Persist + Supabase Realtime
 * Manages real-time alerts, SLA breaches, and notification state
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://k8d4arcxu4.execute-api.us-east-1.amazonaws.com";

export type NotificationType =
  | "complaint"
  | "order"
  | "finance"
  | "system"
  | "sla"
  | "approval"
  | "hr"
  | "driver";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  date: string;
  link?: string;
}

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
  _realtimeChannel: unknown | null;

  // Data fetching
  loadNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;

  // Realtime
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;

  // Actions
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteRead: () => void;
  addNotification: (
    notification: Omit<AdminNotification, "id" | "createdAt" | "read">,
  ) => void;
  removeNotification: (id: string) => void;

  // Selectors
  getUnreadCount: () => number;
  getByType: (type: NotificationType) => AdminNotification[];
  getUrgent: () => AdminNotification[];
}

// Mock notifications for initial state / fallback
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

/** Map a raw Supabase/API row to AdminNotification */
function mapRow(n: Record<string, unknown>): AdminNotification {
  return {
    id: String(n.id ?? `ntf-${Date.now()}-${Math.random()}`),
    type: (n.type as NotificationType) || "system",
    priority: (n.priority as NotificationPriority) || "normal",
    title: String(n.title ?? ""),
    message: String(n.message ?? ""),
    read: Boolean(n.read ?? n.is_read),
    link: (n.link as string) || undefined,
    moduleId: (n.module_id as string) || (n.moduleId as string) || undefined,
    createdAt:
      (n.created_at as string) ||
      (n.createdAt as string) ||
      new Date().toISOString(),
  };
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: MOCK_NOTIFICATIONS,
      loading: false,
      _realtimeChannel: null,

      /**
       * Fetch notifications: API -> Supabase -> keep mock fallback
       * Aliased as both loadNotifications (legacy) and fetchNotifications (new)
       */
      loadNotifications: async () => {
        await get().fetchNotifications();
      },

      fetchNotifications: async () => {
        set({ loading: true });
        try {
          // Try API first
          const res = await fetch(`${API_BASE}/api/notifications`, {
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              set({ notifications: data.map(mapRow), loading: false });
              return;
            }
          }
        } catch {
          /* fall through to Supabase */
        }

        // Try Supabase fallback
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from("notifications" as any)
              .select("*")
              .order("created_at", { ascending: false })
              .limit(50);
            if (!error && data && data.length > 0) {
              set({
                notifications: (data as Record<string, unknown>[]).map(mapRow),
                loading: false,
              });
              return;
            }
          } catch {
            /* keep mock */
          }
        }

        // Keep existing data (mock or previously persisted)
        set({ loading: false });
      },

      /**
       * Subscribe to Supabase Realtime on the `notifications` table.
       * Handles INSERT, UPDATE, and DELETE events.
       */
      subscribeToRealtime: () => {
        // Don't double-subscribe
        if (get()._realtimeChannel) return;
        if (!supabase) return;

        const channel = supabase
          .channel("notifications-realtime")
          .on(
            "postgres_changes" as any,
            { event: "INSERT", schema: "public", table: "notifications" },
            (payload: any) => {
              const newNotif = mapRow(payload.new);
              set((state) => ({
                notifications: [newNotif, ...state.notifications],
              }));
            },
          )
          .on(
            "postgres_changes" as any,
            { event: "UPDATE", schema: "public", table: "notifications" },
            (payload: any) => {
              const updated = mapRow(payload.new);
              set((state) => ({
                notifications: state.notifications.map((n) =>
                  n.id === updated.id ? updated : n,
                ),
              }));
            },
          )
          .on(
            "postgres_changes" as any,
            { event: "DELETE", schema: "public", table: "notifications" },
            (payload: any) => {
              const deletedId = String(payload.old?.id);
              set((state) => ({
                notifications: state.notifications.filter(
                  (n) => n.id !== deletedId,
                ),
              }));
            },
          )
          .subscribe();

        set({ _realtimeChannel: channel });
      },

      /** Unsubscribe from Realtime channel */
      unsubscribeFromRealtime: () => {
        const channel = get()._realtimeChannel;
        if (channel && supabase) {
          supabase.removeChannel(channel as any);
          set({ _realtimeChannel: null });
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }));
        // Fire-and-forget Supabase update
        if (supabase) {
          supabase
            .from("notifications" as any)
            .update({ read: true, is_read: true } as any)
            .eq("id", id)
            .then(() => {});
        }
      },

      markAllAsRead: () => {
        const ids = get()
          .notifications.filter((n) => !n.read)
          .map((n) => n.id);
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
        // Fire-and-forget Supabase update
        if (supabase && ids.length > 0) {
          supabase
            .from("notifications" as any)
            .update({ read: true, is_read: true } as any)
            .in("id", ids)
            .then(() => {});
        }
      },

      /** Delete all read notifications from state */
      deleteRead: () => {
        set((state) => ({
          notifications: state.notifications.filter((n) => !n.read),
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
          (n) => !n.read && (n.priority === "urgent" || n.priority === "high"),
        );
      },
    }),
    {
      name: "fll_notifications",
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    },
  ),
);
