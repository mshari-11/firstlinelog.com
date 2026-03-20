/**
 * لوحة المالية الشاملة - Finance Dashboard
 * Enterprise Financial Overview Hub
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  Wallet, Download, FileText, Zap, Activity, Plus,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, PieChart as RechartsPie,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  KPICard, ChartCard, PageHeader, DataTable, StatusBadge,
  chartTooltipStyle, formatSAR,
} from "@/components/admin/FinanceUI";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockRevenueData = [
  { month: "سبتمبر",  revenue: 156000, orders: 420 },
  { month: "أكتوبر", revenue: 189000, orders: 480 },
  { month: "نوفمبر", revenue: 172000, orders: 450 },
  { month: "ديسمبر", revenue: 245000, orders: 620 },
  { month: "يناير",  revenue: 198000, orders: 510 },
  { month: "فبراير", revenue: 218000, orders: 570 },
];

const mockExpenseData = [
  { name: "رواتب السائقين", value: 145000, percentage: 35 },
  { name: "عمولات المنصة", value: 98000, percentage: 24 },
  { name: "الوقود والصيانة", value: 72000, percentage: 17 },
  { name: "التأمين", value: 52000, percentage: 13 },
  { name: "إداري", value: 42000, percentage: 10 },
  { name: "أخرى", value: 11000, percentage: 1 },
];

const mockCityData = [
  { city: "الرياض", revenue: 285000, orders: 845, percentage: 45 },
  { city: "جدة", revenue: 156000, orders: 420, percentage: 25 },
  { city: "الدمام", revenue: 98000, orders: 280, percentage: 15 },
  { city: "القصيم", revenue: 52000, orders: 140, percentage: 8 },
  { city: "الطائف", revenue: 31000, orders: 85, percentage: 5 },
];

const mockCashFlowData = [
  { week: "أسبوع 1", in: 145000, out: 98000, net: 47000 },
  { week: "أسبوع 2", in: 162000, out: 105000, net: 57000 },
  { week: "أسبوع 3", in: 138000, out: 92000, net: 46000 },
  { week: "أسبوع 4", in: 178000, out: 112000, net: 66000 },
];

const mockTransactions = [
  { id: "TXN001", type: "إيراد", description: "طلب #12345 - أحمد محمد", amount: 45.00, status: "completed", date: "2026-03-12", time: "14:32" },
  { id: "TXN002", type: "صرف", description: "دفع براتب - فهد الغامدي", amount: -2500.00, status: "completed", date: "2026-03-12", time: "13:45" },
  { id: "TXN003", type: "إيراد", description: "طلب #12344 - خالد العمري", amount: 38.50, status: "completed", date: "2026-03-12", time: "12:18" },
  { id: "TXN004", type: "صرف", description: "رسوم منصة - مارس", amount: -12450.00, status: "pending", date: "2026-03-12", time: "11:00" },
  { id: "TXN005", type: "إيراد", description: "طلب #12343 - سعد الزهراني", amount: 52.75, status: "completed", date: "2026-03-11", time: "16:22" },
];

const colorPalette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  driverPayments: number;
  cashFlow: number;
  totalOrders: number;
}

// ─── Quick Action Button ─────────────────────────────────────────────────────
function QuickActionButton({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 8,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        color: "var(--con-text-primary)",
        fontSize: "var(--con-text-body)",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--con-bg-surface-2)";
        e.currentTarget.style.borderColor = "var(--con-brand)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--con-bg-surface-1)";
        e.currentTarget.style.borderColor = "var(--con-border-default)";
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FinanceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 1218000,
    totalExpenses: 420000,
    netProfit: 798000,
    driverPayments: 145000,
    cashFlow: 216000,
    totalOrders: 3125,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceStats();
  }, []);

  async function fetchFinanceStats() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [ordersRes, payoutsRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, created_at", { count: "exact" }),
        supabase.from("payout_runs").select("total_amount, status", { count: "exact" }),
      ]);

      if (ordersRes.data && ordersRes.data.length > 0) {
        const totalRev = ordersRes.data.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
        const totalOrders = ordersRes.count || 0;
        const totalExpense = payoutsRes.data?.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0) || 0;

        setStats({
          totalRevenue: totalRev,
          totalExpenses: totalExpense,
          netProfit: totalRev - totalExpense,
          driverPayments: totalExpense * 0.345,
          cashFlow: totalRev - totalExpense,
          totalOrders: totalOrders,
        });
      }
    } catch (e) {
      console.error("Finance stats fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  const transactionColumns = [
    {
      key: "id", label: "المعرّف", mono: true,
      render: (v: string) => <span style={{ color: "var(--con-text-secondary)" }}>{v}</span>,
    },
    {
      key: "description", label: "الوصف",
      render: (_: any, row: any) => (
        <div>
          <div style={{ color: "var(--con-text-primary)" }}>{row.description}</div>
          <div style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", marginTop: 2 }}>
            {row.date} • {row.time}
          </div>
        </div>
      ),
    },
    {
      key: "amount", label: "المبلغ", align: "right" as const, mono: true,
      render: (v: number, row: any) => (
        <span style={{ color: row.type === "إيراد" ? "var(--con-success)" : "var(--con-danger)", fontWeight: 600 }}>
          {row.type === "إيراد" ? "+" : ""}{v.toLocaleString("ar-SA")} ر.س
        </span>
      ),
    },
    {
      key: "status", label: "الحالة", align: "center" as const,
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        icon={DollarSign}
        title="لوحة المالية"
        subtitle="نظرة عامة شاملة على الوضع المالي والإيرادات والمصروفات"
      />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <KPICard label="إجمالي الإيرادات" value={formatSAR(stats.totalRevenue, true)} change={8} changeLabel="مقارنة بالشهر السابق" icon={DollarSign} accent="var(--con-success)" loading={loading} />
        <KPICard label="إجمالي المصروفات" value={formatSAR(stats.totalExpenses, true)} change={-3} icon={TrendingDown} accent="var(--con-danger)" loading={loading} />
        <KPICard label="صافي الربح" value={formatSAR(stats.netProfit, true)} change={12} icon={TrendingUp} accent="var(--con-brand)" loading={loading} />
        <KPICard label="مدفوعات السائقين" value={formatSAR(stats.driverPayments, true)} icon={Wallet} accent="var(--con-warning)" loading={loading} />
        <KPICard label="التدفق النقدي" value={formatSAR(stats.cashFlow, true)} change={5} icon={Activity} accent="var(--con-info)" loading={loading} />
        <KPICard label="عدد الطلبات" value={stats.totalOrders.toLocaleString("ar-SA")} change={15} icon={BarChart3} accent="var(--con-success)" loading={loading} />
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
        <ChartCard title="الإيرادات" subtitle="آخر 6 أشهر">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatSAR(v), "الإيراد"]} />
              <Bar dataKey="revenue" fill="var(--con-success)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="توزيع المصروفات" subtitle="حسب الفئة">
          <ResponsiveContainer width="100%" height={280}>
            <RechartsPie data={mockExpenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
              {mockExpenseData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
              ))}
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => formatSAR(value)} />
            </RechartsPie>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="التدفق النقدي الأسبوعي" subtitle="الداخل vs الخارج">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockCashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="week" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="in" stackId="1" stroke="var(--con-success)" fill="rgba(34,197,94,0.1)" name="الداخل" />
              <Area type="monotone" dataKey="out" stackId="1" stroke="var(--con-danger)" fill="rgba(239,68,68,0.1)" name="الخارج" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="أداء المدن" subtitle="الإيرادات حسب المدينة">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockCityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis type="number" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis dataKey="city" type="category" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} width={60} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatSAR(v)} />
              <Bar dataKey="revenue" fill="var(--con-brand)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Actions & Recent Transactions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10,
          padding: 20,
        }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 16px 0" }}>
            إجراءات سريعة
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <QuickActionButton icon={Plus} label="إنشاء دفعة جديدة" onClick={() => {}} />
            <QuickActionButton icon={Download} label="تحميل تقرير المنصة" onClick={() => {}} />
            <QuickActionButton icon={FileText} label="تصدير التقرير المالي" onClick={() => {}} />
            <QuickActionButton icon={Zap} label="تحليل AI" onClick={() => {}} />
          </div>
        </div>

        <DataTable
          title="آخر المعاملات"
          columns={transactionColumns}
          data={mockTransactions}
        />
      </div>
    </div>
  );
}
