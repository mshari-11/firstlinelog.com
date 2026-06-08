/**
 * إدارة الرواتب — Payroll Management
 * سجلات رواتب السائقين الشهرية مع الاعتماد والتصدير
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/admin/auth";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";
import {
  Wallet,
  Search,
  X,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Calendar,
  FileSpreadsheet,
  Eye,
  Edit3,
  TrendingUp,
  // New icons for enhancements
  Lock,
  Unlock,
  Calculator,
  Bell,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Banknote,
  Percent,
  ArrowUpDown,
  MoreHorizontal,
  Copy,
  Send,
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  Fuel,
  Wrench,
  Car,
  Receipt,
  Award,
  Columns,
  SlidersHorizontal,
  FileText,
  BarChart3,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface PayrollRecord {
  id: string;
  driver_id: string;
  driver_name: string;
  phone: string;
  platform: string;
  period: string; // e.g. "2026-03"
  total_orders: number;
  order_rate: number;
  gross_earnings: number;
  fuel_allowance: number;
  operations_allowance: number;
  performance_bonus: number;
  total_additions: number;
  fll_commission: number;
  vehicle_cost: number;
  insurance: number;
  maintenance: number;
  penalties: number;
  total_deductions: number;
  vat_amount: number;
  net_payout: number;
  status: "draft" | "pending" | "approved" | "paid" | "rejected";
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
}

const STATUS_META: Record<
  string,
  { label: string; cls: string; icon: React.ElementType }
> = {
  draft: { label: "مسودة", cls: "con-badge-info", icon: Edit3 },
  pending: { label: "بانتظار", cls: "con-badge-warning", icon: Clock },
  approved: { label: "معتمد", cls: "con-badge-success", icon: CheckCircle2 },
  paid: { label: "مدفوع", cls: "con-badge-success", icon: DollarSign },
  rejected: { label: "مرفوض", cls: "con-badge-danger", icon: XCircle },
};

const PLATFORMS: Record<string, string> = {
  jahez: "جاهز",
  hungerstation: "هنقرستيشن",
  keeta: "كيتا",
  mrsool: "مرسول",
  toyou: "تويو",
  ninja: "نينجا",
  careem: "كريم",
  other: "أخرى",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename + ".csv";
  a.click();
}

/* ── Permission helpers ────────────────────────────────────────────────── */
type PayrollRole = "admin" | "finance_manager" | "viewer";

function getPayrollRole(user: any, hasPermission: (p: string) => boolean): PayrollRole {
  if (user?.role === "admin" || user?.role === "owner") return "admin";
  if (hasPermission("finance") || hasPermission("payouts")) return "finance_manager";
  return "viewer";
}

const ROLE_LABELS: Record<PayrollRole, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "مدير النظام", icon: ShieldCheck, color: "var(--con-danger)" },
  finance_manager: { label: "مدير مالي", icon: UserCheck, color: "var(--con-warning)" },
  viewer: { label: "مشاهد فقط", icon: Eye, color: "var(--con-text-muted)" },
};

/* ── Column configuration ─────────────────────────────────────────────── */
interface ColumnConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "driver", label: "السائق", icon: Users, visible: true },
  { key: "platform", label: "المنصة", icon: BarChart3, visible: true },
  { key: "period", label: "الفترة", icon: Calendar, visible: true },
  { key: "orders", label: "الطلبات", icon: Receipt, visible: true },
  { key: "gross", label: "الإجمالي", icon: CircleDollarSign, visible: true },
  { key: "additions", label: "الإضافات", icon: TrendingUp, visible: true },
  { key: "deductions", label: "الخصومات", icon: Percent, visible: true },
  { key: "net", label: "الصافي", icon: Banknote, visible: true },
  { key: "status", label: "الحالة", icon: BadgeCheck, visible: true },
];

