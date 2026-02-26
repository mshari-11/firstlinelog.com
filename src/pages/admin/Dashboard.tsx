/**
 * الداشبورد الرئيسي - لوحة إدارة فيرست لاين
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";

import {
  Users, Package, DollarSign, AlertCircle,
  TrendingUp, TrendingDown, Clock, CheckCircle2,
  Bike, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

// ألوان هوية فيرست لاين
const C = {
  bg: "oklch(0.10 0.06 220)",
  card: "oklch(0.15 0.06 220)",
  cardBorder: "oklch(0.22 0.05 210 / 0.5)",
  cyan: "oklch(0.65 0.18 200)",
  cyanSoft: "oklch(0.60 0.18 200 / 0.12)",
  blue: "oklch(0.25 0.12 220)",
  textPrimary: "oklch(0.92 0.02 220)",
  textMuted: "oklch(0.55 0.06 210)",
  textSub: "oklch(0.70 0.04 215)",
};

interface DashboardStats {
  totalCouriers: number;
  activeCouriers: number;
  todayOrders: number;
  pendingComplaints: number;
  monthRevenue: number;
  pendingApprovals: number;
}

const ordersChartData = [
  { day: "السبت", orders: 142 },
  { day: "الأحد", orders: 198 },
  { day: "الاثنين", orders: 167 },
  { day: "الثلاثاء", orders: 223 },
  { day: "الأربعاء", orders: 189 },
  { day: "الخميس", orders: 245 },
  { day: "الجمعة", orders: 98 },
];

const revenueChartData = [
  { month: "سبتمبر", revenue: 85000 },
  { month: "أكتوبر", revenue: 92000 },
  { month: "نوفمبر", revenue: 78000 },
  { month: "ديسمبر", revenue: 115000 },
  { month: "يناير", revenue: 103000 },
  { month: "فبراير", revenue: 128000 },
];

const kpiConfig = [
  {
    key: "totalCouriers",
    label: "إجمالي المناديب",
    fallback: 47,
    change: 8,
    icon: Users,
    color: "oklch(0.65 0.18 200)",
    bg: "oklch(0.60 0.18 200 / 0.10)",
    border: "oklch(0.60 0.18 200 / 0.25)",
  },
  {
    key: "todayOrders",
    label: "طلبات اليوم",
    fallback: 245,
    change: 12,
    icon: Package,
    color: "oklch(0.72 0.13 150)",
    bg: "oklch(0.60 0.15 150 / 0.10)",
    border: "oklch(0.60 0.15 150 / 0.25)",
  },
  {
    key: "monthRevenue",
    label: "إيرادات الشهر",
    fallback: 128000,
    change: 24,
    icon: DollarSign,
    color: "oklch(0.72 0.13 188)",
    bg: "oklch(0.60 0.13 188 / 0.10)",
    border: "oklch(0.60 0.13 188 / 0.25)",
    format: (v: number) => `${v.toLocaleString("ar-SA")} ر.س`,
  },
  {
    key: "pendingComplaints",
    label: "شكاوى معلقة",
    fallback: 7,
    change: -3,
    icon: AlertCircle,
    color: "oklch(0.65 0.20 25)",
    bg: "oklch(0.55 0.20 25 / 0.10)",
    border: "oklch(0.55 0.20 25 / 0.25)",
  },
  {
    key: "activeCouriers",
    label: "مناديب نشطون الآن",
    fallback: 38,
    icon: Bike,
    color: "oklch(0.72 0.15 280)",
    bg: "oklch(0.60 0.15 280 / 0.10)",
    border: "oklch(0.60 0.15 280 / 0.25)",
  },
  {
    key: "pendingApprovals",
    label: "اعتمادات بانتظار",
    fallback: 4,
    icon: Clock,
    color: "oklch(0.80 0.16 85)",
    bg: "oklch(0.70 0.16 85 / 0.10)",
    border: "oklch(0.70 0.16 85 / 0.25)",
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCouriers: 0, activeCouriers: 0, todayOrders: 0,
    pendingComplaints: 0, monthRevenue: 0, pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [couriersRes, ordersRes, complaintsRes, approvalsRes] = await Promise.all([
        supabase.from("couriers").select("id, status", { count: "exact" }),
        supabase.from("orders").select("id", { count: "exact" }).gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("complaints_requests").select("id", { count: "exact" }).eq("status", "open"),
        supabase.from("approval_workflows").select("id", { count: "exact" }).eq("status", "pending"),
      ]);
      const couriers = couriersRes.data || [];
      setStats({
        totalCouriers: couriersRes.count || 0,
        activeCouriers: couriers.filter((c: { status: string }) => c.status === "active").length,
        todayOrders: ordersRes.count || 0,
        pendingComplaints: complaintsRes.count || 0,
        monthRevenue: 128000,
        pendingApprovals: approvalsRes.count || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const recentOrders = [
    { id: "#10234", courier: "أحمد محمد", platform: "جاهز", status: "تم التسليم", time: "منذ 5 دقائق" },
    { id: "#10233", courier: "خالد العمري", platform: "مرسول", status: "في الطريق", time: "منذ 12 دقيقة" },
    { id: "#10232", courier: "فهد الغامدي", platform: "نون", status: "قيد الاستلام", time: "منذ 18 دقيقة" },
    { id: "#10231", courier: "سعد الزهراني", platform: "صاحب", status: "تم التسليم", time: "منذ 25 دقيقة" },
    { id: "#10230", courier: "عمر الشمري", platform: "Shopify", status: "تم التسليم", time: "منذ 31 دقيقة" },
  ];

  const statusStyle: Record<string, { color: string; bg: string }> = {
    "تم التسليم": { color: "oklch(0.72 0.13 150)", bg: "oklch(0.60 0.15 150 / 0.12)" },
    "في الطريق": { color: "oklch(0.65 0.18 200)", bg: "oklch(0.60 0.18 200 / 0.12)" },
    "قيد الاستلام": { color: "oklch(0.80 0.16 85)", bg: "oklch(0.70 0.16 85 / 0.12)" },
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* الترويسة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.textPrimary }}>
            لوحة التحكم
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.textMuted }}>
            {new Date().toLocaleDateString("ar-SA", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm" style={{ color: C.textSub }}>النظام يعمل</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiConfig.map((kpi) => {
          const rawValue = stats[kpi.key as keyof DashboardStats] || kpi.fallback;
          const displayValue = loading
            ? "..."
            : kpi.format
            ? kpi.format(rawValue as number)
            : rawValue;

          return (
            <div
              key={kpi.key}
              className="rounded-2xl p-5"
              style={{
                background: kpi.bg,
                border: `1px solid ${kpi.border}`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-2.5 rounded-xl"
                  style={{ background: "oklch(0.10 0.06 220 / 0.5)" }}
                >
                  <kpi.icon size={20} style={{ color: kpi.color }} />
                </div>
                {kpi.change !== undefined && (
                  <div
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: kpi.change > 0 ? "oklch(0.72 0.13 150)" : "oklch(0.65 0.20 25)" }}
                  >
                    {kpi.change > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {Math.abs(kpi.change)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: C.textPrimary }}>
                {displayValue}
              </p>
              <p className="text-sm" style={{ color: C.textMuted }}>{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* طلبات الأسبوع */}
        <div
          className="rounded-2xl p-5"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold" style={{ color: C.textPrimary }}>طلبات الأسبوع</h3>
            <span className="text-xs" style={{ color: C.textMuted }}>آخر 7 أيام</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ordersChartData}>
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C1D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C1D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.05 210 / 0.4)" />
              <XAxis dataKey="day" tick={{ fill: "oklch(0.55 0.06 210)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.55 0.06 210)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.15 0.06 220)",
                  border: "1px solid oklch(0.22 0.05 210 / 0.6)",
                  borderRadius: "12px",
                  color: "oklch(0.92 0.02 220)",
                }}
                labelStyle={{ color: "oklch(0.55 0.06 210)" }}
              />
              <Area type="monotone" dataKey="orders" name="الطلبات" stroke="#00C1D4" strokeWidth={2} fill="url(#ordersGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* الإيرادات الشهرية */}
        <div
          className="rounded-2xl p-5"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold" style={{ color: C.textPrimary }}>الإيرادات الشهرية</h3>
            <span className="text-xs" style={{ color: C.textMuted }}>آخر 6 أشهر</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueChartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.05 210 / 0.4)" />
              <XAxis dataKey="month" tick={{ fill: "oklch(0.55 0.06 210)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "oklch(0.55 0.06 210)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.15 0.06 220)",
                  border: "1px solid oklch(0.22 0.05 210 / 0.6)",
                  borderRadius: "12px",
                  color: "oklch(0.92 0.02 220)",
                }}
                formatter={(v: number) => [`${v.toLocaleString("ar-SA")} ر.س`, "الإيراد"]}
              />
              <Bar dataKey="revenue" fill="#00C1D4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* آخر الطلبات */}
      <div
        className="rounded-2xl p-5"
        style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ color: C.textPrimary }}>آخر الطلبات</h3>
          <button
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: C.cyan }}
          >
            عرض الكل
            <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                {["رقم الطلب", "المندوب", "المنصة", "الحالة", "الوقت"].map((h) => (
                  <th key={h} className="text-right text-xs font-medium pb-3" style={{ color: C.textMuted }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const s = statusStyle[order.status] || { color: C.textMuted, bg: "transparent" };
                return (
                  <tr
                    key={order.id}
                    style={{ borderBottom: `1px solid oklch(0.18 0.05 220 / 0.5)` }}
                  >
                    <td className="py-3 text-sm font-mono" style={{ color: C.textSub }}>{order.id}</td>
                    <td className="py-3 text-sm" style={{ color: C.textPrimary }}>{order.courier}</td>
                    <td className="py-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ background: "oklch(0.20 0.05 220)", color: C.textSub }}
                      >
                        {order.platform}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ color: s.color, background: s.bg }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs" style={{ color: C.textMuted }}>{order.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* الاعتمادات المعلقة */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "oklch(0.80 0.16 85 / 0.05)",
          border: "1px solid oklch(0.70 0.16 85 / 0.20)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Clock size={18} style={{ color: "oklch(0.80 0.16 85)" }} />
          <h3 className="font-semibold" style={{ color: C.textPrimary }}>اعتمادات تنتظر مراجعتك</h3>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "oklch(0.80 0.16 85)", color: "oklch(0.10 0.06 220)" }}
          >
            4
          </span>
        </div>
        <div className="space-y-2">
          {[
            { title: "استيراد Excel - رواتب فبراير 2025", by: "محمد الشمري", time: "منذ 2 ساعة" },
            { title: "طلب إجازة - أحمد محمد", by: "أحمد محمد", time: "منذ 5 ساعات" },
            { title: "تعديل راتب - خالد العمري", by: "قسم المالية", time: "منذ يوم" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: C.card }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{item.by} · {item.time}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 transition-colors"
                  style={{
                    background: "oklch(0.60 0.15 150 / 0.15)",
                    color: "oklch(0.72 0.13 150)",
                  }}
                >
                  <CheckCircle2 size={13} />
                  اعتماد
                </button>
                <button
                  className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                  style={{
                    background: "oklch(0.55 0.20 25 / 0.15)",
                    color: "oklch(0.65 0.20 25)",
                  }}
                >
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
