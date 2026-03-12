/**
 * لوحة المالية الشاملة - Finance Dashboard
 * Enterprise Financial Overview Hub
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, 
  Clock, Wallet, Download, FileText, Zap, ArrowUpRight, 
  ArrowDownLeft, Activity, CheckCircle2, AlertCircle, Plus,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, PieChart as RechartsPie, 
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from "recharts";

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
  { city: "القصيم", value: 52000, orders: 140, percentage: 8 },
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
  monthRevenue: number;
  monthExpenses: number;
}

interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  accent: string;
  loading?: boolean;
}

// ─── KPI Card Component ───────────────────────────────────────────────────────
function KPICard({ label, value, change, icon: Icon, accent, loading }: KPICardProps) {
  if (loading) {
    return (
      <div style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10,
        padding: "18px 16px",
        minHeight: 140,
      }}>
        <div className="con-skeleton" style={{ height: 14, width: "60%", marginBottom: 12 }} />
        <div className="con-skeleton" style={{ height: 28, width: "80%", marginBottom: 12 }} />
        <div className="con-skeleton" style={{ height: 12, width: "40%" }} />
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: `1px solid ${accent}33`,
      borderRadius: 10,
      padding: "18px 16px",
      transition: "all 0.2s",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-2)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 500 }}>
          {label}
        </span>
        <div style={{
          background: `${accent}14`,
          borderRadius: 8,
          padding: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: 8 }}>
        {value}
      </div>
      {change !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--con-text-caption)", color: change >= 0 ? "var(--con-success)" : "var(--con-danger)" }}>
          {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
          <span>{Math.abs(change)}% مقارنة بالشهر السابق</span>
        </div>
      )}
    </div>
  );
}

// ─── Chart Card Wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: "1px solid var(--con-border-default)",
      borderRadius: 10,
      padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
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

// ─── Quick Action Button ──────────────────────────────────────────────────────
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

// ─── Transaction Row ──────────────────────────────────────────────────────────
function TransactionRow({ txn }: { txn: typeof mockTransactions[0] }) {
  const isIncome = txn.type === "إيراد";
  return (
    <tr style={{
      borderBottom: "1px solid var(--con-border-default)",
      height: 56,
    }}>
      <td style={{ padding: "12px 16px", color: "var(--con-text-secondary)", fontSize: "var(--con-text-caption)" }}>
        <div style={{ fontFamily: "var(--con-font-mono)" }}>{txn.id}</div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ color: "var(--con-text-primary)", fontSize: "var(--con-text-body)" }}>
          {txn.description}
        </div>
        <div style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", marginTop: 2 }}>
          {txn.date} • {txn.time}
        </div>
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        <div style={{
          color: isIncome ? "var(--con-success)" : "var(--con-danger)",
          fontSize: "var(--con-text-body)",
          fontWeight: 600,
          fontFamily: "var(--con-font-mono)",
        }}>
          {isIncome ? "+" : ""}{txn.amount.toLocaleString("ar-SA")} ر.س
        </div>
      </td>
      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        <span style={{
          padding: "3px 8px",
          borderRadius: 4,
          fontSize: "var(--con-text-caption)",
          fontWeight: 600,
          background: txn.status === "completed" ? "rgba(34,197,94,0.12)" : "rgba(217,119,6,0.12)",
          color: txn.status === "completed" ? "var(--con-success)" : "var(--con-warning)",
          border: `1px solid ${txn.status === "completed" ? "rgba(34,197,94,0.25)" : "rgba(217,119,6,0.25)"}`,
        }}>
          {txn.status === "completed" ? "مكتمل" : "في الانتظار"}
        </span>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FinanceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 1218000,
    totalExpenses: 420000,
    netProfit: 798000,
    driverPayments: 145000,
    cashFlow: 216000,
    totalOrders: 3125,
    monthRevenue: 218000,
    monthExpenses: 142000,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceStats();
  }, []);

  async function fetchFinanceStats() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Try to fetch real data from Supabase
      const [ordersRes, payoutsRes, walletsRes, ledgerRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, created_at", { count: "exact" }),
        supabase.from("payout_runs").select("total_amount, status", { count: "exact" }),
        supabase.from("driver_wallets").select("balance"),
        supabase.from("ledger_entries").select("amount, entry_type"),
      ]);

      // If data exists, compute stats; otherwise use mock data
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
          monthRevenue: totalRev * 0.22,
          monthExpenses: totalExpense,
        });
      }
    } catch (e) {
      console.error("Finance stats fetch error:", e);
      // Fall back to mock data
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" style={{ padding: "20px 24px", background: "var(--con-bg-default)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--con-text-primary)", margin: 0, marginBottom: 4 }}>
          لوحة المالية
        </h1>
        <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
          نظرة عامة شاملة على الوضع المالي والإيرادات والمصروفات
        </p>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <KPICard
          label="إجمالي الإيرادات"
          value={`${(stats.totalRevenue / 1000).toFixed(0)}ك ر.س`}
          change={8}
          icon={DollarSign}
          accent="var(--con-success)"
          loading={loading}
        />
        <KPICard
          label="إجمالي المصروفات"
          value={`${(stats.totalExpenses / 1000).toFixed(0)}ك ر.س`}
          change={-3}
          icon={TrendingDown}
          accent="var(--con-danger)"
          loading={loading}
        />
        <KPICard
          label="صافي الربح"
          value={`${((stats.totalRevenue - stats.totalExpenses) / 1000).toFixed(0)}ك ر.س`}
          change={12}
          icon={TrendingUp}
          accent="var(--con-brand)"
          loading={loading}
        />
        <KPICard
          label="مدفوعات السائقين"
          value={`${(stats.driverPayments / 1000).toFixed(0)}ك ر.س`}
          icon={Wallet}
          accent="var(--con-warning)"
          loading={loading}
        />
        <KPICard
          label="التدفق النقدي"
          value={`${(stats.cashFlow / 1000).toFixed(0)}ك ر.س`}
          change={5}
          icon={Activity}
          accent="var(--con-info)"
          loading={loading}
        />
        <KPICard
          label="عدد الطلبات"
          value={stats.totalOrders.toLocaleString("ar-SA")}
          change={15}
          icon={BarChart3}
          accent="var(--con-success)"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16, marginBottom: 28 }}>
        {/* Revenue Chart */}
        <ChartCard title="الإيرادات" subtitle="آخر 6 أشهر">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="revenue" fill="var(--con-success)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Expense Breakdown */}
        <ChartCard title="توزيع المصروفات" subtitle="حسب الفئة">
          <ResponsiveContainer width="100%" height={280}>
            <RechartsPie data={mockExpenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
              {mockExpenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
              ))}
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => `${value.toLocaleString("ar-SA")} ر.س`} />
            </RechartsPie>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cash Flow Trend */}
        <ChartCard title="التدفق النقدي الأسبوعي" subtitle="الداخل vs الخارج">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockCashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="week" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="in" stackId="1" stroke="var(--con-success)" fill="rgba(34,197,94,0.1)" />
              <Area type="monotone" dataKey="out" stackId="1" stroke="var(--con-danger)" fill="rgba(239,68,68,0.1)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* City Performance */}
        <ChartCard title="أداء المدن" subtitle="الإيرادات حسب المدينة">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockCityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis type="number" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis dataKey="city" type="category" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} width={60} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="revenue" fill="var(--con-brand)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Actions & Recent Transactions Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 28 }}>
        {/* Quick Actions */}
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10,
          padding: "20px",
        }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 16px 0" }}>
            إجراءات سريعة
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <QuickActionButton
              icon={Plus}
              label="إنشاء دفعة جديدة"
              onClick={() => {}}
            />
            <QuickActionButton
              icon={Download}
              label="تحميل تقرير المنصة"
              onClick={() => {}}
            />
            <QuickActionButton
              icon={FileText}
              label="تصدير التقرير المالي"
              onClick={() => {}}
            />
            <QuickActionButton
              icon={Zap}
              label="تحليل AI"
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10,
          overflow: "hidden",
        }}>
          <div style={{ padding: "20px", borderBottom: "1px solid var(--con-border-default)" }}>
            <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
              آخر المعاملات
            </h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--con-bg-surface-2)", borderBottom: "1px solid var(--con-border-default)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", fontWeight: 600 }}>
                    المعرّف
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", fontWeight: 600 }}>
                    الوصف
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", fontWeight: 600 }}>
                    المبلغ
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", fontWeight: 600 }}>
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((txn) => (
                  <TransactionRow key={txn.id} txn={txn} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
