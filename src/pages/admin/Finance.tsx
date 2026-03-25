/**
 * صفحة المالية والرواتب - لوحة إدارة فيرست لاين
 * Enterprise Finance Console — payouts, approvals, deductions
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DollarSign, CheckCircle2, Clock, XCircle, Search,
  Download, Eye, Wallet, RefreshCw, Plus,
  Bell, BellRing, TrendingDown, X, ChevronDown,
  Landmark, Receipt, AlertCircle,
} from "lucide-react";

type PaymentStatus = "pending" | "approved" | "paid" | "rejected";

interface FinanceRecord {
  id: string;
  courier_id: string;
  courier_name?: string;
  period_start: string;
  period_end: string;
  gross_revenue: number;
  platform_fees: number;
  vehicle_deductions: number;
  absence_deductions: number;
  maintenance_deductions: number;
  insurance_deductions: number;
  other_deductions: number;
  net_payout: number;
  payment_status: PaymentStatus;
  approved_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
}

interface FinanceStats {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  pendingCount: number;
  approvedCount: number;
  paidCount: number;
}

const STATUS_META: Record<PaymentStatus, {
  label: string;
  badgeClass: string;
  icon: React.ElementType;
}> = {
  pending:  { label: "في الانتظار", badgeClass: "con-badge-warning", icon: Clock },
  approved: { label: "موافق عليه",  badgeClass: "con-badge-info",    icon: CheckCircle2 },
  paid:     { label: "مدفوع",       badgeClass: "con-badge-success",  icon: Wallet },
  rejected: { label: "مرفوض",       badgeClass: "con-badge-danger",   icon: XCircle },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string;
  count: number;
  countLabel: string;
  icon: React.ElementType;
  accent: "warning" | "info" | "success" | "brand";
  loading?: boolean;
}

function KpiCard({ label, value, count, countLabel, icon: Icon, accent, loading }: KpiProps) {
  const accentMap = {
    warning: { icon: "var(--con-warning)", subtle: "var(--con-warning-subtle)", border: "rgba(217,119,6,0.25)" },
    info:    { icon: "var(--con-info)",    subtle: "var(--con-info-subtle)",    border: "rgba(14,165,233,0.25)" },
    success: { icon: "var(--con-success)", subtle: "var(--con-success-subtle)", border: "rgba(22,163,74,0.25)" },
    brand:   { icon: "var(--con-brand)",   subtle: "rgba(59,130,246,0.12)",     border: "rgba(59,130,246,0.25)" },
  }[accent];

  if (loading) {
    return (
      <div className="con-card" style={{ borderColor: accentMap.border }}>
        <div className="con-skeleton" style={{ height: 14, width: "60%", marginBottom: 12 }} />
        <div className="con-skeleton" style={{ height: 24, width: "80%", marginBottom: 8 }} />
        <div className="con-skeleton" style={{ height: 12, width: "40%" }} />
      </div>
    );
  }

  return (
    <div className="con-kpi-card" style={{ borderColor: accentMap.border }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 500 }}>
          {label}
        </span>
        <div style={{
          background: accentMap.subtle,
          borderRadius: 8,
          padding: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon size={15} style={{ color: accentMap.icon }} />
        </div>
      </div>
      <div className="con-kpi-value">{value}</div>
      <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 4 }}>
        {count} {countLabel}
      </div>
    </div>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
interface DetailModalProps {
  record: FinanceRecord;
  updating: boolean;
  sendingAlert: boolean;
  alertSent: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
  onSendAlert: (record: FinanceRecord) => void;
}

function DetailModal({
  record, updating, sendingAlert, alertSent,
  onClose, onUpdateStatus, onSendAlert,
}: DetailModalProps) {
  const totalDeductions =
    record.platform_fees + record.vehicle_deductions + record.absence_deductions +
    record.maintenance_deductions + record.insurance_deductions + record.other_deductions;

  const meta = STATUS_META[record.payment_status] ?? STATUS_META.pending;
  const StatusIcon = meta.icon;

  const deductionRows = [
    { label: "رسوم المنصة",  value: record.platform_fees },
    { label: "خصم السيارة",  value: record.vehicle_deductions },
    { label: "خصم الغياب",   value: record.absence_deductions },
    { label: "خصم الصيانة",  value: record.maintenance_deductions },
    { label: "خصم التأمين",  value: record.insurance_deductions },
    { label: "خصومات أخرى",  value: record.other_deductions },
  ].filter(d => d.value > 0);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        dir="rtl"
        style={{
          background: "var(--con-bg-elevated)",
          border: "1px solid var(--con-border-strong)",
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid var(--con-border-default)",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36,
                background: "var(--con-brand-subtle)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700,
                color: "var(--con-brand)",
                fontFamily: "var(--con-font-primary)",
              }}>
                {record.courier_name?.charAt(0) ?? "؟"}
              </div>
              <div>
                <div style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)" }}>
                  {record.courier_name}
                </div>
                <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 2 }}>
                  {formatDate(record.period_start)} — {formatDate(record.period_end)}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className={`con-badge con-badge-sm ${meta.badgeClass}`}>
              <StatusIcon size={10} />
              {meta.label}
            </span>
            <button className="con-btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Revenue row */}
          <div style={{
            background: "rgba(22,163,74,0.08)",
            border: "1px solid rgba(22,163,74,0.2)",
            borderRadius: 8,
            padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>الإيراد الإجمالي</span>
            <span style={{
              fontFamily: "var(--con-font-mono)", fontSize: 16, fontWeight: 700,
              color: "var(--con-success)",
            }}>
              {formatCurrency(record.gross_revenue)}
            </span>
          </div>

          {/* Deductions */}
          {deductionRows.length > 0 && (
            <div style={{
              background: "var(--con-bg-surface-2)",
              border: "1px solid var(--con-border-default)",
              borderRadius: 8,
              padding: "12px 16px",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
                fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                <TrendingDown size={11} style={{ color: "var(--con-danger)" }} />
                الخصومات
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {deductionRows.map(d => (
                  <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--con-text-table)", color: "var(--con-text-secondary)" }}>{d.label}</span>
                    <span style={{
                      fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-table)",
                      color: "var(--con-danger)",
                    }}>
                      -{formatCurrency(d.value)}
                    </span>
                  </div>
                ))}
                <div style={{
                  borderTop: "1px solid var(--con-border-default)",
                  paddingTop: 7, marginTop: 3,
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)", fontWeight: 600 }}>
                    إجمالي الخصومات
                  </span>
                  <span style={{
                    fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-body)",
                    color: "var(--con-danger)", fontWeight: 700,
                  }}>
                    -{formatCurrency(totalDeductions)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Net payout */}
          <div style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.25)",
            borderRadius: 8,
            padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-primary)", fontWeight: 600 }}>
              صافي المستحق
            </span>
            <span style={{
              fontFamily: "var(--con-font-mono)", fontSize: 20, fontWeight: 700,
              color: "var(--con-brand)",
            }}>
              {formatCurrency(record.net_payout)}
            </span>
          </div>

          {/* Notes */}
          {record.notes && (
            <div style={{
              background: "var(--con-bg-surface-2)",
              border: "1px solid var(--con-border-default)",
              borderRadius: 8, padding: "10px 14px",
            }}>
              <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 4, fontWeight: 600 }}>
                ملاحظات
              </div>
              <div style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>
                {record.notes}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            {record.payment_status === "pending" && (
              <>
                <button
                  onClick={() => { onUpdateStatus(record.id, "approved"); onClose(); }}
                  disabled={updating}
                  className="con-btn-primary"
                  style={{ flex: 1 }}
                >
                  <CheckCircle2 size={14} />
                  موافقة
                </button>
                <button
                  onClick={() => { onUpdateStatus(record.id, "rejected"); onClose(); }}
                  disabled={updating}
                  className="con-btn-danger"
                >
                  <XCircle size={14} />
                  رفض
                </button>
              </>
            )}
            {record.payment_status === "approved" && (
              <button
                onClick={() => { onUpdateStatus(record.id, "paid"); onClose(); }}
                disabled={updating}
                className="con-btn-primary"
                style={{ flex: 1 }}
              >
                <Landmark size={14} />
                تأكيد الدفع
              </button>
            )}
            <button
              onClick={() => onSendAlert(record)}
              disabled={sendingAlert}
              className="con-btn-ghost"
              title="إرسال تنبيه خطأ الحساب البنكي"
              style={{
                borderColor: alertSent ? "var(--con-success)" : "rgba(220,38,38,0.35)",
                color: alertSent ? "var(--con-success)" : "var(--con-danger)",
              }}
            >
              {alertSent ? <CheckCircle2 size={14} /> : sendingAlert ? <Bell size={14} style={{ animation: "pulse 1s infinite" }} /> : <BellRing size={14} />}
              {alertSent ? "تم الإرسال" : "تنبيه بنك"}
            </button>
            <button onClick={onClose} className="con-btn-ghost">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Finance() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [stats, setStats] = useState<FinanceStats>({
    totalPending: 0, totalApproved: 0, totalPaid: 0,
    pendingCount: 0, approvedCount: 0, paidCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [sendingAlert, setSendingAlert] = useState<string | null>(null);
  const [alertSent, setAlertSent] = useState<Set<string>>(new Set());

  function exportFinanceCsv() {
    const headers = ["courier", "period_start", "period_end", "gross_revenue", "net_payout", "payment_status"];
    const rows = filtered.map((r) => [r.courier_name || "", r.period_start, r.period_end, r.gross_revenue, r.net_payout, r.payment_status].join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance-records.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRecord, setNewRecord] = useState({ courier_name: "", net: "1000", gross: "1000" });
  const [createError, setCreateError] = useState("");

  async function createFinanceRecord() {
    if (!supabase) return;
    setCreateError("");
    const { data: courier } = await supabase
      .from("couriers")
      .select("id, full_name")
      .eq("full_name", newRecord.courier_name.trim())
      .limit(1)
      .maybeSingle();
    if (!courier) {
      setCreateError("لم يتم العثور على المندوب. استخدم الاسم كما هو مسجل بالنظام.");
      return;
    }
    const now = new Date().toISOString();
    const { error } = await supabase.from("finance").insert({
      courier_id: courier.id,
      period_start: now,
      period_end: now,
      gross_revenue: Number(newRecord.gross) || 0,
      platform_fees: 0,
      vehicle_deductions: 0,
      absence_deductions: 0,
      maintenance_deductions: 0,
      insurance_deductions: 0,
      other_deductions: 0,
      net_payout: Number(newRecord.net) || 0,
      payment_status: "pending",
      notes: "تمت الإضافة من لوحة الإدارة",
    });
    if (error) {
      setCreateError("تعذر إنشاء السجل المالي");
      toast.error("تعذر إنشاء السجل المالي");
      return;
    }
    toast.success("تم إنشاء السجل المالي بنجاح");
    setShowCreateModal(false);
    setNewRecord({ courier_name: "", net: "1000", gross: "1000" });
    await fetchFinanceData();
  }

  useEffect(() => { fetchFinanceData(); }, []);

  async function fetchFinanceData() {
    setLoading(true);
    try {
      const { data: finance } = await supabase
        .from("finance")
        .select(`*, couriers ( full_name )`)
        .order("created_at", { ascending: false });

      if (finance) {
        const mapped: FinanceRecord[] = finance.map((r: any) => ({
          ...r,
          courier_name: r.couriers?.full_name || "غير معروف",
        }));
        setRecords(mapped);

        const pending  = mapped.filter(r => r.payment_status === "pending");
        const approved = mapped.filter(r => r.payment_status === "approved");
        const paid     = mapped.filter(r => r.payment_status === "paid");

        setStats({
          totalPending:  pending.reduce((s, r)  => s + r.net_payout, 0),
          totalApproved: approved.reduce((s, r) => s + r.net_payout, 0),
          totalPaid:     paid.reduce((s, r)     => s + r.net_payout, 0),
          pendingCount:  pending.length,
          approvedCount: approved.length,
          paidCount:     paid.length,
        });
      }
    } catch (err) {
      console.error("خطأ في جلب بيانات المالية:", err);
    } finally {
      setLoading(false);
    }
  }

  async function sendBankAlert(record: FinanceRecord) {
    if (!record.courier_id) return;
    setSendingAlert(record.id);
    try {
      const { error } = await supabase.from("driver_notifications").insert({
        driver_id: record.courier_id,
        title: "تنبيه: مشكلة في الحساب البنكي",
        message: `الحساب البنكي المسجل لديك غير صحيح أو غير فعّال. يرجى مراجعة الإدارة أو التواصل عبر: support@fll.sa`,
        type: "bank_error",
        read: false,
      });
      if (!error) {
        toast.success("تم إرسال تنبيه الحساب البنكي");
        setAlertSent(prev => new Set(prev).add(record.id));
        setTimeout(() => {
          setAlertSent(prev => { const n = new Set(prev); n.delete(record.id); return n; });
        }, 3000);
      } else {
        toast.error("فشل إرسال التنبيه");
      }
    } catch (err) {
      console.error("خطأ في إرسال التنبيه:", err);
      toast.error("فشل إرسال التنبيه");
    } finally {
      setSendingAlert(null);
    }
  }

  async function updateStatus(id: string, newStatus: PaymentStatus) {
    setUpdating(id);
    try {
      const updates: any = { payment_status: newStatus };
      if (newStatus === "approved") updates.approved_at = new Date().toISOString();
      if (newStatus === "paid")     updates.paid_at     = new Date().toISOString();
      const { error } = await supabase.from("finance").update(updates).eq("id", id);
      if (!error) {
        const msgs: Record<string, string> = { approved: "تم اعتماد الدفعة بنجاح", paid: "تم تأكيد الدفع بنجاح", rejected: "تم رفض الدفعة" };
        toast.success(msgs[newStatus] ?? "تم تحديث الحالة");
        await fetchFinanceData();
        if (selectedRecord?.id === id) {
          setSelectedRecord(prev => prev ? { ...prev, payment_status: newStatus } : null);
        }
      } else {
        toast.error("حدث خطأ أثناء تحديث الحالة");
      }
    } finally {
      setUpdating(null);
    }
  }

  const filtered = records.filter(r => {
    const matchName   = r.courier_name?.includes(search) || search === "";
    const matchStatus = statusFilter === "all" || r.payment_status === statusFilter;
    return matchName && matchStatus;
  });

  const totalAll = stats.totalPending + stats.totalApproved + stats.totalPaid;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: "7px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Receipt size={18} style={{ color: "var(--con-brand)" }} />
            </div>
            <h1 style={{
              fontSize: "var(--con-text-page-title)", fontWeight: 700,
              color: "var(--con-text-primary)", margin: 0,
              fontFamily: "var(--con-font-primary)",
            }}>
              المالية والرواتب
            </h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>
            إدارة مستحقات المناديب والمدفوعات
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="con-btn-ghost" onClick={fetchFinanceData} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            تحديث
          </button>
          <button className="con-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} />
            سجل جديد
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiCard
          label="في الانتظار"
          value={formatCurrency(stats.totalPending)}
          count={stats.pendingCount}
          countLabel="سجل"
          icon={Clock}
          accent="warning"
          loading={loading}
        />
        <KpiCard
          label="موافق عليه"
          value={formatCurrency(stats.totalApproved)}
          count={stats.approvedCount}
          countLabel="سجل"
          icon={CheckCircle2}
          accent="info"
          loading={loading}
        />
        <KpiCard
          label="مدفوع"
          value={formatCurrency(stats.totalPaid)}
          count={stats.paidCount}
          countLabel="سجل"
          icon={Wallet}
          accent="success"
          loading={loading}
        />
        <KpiCard
          label="إجمالي الفترة"
          value={formatCurrency(totalAll)}
          count={records.length}
          countLabel="سجل إجمالي"
          icon={DollarSign}
          accent="brand"
          loading={loading}
        />
      </div>

      {/* Toolbar */}
      <div className="con-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={14} style={{
            position: "absolute", insetInlineEnd: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--con-text-muted)", pointerEvents: "none",
          }} />
          <input
            type="text"
            placeholder="ابحث عن مندوب..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="con-input"
            style={{ paddingInlineEnd: 32, width: "100%" }}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {(["all", "pending", "approved", "paid", "rejected"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: "var(--con-text-caption)",
                fontWeight: 500,
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s",
                background: statusFilter === s ? "var(--con-brand)" : "transparent",
                borderColor: statusFilter === s ? "var(--con-brand)" : "var(--con-border-strong)",
                color: statusFilter === s ? "#fff" : "var(--con-text-muted)",
              }}
            >
              {s === "all" ? "الكل" : STATUS_META[s].label}
            </button>
          ))}
        </div>

        {/* Export */}
        <button className="con-btn-ghost" style={{ marginInlineStart: "auto" }} onClick={exportFinanceCsv}>
          <Download size={14} />
          تصدير
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10,
        overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: "40px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="con-skeleton" style={{ height: 44, borderRadius: 6 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="con-empty">
            <AlertCircle size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
            <div>لا توجد سجلات مالية</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead>
                <tr>
                  <th>المندوب</th>
                  <th>الفترة</th>
                  <th>الإيراد الإجمالي</th>
                  <th>الخصومات</th>
                  <th>صافي الراتب</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => {
                  const totalDeductions =
                    record.platform_fees + record.vehicle_deductions + record.absence_deductions +
                    record.maintenance_deductions + record.insurance_deductions + record.other_deductions;

                  const meta = STATUS_META[record.payment_status] ?? STATUS_META.pending;
                  const StatusIcon = meta.icon;

                  return (
                    <tr key={record.id}>
                      {/* Courier */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 28, height: 28,
                            background: "var(--con-brand-subtle)",
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700,
                            color: "var(--con-brand)",
                            flexShrink: 0,
                          }}>
                            {record.courier_name?.charAt(0) ?? "؟"}
                          </div>
                          <span style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>
                            {record.courier_name}
                          </span>
                        </div>
                      </td>

                      {/* Period */}
                      <td>
                        <div style={{ color: "var(--con-text-secondary)" }}>{formatDate(record.period_start)}</div>
                        <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 2 }}>
                          حتى {formatDate(record.period_end)}
                        </div>
                      </td>

                      {/* Revenue */}
                      <td>
                        <span style={{
                          fontFamily: "var(--con-font-mono)",
                          color: "var(--con-success)", fontWeight: 600,
                        }}>
                          {formatCurrency(record.gross_revenue)}
                        </span>
                      </td>

                      {/* Deductions */}
                      <td>
                        <span style={{
                          fontFamily: "var(--con-font-mono)",
                          color: "var(--con-danger)", fontWeight: 600,
                        }}>
                          -{formatCurrency(totalDeductions)}
                        </span>
                      </td>

                      {/* Net payout */}
                      <td>
                        <span style={{
                          fontFamily: "var(--con-font-mono)",
                          fontSize: 13, fontWeight: 700,
                          color: "var(--con-text-primary)",
                        }}>
                          {formatCurrency(record.net_payout)}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`con-badge con-badge-sm ${meta.badgeClass}`}>
                          <StatusIcon size={10} />
                          {meta.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="con-btn-ghost"
                            style={{ padding: "4px 8px" }}
                            title="عرض التفاصيل"
                          >
                            <Eye size={13} />
                          </button>
                          {record.payment_status === "pending" && (
                            <button
                              onClick={() => updateStatus(record.id, "approved")}
                              disabled={updating === record.id}
                              style={{
                                padding: "3px 10px",
                                borderRadius: 5,
                                fontSize: 11, fontWeight: 600,
                                border: "1px solid rgba(14,165,233,0.35)",
                                background: "rgba(14,165,233,0.08)",
                                color: "var(--con-info)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                opacity: updating === record.id ? 0.5 : 1,
                              }}
                            >
                              {updating === record.id ? "..." : "موافقة"}
                            </button>
                          )}
                          {record.payment_status === "approved" && (
                            <button
                              onClick={() => updateStatus(record.id, "paid")}
                              disabled={updating === record.id}
                              style={{
                                padding: "3px 10px",
                                borderRadius: 5,
                                fontSize: 11, fontWeight: 600,
                                border: "1px solid rgba(22,163,74,0.35)",
                                background: "rgba(22,163,74,0.08)",
                                color: "var(--con-success)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                opacity: updating === record.id ? 0.5 : 1,
                              }}
                            >
                              {updating === record.id ? "..." : "تأكيد الدفع"}
                            </button>
                          )}
                          <button
                            onClick={() => sendBankAlert(record)}
                            disabled={sendingAlert === record.id}
                            title="إرسال تنبيه خطأ الحساب البنكي"
                            style={{
                              padding: "4px 8px",
                              borderRadius: 5,
                              border: "1px solid",
                              background: "transparent",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              opacity: sendingAlert === record.id ? 0.5 : 1,
                              borderColor: alertSent.has(record.id) ? "rgba(22,163,74,0.35)" : "rgba(220,38,38,0.25)",
                              color: alertSent.has(record.id) ? "var(--con-success)" : "var(--con-danger)",
                            }}
                          >
                            {alertSent.has(record.id)
                              ? <CheckCircle2 size={13} />
                              : sendingAlert === record.id
                              ? <Bell size={13} />
                              : <BellRing size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table footer */}
            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid var(--con-border-default)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                {filtered.length} سجل
                {statusFilter !== "all" && ` — تصفية: ${STATUS_META[statusFilter].label}`}
              </span>
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                إجمالي الصافي:{" "}
                <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>
                  {formatCurrency(filtered.reduce((s, r) => s + r.net_payout, 0))}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <DetailModal
          record={selectedRecord}
          updating={updating === selectedRecord.id}
          sendingAlert={sendingAlert === selectedRecord.id}
          alertSent={alertSent.has(selectedRecord.id)}
          onClose={() => setSelectedRecord(null)}
          onUpdateStatus={updateStatus}
          onSendAlert={sendBankAlert}
        />
      )}

      {/* Create Finance Record Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div dir="rtl" style={{ background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-strong)", borderRadius: 12, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--con-border-default)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>إنشاء سجل مالي</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "transparent", border: "none", color: "var(--con-text-muted)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 4, display: "block" }}>اسم المندوب *</label>
                <input className="con-input" value={newRecord.courier_name} onChange={(e) => setNewRecord((p) => ({ ...p, courier_name: e.target.value }))} placeholder="الاسم كما هو مسجل بالنظام" style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 4, display: "block" }}>صافي المستحق (ر.س)</label>
                <input className="con-input" type="number" value={newRecord.net} onChange={(e) => setNewRecord((p) => ({ ...p, net: e.target.value }))} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 4, display: "block" }}>الإيراد الإجمالي (ر.س)</label>
                <input className="con-input" type="number" value={newRecord.gross} onChange={(e) => setNewRecord((p) => ({ ...p, gross: e.target.value }))} style={{ width: "100%" }} />
              </div>
              {createError && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--con-danger-subtle)", border: "1px solid var(--con-danger)", borderRadius: 8, color: "var(--con-danger)", fontSize: 13 }}>
                  <AlertCircle size={14} /> {createError}
                </div>
              )}
              <button className="con-btn-primary" onClick={createFinanceRecord} disabled={!newRecord.courier_name.trim()} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
                <Plus size={14} /> إنشاء السجل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
