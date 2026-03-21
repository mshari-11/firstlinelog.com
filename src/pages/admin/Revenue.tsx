/**
 * تحليل الإيرادات التفصيلي - Revenue Analysis
 * Detailed revenue breakdown and trends
 */
import { useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart,
} from "recharts";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";
import {
  KPICard, ChartCard, PageHeader, DataTable,
  chartTooltipStyle, formatSAR,
} from "@/components/admin/FinanceUI";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const platformRevenueData = [
  { platform: "جاهز",      revenue: 285000, orders: 845, percentage: 35 },
  { platform: "مرسول",    revenue: 198000, orders: 580, percentage: 24 },
  { platform: "نون",      revenue: 156000, orders: 420, percentage: 19 },
  { platform: "صاحب",     revenue: 128000, orders: 350, percentage: 16 },
  { platform: "HungerStation", revenue: 68000, orders: 145, percentage: 8 },
];

const cityRevenueData = [
  { city: "الرياض",   revenue: 485000, orders: 1420, percentage: 45 },
  { city: "جدة",     revenue: 215000, orders: 580, percentage: 20 },
  { city: "الدمام",   revenue: 172000, orders: 450, percentage: 16 },
  { city: "القصيم",   revenue: 98000, orders: 280, percentage: 9 },
  { city: "الطائف",   revenue: 65000, orders: 185, percentage: 6 },
];

const courierPerformanceData = [
  { courier: "أحمد محمد",   revenue: 98000, orders: 280, rating: 4.8 },
  { courier: "خالد العمري",  revenue: 87000, orders: 245, rating: 4.7 },
  { courier: "فهد الغامدي",  revenue: 82000, orders: 230, rating: 4.9 },
  { courier: "سعد الزهراني", revenue: 76000, orders: 215, rating: 4.6 },
  { courier: "عمر الشمري",   revenue: 72000, orders: 205, rating: 4.8 },
];

const dailyTrendData = [
  { date: "1 مارس", revenue: 18500, orders: 52 },
  { date: "2 مارس", revenue: 21200, orders: 58 },
  { date: "3 مارس", revenue: 19800, orders: 55 },
  { date: "4 مارس", revenue: 23100, orders: 62 },
  { date: "5 مارس", revenue: 20700, orders: 58 },
  { date: "6 مارس", revenue: 22500, orders: 61 },
  { date: "7 مارس", revenue: 24300, orders: 65 },
  { date: "8 مارس", revenue: 21900, orders: 59 },
  { date: "9 مارس", revenue: 23800, orders: 64 },
  { date: "10 مارس", revenue: 22100, orders: 60 },
  { date: "11 مارس", revenue: 24700, orders: 66 },
  { date: "12 مارس", revenue: 23400, orders: 63 },
];

const monthlyTrendData = [
  { month: "سبتمبر",  revenue: 156000, growth: 0 },
  { month: "أكتوبر", revenue: 189000, growth: 21 },
  { month: "نوفمبر", revenue: 172000, growth: -9 },
  { month: "ديسمبر", revenue: 245000, growth: 42 },
  { month: "يناير",  revenue: 198000, growth: -19 },
  { month: "فبراير", revenue: 218000, growth: 10 },
];

const colorPalette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function RevenueAnalysis() {
  const { user } = useAuth();
  const [stats] = useState({
    totalRevenue: 835000,
    monthRevenue: 218000,
    dailyAverage: 22550,
  });

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        icon={DollarSign}
        title="تحليل الإيرادات"
        subtitle="تفصيل شامل للإيرادات حسب المنصات والمدن والمناديب"
      />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <KPICard label="إجمالي الإيرادات" value={formatSAR(stats.totalRevenue, true)} change={8} icon={DollarSign} accent="var(--con-success)" />
        <KPICard label="إيرادات الشهر" value={formatSAR(stats.monthRevenue, true)} change={10} icon={TrendingUp} accent="var(--con-brand)" />
        <KPICard label="المتوسط اليومي" value={`${(stats.dailyAverage / 1000).toFixed(1)}ك ر.س`} icon={Calendar} accent="var(--con-info)" />
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
        <ChartCard title="الإيرادات حسب المنصة" subtitle="توزيع الإيرادات">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie data={platformRevenueData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
              {platformRevenueData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
              ))}
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => formatSAR(value, true)} />
            </RechartsPie>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="الإيرادات حسب المدينة" subtitle="مقارنة الأداء">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="city" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => formatSAR(value, true)} />
              <Bar dataKey="revenue" fill="var(--con-brand)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="الاتجاه اليومي" subtitle="آخر 12 يوم">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="date" stroke="var(--con-text-muted)" style={{ fontSize: 11 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatSAR(v)} />
              <Bar dataKey="revenue" fill="rgba(34,197,94,0.3)" />
              <Line type="monotone" dataKey="revenue" stroke="var(--con-success)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="النمو الشهري" subtitle="آخر 6 أشهر">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => formatSAR(value, true)} />
              <Line type="monotone" dataKey="revenue" stroke="var(--con-brand)" strokeWidth={3} dot={{ fill: "var(--con-brand)", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Performance Tables */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: 16 }}>
        <DataTable
          title="أفضل المناديب"
          data={courierPerformanceData}
          columns={[
            { key: "courier", label: "اسم المندوب" },
            { key: "revenue", label: "الإيرادات", render: (v: number) => formatSAR(v, true) },
            { key: "orders", label: "الطلبات", align: "center" },
            {
              key: "rating", label: "التقييم", align: "center",
              render: (v: number) => (
                <span style={{ color: "var(--con-warning)", fontWeight: 600 }}>
                  <TrendingUp size={12} style={{ display: "inline", marginLeft: 4 }} />
                  {v.toFixed(1)}
                </span>
              ),
            },
          ]}
        />

        <DataTable
          title="المنصات"
          data={platformRevenueData}
          columns={[
            { key: "platform", label: "المنصة" },
            { key: "revenue", label: "الإيرادات", render: (v: number) => formatSAR(v, true) },
            { key: "orders", label: "الطلبات", align: "center" },
            { key: "percentage", label: "النسبة", align: "center", render: (v: number) => `${v}%` },
          ]}
        />
      </div>
    </div>
  );
}
