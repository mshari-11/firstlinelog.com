/**
 * تحليل التدفق النقدي - Cash Flow Analysis
 * Money in vs money out timeline, burn rate, operating margin
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Activity,
  AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownLeft,
  Calendar, Zap,
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
const cashFlowTimeline = [
  { week: "الأسبوع 1", in: 145000, out: 98000, net: 47000 },
  { week: "الأسبوع 2", in: 162000, out: 105000, net: 57000 },
  { week: "الأسبوع 3", in: 138000, out: 92000, net: 46000 },
  { week: "الأسبوع 4", in: 178000, out: 112000, net: 66000 },
];

const netCashFlowMonthly = [
  { month: "سبتمبر",  cash: 142000, cumulative: 142000 },
  { month: "أكتوبر", cash: 178000, cumulative: 320000 },
  { month: "نوفمبر", cash: 145000, cumulative: 465000 },
  { month: "ديسمبر", cash: 198000, cumulative: 663000 },
  { month: "يناير",  cash: 165000, cumulative: 828000 },
  { month: "فبراير", cash: 172000, cumulative: 1000000 },
];

const burnRateData = [
  { period: "يناير",  operatingExpenses: 120000, revenue: 198000, margin: 39 },
  { period: "فبراير", operatingExpenses: 125000, revenue: 218000, margin: 43 },
  { period: "مارس",  operatingExpenses: 128000, revenue: 225000, margin: 43 },
];

const operatingMetrics = [
  { date: "1 مارس",  dailyIn: 18500, dailyOut: 12200, dailyNet: 6300, margin: 34 },
  { date: "2 مارس",  dailyIn: 21200, dailyOut: 14100, dailyNet: 7100, margin: 34 },
  { date: "3 مارس",  dailyIn: 19800, dailyOut: 13200, dailyNet: 6600, margin: 33 },
  { date: "4 مارس",  dailyIn: 23100, dailyOut: 15500, dailyNet: 7600, margin: 33 },
  { date: "5 مارس",  dailyIn: 20700, dailyOut: 13900, dailyNet: 6800, margin: 33 },
];

const forecastData = [
  { month: "مارس",  actual: null, projected: 225000 },
  { month: "أبريل", actual: null, projected: 235000 },
  { month: "مايو",  actual: null, projected: 245000 },
  { month: "يونيو", actual: null, projected: 258000 },
];

interface CashFlowStats {
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
  operatingMargin: number;
  burnRate: number;
  monthlyGrowth: number;
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
  warning?: boolean;
}

function KPICard({ label, value, change, icon: Icon, accent, warning }: KPICardProps) {
  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: `1px solid ${warning ? "var(--con-warning)" : accent}33`,
      borderRadius: 10,
      padding: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 500 }}>
          {label}
        </span>
        <div style={{
          background: `${warning ? "var(--con-warning)" : accent}14`,
          borderRadius: 8,
          padding: "6px",
        }}>
          <Icon size={16} style={{ color: warning ? "var(--con-warning)" : accent }} />
        </div>
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: 6 }}>
        {value}
      </div>
      {change !== undefined && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: "var(--con-text-caption)",
          color: change >= 0 ? "var(--con-success)" : "var(--con-danger)",
        }}>
          {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
  );
}

// ─── Metric Row ───────────────────────────────────────────────────────────────
function MetricRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style({
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid var(--con-border-default)",
    }}>
      <span style={{ color: "var(--con-text-muted)" }}>{label}</span>
      <span style={{ color: accent, fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>{value}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CashFlowAnalysis() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CashFlowStats>({
    totalCashIn: 1068000,
    totalCashOut: 428000,
    netCashFlow: 640000,
    operatingMargin: 39.9,
    burnRate: -640000,
    monthlyGrowth: 3.2,
  });

  return (
    <div dir="rtl" style={{ padding: "20px 24px", background: "var(--con-bg-default)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--con-text-primary)", margin: 0, marginBottom: 4 }}>
          تحليل التدفق النقدي
        </h1>
        <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
          تحليل شامل للتدفقات المالية وسعر الاحتراق والهامش التشغيلي
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <KPICard
          label="إجمالي الداخل"
          value={`${(stats.totalCashIn / 1000).toFixed(0)}ك ر.س`}
          change={8}
          icon={TrendingUp}
          accent="var(--con-success)"
        />
        <KPICard
          label="إجمالي الخارج"
          value={`${(stats.totalCashOut / 1000).toFixed(0)}ك ر.س`}
          icon={TrendingDown}
          accent="var(--con-danger)"
        />
        <KPICard
          label="التدفق النقدي الصافي"
          value={`${(stats.netCashFlow / 1000).toFixed(0)}ك ر.س`}
          change={12}
          icon={Activity}
          accent="var(--con-brand)"
        />
        <KPICard
          label="الهامش التشغيلي"
          value={`${stats.operatingMargin.toFixed(1)}%`}
          icon={CheckCircle2}
          accent="var(--con-info)"
        />
        <KPICard
          label="معدل النمو"
          value={`${stats.monthlyGrowth.toFixed(1)}%`}
          change={3}
          icon={Zap}
          accent="var(--con-warning)"
        />
      </div>

      {/* Main Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16, marginBottom: 28 }}>
        {/* Cash Flow In/Out */}
        <ChartCard title="التدفق النقدي الأسبوعي" subtitle="الداخل vs الخارج">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={cashFlowTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="week" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => `${(value / 1000).toFixed(0)}ك ر.س`} />
              <Legend />
              <Bar dataKey="in" fill="var(--con-success)" />
              <Bar dataKey="out" fill="var(--con-danger)" />
              <Line type="monotone" dataKey="net" stroke="var(--con-brand)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Net Cash Flow Accumulation */}
        <ChartCard title="تراكم التدفق النقدي" subtitle="آخر 6 أشهر">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={netCashFlowMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => `${(value / 1000).toFixed(0)}ك ر.س`} />
              <Area type="monotone" dataKey="cumulative" stroke="var(--con-brand)" fill="rgba(59,130,246,0.15)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Operating Metrics Daily */}
        <ChartCard title="المقاييس التشغيلية اليومية" subtitle="آخر 5 أيام">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={operatingMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="date" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => `${(value / 1000).toFixed(1)}ك ر.س`} />
              <Legend />
              <Bar dataKey="dailyIn" fill="rgba(34,197,94,0.7)" />
              <Line type="monotone" dataKey="margin" yAxisId="right" stroke="var(--con-warning)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Burn Rate */}
        <ChartCard title="سعر الاحتراق والهامش" subtitle="مقارنة شهرية">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={burnRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="period" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis yAxisId="left" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="left" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Bar yAxisId="left" dataKey="operatingExpenses" fill="var(--con-danger)" />
              <Line yAxisId="right" type="monotone" dataKey="margin" stroke="var(--con-success)" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Forecast */}
        <ChartCard title="التنبؤ المالي" subtitle="الربع القادم">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => `${(value / 1000).toFixed(0)}ك ر.س`} />
              <Legend />
              <Line type="monotone" dataKey="projected" stroke="var(--con-brand)" strokeWidth={3} strokeDasharray="5 5" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detailed Metrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 16 }}>
        {/* Cash Position */}
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10,
          padding: "20px",
        }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 16px 0" }}>
            وضع التدفق النقدي
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--con-text-primary)", fontSize: "var(--con-text-body)" }}>النقد في الحساب</span>
              <span style={{ color: "var(--con-success)", fontWeight: 700, fontSize: "20px", fontFamily: "var(--con-font-mono)" }}>
                1,035ك ر.س
              </span>
            </div>
            <div style={{
              height: 1,
              background: "var(--con-border-default)",
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>الالتزامات المعلقة</span>
              <span style={{ color: "var(--con-warning)", fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>
                98.5ك ر.س
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>الذمم المدينة</span>
              <span style={{ color: "var(--con-info)", fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>
                45.2ك ر.س
              </span>
            </div>
            <div style={{
              height: 1,
              background: "var(--con-border-default)",
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--con-text-primary)", fontSize: "var(--con-text-body)", fontWeight: 600 }}>التدفق النقدي الحر</span>
              <span style={{ color: "var(--con-brand)", fontWeight: 700, fontSize: "20px", fontFamily: "var(--con-font-mono)" }}>
                981.7ك ر.س
              </span>
            </div>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10,
          padding: "20px",
        }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 16px 0" }}>
            مقاييس الكفاءة
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <MetricRow label="معدل تحويل الإيرادات" value="91.3%" accent="var(--con-success)" />
            <MetricRow label="معدل استرجاع النقد" value="87.6%" accent="var(--con-brand)" />
            <MetricRow label="فترة تحويل النقد" value="8.2 أيام" accent="var(--con-info)" />
            <MetricRow label="نسبة السيولة الحالية" value="2.85x" accent="var(--con-success)" />
            <MetricRow label="رأس المال العامل" value="987ك ر.س" accent="var(--con-brand)" />
          </div>
        </div>

        {/* Risk Indicators */}
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10,
          padding: "20px",
        }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 16px 0" }}>
            مؤشرات المخاطر
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              padding: "12px",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <CheckCircle2 size={16} style={{ color: "var(--con-success)" }} />
                <span style={{ color: "var(--con-text-primary)", fontWeight: 600 }}>صحة التدفق النقدي</span>
              </div>
              <span style={{ color: "var(--con-success)", fontSize: "var(--con-text-caption)" }}>ممتازة - لا توجد مخاطر فورية</span>
            </div>
            <div style={{
              padding: "12px",
              background: "rgba(217,119,6,0.12)",
              border: "1px solid rgba(217,119,6,0.25)",
              borderRadius: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <AlertCircle size={16} style={{ color: "var(--con-warning)" }} />
                <span style={{ color: "var(--con-text-primary)", fontWeight: 600 }}>تنبيه السيولة</span>
              </div>
              <span style={{ color: "var(--con-warning)", fontSize: "var(--con-text-caption)" }}>لا توجد مشاكل في السيولة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
