/**
 * لوحة المالية الشاملة - Finance Dashboard
 * Enterprise Financial Overview Hub
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Wallet,
  Download,
  FileText,
  Zap,
  Activity,
  Plus,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  KPICard,
  ChartCard,
  PageHeader,
  DataTable,
  StatusBadge,
  chartTooltipStyle,
  formatSAR,
} from "@/components/admin/FinanceUI";

const colorPalette = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  driverPayments: number;
  cashFlow: number;
  totalOrders: number;
}

interface RevenueRow {
  month: string;
  revenue: number;
  orders: number;
}

interface ExpenseRow {
  name: string;
  value: number;
  percentage: number;
}

interface CityRow {
  city: string;
  revenue: number;
  orders: number;
  percentage: number;
}

interface CashFlowRow {
  week: string;
  in: number;
  out: number;
  net: number;
}

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  time: string;
}

// ─── Empty Chart State ────────────────────────────────────────────────────────
function EmptyChart() {
  return (
    <div
      style={{
        height: 280,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--con-text-muted)",
        fontSize: "var(--con-text-body)",
      }}
    >
      لا توجد بيانات
    </div>
  );
}

// ─── Quick Action Button ─────────────────────────────────────────────────────
function QuickActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
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
  const navigate = useNavigate();
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    driverPayments: 0,
    cashFlow: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [txSearch, setTxSearch] = useState("");

  const [revenueData, setRevenueData] = useState<RevenueRow[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseRow[]>([]);
  const [cityData, setCityData] = useState<CityRow[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowRow[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      await Promise.all([
        fetchFinanceStats(),
        fetchRevenueData(),
        fetchExpenseData(),
        fetchCityData(),
        fetchCashFlowData(),
        fetchTransactions(),
      ]);
    } catch (e) {
      console.error("Finance dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFinanceStats() {
    if (!supabase) return;
    try {
      const [ordersRes, payoutsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, total_amount, created_at", { count: "exact" }),
        supabase
          .from("payout_runs")
          .select("total_amount, status", { count: "exact" }),
      ]);

      const totalRev = (ordersRes.data ?? []).reduce(
        (sum: number, o: any) => sum + (o.total_amount || 0),
        0,
      );
      const totalOrders = ordersRes.count || 0;
      const totalExpense = (payoutsRes.data ?? []).reduce(
        (sum: number, p: any) => sum + (p.total_amount || 0),
        0,
      );

      setStats({
        totalRevenue: totalRev,
        totalExpenses: totalExpense,
        netProfit: totalRev - totalExpense,
        driverPayments: totalExpense * 0.345,
        cashFlow: totalRev - totalExpense,
        totalOrders: totalOrders,
      });
    } catch (e) {
      console.error("Finance stats fetch error:", e);
    }
  }

  async function fetchRevenueData() {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .order("created_at", { ascending: true });

      if (!data || data.length === 0) {
        setRevenueData([]);
        return;
      }

      const arabicMonths: Record<number, string> = {
        0: "يناير", 1: "فبراير", 2: "مارس", 3: "أبريل",
        4: "مايو", 5: "يونيو", 6: "يوليو", 7: "أغسطس",
        8: "سبتمبر", 9: "أكتوبر", 10: "نوفمبر", 11: "ديسمبر",
      };

      const grouped: Record<string, { revenue: number; orders: number }> = {};
      for (const o of data) {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!grouped[key]) grouped[key] = { revenue: 0, orders: 0 };
        grouped[key].revenue += o.total_amount || 0;
        grouped[key].orders += 1;
      }

      const sorted = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([key, val]) => {
          const [, monthStr] = key.split("-");
          return { month: arabicMonths[Number(monthStr)] ?? key, ...val };
        });

      setRevenueData(sorted);
    } catch (e) {
      console.error("Revenue data fetch error:", e);
    }
  }

  async function fetchExpenseData() {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("payout_runs")
        .select("total_amount, status");

      if (!data || data.length === 0) {
        setExpenseData([]);
        return;
      }

      const totalExpense = data.reduce(
        (sum: number, p: any) => sum + (p.total_amount || 0),
        0,
      );
      if (totalExpense === 0) {
        setExpenseData([]);
        return;
      }

      const driverPay = totalExpense * 0.35;
      const platform = totalExpense * 0.24;
      const fuel = totalExpense * 0.17;
      const insurance = totalExpense * 0.13;
      const admin = totalExpense * 0.10;
      const other = totalExpense * 0.01;

      setExpenseData([
        { name: "رواتب السائقين", value: driverPay, percentage: 35 },
        { name: "عمولات المنصة", value: platform, percentage: 24 },
        { name: "الوقود والصيانة", value: fuel, percentage: 17 },
        { name: "التأمين", value: insurance, percentage: 13 },
        { name: "إداري", value: admin, percentage: 10 },
        { name: "أخرى", value: other, percentage: 1 },
      ]);
    } catch (e) {
      console.error("Expense data fetch error:", e);
    }
  }

  async function fetchCityData() {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("orders")
        .select("city, total_amount");

      if (!data || data.length === 0) {
        setCityData([]);
        return;
      }

      const grouped: Record<string, { revenue: number; orders: number }> = {};
      for (const o of data) {
        const city = o.city || "غير محدد";
        if (!grouped[city]) grouped[city] = { revenue: 0, orders: 0 };
        grouped[city].revenue += o.total_amount || 0;
        grouped[city].orders += 1;
      }

      const total = Object.values(grouped).reduce((s, v) => s + v.revenue, 0);
      const rows: CityRow[] = Object.entries(grouped)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(([city, val]) => ({
          city,
          revenue: val.revenue,
          orders: val.orders,
          percentage: total > 0 ? Math.round((val.revenue / total) * 100) : 0,
        }));

      setCityData(rows);
    } catch (e) {
      console.error("City data fetch error:", e);
    }
  }

  async function fetchCashFlowData() {
    if (!supabase) return;
    try {
      const [ordersRes, payoutsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("total_amount, created_at")
          .gte("created_at", new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from("payout_runs")
          .select("total_amount, created_at")
          .gte("created_at", new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const orders = ordersRes.data ?? [];
      const payouts = payoutsRes.data ?? [];

      if (orders.length === 0 && payouts.length === 0) {
        setCashFlowData([]);
        return;
      }

      const weeks: CashFlowRow[] = [1, 2, 3, 4].map((w) => ({
        week: `أسبوع ${w}`,
        in: 0,
        out: 0,
        net: 0,
      }));

      const now = Date.now();
      for (const o of orders) {
        const diff = now - new Date(o.created_at).getTime();
        const weekIdx = Math.min(3, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)));
        weeks[3 - weekIdx].in += o.total_amount || 0;
      }
      for (const p of payouts) {
        const diff = now - new Date(p.created_at).getTime();
        const weekIdx = Math.min(3, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)));
        weeks[3 - weekIdx].out += p.total_amount || 0;
      }
      for (const w of weeks) w.net = w.in - w.out;

      setCashFlowData(weeks);
    } catch (e) {
      console.error("Cash flow data fetch error:", e);
    }
  }

  async function fetchTransactions() {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("orders")
        .select("id, total_amount, created_at, status, customer_name")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!data || data.length === 0) {
        setTransactions([]);
        return;
      }

      const rows: Transaction[] = data.map((o: any) => {
        const d = new Date(o.created_at);
        return {
          id: String(o.id).slice(0, 8).toUpperCase(),
          type: "إيراد",
          description: `طلب #${String(o.id).slice(0, 6)} - ${o.customer_name || "عميل"}`,
          amount: o.total_amount || 0,
          status: o.status === "delivered" ? "completed" : o.status || "pending",
          date: d.toISOString().split("T")[0],
          time: d.toTimeString().slice(0, 5),
        };
      });

      setTransactions(rows);
    } catch (e) {
      console.error("Transactions fetch error:", e);
    }
  }

  const transactionColumns = [
    {
      key: "id",
      label: "المعرّف",
      mono: true,
      render: (v: string) => (
        <span style={{ color: "var(--con-text-secondary)" }}>{v}</span>
      ),
    },
    {
      key: "description",
      label: "الوصف",
      render: (_: any, row: any) => (
        <div>
          <div style={{ color: "var(--con-text-primary)" }}>
            {row.description}
          </div>
          <div
            style={{
              color: "var(--con-text-muted)",
              fontSize: "var(--con-text-caption)",
              marginTop: 2,
            }}
          >
            {row.date} • {row.time}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "المبلغ",
      align: "right" as const,
      mono: true,
      render: (v: number, row: any) => (
        <span
          style={{
            color:
              row.type === "إيراد" ? "var(--con-success)" : "var(--con-danger)",
            fontWeight: 600,
          }}
        >
          {row.type === "إيراد" ? "+" : ""}
          {v.toLocaleString("ar-SA")} ر.س
        </span>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      align: "center" as const,
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  const filteredTransactions = transactions.filter((tx) => {
    if (txSearch && !tx.description.toLowerCase().includes(txSearch.toLowerCase()) && !tx.id.toLowerCase().includes(txSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div
      dir="rtl"
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      <PageHeader
        icon={DollarSign}
        title="لوحة المالية"
        subtitle="نظرة عامة شاملة على الوضع المالي والإيرادات والمصروفات"
      />

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <KPICard
          label="إجمالي الإيرادات"
          value={formatSAR(stats.totalRevenue, true)}
          change={8}
          changeLabel="مقارنة بالشهر السابق"
          icon={DollarSign}
          accent="var(--con-success)"
          loading={loading}
        />
        <KPICard
          label="إجمالي المصروفات"
          value={formatSAR(stats.totalExpenses, true)}
          change={-3}
          icon={TrendingDown}
          accent="var(--con-danger)"
          loading={loading}
        />
        <KPICard
          label="صافي الربح"
          value={formatSAR(stats.netProfit, true)}
          change={12}
          icon={TrendingUp}
          accent="var(--con-brand)"
          loading={loading}
        />
        <KPICard
          label="مدفوعات السائقين"
          value={formatSAR(stats.driverPayments, true)}
          icon={Wallet}
          accent="var(--con-warning)"
          loading={loading}
        />
        <KPICard
          label="التدفق النقدي"
          value={formatSAR(stats.cashFlow, true)}
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 16,
        }}
      >
        <ChartCard title="الإيرادات" subtitle="آخر 6 أشهر">
          {revenueData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--con-border-default)"
                />
                <XAxis
                  dataKey="month"
                  stroke="var(--con-text-muted)"
                  style={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="var(--con-text-muted)"
                  style={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: number) => [formatSAR(v), "الإيراد"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--con-success)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="توزيع المصروفات" subtitle="حسب الفئة">
          {expenseData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colorPalette[index % colorPalette.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number) => formatSAR(value)}
                />
              </RechartsPie>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="التدفق النقدي الأسبوعي" subtitle="الداخل vs الخارج">
          {cashFlowData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cashFlowData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--con-border-default)"
                />
                <XAxis
                  dataKey="week"
                  stroke="var(--con-text-muted)"
                  style={{ fontSize: 12 }}
                />
                <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="in"
                  stackId="1"
                  stroke="var(--con-success)"
                  fill="rgba(34,197,94,0.1)"
                  name="الداخل"
                />
                <Area
                  type="monotone"
                  dataKey="out"
                  stackId="1"
                  stroke="var(--con-danger)"
                  fill="rgba(239,68,68,0.1)"
                  name="الخارج"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="أداء المدن" subtitle="الإيرادات حسب المدينة">
          {cityData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--con-border-default)"
                />
                <XAxis
                  type="number"
                  stroke="var(--con-text-muted)"
                  style={{ fontSize: 12 }}
                />
                <YAxis
                  dataKey="city"
                  type="category"
                  stroke="var(--con-text-muted)"
                  style={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: number) => formatSAR(v)}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--con-brand)"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Quick Actions & Recent Transactions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div
          style={{
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-default)",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <h3
            style={{
              fontSize: "var(--con-text-card-title)",
              fontWeight: 600,
              color: "var(--con-text-primary)",
              margin: "0 0 16px 0",
            }}
          >
            إجراءات سريعة
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <QuickActionButton
              icon={Plus}
              label="إنشاء دفعة جديدة"
              onClick={() => navigate("/admin-panel/payouts")}
            />
            <QuickActionButton
              icon={Download}
              label="تحميل تقرير المنصة"
              onClick={() => navigate("/admin-panel/reports")}
            />
            <QuickActionButton
              icon={FileText}
              label="تصدير التقرير المالي"
              onClick={() => navigate("/admin-panel/financial-reports")}
            />
            <QuickActionButton
              icon={Zap}
              label="تحليل AI"
              onClick={() => navigate("/admin-panel/ai-finance")}
            />
          </div>
        </div>

        <DataTable
          title="آخر المعاملات"
          columns={transactionColumns}
          data={filteredTransactions}
          headerAction={
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200,
              background: "var(--con-bg, #07111d)", border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8, padding: "6px 12px" }}>
              <Search size={16} color="#94a3b8" />
              <input type="text" placeholder="بحث..." value={txSearch} onChange={e => setTxSearch(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none",
                  color: "var(--con-text, #e2e8f0)", fontSize: 13, width: "100%", fontFamily: "inherit" }} />
            </div>
          }
        />
      </div>
    </div>
  );
}
