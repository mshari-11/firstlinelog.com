/**
 * تحليل الإيرادات التفصيلي - Revenue Analysis
 * Detailed revenue breakdown and trends
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, 
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from "recharts";
import {
  DollarSign, TrendingUp, PieChart, BarChart3, 
  ArrowUpRight, ArrowDownLeft, Calendar, Filter,
} from "lucide-react";

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
const chartTooltipStyle = {
  background: "var(--con-bg-elevated)",
  border: "1px solid var(--con-border-strong)",
  borderRadius: 8,
  color: "var(--con-text-primary)",
  fontSize: 12,
  padding: "8px 12px",
};

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

interface RevenueStats {
  totalRevenue: number;
  monthRevenue: number;
  dailyAverage: number;
  topPlatform: string;
  topCity: string;
  topCourier: string;
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: "1px solid var(--con-border-default)",
      borderRadius: 10,
      padding: "20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
          {title}
        </h3>
        {subtitle && (
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  accent: string;
}

function KPICard({ label, value, change, icon: Icon, accent }: KPICardProps) {
  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: `1px solid ${accent}33`,
      borderRadius: 10,
      padding: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 500 }}>
          {label}
        </span>
        <div style={{
          background: `${accent}14`,
          borderRadius: 8,
          padding: "6px",
        }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: 6 }}>
        {value}
      </div>
      {change !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--con-text-caption)", color: change >= 0 ? "var(--con-success)" : "var(--con-danger)" }}>
          {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
  );
}

// ─── Performance Table ──────────────────────────────────────────────────────────
function PerformanceTable({ title, data, columns }: { title: string; data: any[]; columns: any[] }) {
  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: "1px solid var(--con-border-default)",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <div style={{ padding: "20px", borderBottom: "1px solid var(--con-border-default)" }}>
        <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
          {title}
        </h3>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--con-bg-surface-2)", borderBottom: "1px solid var(--con-border-default)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: "12px 16px",
                    textAlign: col.align || "right",
                    color: "var(--con-text-muted)",
                    fontSize: "var(--con-text-caption)",
                    fontWeight: 600,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: "1px solid var(--con-border-default)",
                  height: 52,
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "12px 16px",
                      textAlign: col.align || "right",
                      color: "var(--con-text-primary)",
                      fontSize: "var(--con-text-body)",
                    }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RevenueAnalysis() {
  const { user } = useAuth();
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 835000,
    monthRevenue: 218000,
    dailyAverage: 22550,
    topPlatform: "جاهز",
    topCity: "الرياض",
    topCourier: "أحمد محمد",
  });

  return (
    <div dir="rtl" style={{ padding: "20px 24px", background: "var(--con-bg-default)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--con-text-primary)", margin: 0, marginBottom: 4 }}>
          تحليل الإيرادات
        </h1>
        <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
          تفصيل شامل للإيرادات حسب المنصات والمدن والمناديب
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <KPICard
          label="إجمالي الإيرادات"
          value={`${(stats.totalRevenue / 1000).toFixed(0)}ك ر.س`}
          change={8}
          icon={DollarSign}
          accent="var(--con-success)"
        />
        <KPICard
          label="إيرادات الشهر"
          value={`${(stats.monthRevenue / 1000).toFixed(0)}ك ر.س`}
          change={10}
          icon={TrendingUp}
          accent="var(--con-brand)"
        />
        <KPICard
          label="المتوسط اليومي"
          value={`${(stats.dailyAverage / 1000).toFixed(1)}ك ر.س`}
          icon={Calendar}
          accent="var(--con-info)"
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16, marginBottom: 28 }}>
        {/* Platform Revenue */}
        <ChartCard title="الإيرادات حسب المنصة" subtitle="توزيع الإيرادات">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie data={platformRevenueData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
              {platformRevenueData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
              ))}
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => `${(value / 1000).toFixed(0)}ك ر.س`} />
            </RechartsPie>
          </ResponsiveContainer>
        </ChartCard>

        {/* City Revenue */}
        <ChartCard title="الإيرادات حسب المدينة" subtitle="مقارنة الأداء">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="city" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => `${(value / 1000).toFixed(0)}ك ر.س`} />
              <Bar dataKey="revenue" fill="var(--con-brand)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily Trend */}
        <ChartCard title="الاتجاه اليومي" subtitle="آخر 12 يوم">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="date" stroke="var(--con-text-muted)" style={{ fontSize: 11 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="revenue" fill="rgba(34,197,94,0.3)" />
              <Line type="monotone" dataKey="revenue" stroke="var(--con-success)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly Trend */}
        <ChartCard title="النمو الشهري" subtitle="آخر 6 أشهر">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => `${(value / 1000).toFixed(0)}ك ر.س`} />
              <Line type="monotone" dataKey="revenue" stroke="var(--con-brand)" strokeWidth={3} dot={{ fill: "var(--con-brand)", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Performance Tables */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: 16 }}>
        <PerformanceTable
          title="أفضل المناديب"
          data={courierPerformanceData}
          columns={[
            { key: "courier", label: "اسم الناديب", align: "right" },
            {
              key: "revenue",
              label: "الإيرادات",
              align: "right",
              render: (v: number) => `${(v / 1000).toFixed(0)}ك ر.س`,
            },
            { key: "orders", label: "الطلبات", align: "center" },
            {
              key: "rating",
              label: "التقييم",
              align: "center",
              render: (v: number) => (
                <div style={{ color: "var(--con-warning)", fontWeight: 600 }}>
                  ⭐ {v.toFixed(1)}
                </div>
              ),
            },
          ]}
        />

        <PerformanceTable
          title="المنصات"
          data={platformRevenueData}
          columns={[
            { key: "platform", label: "المنصة", align: "right" },
            {
              key: "revenue",
              label: "الإيرادات",
              align: "right",
              render: (v: number) => `${(v / 1000).toFixed(0)}ك ر.س`,
            },
            { key: "orders", label: "الطلبات", align: "center" },
            {
              key: "percentage",
              label: "النسبة",
              align: "center",
              render: (v: number) => `${v}%`,
            },
          ]}
        />
      </div>
    </div>
  );
}
