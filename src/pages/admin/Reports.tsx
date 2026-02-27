/**
 * صفحة التقارير - لوحة إدارة فيرست لاين
 * تقارير شاملة عن الطلبات والمناديب والإيرادات
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Package, Users, DollarSign,
  TrendingUp, Download, RefreshCw
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

// ألوان هوية فيرست لاين
const C = {
  bg: "oklch(0.10 0.06 220)",
  card: "oklch(0.15 0.06 220)",
  cardBorder: "oklch(0.22 0.05 210 / 0.5)",
  cyan: "oklch(0.65 0.18 200)",
  cyanSoft: "oklch(0.60 0.18 200 / 0.12)",
  textPrimary: "oklch(0.92 0.02 220)",
  textMuted: "oklch(0.55 0.06 210)",
  textSub: "oklch(0.70 0.04 215)",
};

interface ReportStats {
  totalOrders: number;
  totalRevenue: number;
  totalCouriers: number;
  deliveredOrders: number;
}

type PeriodFilter = "week" | "month" | "quarter";

const platformChartData = [
  { name: "جاهز", orders: 320, revenue: 48000 },
  { name: "مرسول", orders: 275, revenue: 41250 },
  { name: "نون", orders: 190, revenue: 28500 },
  { name: "أمازون", orders: 160, revenue: 24000 },
  { name: "Shopify", orders: 85, revenue: 12750 },
  { name: "أخرى", orders: 55, revenue: 8250 },
];

const weeklyTrendData = [
  { week: "الأسبوع 1", orders: 210, revenue: 31500 },
  { week: "الأسبوع 2", orders: 245, revenue: 36750 },
  { week: "الأسبوع 3", orders: 198, revenue: 29700 },
  { week: "الأسبوع 4", orders: 278, revenue: 41700 },
];

const orderStatusData = [
  { name: "تم التسليم", value: 782, color: "#34D399" },
  { name: "في الطريق", value: 124, color: "#00C1D4" },
  { name: "قيد الاستلام", value: 89, color: "#FBBF24" },
  { name: "ملغي", value: 35, color: "#F87171" },
];

const courierPerformanceData = [
  { name: "أحمد محمد", delivered: 145, rating: 4.8 },
  { name: "خالد العمري", delivered: 132, rating: 4.7 },
  { name: "فهد الغامدي", delivered: 128, rating: 4.9 },
  { name: "سعد الزهراني", delivered: 118, rating: 4.6 },
  { name: "عمر الشمري", delivered: 112, rating: 4.5 },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);

const FALLBACK_REVENUE = 162750;

export default function Reports() {
  const [stats, setStats] = useState<ReportStats>({
    totalOrders: 0, totalRevenue: 0, totalCouriers: 0, deliveredOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("month");

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    setLoading(true);
    try {
      if (supabase) {
        const [ordersRes, couriersRes] = await Promise.all([
          supabase.from("orders").select("id, status", { count: "exact" }),
          supabase.from("couriers").select("id", { count: "exact" }),
        ]);
        const orders = ordersRes.data || [];
        setStats({
          totalOrders: ordersRes.count || 0,
          totalRevenue: FALLBACK_REVENUE,
          totalCouriers: couriersRes.count || 0,
          deliveredOrders: orders.filter((o: { status: string }) => o.status === "delivered").length,
        });
      } else {
        // Fallback values when Supabase is not connected
        setStats({
          totalOrders: 1030,
          totalRevenue: FALLBACK_REVENUE,
          totalCouriers: 47,
          deliveredOrders: 782,
        });
      }
    } catch (err) {
      console.error("خطأ في جلب بيانات التقارير:", err);
      setStats({ totalOrders: 1030, totalRevenue: FALLBACK_REVENUE, totalCouriers: 47, deliveredOrders: 782 });
    } finally {
      setLoading(false);
    }
  }

  const kpis = [
    {
      label: "إجمالي الطلبات",
      value: loading ? "..." : stats.totalOrders.toLocaleString("ar-SA"),
      icon: Package,
      color: "oklch(0.65 0.18 200)",
      bg: "oklch(0.60 0.18 200 / 0.10)",
      border: "oklch(0.60 0.18 200 / 0.25)",
    },
    {
      label: "الإيرادات",
      value: loading ? "..." : formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "oklch(0.72 0.13 150)",
      bg: "oklch(0.60 0.15 150 / 0.10)",
      border: "oklch(0.60 0.15 150 / 0.25)",
    },
    {
      label: "المناديب النشطون",
      value: loading ? "..." : stats.totalCouriers.toLocaleString("ar-SA"),
      icon: Users,
      color: "oklch(0.72 0.15 280)",
      bg: "oklch(0.60 0.15 280 / 0.10)",
      border: "oklch(0.60 0.15 280 / 0.25)",
    },
    {
      label: "نسبة التسليم",
      value: loading ? "..." : `${stats.totalOrders ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}%`,
      icon: TrendingUp,
      color: "oklch(0.80 0.16 85)",
      bg: "oklch(0.70 0.16 85 / 0.10)",
      border: "oklch(0.70 0.16 85 / 0.25)",
    },
  ];

  const periodLabels: Record<PeriodFilter, string> = {
    week: "هذا الأسبوع",
    month: "هذا الشهر",
    quarter: "هذا الربع",
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* الترويسة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.textPrimary }}>
            التقارير
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.textMuted }}>
            تقارير شاملة عن أداء العمليات والإيرادات
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* فلتر الفترة */}
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
            {(["week", "month", "quarter"] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-lg text-sm transition-all"
                style={
                  period === p
                    ? { background: C.cyanSoft, color: C.cyan, fontWeight: 600 }
                    : { color: C.textMuted }
                }
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
          <button
            onClick={fetchReportData}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
            style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textSub }}
          >
            <RefreshCw size={14} />
            تحديث
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl p-5"
            style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="p-2.5 rounded-xl"
                style={{ background: "oklch(0.10 0.06 220 / 0.5)" }}
              >
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: C.textPrimary }}>
              {kpi.value}
            </p>
            <p className="text-sm" style={{ color: C.textMuted }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* الرسوم البيانية - الصف الأول */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* الطلبات حسب المنصة */}
        <div
          className="rounded-2xl p-5"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold" style={{ color: C.textPrimary }}>الطلبات حسب المنصة</h3>
            <span className="text-xs" style={{ color: C.textMuted }}>{periodLabels[period]}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={platformChartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.05 210 / 0.4)" />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.55 0.06 210)", fontSize: 11 }} axisLine={false} tickLine={false} />
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
              <Bar dataKey="orders" name="الطلبات" fill="#00C1D4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* حالة الطلبات */}
        <div
          className="rounded-2xl p-5"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold" style={{ color: C.textPrimary }}>توزيع حالة الطلبات</h3>
            <span className="text-xs" style={{ color: C.textMuted }}>{periodLabels[period]}</span>
          </div>
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.15 0.06 220)",
                    border: "1px solid oklch(0.22 0.05 210 / 0.6)",
                    borderRadius: "12px",
                    color: "oklch(0.92 0.02 220)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {orderStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm" style={{ color: C.textSub }}>{item.name}</span>
                  <span className="text-sm font-medium mr-auto" style={{ color: C.textPrimary }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* الرسوم البيانية - الصف الثاني */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* الإيرادات الأسبوعية */}
        <div
          className="rounded-2xl p-5"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold" style={{ color: C.textPrimary }}>اتجاه الإيرادات</h3>
            <span className="text-xs" style={{ color: C.textMuted }}>{periodLabels[period]}</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyTrendData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.05 210 / 0.4)" />
              <XAxis dataKey="week" tick={{ fill: "oklch(0.55 0.06 210)", fontSize: 11 }} axisLine={false} tickLine={false} />
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
                formatter={(v: number) => [formatCurrency(v), "الإيراد"]}
              />
              <Area type="monotone" dataKey="revenue" name="الإيراد" stroke="#34D399" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* أداء المناديب */}
        <div
          className="rounded-2xl p-5"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold" style={{ color: C.textPrimary }}>أفضل المناديب أداءً</h3>
            <span className="text-xs" style={{ color: C.textMuted }}>{periodLabels[period]}</span>
          </div>
          <div className="space-y-3">
            {courierPerformanceData.map((courier, i) => (
              <div
                key={courier.name}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: i === 0 ? C.cyanSoft : "transparent" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{
                    background: i === 0 ? C.cyan : "oklch(0.20 0.05 220)",
                    color: i === 0 ? "oklch(0.10 0.08 220)" : C.textMuted,
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: C.textPrimary }}>{courier.name}</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>{courier.delivered} طلب مسلّم</p>
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold" style={{ color: "oklch(0.80 0.16 85)" }}>
                    ★ {courier.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* جدول ملخص المنصات */}
      <div
        className="rounded-2xl p-5"
        style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ color: C.textPrimary }}>ملخص الأداء حسب المنصة</h3>
          <button
            className="flex items-center gap-2 text-sm transition-colors px-3 py-1.5 rounded-lg"
            style={{ color: C.cyan, background: C.cyanSoft }}
          >
            <Download size={14} />
            تصدير
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                {["المنصة", "عدد الطلبات", "الإيرادات", "متوسط قيمة الطلب", "النسبة"].map((h) => (
                  <th key={h} className="text-right text-xs font-medium pb-3" style={{ color: C.textMuted }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {platformChartData.map((platform) => {
                const totalOrders = platformChartData.reduce((s, p) => s + p.orders, 0);
                const percentage = ((platform.orders / totalOrders) * 100).toFixed(1);
                const avgOrder = platform.orders > 0 ? platform.revenue / platform.orders : 0;
                return (
                  <tr
                    key={platform.name}
                    style={{ borderBottom: `1px solid oklch(0.18 0.05 220 / 0.5)` }}
                  >
                    <td className="py-3">
                      <span
                        className="text-sm px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: "oklch(0.20 0.05 220)", color: C.textSub }}
                      >
                        {platform.name}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-medium" style={{ color: C.textPrimary }}>
                      {platform.orders.toLocaleString("ar-SA")}
                    </td>
                    <td className="py-3 text-sm" style={{ color: "oklch(0.72 0.13 150)" }}>
                      {formatCurrency(platform.revenue)}
                    </td>
                    <td className="py-3 text-sm" style={{ color: C.textSub }}>
                      {formatCurrency(avgOrder)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.20 0.05 220)", maxWidth: 80 }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percentage}%`, background: C.cyan }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: C.textMuted }}>{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
