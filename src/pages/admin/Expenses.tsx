/**
 * تتبع المصروفات - Expense Tracking
 * Add, track, and analyze business expenses
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart,
} from "recharts";
import {
  DollarSign, TrendingDown, PieChart, TrendingUp,
  Plus, AlertCircle, CheckCircle2, X, Calendar,
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
const expenseCategoryData = [
  { name: "رواتب السائقين",    value: 145000, percentage: 35, budget: 150000 },
  { name: "عمولات المنصة",     value: 98000,  percentage: 24, budget: 100000 },
  { name: "الوقود والصيانة",   value: 72000,  percentage: 17, budget: 75000  },
  { name: "التأمين",          value: 52000,  percentage: 13, budget: 55000  },
  { name: "إداري",            value: 42000,  percentage: 10, budget: 45000  },
  { name: "أخرى",             value: 11000,  percentage: 1,  budget: 12000  },
];

const monthlyComparisonData = [
  { month: "سبتمبر",  actual: 312000, budget: 320000 },
  { month: "أكتوبر", actual: 298000, budget: 320000 },
  { month: "نوفمبر", actual: 325000, budget: 320000 },
  { month: "ديسمبر", actual: 385000, budget: 350000 },
  { month: "يناير",  actual: 342000, budget: 320000 },
  { month: "فبراير", actual: 348000, budget: 330000 },
];

const recentExpenses = [
  { id: "EXP001", category: "الوقود والصيانة", description: "صيانة سيارة رقم 45", amount: 2500, date: "2026-03-12", status: "completed" },
  { id: "EXP002", category: "رواتب السائقين", description: "رواتب الأسبوع الأول", amount: 35000, date: "2026-03-12", status: "pending" },
  { id: "EXP003", category: "عمولات المنصة", description: "عمولة مارس - جاهز", amount: 12450, date: "2026-03-11", status: "completed" },
  { id: "EXP004", category: "التأمين", description: "تأمين السيارات الشهري", amount: 5200, date: "2026-03-11", status: "completed" },
  { id: "EXP005", category: "إداري", description: "رسوم مكتبية", amount: 650, date: "2026-03-10", status: "completed" },
];

const colorPalette = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];

interface ExpenseStats {
  totalExpenses: number;
  monthExpenses: number;
  budgetRemaining: number;
  budgetUtilization: number;
  highestCategory: string;
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
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: "var(--con-text-caption)",
          color: change <= 0 ? "var(--con-success)" : "var(--con-warning)",
        }}>
          {change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(change)}% {change > 0 ? "زيادة" : "تراجع"}</span>
        </div>
      )}
    </div>
  );
}

// ─── Expense Modal ──────────────────────────────────────────────────────────────
function ExpenseModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    category: "الوقود والصيانة",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const categories = [
    "رواتب السائقين",
    "عمولات المنصة",
    "الوقود والصيانة",
    "التأمين",
    "إداري",
    "أخرى",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir="rtl"
        style={{
          background: "var(--con-bg-elevated)",
          border: "1px solid var(--con-border-strong)",
          borderRadius: 12,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--con-border-default)",
          }}
        >
          <h2 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
            إضافة مصروف جديد
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--con-text-muted)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 6, display: "block" }}>
              الفئة
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--con-bg-surface-1)",
                border: "1px solid var(--con-border-default)",
                borderRadius: 8,
                color: "var(--con-text-primary)",
                fontSize: "var(--con-text-body)",
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 6, display: "block" }}>
              الوصف
            </label>
            <input
              type="text"
              placeholder="مثال: صيانة سيارة رقم 45"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--con-bg-surface-1)",
                border: "1px solid var(--con-border-default)",
                borderRadius: 8,
                color: "var(--con-text-primary)",
                fontSize: "var(--con-text-body)",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 6, display: "block" }}>
              المبلغ (ر.س)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--con-bg-surface-1)",
                border: "1px solid var(--con-border-default)",
                borderRadius: 8,
                color: "var(--con-text-primary)",
                fontSize: "var(--con-text-body)",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 6, display: "block" }}>
              التاريخ
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--con-bg-surface-1)",
                border: "1px solid var(--con-border-default)",
                borderRadius: 8,
                color: "var(--con-text-primary)",
                fontSize: "var(--con-text-body)",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--con-brand)",
              border: "none",
              borderRadius: 8,
              color: "white",
              fontSize: "var(--con-text-body)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.9)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--con-brand)"; }}
          >
            إضافة المصروف
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Expense Row ───────────────────────────────────────────────────────────────
function ExpenseRow({ expense }: { expense: typeof recentExpenses[0] }) {
  return (
    <tr style={{
      borderBottom: "1px solid var(--con-border-default)",
      height: 56,
    }}>
      <td style={{ padding: "12px 16px", color: "var(--con-text-secondary)", fontSize: "var(--con-text-caption)" }}>
        <div style={{ fontFamily: "var(--con-font-mono)" }}>{expense.id}</div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ color: "var(--con-text-primary)", fontSize: "var(--con-text-body)", fontWeight: 500 }}>
          {expense.category}
        </div>
        <div style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", marginTop: 2 }}>
          {expense.description}
        </div>
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        <div style={{
          color: "var(--con-danger)",
          fontSize: "var(--con-text-body)",
          fontWeight: 600,
          fontFamily: "var(--con-font-mono)",
        }}>
          -{expense.amount.toLocaleString("ar-SA")} ر.س
        </div>
      </td>
      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
          {expense.date}
        </div>
      </td>
      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        <span style={{
          padding: "3px 8px",
          borderRadius: 4,
          fontSize: "var(--con-text-caption)",
          fontWeight: 600,
          background: expense.status === "completed" ? "rgba(34,197,94,0.12)" : "rgba(217,119,6,0.12)",
          color: expense.status === "completed" ? "var(--con-success)" : "var(--con-warning)",
          border: `1px solid ${expense.status === "completed" ? "rgba(34,197,94,0.25)" : "rgba(217,119,6,0.25)"}`,
        }}>
          {expense.status === "completed" ? "مكتمل" : "في الانتظار"}
        </span>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Expenses() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState<ExpenseStats>({
    totalExpenses: 1068000,
    monthExpenses: 348000,
    budgetRemaining: 5000,
    budgetUtilization: 95.3,
    highestCategory: "رواتب السائقين",
  });

  return (
    <div dir="rtl" style={{ padding: "20px 24px", background: "var(--con-bg-default)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--con-text-primary)", margin: 0, marginBottom: 4 }}>
            تتبع المصروفات
          </h1>
          <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
            إدارة شاملة للمصروفات والميزانية
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "var(--con-brand)",
            border: "none",
            borderRadius: 8,
            color: "white",
            fontSize: "var(--con-text-body)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.9)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--con-brand)"; }}
        >
          <Plus size={18} />
          إضافة مصروف جديد
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <KPICard
          label="إجمالي المصروفات"
          value={`${(stats.totalExpenses / 1000).toFixed(0)}ك ر.س`}
          icon={TrendingDown}
          accent="var(--con-danger)"
        />
        <KPICard
          label="مصروفات الشهر"
          value={`${(stats.monthExpenses / 1000).toFixed(0)}ك ر.س`}
          change={5}
          icon={DollarSign}
          accent="var(--con-warning)"
        />
        <KPICard
          label="الرصيد المتبقي"
          value={`${(stats.budgetRemaining / 1000).toFixed(1)}ك ر.س`}
          icon={AlertCircle}
          accent="var(--con-info)"
        />
        <KPICard
          label="استهلاك الميزانية"
          value={`${stats.budgetUtilization}%`}
          icon={CheckCircle2}
          accent="var(--con-warning)"
        />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16, marginBottom: 28 }}>
        {/* Category Breakdown */}
        <ChartCard title="توزيع المصروفات" subtitle="حسب الفئة">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
              {expenseCategoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
              ))}
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => `${(value / 1000).toFixed(0)}ك ر.س`} />
            </RechartsPie>
          </ResponsiveContainer>
        </ChartCard>

        {/* Budget vs Actual */}
        <ChartCard title="الميزانية مقابل الفعلي" subtitle="آخر 6 أشهر">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <YAxis stroke="var(--con-text-muted)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => `${(value / 1000).toFixed(0)}ك ر.س`} />
              <Bar dataKey="actual" fill="rgba(239,68,68,0.8)" />
              <Line type="monotone" dataKey="budget" stroke="var(--con-brand)" strokeWidth={2} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Category Budget Details */}
      <div style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10,
        padding: "20px",
        marginBottom: 28,
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
                borderRadius: 8,
                padding: "16px",
              }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}>
                    <span style={{ fontSize: "var(--con-text-body)", fontWeight: 600, color: "var(--con-text-primary)" }}>
                      {cat.name}
                    </span>
                    <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                      {utilization.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: 8,
                    background: "var(--con-bg-surface-1)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${Math.min(utilization, 100)}%`,
                      height: "100%",
                      background: utilization > 90 ? "var(--con-danger)" : "var(--con-success)",
                      transition: "width 0.3s",
                    }} />
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-muted)",
                }}>
                  <span>الفعلي: {(cat.value / 1000).toFixed(0)}ك</span>
                  <span>المتبقي: {(remaining / 1000).toFixed(0)}ك</span>
                  <span>الميزانية: {(cat.budget / 1000).toFixed(0)}ك</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Expenses */}
      <div style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10,
        overflow: "hidden",
      }}>
        <div style={{ padding: "20px", borderBottom: "1px solid var(--con-border-default)" }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
            آخر المصروفات
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
                  الفئة والوصف
                </th>
                <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", fontWeight: 600 }}>
                  المبلغ
                </th>
                <th style={{ padding: "12px 16px", textAlign: "center", color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", fontWeight: 600 }}>
                  التاريخ
                </th>
                <th style={{ padding: "12px 16px", textAlign: "center", color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", fontWeight: 600 }}>
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody>
              {recentExpenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <ExpenseModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