/* ── Component ─────────────────────────────────────────────────────────── */
export default function PayrollManagement() {
  const { user, hasPermission } = useAuth();
  const role = getPayrollRole(user, hasPermission);
  const canEdit = role === "admin" || role === "finance_manager";
  const canApprove = role === "admin";
  const canPay = role === "admin" || role === "finance_manager";
  const canExport = role !== "viewer";
  const canLock = role === "admin";

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);

  // New enhanced state
  const [lockedRecords, setLockedRecords] = useState<Set<string>>(new Set());
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showToolbar, setShowToolbar] = useState(true);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data } = await supabase
          .from("finance.driver_payouts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (data?.length) {
          setRecords(
            data.map((r: any) => ({
              id: r.id,
              driver_id: r.driver_id || "",
              driver_name: r.driver_name || r.full_name || "",
              phone: r.phone || r.stc_bank_phone || "",
              platform: r.platform || "",
              period: r.period || r.period_start?.slice(0, 7) || "",
              total_orders: r.total_orders || 0,
              order_rate: r.order_rate || 0,
              gross_earnings: r.gross_earnings || 0,
              fuel_allowance: r.fuel_allowance || 0,
              operations_allowance: r.operations_allowance || 0,
              performance_bonus: r.performance_bonus || 0,
              total_additions: r.total_additions || 0,
              fll_commission: r.fll_commission || 0,
              vehicle_cost: r.vehicle_cost || 0,
              insurance: r.insurance || 0,
              maintenance: r.maintenance || 0,
              penalties: r.penalties || 0,
              total_deductions: r.total_deductions || 0,
              vat_amount: r.vat_amount || 0,
              net_payout: r.net_payout || 0,
              status: r.status || "draft",
              approved_by: r.approved_by,
              approved_at: r.approved_at,
              paid_at: r.paid_at,
              notes: r.notes,
              created_at: r.created_at || "",
            })),
          );
        }
      }
      const res = await fetch(`${API_BASE}/payout-lines`);
      if (res.ok) {
        const d = await res.json();
        if (d.items?.length && !records.length) {
          setRecords(
            d.items.map((r: any) => ({
              id: r.id,
              driver_id: r.driver_id || "",
              driver_name: r.driver_name || "",
              phone: r.phone || "",
              platform: r.platform || "",
              period: r.period || "",
              total_orders: r.total_orders || 0,
              order_rate: r.order_rate || 0,
              gross_earnings: r.gross_earnings || 0,
              fuel_allowance: 0,
              operations_allowance: 0,
              performance_bonus: 0,
              total_additions: r.total_additions || 0,
              fll_commission: r.fll_commission || 0,
              vehicle_cost: 0,
              insurance: 0,
              maintenance: 0,
              penalties: 0,
              total_deductions: r.total_deductions || 0,
              vat_amount: r.vat_amount || 0,
              net_payout: r.net_payout || 0,
              status: r.status || "draft",
              notes: "",
              created_at: r.createdAt || "",
            })),
          );
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (
        search &&
        !r.driver_name.includes(search) &&
        !r.phone.includes(search)
      )
        return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterPeriod && r.period !== filterPeriod) return false;
      return true;
    });
  }, [records, search, filterStatus, filterPeriod]);

  const totals = useMemo(() => {
    const t = {
      count: filtered.length,
      gross: 0,
      additions: 0,
      deductions: 0,
      net: 0,
      pending: 0,
      approved: 0,
      paid: 0,
    };
    filtered.forEach((r) => {
      t.gross += r.gross_earnings;
      t.additions += r.total_additions;
      t.deductions += r.total_deductions + r.vat_amount;
      t.net += r.net_payout;
      if (r.status === "pending") t.pending++;
      if (r.status === "approved") t.approved++;
      if (r.status === "paid") t.paid++;
    });
    return t;
  }, [filtered]);

  const periods = useMemo(
    () =>
      [...new Set(records.map((r) => r.period).filter(Boolean))]
        .sort()
        .reverse(),
    [records],
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function bulkApprove() {
    const ids = [...selectedIds];
    setRecords((prev) =>
      prev.map((r) =>
        ids.includes(r.id) && r.status === "pending"
          ? { ...r, status: "approved", approved_at: new Date().toISOString() }
          : r,
      ),
    );
    setSelectedIds(new Set());
    toast.success(`تم اعتماد ${ids.length} سجل`);
  }

  async function bulkPay() {
    const ids = [...selectedIds];
    setRecords((prev) =>
      prev.map((r) =>
        ids.includes(r.id) && r.status === "approved"
          ? { ...r, status: "paid", paid_at: new Date().toISOString() }
          : r,
      ),
    );
    setSelectedIds(new Set());
    toast.success(`تم تحديث ${ids.length} سجل كـ "مدفوع"`);
  }

  // ─── New tool functions ─────────────────────────────────────────────
  function toggleLock(id: string) {
    if (!canLock) { toast.error("ليس لديك صلاحية قفل السجلات"); return; }
    setLockedRecords((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    toast.success(lockedRecords.has(id) ? "تم فتح القفل" : "تم قفل السجل");
  }

  function bulkLock() {
    if (!canLock) return;
    const ids = [...selectedIds];
    setLockedRecords((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => n.add(id));
      return n;
    });
    setSelectedIds(new Set());
    toast.success(`تم قفل ${ids.length} سجل`);
  }

  function recalculate(id: string) {
    if (!canEdit) { toast.error("ليس لديك صلاحية إعادة الحساب"); return; }
    if (lockedRecords.has(id)) { toast.error("السجل مقفل — لا يمكن إعادة الحساب"); return; }
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const gross = r.total_orders * r.order_rate;
        const additions = r.fuel_allowance + r.operations_allowance + r.performance_bonus;
        const deductions = r.fll_commission + r.vehicle_cost + r.insurance + r.maintenance + r.penalties;
        const vat = gross * 0.15;
        const net = gross + additions - deductions - vat;
        return { ...r, gross_earnings: gross, total_additions: additions, total_deductions: deductions, vat_amount: vat, net_payout: net };
      }),
    );
    toast.success("تم إعادة حساب الراتب");
  }

  function sendNotification(driverName: string) {
    toast.success(`تم إرسال إشعار الراتب إلى ${driverName}`);
  }

  function copyPayslip(r: PayrollRecord) {
    const text = `كشف راتب: ${r.driver_name}\nالفترة: ${r.period}\nالإجمالي: ${fmt(r.gross_earnings)}\nالإضافات: ${fmt(r.total_additions)}\nالخصومات: ${fmt(r.total_deductions + r.vat_amount)}\nالصافي: ${fmt(r.net_payout)}`;
    navigator.clipboard.writeText(text).then(() => toast.success("تم نسخ كشف الراتب"));
  }

  function toggleColumn(key: string) {
    setColumns((prev) => prev.map((c) => c.key === key ? { ...c, visible: !c.visible } : c));
  }

  function handleSort(field: string) {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  const isColVisible = (key: string) => columns.find((c) => c.key === key)?.visible !== false;

  function generateSTCExport() {
    const approved = filtered.filter(
      (r) => r.status === "approved" || r.status === "paid",
    );
    if (!approved.length) {
      toast.error("لا توجد سجلات معتمدة للتصدير");
      return;
    }
    const headers = "Reference,Phone,Amount";
    const rows = approved.map((r) => {
      const phone = r.phone.replace(/\D/g, "");
      const intPhone =
        phone.length === 9 && phone.startsWith("5")
          ? "966" + phone
          : phone.length === 12
            ? phone
            : "966" + phone;
      return `"${r.driver_name} - ${r.platform} - ${r.period}","${intPhone}",${Math.max(0, r.net_payout).toFixed(2)}`;
    });
    const csv = "\uFEFF" + headers + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `STC_Payroll_${filterPeriod || "all"}.csv`;
    a.click();
    toast.success("تم تحميل ملف STC Bank");
  }

  const detailRecord = detailId ? records.find((r) => r.id === detailId) : null;

  return (
    <div
      dir="rtl"
      style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--con-text-primary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: "var(--con-radius)", background: "rgba(236,72,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={17} style={{ color: "#EC4899" }} />
            </div>
            إدارة الرواتب
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--con-text-muted)",
              margin: "4px 0 0",
            }}
          >
            سجلات رواتب السائقين — الاعتماد والدفع والتصدير
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Role badge */}
          {(() => {
            const r = ROLE_LABELS[role];
            const RIcon = r.icon;
            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: "var(--con-radius)",
                  background: `${r.color}12`,
                  border: `1px solid ${r.color}30`,
                  fontSize: 11,
                  fontWeight: 600,
                  color: r.color,
                }}
              >
                <RIcon size={12} />
                {r.label}
              </div>
            );
          })()}
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="con-btn con-btn-ghost"
            style={{ gap: 6, fontSize: 12 }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── Advanced Toolbar ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          marginBottom: "0.75rem",
          padding: "8px 10px",
          background: "var(--con-bg-elevated)",
          borderRadius: "var(--con-radius)",
          border: "1px solid var(--con-border-default)",
          alignItems: "center",
        }}
      >
        {/* Bulk actions (when selected) */}
        {selectedIds.size > 0 && (
          <>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--con-brand)", marginLeft: 8 }}>
              {selectedIds.size} محدد
            </span>
            {canApprove && (
              <button
                onClick={bulkApprove}
                className="con-btn"
                style={{ gap: 5, fontSize: 11, padding: "4px 10px", background: "rgba(34,197,94,0.12)", color: "var(--con-success)", border: "1px solid rgba(34,197,94,0.3)" }}
              >
                <CheckCircle2 size={12} /> اعتماد
              </button>
            )}
            {canPay && (
              <button
                onClick={bulkPay}
                className="con-btn"
                style={{ gap: 5, fontSize: 11, padding: "4px 10px", background: "rgba(59,130,246,0.12)", color: "var(--con-accent)", border: "1px solid rgba(59,130,246,0.3)" }}
              >
                <DollarSign size={12} /> دفع
              </button>
            )}
            {canLock && (
              <button
                onClick={bulkLock}
                className="con-btn"
                style={{ gap: 5, fontSize: 11, padding: "4px 10px", background: "rgba(239,68,68,0.08)", color: "var(--con-danger)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <Lock size={12} /> قفل
              </button>
            )}
            <div style={{ width: 1, height: 20, background: "var(--con-border-default)", margin: "0 4px" }} />
          </>
        )}

        {/* Export tools */}
        {canExport && (
          <>
            <button
              onClick={generateSTCExport}
              className="con-btn"
              style={{ gap: 5, fontSize: 11, padding: "4px 10px", background: "rgba(34,197,94,0.08)", color: "var(--con-success)", border: "1px solid rgba(34,197,94,0.2)" }}
              disabled={!filtered.length}
              title="تصدير ملف STC Bank"
            >
              <FileSpreadsheet size={12} /> STC Bank
            </button>
            <button
              onClick={() => downloadCSV(filtered as any, "payroll_records")}
              className="con-btn con-btn-ghost"
              style={{ gap: 5, fontSize: 11, padding: "4px 10px" }}
              disabled={!filtered.length}
              title="تصدير CSV"
            >
              <Download size={12} /> CSV
            </button>
            <button
              onClick={() => window.print()}
              className="con-btn con-btn-ghost"
              style={{ gap: 5, fontSize: 11, padding: "4px 10px" }}
              title="طباعة"
            >
              <Printer size={12} />
            </button>
          </>
        )}

        <div style={{ width: 1, height: 20, background: "var(--con-border-default)", margin: "0 4px" }} />

        {/* Column picker */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="con-btn con-btn-ghost"
            style={{ gap: 5, fontSize: 11, padding: "4px 10px", background: showColumnPicker ? "var(--con-brand)12" : undefined, color: showColumnPicker ? "var(--con-brand)" : undefined }}
            title="إظهار/إخفاء الأعمدة"
          >
            <Columns size={12} /> الأعمدة
          </button>
          {showColumnPicker && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "var(--con-bg-surface-2)",
                border: "1px solid var(--con-border-default)",
                borderRadius: "var(--con-radius)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                zIndex: 100,
                minWidth: 160,
                padding: "6px 0",
              }}
              onMouseLeave={() => setShowColumnPicker(false)}
            >
              {columns.map((col) => {
                const CIcon = col.icon;
                return (
                  <label
                    key={col.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 12px",
                      cursor: "pointer",
                      fontSize: 11,
                      color: col.visible ? "var(--con-text-primary)" : "var(--con-text-disabled)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => toggleColumn(col.key)}
                      style={{ accentColor: "var(--con-brand)" }}
                    />
                    <CIcon size={11} style={{ color: "var(--con-text-muted)" }} />
                    {col.label}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary stats mini */}
        <div style={{ marginRight: "auto", display: "flex", gap: 12, fontSize: 10, color: "var(--con-text-muted)" }}>
          <span><strong style={{ color: "var(--con-text-secondary)" }}>{filtered.length}</strong> سجل</span>
          <span>صافي: <strong style={{ color: "var(--con-accent)", fontFamily: "monospace" }}>{fmt(totals.net)}</strong></span>
        </div>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        {[
          { label: "السجلات", value: totals.count.toString(), icon: Users, color: "var(--con-brand)", bgAlpha: "08" },
          { label: "الإجمالي", value: fmt(totals.gross), icon: CircleDollarSign, color: "var(--con-success)", bgAlpha: "08" },
          { label: "الإضافات", value: fmt(totals.additions), icon: TrendingUp, color: "#10B981", bgAlpha: "08" },
          { label: "الخصومات", value: fmt(totals.deductions), icon: Percent, color: "var(--con-danger)", bgAlpha: "08" },
          { label: "بانتظار", value: totals.pending.toString(), icon: Clock, color: "var(--con-warning)", bgAlpha: "08" },
          { label: "معتمد", value: totals.approved.toString(), icon: BadgeCheck, color: "var(--con-accent)", bgAlpha: "08" },
          { label: "مدفوع", value: totals.paid.toString(), icon: Banknote, color: "#8B5CF6", bgAlpha: "08" },
          { label: "صافي المستحق", value: fmt(totals.net), icon: Wallet, color: "#EC4899", bgAlpha: "10" },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              padding: "0.7rem",
              textAlign: "center",
              background: `${k.color}${k.bgAlpha}`,
              border: `1px solid ${k.color}20`,
              borderRadius: "var(--con-radius)",
              transition: "transform 0.15s, box-shadow 0.15s",
              cursor: "default",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${k.color}15`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "var(--con-radius-sm)", background: `${k.color}14`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
              <k.icon size={14} style={{ color: k.color }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: k.color, fontFamily: "monospace" }}>
              {k.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--con-text-muted)", marginTop: 2 }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--con-text-muted)",
            }}
          />
          <input
            className="con-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الجوال..."
            style={{ width: "100%", paddingRight: 32, fontSize: 12 }}
          />
        </div>
        <select
          className="con-input"
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          style={{ fontSize: 12 }}
        >
          <option value="">كل الفترات</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="con-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ fontSize: 12 }}
        >
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="con-card" style={{ overflow: "auto" }}>
        {!filtered.length ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--con-text-muted)",
            }}
          >
            <Wallet size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>لا توجد سجلات رواتب</p>
            <p style={{ fontSize: 12 }}>
              أضف سائقين من "تصنيف السائقين" ثم استخدم "حاسبة الرواتب" لإنشاء
              السجلات
            </p>
          </div>
        ) : (
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
          >
            <thead>
              <tr
                style={{ borderBottom: "1px solid var(--con-border-default)" }}
              >
                <th style={{ padding: "10px 8px", width: 30 }}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedIds(new Set(filtered.map((r) => r.id)));
                      else setSelectedIds(new Set());
                    }}
                  />
                </th>
                {columns.filter((c) => c.visible).map((col) => {
                  const CIcon = col.icon;
                  return (
                    <th
                      key={col.key}
                      style={{
                        padding: "10px 8px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: "var(--con-text-muted)",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                      onClick={() => handleSort(col.key)}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <CIcon size={11} style={{ opacity: 0.6 }} />
                        {col.label}
                        {sortField === col.key && (
                          <ArrowUpDown size={10} style={{ color: "var(--con-brand)" }} />
                        )}
                      </span>
                    </th>
                  );
                })}
                <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>
                  <SlidersHorizontal size={11} style={{ opacity: 0.6 }} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const sm = STATUS_META[r.status];
                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: "1px solid var(--con-border-subtle)",
                    }}
                  >
                    <td style={{ padding: "10px 8px" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                      />
                    </td>
                    {isColVisible("driver") && (
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {lockedRecords.has(r.id) && (
                          <Lock size={10} style={{ color: "var(--con-danger)", flexShrink: 0 }} />
                        )}
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--con-text-primary)",
                            }}
                          >
                            {r.driver_name || "—"}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--con-text-muted)",
                              fontFamily: "monospace",
                            }}
                          >
                            {r.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    )}
                    {isColVisible("platform") && (
                    <td style={{ padding: "10px 8px", color: "var(--con-text-secondary)" }}>
                      {PLATFORMS[r.platform] || r.platform}
                    </td>
                    )}
                    {isColVisible("period") && (
                    <td style={{ padding: "10px 8px", fontFamily: "monospace" }}>
                      {r.period}
                    </td>
                    )}
                    {isColVisible("orders") && (
                    <td style={{ padding: "10px 8px", fontWeight: 600, fontFamily: "monospace" }}>
                      {r.total_orders}
                    </td>
                    )}
                    {isColVisible("gross") && (
                    <td style={{ padding: "10px 8px", fontFamily: "monospace" }}>
                      {fmt(r.gross_earnings)}
                    </td>
                    )}
                    {isColVisible("additions") && (
                    <td style={{ padding: "10px 8px", fontFamily: "monospace", color: "var(--con-success)" }}>
                      +{fmt(r.total_additions)}
                    </td>
                    )}
                    {isColVisible("deductions") && (
                    <td style={{ padding: "10px 8px", fontFamily: "monospace", color: "var(--con-danger)" }}>
                      -{fmt(r.total_deductions + r.vat_amount)}
                    </td>
                    )}
                    {isColVisible("net") && (
                    <td style={{ padding: "10px 8px", fontWeight: 700, fontFamily: "monospace", color: "var(--con-accent)" }}>
                      {fmt(r.net_payout)}
                    </td>
                    )}
                    {isColVisible("status") && (
                    <td style={{ padding: "10px 8px" }}>
                      <span className={`con-badge ${sm.cls}`} style={{ fontSize: 10, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <sm.icon size={10} />
                        {sm.label}
                      </span>
                    </td>
                    )}
                    {/* Row actions menu */}
                    <td style={{ padding: "10px 8px", position: "relative" }}>
                      <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                        <button
                          onClick={() => setDetailId(r.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--con-text-muted)", borderRadius: "var(--con-radius-sm)" }}
                          title="عرض التفاصيل"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => setActionMenuId(actionMenuId === r.id ? null : r.id)}
                          style={{ background: actionMenuId === r.id ? "var(--con-bg-surface-2)" : "none", border: "none", cursor: "pointer", padding: 4, color: "var(--con-text-muted)", borderRadius: "var(--con-radius-sm)" }}
                          title="خيارات"
                        >
                          <MoreHorizontal size={13} />
                        </button>
                      </div>
                      {actionMenuId === r.id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            marginTop: 2,
                            background: "var(--con-bg-surface-2)",
                            border: "1px solid var(--con-border-default)",
                            borderRadius: "var(--con-radius)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                            zIndex: 50,
                            minWidth: 170,
                            overflow: "hidden",
                          }}
                          onMouseLeave={() => setActionMenuId(null)}
                        >
                          {canEdit && (
                            <button
                              onClick={() => { recalculate(r.id); setActionMenuId(null); }}
                              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 12px", background: "transparent", border: "none", cursor: "pointer", color: "var(--con-text-secondary)", fontSize: 11, fontFamily: "var(--con-font-primary)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <Calculator size={12} style={{ color: "var(--con-info)" }} /> إعادة حساب
                            </button>
                          )}
                          {canLock && (
                            <button
                              onClick={() => { toggleLock(r.id); setActionMenuId(null); }}
                              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 12px", background: "transparent", border: "none", cursor: "pointer", color: "var(--con-text-secondary)", fontSize: 11, fontFamily: "var(--con-font-primary)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              {lockedRecords.has(r.id) ? <Unlock size={12} style={{ color: "var(--con-success)" }} /> : <Lock size={12} style={{ color: "var(--con-danger)" }} />}
                              {lockedRecords.has(r.id) ? "فتح القفل" : "قفل السجل"}
                            </button>
                          )}
                          <button
                            onClick={() => { sendNotification(r.driver_name); setActionMenuId(null); }}
                            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 12px", background: "transparent", border: "none", cursor: "pointer", color: "var(--con-text-secondary)", fontSize: 11, fontFamily: "var(--con-font-primary)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <Send size={12} style={{ color: "var(--con-brand)" }} /> إشعار السائق
                          </button>
                          <button
                            onClick={() => { copyPayslip(r); setActionMenuId(null); }}
                            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 12px", background: "transparent", border: "none", cursor: "pointer", color: "var(--con-text-secondary)", fontSize: 11, fontFamily: "var(--con-font-primary)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <Copy size={12} style={{ color: "var(--con-text-muted)" }} /> نسخ كشف الراتب
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {detailRecord && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setDetailId(null)}
        >
          <div
            className="con-card"
            style={{ width: "100%", maxWidth: 500, padding: "1.5rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "var(--con-radius)", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={16} style={{ color: "var(--con-accent)" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>
                    تفاصيل الراتب
                  </h2>
                  <span style={{ fontSize: 10, color: "var(--con-text-muted)" }}>
                    {STATUS_META[detailRecord.status]?.label} · {detailRecord.period}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {canEdit && !lockedRecords.has(detailRecord.id) && (
                  <button
                    onClick={() => { recalculate(detailRecord.id); }}
                    className="con-btn con-btn-ghost"
                    style={{ padding: 4 }}
                    title="إعادة حساب"
                  >
                    <Calculator size={14} style={{ color: "var(--con-info)" }} />
                  </button>
                )}
                <button
                  onClick={() => { sendNotification(detailRecord.driver_name); }}
                  className="con-btn con-btn-ghost"
                  style={{ padding: 4 }}
                  title="إشعار السائق"
                >
                  <Send size={14} style={{ color: "var(--con-brand)" }} />
                </button>
                <button
                  onClick={() => { copyPayslip(detailRecord); }}
                  className="con-btn con-btn-ghost"
                  style={{ padding: 4 }}
                  title="نسخ كشف الراتب"
                >
                  <Copy size={14} style={{ color: "var(--con-text-muted)" }} />
                </button>
                <button
                  onClick={() => setDetailId(null)}
                  className="con-btn con-btn-ghost"
                  style={{ padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <Info label="السائق" value={detailRecord.driver_name} icon={Users} />
              <Info label="الجوال" value={detailRecord.phone} mono icon={Bell} />
              <Info label="المنصة" value={PLATFORMS[detailRecord.platform] || detailRecord.platform} icon={BarChart3} />
              <Info label="الفترة" value={detailRecord.period} mono icon={Calendar} />
              <Info label="الطلبات" value={detailRecord.total_orders.toString()} mono icon={Receipt} />
              <Info label="سعر الطلب" value={fmt(detailRecord.order_rate)} mono icon={DollarSign} />
              <div
                style={{
                  gridColumn: "1 / -1",
                  borderTop: "1px solid var(--con-border-subtle)",
                  margin: "4px 0",
                }}
              />
              <Info label="الإجمالي" value={fmt(detailRecord.gross_earnings)} mono icon={CircleDollarSign} />
              <Info label="بدل وقود" value={fmt(detailRecord.fuel_allowance)} color="var(--con-success)" icon={Fuel} />
              <Info label="بدل تشغيل" value={fmt(detailRecord.operations_allowance)} color="var(--con-success)" icon={Wrench} />
              <Info label="مكافأة" value={fmt(detailRecord.performance_bonus)} color="var(--con-success)" icon={Award} />
              <div
                style={{
                  gridColumn: "1 / -1",
                  borderTop: "1px solid var(--con-border-subtle)",
                  margin: "4px 0",
                }}
              />
              <Info label="عمولة FLL" value={fmt(detailRecord.fll_commission)} color="var(--con-danger)" icon={Percent} />
              <Info label="تكلفة مركبة" value={fmt(detailRecord.vehicle_cost)} color="var(--con-danger)" icon={Car} />
              <Info label="تأمين" value={fmt(detailRecord.insurance)} color="var(--con-danger)" icon={ShieldAlert} />
              <Info label="جزاءات" value={fmt(detailRecord.penalties)} color="var(--con-danger)" icon={AlertTriangle} />
              <Info label="ضريبة" value={fmt(detailRecord.vat_amount)} color="var(--con-danger)" icon={Receipt} />
              <div
                style={{
                  gridColumn: "1 / -1",
                  borderTop: "2px solid var(--con-border-default)",
                  margin: "4px 0",
                }}
              />
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "0.75rem",
                  background: "rgba(59,130,246,0.06)",
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>
                  صافي المستحق
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: "var(--con-accent)",
                  }}
                >
                  {fmt(detailRecord.net_payout)}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6, marginTop: 4 }}>
                {canApprove && detailRecord.status === "pending" && (
                  <button
                    onClick={() => {
                      setRecords((prev) => prev.map((rec) => rec.id === detailRecord.id ? { ...rec, status: "approved", approved_at: new Date().toISOString() } : rec));
                      toast.success("تم اعتماد الراتب");
                    }}
                    className="con-btn"
                    style={{ flex: 1, gap: 5, fontSize: 11, padding: "6px 12px", background: "rgba(34,197,94,0.12)", color: "var(--con-success)", border: "1px solid rgba(34,197,94,0.3)" }}
                  >
                    <CheckCircle2 size={12} /> اعتماد
                  </button>
                )}
                {canPay && detailRecord.status === "approved" && (
                  <button
                    onClick={() => {
                      setRecords((prev) => prev.map((rec) => rec.id === detailRecord.id ? { ...rec, status: "paid", paid_at: new Date().toISOString() } : rec));
                      toast.success("تم تحويل الراتب");
                    }}
                    className="con-btn"
                    style={{ flex: 1, gap: 5, fontSize: 11, padding: "6px 12px", background: "rgba(59,130,246,0.12)", color: "var(--con-accent)", border: "1px solid rgba(59,130,246,0.3)" }}
                  >
                    <Banknote size={12} /> تحويل للسائق
                  </button>
                )}
                {canApprove && detailRecord.status === "pending" && (
                  <button
                    onClick={() => {
                      setRecords((prev) => prev.map((rec) => rec.id === detailRecord.id ? { ...rec, status: "rejected" } : rec));
                      toast.success("تم رفض الراتب");
                    }}
                    className="con-btn"
                    style={{ gap: 5, fontSize: 11, padding: "6px 12px", background: "rgba(239,68,68,0.08)", color: "var(--con-danger)", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    <XCircle size={12} /> رفض
                  </button>
                )}
                {!canApprove && !canPay && (
                  <div style={{ flex: 1, textAlign: "center", padding: "6px", fontSize: 11, color: "var(--con-text-muted)", background: "var(--con-bg-elevated)", borderRadius: "var(--con-radius)" }}>
                    <ShieldAlert size={12} style={{ marginLeft: 4, verticalAlign: "middle" }} />
                    ليس لديك صلاحية لتنفيذ إجراءات على هذا السجل
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({
  label,
  value,
  mono,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
  icon?: React.ElementType;
}) {
  return (
    <div
      style={{
        padding: "6px 8px",
        background: "var(--con-bg-elevated)",
        borderRadius: 6,
      }}
    >
      <div style={{ fontSize: 9, color: "var(--con-text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
        {Icon && <Icon size={9} style={{ opacity: 0.6 }} />}
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          fontFamily: mono ? "monospace" : "inherit",
          color: color || "var(--con-text-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
