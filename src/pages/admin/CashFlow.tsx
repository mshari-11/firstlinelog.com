/**
 * تحليل التدفق النقدي - Cash Flow Analysis
 * Money in vs money out timeline, burn rate, operating margin
 */
import { useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity,
  AlertCircle, CheckCircle2, Zap,
} from "lucide-react";
import {
  KPICard, ChartCard, PageHeader, MetricRow,
  chartTooltipStyle, formatSAR,
} from "@/components/admin/FinanceUI";

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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CashFlowAnalysis() {
  const { user } = useAuth();
  const [stats] = useState({
    totalCashIn: 1068000,
    totalCashOut: 428000,
    netCashFlow: 640000,
    operatingMargin: 39.9,
    monthlyGrowth: 3.2,
  });

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        icon={Activity}
        title="تحليل التدفق النقدي"
        subtitle="تحليل شامل للتدفقات المالية وسعر الاحتراق والهامش التشغيلي"
      />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <KPICard label="إجمالي الداخل" value={formatSAR(stats.totalCashIn, true)} change={8} icon={TrendingUp} accent="var(--con-success)" />
        <KPICard label="إجمالي الخارج" value={formatSAR(stats.totalCashOut, true)} icon={TrendingDown} accent="var(--con-danger)" />
        <KPICard label="التدفق النقدي الصافي" value={formatSAR(stats.netCashFlow, true)} change={12} icon={Activity} accent="var(--con-brand)" />
        <KPICard label="الهامش التشغيلي" value={`${stats.operatingMargin.toFixed(1)}%`} icon={CheckCircle2} accent="var(--con-info)" />
        <KPICard label="معدل النمو" value={`${stats.monthlyGrowth.toFixed(1)}%`} change={3} icon={Zap} accent="var(--con-warning)" />
      </div>

      {/* Main Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
        <ChartCard title="التدفق النقدي الأسبوعي" subtitle="الداخل vs الخارج">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={cashFlowTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="week" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => formatSAR(value, true)} />
              <Legend />
              <Bar dataKey="in" fill="var(--con-success)" name="الداخل" radius={[4, 4, 0, 0]} />
              <Bar dataKey="out" fill="var(--con-danger)" name="الخارج" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="net" stroke="var(--con-brand)" strokeWidth={2} name="الصافي" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="تراكم التدفق النقدي" subtitle="آخر 6 أشهر">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={netCashFlowMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => formatSAR(value, true)} />
              <Area type="monotone" dataKey="cumulative" stroke="var(--con-brand)" fill="rgba(59,130,246,0.15)" name="التراكمي" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="المقاييس التشغيلية اليومية" subtitle="آخر 5 أيام">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={operatingMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="date" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Bar dataKey="dailyIn" fill="rgba(34,197,94,0.7)" name="الداخل اليومي" radius={[4, 4, 0, 0]} />
              <Bar dataKey="dailyOut" fill="rgba(239,68,68,0.5)" name="الخارج اليومي" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="سعر الاحتراق والهامش" subtitle="مقارنة شهرية">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={burnRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="period" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis yAxisId="left" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="left" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Bar yAxisId="left" dataKey="operatingExpenses" fill="var(--con-danger)" name="المصاريف" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="margin" stroke="var(--con-success)" strokeWidth={3} name="الهامش %" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="التنبؤ المالي" subtitle="الربع القادم">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => formatSAR(value, true)} />
              <Line type="monotone" dataKey="projected" stroke="var(--con-brand)" strokeWidth={3} strokeDasharray="5 5" connectNulls name="المتوقع" />
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
          borderRadius: 10, padding: 20,
        }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 16px 0" }}>
            وضع التدفق النقدي
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--con-text-primary)" }}>النقد في الحساب</span>
              <span style={{ color: "var(--con-success)", fontWeight: 700, fontSize: 20, fontFamily: "var(--con-font-mono)" }}>
                1,035ك ر.س
              </span>
            </div>
            <div style={{ height: 1, background: "var(--con-border-default)" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>الالتزامات المعلقة</span>
              <span style={{ color: "var(--con-warning)", fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>98.5ك ر.س</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>الذمم المدينة</span>
              <span style={{ color: "var(--con-info)", fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>45.2ك ر.س</span>
            </div>
            <div style={{ height: 1, background: "var(--con-border-default)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--con-text-primary)", fontWeight: 600 }}>التدفق النقدي الحر</span>
              <span style={{ color: "var(--con-brand)", fontWeight: 700, fontSize: 20, fontFamily: "var(--con-font-mono)" }}>
                981.7ك ر.س
              </span>
            </div>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10, padding: 20,
        }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 16px 0" }}>
            مقاييس الكفاءة
          </h3>
          <MetricRow label="معدل تحويل الإيرادات" value="91.3%" accent="var(--con-success)" />
          <MetricRow label="معدل استرجاع النقد" value="87.6%" accent="var(--con-brand)" />
          <MetricRow label="فترة تحويل النقد" value="8.2 أيام" accent="var(--con-info)" />
          <MetricRow label="نسبة السيولة الحالية" value="2.85x" accent="var(--con-success)" />
          <MetricRow label="رأس المال العامل" value="987ك ر.س" accent="var(--con-brand)" />
        </div>

        {/* Risk Indicators */}
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10, padding: 20,
        }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 16px 0" }}>
            مؤشرات المخاطر
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: 12, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <CheckCircle2 size={16} style={{ color: "var(--con-success)" }} />
                <span style={{ color: "var(--con-text-primary)", fontWeight: 600 }}>صحة التدفق النقدي</span>
              </div>
              <span style={{ color: "var(--con-success)", fontSize: "var(--con-text-caption)" }}>ممتازة - لا توجد مخاطر فورية</span>
            </div>
            <div style={{ padding: 12, background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.25)", borderRadius: 8 }}>
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
