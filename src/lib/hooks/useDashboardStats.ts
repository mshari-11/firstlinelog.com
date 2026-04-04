import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface RecentOrder {
  id: string;
  customer: string;
  driver: string;
  status: string;
  time: string;
  city: string;
}

interface CityStats {
  name: string;
  orders: number;
  percentage: number;
}

export interface DashboardStats {
  totalOrders: number;
  totalOrdersChange: number;
  activeDrivers: number;
  activeDriversChange: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  avgDeliveryTime: number;
  avgDeliveryTimeChange: number;
  recentOrders: RecentOrder[];
  topCities: CityStats[];
  loading: boolean;
}

const MOCK_RECENT_ORDERS: RecentOrder[] = [
  { id: "FLL-10847", customer: "البيك", driver: "عبدالله", status: "delivered", time: "منذ 5 دقائق", city: "جدة" },
  { id: "FLL-10846", customer: "هنقرستيشن", driver: "محمد", status: "in_transit", time: "منذ 12 دقيقة", city: "الرياض" },
  { id: "FLL-10845", customer: "جاهز", driver: "خالد", status: "pending", time: "منذ 18 دقيقة", city: "مكة" },
  { id: "FLL-10844", customer: "مرسول", driver: "فهد", status: "delivered", time: "منذ 25 دقيقة", city: "الدمام" },
  { id: "FLL-10843", customer: "نون فود", driver: "سعود", status: "in_transit", time: "منذ 30 دقيقة", city: "المدينة" },
];

const MOCK_TOP_CITIES: CityStats[] = [
  { name: "جدة", orders: 4250, percentage: 33 },
  { name: "الرياض", orders: 3890, percentage: 30 },
  { name: "مكة", orders: 1920, percentage: 15 },
  { name: "الدمام", orders: 1540, percentage: 12 },
  { name: "المدينة", orders: 1247, percentage: 10 },
];

const MOCK_STATS: DashboardStats = {
  totalOrders: 12847,
  totalOrdersChange: 12.5,
  activeDrivers: 2847,
  activeDriversChange: 5.2,
  monthlyRevenue: 1200000,
  monthlyRevenueChange: 18.3,
  avgDeliveryTime: 28,
  avgDeliveryTimeChange: -3.1,
  recentOrders: MOCK_RECENT_ORDERS,
  topCities: MOCK_TOP_CITIES,
  loading: false,
};

function getMonthRange(offset: number): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

const REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({ ...MOCK_STATS, loading: true });

  const fetchStats = useCallback(async () => {
    if (!supabase) {
      setStats({ ...MOCK_STATS, loading: false });
      return;
    }

    try {
      const currentMonth = getMonthRange(0);
      const prevMonth = getMonthRange(-1);

      const [
        ordersCountRes,
        prevOrdersCountRes,
        activeDriversRes,
        prevActiveDriversRes,
        revenueRes,
        prevRevenueRes,
        complaintsRes,
      ] = await Promise.all([
        // Current month orders
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("created_at", currentMonth.start)
          .lt("created_at", currentMonth.end),
        // Previous month orders
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("created_at", prevMonth.start)
          .lt("created_at", prevMonth.end),
        // Current active couriers
        supabase
          .from("couriers")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        // Previous month active couriers (snapshot approximation)
        supabase
          .from("couriers")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .lt("created_at", currentMonth.start),
        // Current month revenue
        supabase
          .from("finance")
          .select("net_payout")
          .gte("created_at", currentMonth.start)
          .lt("created_at", currentMonth.end),
        // Previous month revenue
        supabase
          .from("finance")
          .select("net_payout")
          .gte("created_at", prevMonth.start)
          .lt("created_at", prevMonth.end),
        // Open complaints
        supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("status", "open"),
      ]);

      // Check for critical errors — fall back to mock if any query fails
      const hasError = [ordersCountRes, prevOrdersCountRes, activeDriversRes, prevActiveDriversRes, revenueRes, prevRevenueRes, complaintsRes]
        .some((r) => r.error);

      if (hasError) {
        console.warn("Dashboard stats query error, falling back to mock data");
        setStats({ ...MOCK_STATS, loading: false });
        return;
      }

      const currentOrders = ordersCountRes.count ?? 0;
      const prevOrders = prevOrdersCountRes.count ?? 0;

      const currentDrivers = activeDriversRes.count ?? 0;
      const prevDrivers = prevActiveDriversRes.count ?? 0;

      const currentRevenue = (revenueRes.data ?? []).reduce(
        (sum: number, row: { net_payout: number | null }) => sum + (row.net_payout ?? 0),
        0,
      );
      const prevRevenue = (prevRevenueRes.data ?? []).reduce(
        (sum: number, row: { net_payout: number | null }) => sum + (row.net_payout ?? 0),
        0,
      );

      setStats({
        totalOrders: currentOrders,
        totalOrdersChange: calcChange(currentOrders, prevOrders),
        activeDrivers: currentDrivers,
        activeDriversChange: calcChange(currentDrivers, prevDrivers),
        monthlyRevenue: currentRevenue,
        monthlyRevenueChange: calcChange(currentRevenue, prevRevenue),
        // avgDeliveryTime kept as mock — no delivery_time column assumed
        avgDeliveryTime: MOCK_STATS.avgDeliveryTime,
        avgDeliveryTimeChange: MOCK_STATS.avgDeliveryTimeChange,
        recentOrders: MOCK_RECENT_ORDERS,
        topCities: MOCK_TOP_CITIES,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setStats({ ...MOCK_STATS, loading: false });
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, REFETCH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return stats;
}
