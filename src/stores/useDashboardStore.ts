/**
 * Dashboard Store — Zustand
 * Manages Control Tower dashboard state: stats, widget preferences, refresh
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export interface DashboardStats {
  totalCouriers: number;
  activeCouriers: number;
  todayOrders: number;
  pendingComplaints: number;
  monthRevenue: number;
  pendingApprovals: number;
  activeDriversNow: number;
  slaBreaches: number;
}

interface DashboardState {
  // Data
  stats: DashboardStats;
  statsLoading: boolean;
  lastRefresh: string | null;

  // Widget preferences
  collapsedWidgets: string[];
  widgetOrder: Record<string, string[]>;

  // Actions
  fetchStats: () => Promise<void>;
  toggleWidgetCollapse: (widgetId: string) => void;
  setWidgetOrder: (zone: string, order: string[]) => void;
  isWidgetCollapsed: (widgetId: string) => boolean;
}

const DEFAULT_STATS: DashboardStats = {
  totalCouriers: 0,
  activeCouriers: 0,
  todayOrders: 0,
  pendingComplaints: 0,
  monthRevenue: 0,
  pendingApprovals: 0,
  activeDriversNow: 0,
  slaBreaches: 0,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      stats: DEFAULT_STATS,
      statsLoading: true,
      lastRefresh: null,
      collapsedWidgets: [],
      widgetOrder: {},

      fetchStats: async () => {
        set({ statsLoading: true });
        try {
          if (!supabase) {
            // Mock data fallback when Supabase is not configured
            set({
              stats: {
                totalCouriers: 47,
                activeCouriers: 38,
                todayOrders: 245,
                pendingComplaints: 7,
                monthRevenue: 128000,
                pendingApprovals: 4,
                activeDriversNow: 31,
                slaBreaches: 3,
              },
              statsLoading: false,
              lastRefresh: new Date().toISOString(),
            });
            return;
          }

          const today = new Date().toISOString().split("T")[0];
          const [couriersRes, ordersRes, complaintsRes, approvalsRes] = await Promise.all([
            supabase.from("couriers").select("id, status", { count: "exact" }),
            supabase.from("orders").select("id", { count: "exact" }).gte("created_at", today),
            supabase.from("complaints_requests").select("id", { count: "exact" }).eq("status", "open"),
            supabase.from("couriers").select("id", { count: "exact" }).eq("status", "pending"),
          ]);

          const couriers = couriersRes.data || [];
          set({
            stats: {
              totalCouriers: couriersRes.count || 0,
              activeCouriers: couriers.filter((c: { status: string }) => c.status === "active").length,
              todayOrders: ordersRes.count || 0,
              pendingComplaints: complaintsRes.count || 0,
              monthRevenue: 128000, // TODO: aggregate from finance tables
              pendingApprovals: approvalsRes.count || 0,
              activeDriversNow: couriers.filter((c: { status: string }) => c.status === "active").length,
              slaBreaches: 0, // TODO: query from SLA scanner
            },
            statsLoading: false,
            lastRefresh: new Date().toISOString(),
          });
        } catch (e) {
          console.error("Dashboard stats fetch error:", e);
          set({ statsLoading: false });
        }
      },

      toggleWidgetCollapse: (widgetId) => {
        set((state) => ({
          collapsedWidgets: state.collapsedWidgets.includes(widgetId)
            ? state.collapsedWidgets.filter((id) => id !== widgetId)
            : [...state.collapsedWidgets, widgetId],
        }));
      },

      setWidgetOrder: (zone, order) => {
        set((state) => ({
          widgetOrder: { ...state.widgetOrder, [zone]: order },
        }));
      },

      isWidgetCollapsed: (widgetId) => {
        return get().collapsedWidgets.includes(widgetId);
      },
    }),
    {
      name: "fll_dashboard_prefs",
      partialize: (state) => ({
        collapsedWidgets: state.collapsedWidgets,
        widgetOrder: state.widgetOrder,
      }),
    }
  )
);
