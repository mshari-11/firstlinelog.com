/**
 * صفحة إدارة المناديب — Enterprise Courier Management Console
 * Includes:
 *   - Couriers list tab
 *   - Registration Applications tab (approve / reject / view)
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users, Plus, Search, MoreVertical,
  CheckCircle2, XCircle, Clock, MapPin,
  Star, Package, Bike, Truck,
  ClipboardList, Eye, ThumbsUp, ThumbsDown,
  RefreshCw, AlertTriangle,
  Loader2, FileText, X,
} from "lucide-react";

interface Courier {
  id: string;
  full_name: string;
  phone: string;
  status: "active" | "inactive" | "on_delivery" | "pending";
  city?: string;
  rating?: number;
  total_orders?: number;
  vehicle_type?: string;
  created_at: string;
}

interface DriverApplication {
  id: string;
  app_ref: string;
  full_name: string;
  national_id: string;
  phone: string;
  email: string;
  city: string;
  nationality: string;
  platform_app?: string;
  contract_type: string;
  bank_name?: string;
  iban?: string;
  has_vehicle: boolean;
  vehicle_type?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  status: "pending" | "under_review" | "approved" | "rejected" | "info_required";
  liveness_score?: number;
  email_verified: boolean;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

type AdminTab = "couriers" | "applications";

const statusConfig: Record<string, { label: string; cls: string }> = {
  active:      { label: "نشط",          cls: "con-badge con-badge-success" },
  inactive:    { label: "غير نشط",      cls: "con-badge con-badge-muted"   },
  on_delivery: { label: "في التوصيل",   cls: "con-badge con-badge-info"    },
  pending:     { label: "قيد المراجعة", cls: "con-badge con-badge-warning"  },
};

const kpiConfig = [
  { key: "total",      label: "إجمالي المناديب",    icon: Users,        variant: "brand"   },
  { key: "active",     label: "نشطون الآن",          icon: CheckCircle2, variant: "success" },
  { key: "onDelivery", label: "في التوصيل",          icon: Bike,         variant: "info"    },
  { key: "pending",    label: "قيد المراجعة",        icon: Clock,        variant: "warning" },
] as const;

const mockCouriers: Courier[] = [
  { id: "1", full_name: "أحمد محمد السالم",  phone: "0501234567", status: "active",      city: "الرياض", rating: 4.8, total_orders: 312, vehicle_type: "دراجة", created_at: "2024-01-15" },
  { id: "2", full_name: "خالد العمري",       phone: "0557654321", status: "on_delivery", city: "جدة",    rating: 4.5, total_orders: 198, vehicle_type: "سيارة", created_at: "2024-02-20" },
  { id: "3", full_name: "فهد الغامدي",       phone: "0509876543", status: "active",      city: "الرياض", rating: 4.9, total_orders: 445, vehicle_type: "دراجة", created_at: "2023-11-10" },
  { id: "4", full_name: "سعد الزهراني",      phone: "0551112233", status: "inactive",    city: "الدمام", rating: 3.9, total_orders: 87,  vehicle_type: "دراجة", created_at: "2024-03-05" },
  { id: "5", full_name: "عمر الشمري",        phone: "0503334455", status: "pending",     city: "الرياض", rating: undefined, total_orders: 0, vehicle_type: "سيارة", created_at: "2025-02-01" },
  { id: "6", full_name: "محمد القحطاني",     phone: "0556667788", status: "active",      city: "مكة",   rating: 4.7, total_orders: 234, vehicle_type: "دراجة", created_at: "2024-04-18" },
];

function initials(name: string) {
  return name.trim().charAt(0);
}

// ─── Application status config ─────────────────────────────────────────────────
const appStatusConfig: Record<string, { label: string; cls: string }> = {
  pending:       { label: "قيد الانتظار",    cls: "con-badge con-badge-warning" },
  under_review:  { label: "تحت المراجعة",   cls: "con-badge con-badge-info"    },
  approved:      { label: "مقبول",           cls: "con-badge con-badge-success" },
  rejected:      { label: "مرفوض",          cls: "con-badge con-badge-danger"  },
  info_required: { label: "معلومات مطلوبة", cls: "con-badge con-badge-warning" },
};

// ─── Mock applications (shown when Supabase has no data) ──────────────────────
const mockApplications: DriverApplication[] = [
  {
    id: "a1", app_ref: "APP-K3M9P2", full_name: "عبدالله محمد الحربي",
    national_id: "1090123456", phone: "0501234567", email: "a.harbi@example.com",
    city: "الرياض", nationality: "سعودي", platform_app: "جاهز",
    contract_type: "full_time", bank_name: "البنك الأهلي", iban: "SA0380000000608010167519",
    has_vehicle: true, vehicle_type: "bike", vehicle_brand: "هوندا",
    vehicle_model: "CB150", vehicle_plate: "أ ب ج 1234",
    status: "pending", liveness_score: 91, email_verified: true,
    created_at: "2026-03-08T10:22:00Z", updated_at: "2026-03-08T10:22:00Z",
  },
  {
    id: "a2", app_ref: "APP-R7T2X5", full_name: "فيصل العتيبي",
    national_id: "1078654321", phone: "0557654321", email: "f.otaibi@example.com",
    city: "جدة", nationality: "سعودي", platform_app: "هنقرستيشن",
    contract_type: "freelance", bank_name: "بنك الراجحي", iban: "SA4420000001234567891234",
    has_vehicle: false, status: "under_review",
    liveness_score: 88, email_verified: true,
    created_at: "2026-03-09T14:05:00Z", updated_at: "2026-03-10T09:30:00Z",
  },
  {
    id: "a3", app_ref: "APP-M1B8Q3", full_name: "سلطان القحطاني",
    national_id: "1055678901", phone: "0509876543", email: "s.qahtani@example.com",
    city: "الدمام", nationality: "سعودي", platform_app: "طلبات",
    contract_type: "part_time", bank_name: "بنك الرياض", iban: "SA2005000068210636400800",
    has_vehicle: true, vehicle_type: "car", vehicle_brand: "تويوتا",
    vehicle_model: "كامري", vehicle_plate: "ص ر م 7890",
    status: "approved", liveness_score: 95, email_verified: true,
    created_at: "2026-03-05T08:10:00Z", updated_at: "2026-03-07T11:45:00Z",
  },
];

// ─── Application detail modal ─────────────────────────────────────────────────
function AppDetailModal({
  app,
  onClose,
  onApprove,
  onReject,
}: {
  app: DriverApplication;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject:  (id: string, reason: string) => void;
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const cfg = appStatusConfig[app.status] ?? appStatusConfig.pending;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--con-bg-default)", border: "1px solid var(--con-border-default)",
          borderRadius: "var(--con-radius-lg)", padding: "1.5rem",
          width: "100%", maxWidth: "520px", maxHeight: "80vh", overflowY: "auto",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "var(--con-text-heading)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>
              {app.full_name}
            </h3>
            <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "12px", color: "var(--con-text-muted)" }}>
              {app.app_ref}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className={cfg.cls}>{cfg.label}</span>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)", padding: "0.25rem" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1rem" }}>
          {[
            { label: "رقم الهوية",   value: app.national_id },
            { label: "رقم الجوال",   value: app.phone },
            { label: "البريد",        value: app.email },
            { label: "المدينة",       value: app.city },
            { label: "الجنسية",       value: app.nationality },
            { label: "التطبيق",       value: app.platform_app ?? "—" },
            { label: "التعاقد",       value: app.contract_type },
            { label: "البنك",         value: app.bank_name ?? "—" },
            { label: "IBAN",          value: app.iban ?? "—" },
            { label: "التحقق الحيوي", value: app.liveness_score ? `${app.liveness_score}%` : "—" },
            { label: "البريد محقق",   value: app.email_verified ? "✓ نعم" : "✗ لا" },
            { label: "لديه مركبة",    value: app.has_vehicle ? "نعم" : "لا" },
          ].map((r) => (
            <div key={r.label} style={{
              background: "var(--con-bg-subtle)", borderRadius: "var(--con-radius)",
              padding: "0.5rem 0.75rem",
            }}>
              <div style={{ fontSize: "11px", color: "var(--con-text-muted)", marginBottom: "0.125rem" }}>{r.label}</div>
              <div style={{
                fontSize: "12px", color: "var(--con-text-primary)", fontWeight: 500,
                fontFamily: r.label === "IBAN" || r.label === "رقم الهوية" ? "var(--con-font-mono)" : undefined,
                wordBreak: "break-all",
              }}>{r.value}</div>
            </div>
          ))}
        </div>

        {app.has_vehicle && (
          <div style={{
            background: "var(--con-bg-subtle)", borderRadius: "var(--con-radius)",
            padding: "0.75rem", marginBottom: "1rem",
            border: "1px solid var(--con-border-default)",
          }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--con-brand)", marginBottom: "0.5rem" }}>
              بيانات المركبة
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem", fontSize: "12px", color: "var(--con-text-secondary)" }}>
              <span>النوع: {app.vehicle_type}</span>
              <span>الماركة: {app.vehicle_brand}</span>
              <span>الموديل: {app.vehicle_model}</span>
              <span>اللوحة: {app.vehicle_plate}</span>
            </div>
          </div>
        )}

        {app.rejection_reason && (
          <div style={{
            background: "var(--con-danger-subtle)", border: "1px solid var(--con-danger)",
            borderRadius: "var(--con-radius)", padding: "0.75rem", marginBottom: "1rem",
            fontSize: "12px", color: "var(--con-danger)",
          }}>
            <strong>سبب الرفض: </strong>{app.rejection_reason}
          </div>
        )}

        {/* Reject input */}
        {rejectMode && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "12px", color: "var(--con-text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              سبب الرفض (سيُرسل للمتقدم بالبريد)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="يرجى توضيح سبب رفض الطلب..."
              style={{
                width: "100%", padding: "0.625rem", boxSizing: "border-box",
                background: "var(--con-bg-subtle)", border: "1px solid var(--con-border-default)",
                borderRadius: "var(--con-radius)", color: "var(--con-text-primary)",
                fontSize: "13px", resize: "vertical", fontFamily: "inherit",
              }}
            />
          </div>
        )}

        {/* Actions */}
        {(app.status === "pending" || app.status === "under_review" || app.status === "info_required") && (
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", borderTop: "1px solid var(--con-border-default)", paddingTop: "1rem" }}>
            {!rejectMode ? (
              <>
                <button
                  onClick={() => setRejectMode(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    background: "var(--con-danger-subtle)", color: "var(--con-danger)",
                    border: "1px solid var(--con-danger)", borderRadius: "var(--con-radius)",
                    padding: "0.5rem 1rem", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <ThumbsDown size={13} /> رفض
                </button>
                <button
                  onClick={() => onApprove(app.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    background: "var(--con-success-subtle)", color: "var(--con-success)",
                    border: "1px solid var(--con-success)", borderRadius: "var(--con-radius)",
                    padding: "0.5rem 1rem", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <ThumbsUp size={13} /> قبول
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setRejectMode(false)}
                  style={{
                    background: "none", border: "1px solid var(--con-border-default)",
                    borderRadius: "var(--con-radius)", padding: "0.5rem 0.75rem",
                    color: "var(--con-text-muted)", fontSize: "13px", cursor: "pointer",
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={() => onReject(app.id, reason)}
                  disabled={!reason.trim()}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    background: "var(--con-danger-subtle)", color: "var(--con-danger)",
                    border: "1px solid var(--con-danger)", borderRadius: "var(--con-radius)",
                    padding: "0.5rem 1rem", fontSize: "13px", fontWeight: 600,
                    cursor: reason.trim() ? "pointer" : "not-allowed",
                    opacity: reason.trim() ? 1 : 0.5,
                  }}
                >
                  <XCircle size={13} /> تأكيد الرفض
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCouriers() {
  const [activeTab, setActiveTab] = useState<AdminTab>("couriers");

  // ── Couriers state ──
  const [couriers, setCouriers]         = useState<Courier[]>(mockCouriers);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ── Applications state ──
  const [applications, setApplications]   = useState<DriverApplication[]>(mockApplications);
  const [appsLoading, setAppsLoading]     = useState(false);
  const [appSearch, setAppSearch]         = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp]     = useState<DriverApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // app id being actioned

  useEffect(() => { fetchCouriers(); }, []);
  useEffect(() => { if (activeTab === "applications") fetchApplications(); }, [activeTab]);

  async function fetchCouriers() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("couriers")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setCouriers(data as Courier[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const fetchApplications = useCallback(async () => {
    if (!supabase) return;
    setAppsLoading(true);
    try {
      const { data, error } = await supabase
        .from("driver_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setApplications(data as DriverApplication[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  async function approveApplication(id: string) {
    setActionLoading(id);
    setSelectedApp(null);
    try {
      if (supabase) {
        const { error } = await supabase.rpc("approve_driver_application", { application_id: id });
        if (!error) {
          setApplications((prev) =>
            prev.map((a) => a.id === id ? { ...a, status: "approved" } : a)
          );
        }
      } else {
        // Mock: just update local state
        setApplications((prev) =>
          prev.map((a) => a.id === id ? { ...a, status: "approved" } : a)
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectApplication(id: string, reason: string) {
    setActionLoading(id);
    setSelectedApp(null);
    try {
      if (supabase) {
        const { error } = await supabase
          .from("driver_applications")
          .update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (!error) {
          setApplications((prev) =>
            prev.map((a) => a.id === id ? { ...a, status: "rejected", rejection_reason: reason } : a)
          );
        }
      } else {
        setApplications((prev) =>
          prev.map((a) => a.id === id ? { ...a, status: "rejected", rejection_reason: reason } : a)
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = couriers.filter((c) => {
    const matchSearch = c.full_name.includes(search) || c.phone.includes(search);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredApps = applications.filter((a) => {
    const matchSearch =
      a.full_name.includes(appSearch) ||
      a.phone.includes(appSearch) ||
      a.app_ref.includes(appSearch.toUpperCase()) ||
      a.national_id.includes(appSearch);
    const matchStatus = appStatusFilter === "all" || a.status === appStatusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:      couriers.length,
    active:     couriers.filter((c) => c.status === "active").length,
    onDelivery: couriers.filter((c) => c.status === "on_delivery").length,
    pending:    couriers.filter((c) => c.status === "pending").length,
  };

  const appStats = {
    total:        applications.length,
    pending:      applications.filter((a) => a.status === "pending").length,
    under_review: applications.filter((a) => a.status === "under_review").length,
    approved:     applications.filter((a) => a.status === "approved").length,
    rejected:     applications.filter((a) => a.status === "rejected").length,
  };

  const variantStyle = (v: string): React.CSSProperties => {
    const map: Record<string, { icon: string; bg: string }> = {
      brand:   { icon: "var(--con-brand)",   bg: "var(--con-brand-subtle)"   },
      success: { icon: "var(--con-success)", bg: "var(--con-success-subtle)" },
      info:    { icon: "var(--con-info)",    bg: "var(--con-info-subtle)"    },
      warning: { icon: "var(--con-warning)", bg: "var(--con-warning-subtle)" },
      danger:  { icon: "var(--con-danger)",  bg: "var(--con-danger-subtle)"  },
    };
    return map[v] ?? map.brand;
  };

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }} dir="rtl">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", lineHeight: 1.2 }}>
            المناديب
          </h1>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>
            إدارة جميع مناديب التوصيل وطلبات التسجيل
          </p>
        </div>
        {activeTab === "couriers" && (
          <button className="con-btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={15} />
            إضافة مندوب
          </button>
        )}
        {activeTab === "applications" && (
          <button
            onClick={fetchApplications}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              background: "var(--con-bg-elevated)", color: "var(--con-text-secondary)",
              border: "1px solid var(--con-border-default)", borderRadius: "var(--con-radius)",
              padding: "0.5rem 0.875rem", fontSize: "13px", cursor: "pointer",
            }}
          >
            <RefreshCw size={13} />
            تحديث
          </button>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--con-border-default)" }}>
        {[
          { id: "couriers" as AdminTab,     label: "المناديب",          icon: Users,         count: couriers.length },
          { id: "applications" as AdminTab, label: "طلبات التسجيل",     icon: ClipboardList,  count: appStats.pending, badge: appStats.pending > 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              background: "none", border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: 600,
              color: activeTab === tab.id ? "var(--con-brand)" : "var(--con-text-muted)",
              borderBottom: activeTab === tab.id ? "2px solid var(--con-brand)" : "2px solid transparent",
              marginBottom: "-1px", transition: "color 0.15s",
            }}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.badge && tab.count > 0 && (
              <span style={{
                background: "var(--con-warning)", color: "#000",
                borderRadius: "999px", fontSize: "10px", fontWeight: 700,
                padding: "0 0.4rem", lineHeight: "1.4",
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════ COURIERS TAB ═══════════════ */}
      {activeTab === "couriers" && (
        <>
          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            {kpiConfig.map((k) => {
              const s = variantStyle(k.variant);
              const value = stats[k.key as keyof typeof stats];
              return (
                <div key={k.key} className="con-kpi-card">
                  <div className="con-icon-wrap" style={{ background: s.bg, color: s.icon, marginBottom: "0.75rem" }}>
                    <k.icon size={18} />
                  </div>
                  <div className="con-kpi-value">{loading ? "—" : value}</div>
                  <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>
                    {k.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="con-toolbar">
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={14}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }}
              />
              <input
                className="con-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الجوال..."
                style={{ paddingRight: "2.25rem", width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {[
                { value: "all",         label: "الكل" },
                { value: "active",      label: "نشط" },
                { value: "on_delivery", label: "في التوصيل" },
                { value: "inactive",    label: "غير نشط" },
                { value: "pending",     label: "قيد المراجعة" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`con-tab${statusFilter === opt.value ? " con-tab-active" : ""}`}
                  style={{ fontSize: "var(--con-text-caption)" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Couriers Table */}
          <div className="con-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="con-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>المندوب</th>
                    <th>رقم الجوال</th>
                    <th>المدينة</th>
                    <th>المركبة</th>
                    <th>التقييم</th>
                    <th>إجمالي الطلبات</th>
                    <th>الحالة</th>
                    <th style={{ width: "2.5rem" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 8 }).map((__, j) => (
                            <td key={j}><div className="con-skeleton" style={{ height: "1rem", borderRadius: "4px" }} /></td>
                          ))}
                        </tr>
                      ))
                    : filtered.map((courier) => {
                        const sc = statusConfig[courier.status];
                        return (
                          <tr key={courier.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                <div style={{
                                  width: "2rem", height: "2rem", borderRadius: "var(--con-radius)",
                                  background: "var(--con-brand-subtle)", color: "var(--con-brand)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "var(--con-text-caption)", fontWeight: 600, flexShrink: 0,
                                }}>
                                  {initials(courier.full_name)}
                                </div>
                                <span style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>
                                  {courier.full_name}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>
                                {courier.phone}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--con-text-secondary)" }}>
                                <MapPin size={12} style={{ color: "var(--con-text-muted)" }} />
                                {courier.city ?? "—"}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                {courier.vehicle_type === "سيارة"
                                  ? <Truck size={13} style={{ color: "var(--con-text-muted)" }} />
                                  : <Bike  size={13} style={{ color: "var(--con-text-muted)" }} />
                                }
                                <span style={{ color: "var(--con-text-secondary)" }}>{courier.vehicle_type ?? "—"}</span>
                              </div>
                            </td>
                            <td>
                              {courier.rating != null ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                  <Star size={12} style={{ color: "var(--con-warning)", fill: "var(--con-warning)" }} />
                                  <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-primary)", fontWeight: 600 }}>
                                    {courier.rating.toFixed(1)}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: "var(--con-text-muted)" }}>—</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                <Package size={12} style={{ color: "var(--con-text-muted)" }} />
                                <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>
                                  {(courier.total_orders ?? 0).toLocaleString("ar-SA")}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={sc?.cls ?? "con-badge con-badge-muted"}>
                                {sc?.label ?? courier.status}
                              </span>
                            </td>
                            <td>
                              <button
                                style={{
                                  padding: "0.25rem", borderRadius: "var(--con-radius-sm)",
                                  color: "var(--con-text-muted)", background: "transparent", border: "none", cursor: "pointer",
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--con-bg-elevated)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                              >
                                <MoreVertical size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
            {!loading && filtered.length === 0 && (
              <div className="con-empty">
                <Users size={28} style={{ marginBottom: "0.5rem", opacity: 0.3 }} />
                <p>لا توجد نتائج تطابق المعايير المحددة</p>
              </div>
            )}
            {!loading && filtered.length > 0 && (
              <div style={{
                padding: "0.625rem 1.25rem",
                borderTop: "1px solid var(--con-border-default)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
              }}>
                <span>
                  {filtered.length} مندوب
                  {statusFilter !== "all" && ` · تصفية: ${statusConfig[statusFilter]?.label ?? statusFilter}`}
                </span>
                <span>
                  نشط: {filtered.filter((c) => c.status === "active").length}
                  {" · "}
                  في التوصيل: {filtered.filter((c) => c.status === "on_delivery").length}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ APPLICATIONS TAB ═══════════════ */}
      {activeTab === "applications" && (
        <>
          {/* Applications KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {[
              { key: "total",        label: "إجمالي الطلبات",  icon: ClipboardList, variant: "brand"   },
              { key: "pending",      label: "قيد الانتظار",    icon: Clock,         variant: "warning" },
              { key: "under_review", label: "تحت المراجعة",   icon: FileText,      variant: "info"    },
              { key: "approved",     label: "مقبولة",          icon: CheckCircle2,  variant: "success" },
              { key: "rejected",     label: "مرفوضة",          icon: XCircle,       variant: "danger"  },
            ].map((k) => {
              const s = variantStyle(k.variant);
              const value = appStats[k.key as keyof typeof appStats];
              return (
                <div key={k.key} className="con-kpi-card">
                  <div className="con-icon-wrap" style={{ background: s.bg, color: s.icon, marginBottom: "0.75rem" }}>
                    <k.icon size={18} />
                  </div>
                  <div className="con-kpi-value">{appsLoading ? "—" : value}</div>
                  <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>
                    {k.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="con-toolbar">
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={14}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }}
              />
              <input
                className="con-input"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الهوية أو رقم الطلب..."
                style={{ paddingRight: "2.25rem", width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {[
                { value: "all",           label: "الكل" },
                { value: "pending",       label: "انتظار" },
                { value: "under_review",  label: "مراجعة" },
                { value: "approved",      label: "مقبول" },
                { value: "rejected",      label: "مرفوض" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAppStatusFilter(opt.value)}
                  className={`con-tab${appStatusFilter === opt.value ? " con-tab-active" : ""}`}
                  style={{ fontSize: "var(--con-text-caption)" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Applications Table */}
          <div className="con-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="con-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>المتقدم</th>
                    <th>رقم الجوال</th>
                    <th>المدينة</th>
                    <th>التحقق</th>
                    <th>المركبة</th>
                    <th>تاريخ التقديم</th>
                    <th>الحالة</th>
                    <th style={{ width: "7rem" }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {appsLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 9 }).map((__, j) => (
                            <td key={j}><div className="con-skeleton" style={{ height: "1rem", borderRadius: "4px" }} /></td>
                          ))}
                        </tr>
                      ))
                    : filteredApps.map((app) => {
                        const sc = appStatusConfig[app.status] ?? appStatusConfig.pending;
                        const isActioning = actionLoading === app.id;
                        return (
                          <tr key={app.id}>
                            {/* App ref */}
                            <td>
                              <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "12px", color: "var(--con-brand)" }}>
                                {app.app_ref}
                              </span>
                            </td>
                            {/* Name */}
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div style={{
                                  width: "1.75rem", height: "1.75rem", borderRadius: "50%",
                                  background: "var(--con-brand-subtle)", color: "var(--con-brand)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "11px", fontWeight: 700, flexShrink: 0,
                                }}>
                                  {initials(app.full_name)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 500, color: "var(--con-text-primary)", fontSize: "13px" }}>
                                    {app.full_name}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "var(--con-text-muted)" }}>
                                    {app.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Phone */}
                            <td>
                              <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)", fontSize: "12px" }}>
                                {app.phone}
                              </span>
                            </td>
                            {/* City */}
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--con-text-secondary)", fontSize: "12px" }}>
                                <MapPin size={11} style={{ color: "var(--con-text-muted)" }} />
                                {app.city}
                              </div>
                            </td>
                            {/* Verification */}
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                                <span style={{ fontSize: "11px", color: app.email_verified ? "var(--con-success)" : "var(--con-text-muted)" }}>
                                  {app.email_verified ? "✓ بريد" : "✗ بريد"}
                                </span>
                                {app.liveness_score && (
                                  <span style={{ fontSize: "11px", color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)" }}>
                                    {app.liveness_score}% حيوي
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Vehicle */}
                            <td>
                              {app.has_vehicle ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                  {app.vehicle_type === "bike"
                                    ? <Bike size={12} style={{ color: "var(--con-text-muted)" }} />
                                    : <Truck size={12} style={{ color: "var(--con-text-muted)" }} />
                                  }
                                  <span style={{ fontSize: "11px", color: "var(--con-text-secondary)" }}>
                                    {app.vehicle_brand} {app.vehicle_model}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontSize: "11px", color: "var(--con-text-muted)" }}>لا</span>
                              )}
                            </td>
                            {/* Date */}
                            <td>
                              <span style={{ fontSize: "11px", color: "var(--con-text-muted)" }}>
                                {new Date(app.created_at).toLocaleDateString("ar-SA")}
                              </span>
                            </td>
                            {/* Status */}
                            <td>
                              <span className={sc.cls}>{sc.label}</span>
                            </td>
                            {/* Actions */}
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                {isActioning ? (
                                  <Loader2 size={14} style={{ color: "var(--con-text-muted)", animation: "spin 1s linear infinite" }} />
                                ) : (
                                  <>
                                    <button
                                      title="عرض التفاصيل"
                                      onClick={() => setSelectedApp(app)}
                                      style={{
                                        padding: "0.25rem 0.375rem", borderRadius: "var(--con-radius-sm)",
                                        background: "var(--con-bg-elevated)", border: "none", cursor: "pointer",
                                        color: "var(--con-text-muted)",
                                      }}
                                    >
                                      <Eye size={13} />
                                    </button>
                                    {(app.status === "pending" || app.status === "under_review") && (
                                      <>
                                        <button
                                          title="قبول"
                                          onClick={() => approveApplication(app.id)}
                                          style={{
                                            padding: "0.25rem 0.375rem", borderRadius: "var(--con-radius-sm)",
                                            background: "var(--con-success-subtle)", border: "none", cursor: "pointer",
                                            color: "var(--con-success)",
                                          }}
                                        >
                                          <ThumbsUp size={13} />
                                        </button>
                                        <button
                                          title="رفض"
                                          onClick={() => setSelectedApp(app)}
                                          style={{
                                            padding: "0.25rem 0.375rem", borderRadius: "var(--con-radius-sm)",
                                            background: "var(--con-danger-subtle)", border: "none", cursor: "pointer",
                                            color: "var(--con-danger)",
                                          }}
                                        >
                                          <ThumbsDown size={13} />
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>

            {!appsLoading && filteredApps.length === 0 && (
              <div className="con-empty">
                <ClipboardList size={28} style={{ marginBottom: "0.5rem", opacity: 0.3 }} />
                <p>لا توجد طلبات تسجيل تطابق المعايير</p>
              </div>
            )}

            {!appsLoading && filteredApps.length > 0 && (
              <div style={{
                padding: "0.625rem 1.25rem",
                borderTop: "1px solid var(--con-border-default)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
              }}>
                <span>{filteredApps.length} طلب</span>
                <span>
                  انتظار: {filteredApps.filter((a) => a.status === "pending").length}
                  {" · "}
                  مراجعة: {filteredApps.filter((a) => a.status === "under_review").length}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Detail modal */}
      {selectedApp && (
        <AppDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={approveApplication}
          onReject={rejectApplication}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

