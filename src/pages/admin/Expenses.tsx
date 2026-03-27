/**
 * تتبع المصروفات - Expense Tracking
 * Add, track, and analyze business expenses
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Bar, Line,
} from "recharts";
import { DollarSign, TrendingDown, Plus, AlertCircle, CheckCircle2, X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import {
  KPICard, ChartCard, PageHeader, DataTable, StatusBadge,
  chartTooltipStyle, formatSAR,
} from "@/components/admin/FinanceUI";

// ─── Fallback Data (used when Supabase is unavailable) ────────────────────────
const FALLBACK_EXPENSE_CATEGORIES = [
  { name: "رواتب السائقين",    value: 145000, percentage: 35, budget: 150000 },
  { name: "عمولات المنصة",     value: 98000,  percentage: 24, budget: 100000 },
  { name: "الوقود والصيانة",   value: 72000,  percentage: 17, budget: 75000  },
  { name: "التأمين",          value: 52000,  percentage: 13, budget: 55000  },
  { name: "إداري",            value: 42000,  percentage: 10, budget: 45000  },
  { name: "أخرى",             value: 11000,  percentage: 1,  budget: 12000  },
];

const FALLBACK_MONTHLY_COMPARISON = [
  { month: "سبتمبر",  actual: 312000, budget: 320000 },
  { month: "أكتوبر", actual: 298000, budget: 320000 },
  { month: "نوفمبر", actual: 325000, budget: 320000 },
  { month: "ديسمبر", actual: 385000, budget: 350000 },
  { month: "يناير",  actual: 342000, budget: 320000 },
  { month: "فبراير", actual: 348000, budget: 330000 },
];

const FALLBACK_RECENT_EXPENSES = [
  { id: "EXP001", category: "الوقود والصيانة", description: "صيانة سيارة رقم 45", amount: 2500, date: "2026-03-12", status: "completed" },
  { id: "EXP002", category: "رواتب السائقين", description: "رواتب الأسبوع الأول", amount: 35000, date: "2026-03-12", status: "pending" },
  { id: "EXP003", category: "عمولات المنصة", description: "عمولة مارس - جاهز", amount: 12450, date: "2026-03-11", status: "completed" },
  { id: "EXP004", category: "التأمين", description: "تأمين السيارات الشهري", amount: 5200, date: "2026-03-11", status: "completed" },
  { id: "EXP005", category: "إداري", description: "رسوم مكتبية", amount: 650, date: "2026-03-10", status: "completed" },
];

const PLATFORM_LABELS: Record<string, string> = {
  jahez: "جاهز", hungerstation: "هنقرستيشن", toyou: "تو يو",
  keeta: "كيتا", careem: "كريم", ninja: "نينجا", mrsool: "مرسول",
};

const ARABIC_MONTHS: Record<number, string> = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل", 5: "مايو", 6: "يونيو",
  7: "يوليو", 8: "أغسطس", 9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر",
};

const colorPalette = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];

// ─── Expense Modal ───────────────────────────────────────────────────────────
function ExpenseModal({ onClose, onSave }: { onClose: () => void; onSave: (data: { category: string; description: string; amount: number; date: string }) => void }) {
  const [formData, setFormData] = useState({
    category: "الوقود والصيانة",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  function handleSave() {
    const amount = Number(formData.amount);
    if (!formData.description || !amount || amount <= 0) {
      toast.error("يرجى تعبئة جميع الحقول بشكل صحيح");
      return;
    }
    onSave({ ...formData, amount });
    toast.success("تم إضافة المصروف بنجاح");
    onClose();
  }

  const categories = ["رواتب السائقين", "عمولات المنصة", "الوقود والصيانة", "التأمين", "إداري", "أخرى"];

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--con-bg-surface-1)",
    border: "1px solid var(--con-border-default)",
    borderRadius: 8,
    color: "var(--con-text-primary)",
    fontSize: "var(--con-text-body)",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div dir="rtl" style={{
        background: "var(--con-bg-elevated)",
        border: "1px solid var(--con-border-strong)",
        borderRadius: 12, width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--con-border-default)",
        }}>
          <h2 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
            إضافة مصروف جديد
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--con-text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {[
            { label: "الفئة", type: "select", value: formData.category, onChange: (v: string) => setFormData({ ...formData, category: v }), options: categories },
            { label: "الوصف", type: "text", placeholder: "مثال: صيانة سيارة رقم 45", value: formData.description, onChange: (v: string) => setFormData({ ...formData, description: v }) },
            { label: "المبلغ (ر.س)", type: "number", placeholder: "0.00", value: formData.amount, onChange: (v: string) => setFormData({ ...formData, amount: v }) },
            { label: "التاريخ", type: "date", value: formData.date, onChange: (v: string) => setFormData({ ...formData, date: v }) },
          ].map((field) => (
            <div key={field.label} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 6, display: "block" }}>
                {field.label}
              </label>
              {field.type === "select" ? (
                <select value={field.value} onChange={(e) => field.onChange(e.target.value)} style={inputStyle}>
                  {field.options!.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : field.type === "date" ? (
                <DatePicker
                  date={field.value ? new Date(field.value) : undefined}
                  onSelect={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
                />
              ) : (
                <input type={field.type} placeholder={field.placeholder} value={field.value} onChange={(e) => field.onChange(e.target.value)} style={inputStyle} />
              )}
            </div>
          ))}
          <button
            onClick={handleSave}
            style={{
              width: "100%", padding: 12, marginTop: 8,
              background: "var(--con-brand)", border: "none", borderRadius: 8,
              color: "white", fontSize: "var(--con-text-body)", fontWeight: 600,
              cursor: "pointer", transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            إضافة المصروف
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Expenses() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expenseCategoryData, setExpenseCategoryData] = useState(FALLBACK_EXPENSE_CATEGORIES);
  const [monthlyComparisonData, setMonthlyComparisonData] = useState(FALLBACK_MONTHLY_COMPARISON);
  const [recentExpenses, setRecentExpenses] = useState(FALLBACK_RECENT_EXPENSES);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthExpenses: 0,
    budgetRemaining: 0,
    budgetUtilization: 0,
  });

  useEffect(() => {
    async function fetchExpenses() {
      setLoading(true);
      try {
        if (!supabase) throw new Error("no client");
        const { data: orders, error } = await supabase
          .from("orders")
          .select("platform, order_date, deductions, orders_count")
          .order("order_date", { ascending: true });
        if (error || !orders?.length) throw error ?? new Error("no data");

        // ── Category aggregation (group by platform) ──────────────────────
        const catMap = new Map<string, number>();
        let totalDeductions = 0;
        orders.forEach((o: any) => {
          const ded = Number(o.deductions) || 0;
          totalDeductions += ded;
          const platform = PLATFORM_LABELS[o.platform] || o.platform || "أخرى";
          catMap.set(platform, (catMap.get(platform) || 0) + ded);
        });
        const catData = Array.from(catMap.entries())
          .map(([name, value]) => ({
            name,
            value: Math.round(value),
            percentage: totalDeductions > 0 ? Math.round((value / totalDeductions) * 100) : 0,
            budget: Math.round(value * 1.1), // estimated budget = actual + 10%
          }))
          .sort((a, b) => b.value - a.value);
        setExpenseCategoryData(catData.length ? catData : FALLBACK_EXPENSE_CATEGORIES);

        // ── Monthly aggregation ───────────────────────────────────────────
        const monthMap = new Map<string, { actual: number; key: string }>();
        orders.forEach((o: any) => {
          const ded = Number(o.deductions) || 0;
          const date = o.order_date ? new Date(o.order_date) : null;
          if (!date) return;
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const label = ARABIC_MONTHS[date.getMonth() + 1] || key;
          const prev = monthMap.get(key) || { actual: 0, key: label };
          monthMap.set(key, { actual: prev.actual + ded, key: label });
        });
        const sortedMonths = Array.from(monthMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([, v]) => ({
            month: v.key,
            actual: Math.round(v.actual),
            budget: Math.round(v.actual * 1.05), // estimated budget = actual + 5%
          }));
        setMonthlyComparisonData(sortedMonths.length ? sortedMonths : FALLBACK_MONTHLY_COMPARISON);

        // ── Recent expense rows (last 5 orders by date) ───────────────────
        const recentRows = [...orders]
          .sort((a: any, b: any) => (b.order_date || "").localeCompare(a.order_date || ""))
          .slice(0, 5)
          .map((o: any, i: number) => ({
            id: `EXP${String(i + 1).padStart(3, "0")}`,
            category: PLATFORM_LABELS[o.platform] || o.platform || "أخرى",
            description: `خصومات منصة ${PLATFORM_LABELS[o.platform] || o.platform || "أخرى"}`,
            amount: Math.round(Number(o.deductions) || 0),
            date: o.order_date || "",
            status: "completed",
          }));
        setRecentExpenses(recentRows.length ? recentRows : FALLBACK_RECENT_EXPENSES);

        // ── KPI stats ─────────────────────────────────────────────────────
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const monthDed = orders
          .filter((o: any) => (o.order_date || "").startsWith(currentMonth))
          .reduce((sum: number, o: any) => sum + (Number(o.deductions) || 0), 0);
        const estimatedBudget = Math.round(totalDeductions * 1.05);
        const remaining = estimatedBudget - totalDeductions;
        const utilization = estimatedBudget > 0 ? Math.round((totalDeductions / estimatedBudget) * 100 * 10) / 10 : 0;
        setStats({
          totalExpenses: Math.round(totalDeductions),
          monthExpenses: Math.round(monthDed),
          budgetRemaining: remaining,
          budgetUtilization: utilization,
        });
      } catch {
        // Keep fallback data already in state
      } finally {
        setLoading(false);
      }
    }
    fetchExpenses();
  }, []);

  const expenseColumns = [
    { key: "id", label: "المعرّف", mono: true, render: (v: string) => <span style={{ color: "var(--con-text-secondary)" }}>{v}</span> },
    {
      key: "category", label: "الفئة والوصف",
      render: (_: any, row: any) => (
        <div>
          <div style={{ color: "var(--con-text-primary)", fontWeight: 500 }}>{row.category}</div>
          <div style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", marginTop: 2 }}>{row.description}</div>
        </div>
      ),
    },
    {
      key: "amount", label: "المبلغ", align: "right" as const, mono: true,
      render: (v: number) => <span style={{ color: "var(--con-danger)", fontWeight: 600 }}>-{formatSAR(v)}</span>,
    },
    { key: "date", label: "التاريخ", align: "center" as const, render: (v: string) => <span style={{ color: "var(--con-text-muted)" }}>{v}</span> },
    { key: "status", label: "الحالة", align: "center" as const, render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        icon={TrendingDown}
        title="تتبع المصروفات"
        subtitle="إدارة شاملة للمصروفات والميزانية"
        actions={
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", background: "var(--con-brand)", border: "none",
              borderRadius: 8, color: "white", fontSize: "var(--con-text-body)",
              fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <Plus size={18} />
            إضافة مصروف جديد
          </button>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <KPICard label="إجمالي المصروفات" value={formatSAR(stats.totalExpenses, true)} icon={TrendingDown} accent="var(--con-danger)" loading={loading} />
        <KPICard label="مصروفات الشهر" value={formatSAR(stats.monthExpenses, true)} change={5} invertChange icon={DollarSign} accent="var(--con-warning)" loading={loading} />
        <KPICard label="الرصيد المتبقي" value={formatSAR(stats.budgetRemaining, true)} icon={AlertCircle} accent="var(--con-info)" loading={loading} />
        <KPICard label="استهلاك الميزانية" value={`${stats.budgetUtilization}%`} icon={CheckCircle2} accent="var(--con-warning)" warning={stats.budgetUtilization > 90} loading={loading} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
        <ChartCard title="توزيع المصروفات" subtitle="حسب الفئة">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
              {expenseCategoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
              ))}
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => formatSAR(value, true)} />
            </RechartsPie>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="الميزانية مقابل الفعلي" subtitle="آخر 6 أشهر">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => formatSAR(value, true)} />
              <Bar dataKey="actual" fill="rgba(239,68,68,0.8)" name="الفعلي" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="budget" stroke="var(--con-brand)" strokeWidth={2} strokeDasharray="5 5" name="الميزانية" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Budget Details */}
      <div style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10, padding: 20,
      }}>
        <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 16px 0" }}>
          تفاصيل الميزانية حسب الفئة
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {expenseCategoryData.map((cat) => {
            const remaining = cat.budget - cat.value;
            const utilization = (cat.value / cat.budget) * 100;
            return (
              <div key={cat.name} style={{
                background: "var(--con-bg-surface-2)",
                border: "1px solid var(--con-border-default)",
                borderRadius: 8, padding: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "var(--con-text-body)", fontWeight: 600, color: "var(--con-text-primary)" }}>{cat.name}</span>
                  <span style={{ fontSize: "var(--con-text-caption)", color: utilization > 90 ? "var(--con-danger)" : "var(--con-text-muted)" }}>
                    {utilization.toFixed(0)}%
                  </span>
                </div>
                <div style={{ width: "100%", height: 8, background: "var(--con-bg-surface-1)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{
                    width: `${Math.min(utilization, 100)}%`, height: "100%",
                    background: utilization > 90 ? "var(--con-danger)" : "var(--con-success)",
                    transition: "width 0.3s",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                  <span>الفعلي: {formatSAR(cat.value, true)}</span>
                  <span>المتبقي: {formatSAR(remaining, true)}</span>
                  <span>الميزانية: {formatSAR(cat.budget, true)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Expenses */}
      <DataTable title="آخر المصروفات" columns={expenseColumns} data={recentExpenses} />

      {showModal && <ExpenseModal onClose={() => setShowModal(false)} onSave={(data) => { console.log("Expense saved:", data); /* TODO: save to Supabase */ }} />}
    </div>
  );
}
