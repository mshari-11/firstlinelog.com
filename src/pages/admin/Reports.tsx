/**
 * صفحة التقارير — Enterprise Analytics Console
 * تقارير شاملة عن الطلبات والمناديب والإيرادات
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Package, Users, DollarSign,
  TrendingUp, Download, RefreshCw, Star,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

interface ReportStats {
  totalOrders: number;
  totalRevenue: number;
  totalCouriers: number;
  deliveredOrders: number;
}

type PeriodFilter = "week" | "month" | "quarter";

const platformChartData = [
  { name: "جاهز",    orders: 320, revenue: 48000 },
  { name: "مرسول",   orders: 275, revenue: 41250 },
  { name: "نون",     orders: 190, revenue: 28500 },
  { name: "أمازون",  orders: 160, revenue: 24000 },
  { name: "Shopify", orders: 85,  revenue: 12750 },
  { name: "أخرى",    orders: 55,  revenue: 8250  },
];

const weeklyTrendData = [
  { week: "الأسبوع 1", orders: 210, revenue: 31500 },
  { week: "الأسبوع 2", orders: 245, revenue: 36750 },
  { week: "الأسبوع 3", orders: 198, revenue: 29700 },
  { week: "الأسبوع 4", orders: 278, revenue: 41700 },
];

const orderStatusData = [
  { name: "تم التسليم",   value: 782, color: "#16A34A" },
  { name: "في الطريق",    value: 124, color: "#3B82F6" },
  { name: "قيد الاستلام", value: 89,  color: "#D97706" },
  { name: "ملغي",         value: 35,  color: "#DC2626" },
];

const courierPerformanceData = [
  { name: "أحمد محمد",    delivered: 145, rating: 4.8 },
  { name: "خالد العمري",  delivered: 132, rating: 4.7 },
  { name: "فهد الغامدي",  delivered: 128, rating: 4.9 },
  { name: "سعد الزهراني", delivered: 118, rating: 4.6 },
  { name: "عمر الشمري",   delivered: 112, rating: 4.5 },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);

const FALLBACK_REVENUE = 162750;

// Shared recharts tooltip style using CSS vars (evaluated at call-time so vars resolve inside .fll-console)
const tooltipStyle = {
  background:   "var(--con-bg-elevated)",
  border:       "1px solid var(--con-border-strong)",
  borderRadius: "8px",
  color:        "var(--con-text-primary)",
  fontSize:     "13px",
};

// Chart axis / grid colors
const AXIS_COLOR  = "#7E8CA2"; // --con-text-muted
const GRID_COLOR  = "rgba(255,255,255,0.06)"; // subtle grid lines
const BRAND_BLUE  = "#3B82F6";
const BRAND_GREEN = "#16A34A";

function ChartCard({ title, period, children }: { title: string; period: string; children: React.ReactNode }) {
  return (
    <div className="con-card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)" }}>
          {title}
        </h3>
        <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{period}</span>
      </div>
      {children}
    </div>
  );
}

export default function Reports() {
  const [stats, setStats] = useState<ReportStats>({
    totalOrders: 0, totalRevenue: 0, totalCouriers: 0, deliveredOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<PeriodFilter>("month");

  useEffect(() => { fetchReportData(); }, []);

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
          totalOrders:     ordersRes.count || 0,
          totalRevenue:    FALLBACK_REVENUE,
          totalCouriers:   couriersRes.count || 0,
          deliveredOrders: orders.filter((o: { status: string }) => o.status === "delivered").length,
        });
      } else {
        setStats({ totalOrders: 1030, totalRevenue: FALLBACK_REVENUE, totalCouriers: 47, deliveredOrders: 782 });
      }
    } catch {
      setStats({ totalOrders: 1030, totalRevenue: FALLBACK_REVENUE, totalCouriers: 47, deliveredOrders: 782 });
    } finally {
      setLoading(false);
    }
  }

  const kpis = [
    {
      label:   "إجمالي الطلبات",
      value:   loading ? "—" : stats.totalOrders.toLocaleString("ar-SA"),
      icon:    Package,
      variant: "brand",
    },
    {
      label:   "الإيرادات",
      value:   loading ? "—" : formatCurrency(stats.totalRevenue),
      icon:    DollarSign,
      variant: "success",
    },
    {
      label:   "المناديب النشطون",
      value:   loading ? "—" : stats.totalCouriers.toLocaleString("ar-SA"),
      icon:    Users,
      variant: "info",
    },
    {
      label:   "نسبة التسليم",
      value:   loading
                 ? "—"
                 : `${stats.totalOrders ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}%`,
      icon:    TrendingUp,
      variant: "warning",
    },
  ] as const;

  const variantStyle = (v: string) => {
    const map: Record<string, { icon: string; bg: string }> = {
      brand:   { icon: "var(--con-brand)",   bg: "var(--con-brand-subtle)"   },
      success: { icon: "var(--con-success)", bg: "var(--con-success-subtle)" },
      info:    { icon: "var(--con-info)",    bg: "var(--con-info-subtle)"    },
      warning: { icon: "var(--con-warning)", bg: "var(--con-warning-subtle)" },
    };
    return map[v] ?? map.brand;
  };

  const periodLabels: Record<PeriodFilter, string> = {
    week:    "هذا الأسبوع",
    month:   "هذا الشهر",
    quarter: "هذا الربع",
  };

  const totalOrders = platformChartData.reduce((s, p) => s + p.orders, 0);

  function exportPlatformSummary() {
    const rows = platformChartData.map((platform) => {
      const percentage = ((platform.orders / totalOrders) * 100).toFixed(1);
      const avgOrder = platform.orders > 0 ? platform.revenue / platform.orders : 0;
      return [platform.name, platform.orders, platform.revenue, avgOrder.toFixed(2), `${percentage}%`].join(",");
    });
    const csv = [["platform", "orders", "revenue", "avg_order", "share"].join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fll-platform-summary-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }} dir="rtl">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", lineHeight: 1.2 }}>
            التقارير
          </h1>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>
            تقارير شاملة عن أداء العمليات والإيرادات
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {/* Period tab switcher */}
          <div className="con-tabs">
            {(["week", "month", "quarter"] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`con-tab${period === p ? " con-tab-active" : ""}`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>

          <button
            className="con-btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
            onClick={fetchReportData}
          >
            <RefreshCw size={14} />
            تحديث
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {kpis.map((k) => {
          const s = variantStyle(k.variant);
          return (
            <div key={k.label} className="con-kpi-card">
              <div className="con-icon-wrap" style={{ background: s.bg, color: s.icon, marginBottom: "0.75rem" }}>
                <k.icon size={18} />
              </div>
              <div className="con-kpi-value">{k.value}</div>
              <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>
                {k.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1rem" }}>

        {/* Platform Orders Bar Chart */}
        <ChartCard title="الطلبات حسب المنصة" period={periodLabels[period]}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={platformChartData} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: AXIS_COLOR }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="orders" name="الطلبات" fill={BRAND_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Order Status Donut */}
        <ChartCard title="توزيع حالة الطلبات" period={periodLabels[period]}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={82}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={2}
                >
                  {orderStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={false}
                />
              </PieChart>
            </ResponsiveContainer>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {orderStatusData.map((item) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", flex: 1 }}>
                    {item.name}
                  </span>
                  <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-caption)", color: "var(--con-text-primary)", fontWeight: 600 }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1rem" }}>

        {/* Revenue Trend Area Chart */}
        <ChartCard title="اتجاه الإيرادات" period={periodLabels[period]}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyTrendData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND_GREEN} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={BRAND_GREEN} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="week" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: AXIS_COLOR }}
                formatter={(v: number) => [formatCurrency(v), "الإيراد"]}
              />
              <Area type="monotone" dataKey="revenue" name="الإيراد"
                stroke={BRAND_GREEN} strokeWidth={2}
                fill="url(#revenueGrad)" dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Courier Performance Leaderboard */}
        <ChartCard title="أفضل المناديب أداءً" period={periodLabels[period]}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {courierPerformanceData.map((courier, i) => (
              <div
                key={courier.name}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--con-radius)",
                  background: i === 0 ? "var(--con-brand-subtle)" : "transparent",
                }}
              >
                {/* Rank badge */}
                <div
                  style={{
                    width: "1.75rem", height: "1.75rem",
                    borderRadius: "var(--con-radius-sm)",
                    background: i === 0 ? "var(--con-brand)" : "var(--con-bg-elevated)",
                    color: i === 0 ? "#fff" : "var(--con-text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "var(--con-text-caption)", fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>

                {/* Name + deliveries */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--con-text-body)", fontWeight: 500, color: "var(--con-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {courier.name}
                  </div>
                  <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                    {courier.delivered} طلب مسلّم
                  </div>
                </div>

                {/* Rating */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Star size={12} style={{ color: "var(--con-warning)", fill: "var(--con-warning)" }} />
                  <span style={{ fontFamily: "var(--con-font-mono)", fontWeight: 600, fontSize: "var(--con-text-body)", color: "var(--con-text-primary)" }}>
                    {courier.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── Platform Summary Table ── */}
      <div className="con-card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)" }}>
            ملخص الأداء حسب المنصة
          </h3>
          <button
            className="con-btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "var(--con-text-caption)" }}
            onClick={exportPlatformSummary}
          >
            <Download size={13} />
            تصدير
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="con-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>المنصة</th>
                <th>عدد الطلبات</th>
                <th>الإيرادات</th>
                <th>متوسط قيمة الطلب</th>
                <th style={{ minWidth: "120px" }}>النسبة</th>
              </tr>
            </thead>
            <tbody>
              {platformChartData.map((platform) => {
                const percentage = ((platform.orders / totalOrders) * 100).toFixed(1);
                const avgOrder   = platform.orders > 0 ? platform.revenue / platform.orders : 0;
                return (
                  <tr key={platform.name}>
                    <td>
                      <span className="con-badge con-badge-muted">{platform.name}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--con-font-mono)", fontWeight: 600, color: "var(--con-text-primary)" }}>
                        {platform.orders.toLocaleString("ar-SA")}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-success)", fontWeight: 500 }}>
                        {formatCurrency(platform.revenue)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>
                        {formatCurrency(avgOrder)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "var(--con-bg-elevated)", maxWidth: "80px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%", borderRadius: "2px",
                              width: `${percentage}%`,
                              background: "var(--con-brand)",
                            }}
                          />
                        </div>
                        <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", minWidth: "2.5rem" }}>
                          {percentage}%
                        </span>
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
