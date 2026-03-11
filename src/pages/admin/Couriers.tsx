/**
 * صفحة إدارة المناديب — Enterprise Courier Management Console
 * Tab 1: المناديب (existing couriers)
 * Tab 2: طلبات التسجيل (driver applications — approve / reject / review)
 */
import { useEffect, useState, useCallback, Fragment } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users, Plus, Search, MoreVertical,
  CheckCircle2, XCircle, Clock, MapPin,
  Star, Package, Bike, Truck,
  FileText, Eye, ThumbsUp, ThumbsDown,
  AlertCircle, RefreshCw, X, ExternalLink,
  Mail, Phone, CreditCard, Calendar,
  Shield, Camera, Car,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

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
  email: string;
  phone: string;
  city: string;
  date_of_birth?: string;
  has_vehicle: boolean;
  vehicle_type?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  plate_number?: string;
  selfie_url?: string;
  id_front_url?: string;
  id_back_url?: string;
  license_url?: string;
  bank_cert_url?: string;
  vehicle_registration_url?: string;
  vehicle_insurance_url?: string;
  doc_national_id?: string;
  doc_national_id_back?: string;
  doc_selfie?: string;
  doc_driver_license?: string;
  doc_bank_cert?: string;
  doc_vehicle_reg?: string;
  doc_vehicle_insurance?: string;
  email_verified?: boolean;
  liveness_passed?: boolean;
  face_similarity_score?: number;
  status: "pending" | "under_review" | "approved" | "rejected" | "requires_correction";
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  device_fingerprint?: string;
  created_at: string;
  updated_at?: string;
}

interface VerificationChecks {
  identity: boolean;
  liveness: boolean;
  license: boolean;
  bank: boolean;
  vehicleDocs: boolean;
  contact: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const API_BASE = "https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com";

const courierStatusConfig: Record<string, { label: string; cls: string }> = {
  active:      { label: "نشط",          cls: "con-badge con-badge-success" },
  inactive:    { label: "غير نشط",      cls: "con-badge con-badge-muted"   },
  on_delivery: { label: "في التوصيل",   cls: "con-badge con-badge-info"    },
  pending:     { label: "قيد المراجعة", cls: "con-badge con-badge-warning" },
};

const appStatusConfig: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending:       { label: "قيد الانتظار",   cls: "con-badge con-badge-warning", icon: Clock        },
  under_review:  { label: "قيد المراجعة",   cls: "con-badge con-badge-info",    icon: Eye          },
  approved:      { label: "مقبول",          cls: "con-badge con-badge-success", icon: CheckCircle2 },
  rejected:      { label: "مرفوض",          cls: "con-badge con-badge-danger",  icon: XCircle      },
  requires_correction: { label: "استكمال مطلوب", cls: "con-badge con-badge-warning", icon: AlertCircle },
};

const courierKpiConfig = [
  { key: "total",      label: "إجمالي المناديب", icon: Users,        variant: "brand"   },
  { key: "active",     label: "نشطون الآن",       icon: CheckCircle2, variant: "success" },
  { key: "onDelivery", label: "في التوصيل",       icon: Bike,         variant: "info"    },
  { key: "pending",    label: "قيد المراجعة",     icon: Clock,        variant: "warning" },
] as const;

const appKpiConfig = [
  { key: "total",        label: "إجمالي الطلبات",  icon: FileText,    variant: "brand"   },
  { key: "pending",      label: "بانتظار المراجعة", icon: Clock,       variant: "warning" },
  { key: "under_review", label: "قيد المراجعة",     icon: Eye,         variant: "info"    },
  { key: "approved",     label: "مقبولة",           icon: CheckCircle2, variant: "success" },
  { key: "rejected",     label: "مرفوضة",           icon: XCircle,     variant: "danger"  },
] as const;

const mockCouriers: Courier[] = [
  { id: "1", full_name: "أحمد محمد السالم",  phone: "0501234567", status: "active",      city: "الرياض", rating: 4.8, total_orders: 312, vehicle_type: "دراجة", created_at: "2024-01-15" },
  { id: "2", full_name: "خالد العمري",       phone: "0557654321", status: "on_delivery", city: "جدة",    rating: 4.5, total_orders: 198, vehicle_type: "سيارة", created_at: "2024-02-20" },
  { id: "3", full_name: "فهد الغامدي",       phone: "0509876543", status: "active",      city: "الرياض", rating: 4.9, total_orders: 445, vehicle_type: "دراجة", created_at: "2023-11-10" },
  { id: "4", full_name: "سعد الزهراني",      phone: "0551112233", status: "inactive",    city: "الدمام", rating: 3.9, total_orders: 87,  vehicle_type: "دراجة", created_at: "2024-03-05" },
  { id: "5", full_name: "عمر الشمري",        phone: "0503334455", status: "pending",     city: "الرياض", rating: undefined, total_orders: 0, vehicle_type: "سيارة", created_at: "2025-02-01" },
  { id: "6", full_name: "محمد القحطاني",     phone: "0556667788", status: "active",      city: "مكة",   rating: 4.7, total_orders: 234, vehicle_type: "دراجة", created_at: "2024-04-18" },
];

const mockApplications: DriverApplication[] = [
  {
    id: "app-1", app_ref: "FLL-20250301-A1B2", full_name: "ناصر الحربي", national_id: "1088******", email: "n***@gmail.com", phone: "055***4567",
    city: "الرياض", date_of_birth: "1995-06-15", has_vehicle: true, vehicle_type: "سيارة", vehicle_model: "هيونداي أكسنت", vehicle_year: 2022, plate_number: "أ ب ج ١٢٣٤",
    status: "pending", created_at: "2025-03-01T10:00:00Z",
  },
  {
    id: "app-2", app_ref: "FLL-20250228-C3D4", full_name: "عبدالله الدوسري", national_id: "1092******", email: "a***@outlook.com", phone: "050***8901",
    city: "جدة", date_of_birth: "1998-11-20", has_vehicle: false,
    status: "under_review", created_at: "2025-02-28T14:30:00Z",
  },
  {
    id: "app-3", app_ref: "FLL-20250225-E5F6", full_name: "يوسف الشهري", national_id: "1075******", email: "y***@gmail.com", phone: "053***2345",
    city: "الدمام", date_of_birth: "1992-03-08", has_vehicle: true, vehicle_type: "دراجة",
    status: "approved", reviewed_by: "admin@fll.sa", reviewed_at: "2025-02-26T09:00:00Z", created_at: "2025-02-25T08:00:00Z",
  },
  {
    id: "app-4", app_ref: "FLL-20250220-G7H8", full_name: "تركي المطيري", national_id: "1100******", email: "t***@yahoo.com", phone: "054***6789",
    city: "مكة", date_of_birth: "2000-01-12", has_vehicle: true, vehicle_type: "سيارة", vehicle_model: "تويوتا كورولا", vehicle_year: 2021,
    status: "rejected", admin_notes: "الهوية غير واضحة", reviewed_by: "admin@fll.sa", reviewed_at: "2025-02-21T16:00:00Z", created_at: "2025-02-20T11:00:00Z",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */

function initials(name: string) {
  return name.trim().charAt(0);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function variantStyle(v: string): { icon: string; bg: string } {
  const map: Record<string, { icon: string; bg: string }> = {
    brand:   { icon: "var(--con-brand)",   bg: "var(--con-brand-subtle)"   },
    success: { icon: "var(--con-success)", bg: "var(--con-success-subtle)" },
    info:    { icon: "var(--con-info)",    bg: "var(--con-info-subtle)"    },
    warning: { icon: "var(--con-warning)", bg: "var(--con-warning-subtle)" },
    danger:  { icon: "var(--con-danger, #ef4444)", bg: "var(--con-danger-subtle, rgba(239,68,68,0.1))" },
  };
  return map[v] ?? map.brand;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function AdminCouriers() {
  const [activeTab, setActiveTab] = useState<"couriers" | "applications">("couriers");

  /* ── Couriers state ── */
  const [couriers, setCouriers]         = useState<Courier[]>(mockCouriers);
  const [courierLoading, setCourierLoading] = useState(true);
  const [courierSearch, setCourierSearch]   = useState("");
  const [courierStatusFilter, setCourierStatusFilter] = useState<string>("all");

  /* ── Applications state ── */
  const [applications, setApplications]     = useState<DriverApplication[]>(mockApplications);
  const [appLoading, setAppLoading]         = useState(true);
  const [appSearch, setAppSearch]           = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp]       = useState<DriverApplication | null>(null);
  const [actionLoading, setActionLoading]   = useState<string | null>(null);
  const [reviewNotes, setReviewNotes]       = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verificationChecks, setVerificationChecks] = useState<VerificationChecks>({
    identity: false,
    liveness: false,
    license: false,
    bank: false,
    vehicleDocs: false,
    contact: false,
  });

  /* ── Fetch couriers ── */
  useEffect(() => { fetchCouriers(); }, []);

  async function fetchCouriers() {
    if (!supabase) { setCourierLoading(false); return; }
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
      setCourierLoading(false);
    }
  }

  /* ── Fetch applications ── */
  const fetchApplications = useCallback(async () => {
    setAppLoading(true);
    if (!supabase) { setAppLoading(false); return; }
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
      setAppLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  useEffect(() => {
    if (!selectedApp) return;
    setReviewNotes(selectedApp.admin_notes ?? "");
    setVerificationError("");
    setVerificationChecks({
      identity: Boolean((selectedApp.id_front_url || selectedApp.doc_national_id) && (selectedApp.id_back_url || selectedApp.doc_national_id_back)),
      liveness: Boolean(selectedApp.liveness_passed || selectedApp.selfie_url || selectedApp.doc_selfie),
      license: Boolean(selectedApp.license_url || selectedApp.doc_driver_license),
      bank: Boolean(selectedApp.bank_cert_url || selectedApp.doc_bank_cert),
      vehicleDocs: !selectedApp.has_vehicle || Boolean((selectedApp.vehicle_registration_url || selectedApp.doc_vehicle_reg) && (selectedApp.vehicle_insurance_url || selectedApp.doc_vehicle_insurance)),
      contact: Boolean(selectedApp.email_verified || selectedApp.phone),
    });
  }, [selectedApp]);

  async function updateApplicationReview(app: DriverApplication, patch: Partial<DriverApplication>) {
    const payload = {
      ...patch,
      reviewed_by: "admin@fll.sa",
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActionLoading(app.id);
    try {
      if (supabase) {
        const { error } = await supabase
          .from("driver_applications")
          .update(payload)
          .eq("id", app.id);
        if (error) throw error;
      }
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...payload } : a)));
      setSelectedApp((prev) => (prev && prev.id === app.id ? { ...prev, ...payload } : prev));
    } catch (e) {
      console.error(e);
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...payload } : a)));
      setSelectedApp((prev) => (prev && prev.id === app.id ? { ...prev, ...payload } : prev));
    } finally {
      setActionLoading(null);
    }
  }

  async function markUnderReview(app: DriverApplication) {
    await updateApplicationReview(app, {
      status: "under_review",
      admin_notes: reviewNotes.trim() || undefined,
    });
  }

  async function requestCorrection(app: DriverApplication) {
    const note = reviewNotes.trim();
    if (!note) {
      setVerificationError("اكتب ملاحظات واضحة قبل طلب الاستكمال");
      return;
    }
    await updateApplicationReview(app, {
      status: "requires_correction",
      admin_notes: note,
    });
    setSelectedApp(null);
  }

  /* ── Application actions ── */
  async function handleApprove(app: DriverApplication) {
    if (selectedApp?.id === app.id) {
      const requiredChecks = [
        verificationChecks.identity,
        verificationChecks.liveness,
        verificationChecks.license,
        verificationChecks.bank,
        verificationChecks.contact,
        verificationChecks.vehicleDocs,
      ];
      if (requiredChecks.some((isDone) => !isDone)) {
        setVerificationError("لا يمكن القبول قبل اكتمال جميع عناصر التحقق");
        return;
      }
    }
    if (!confirm(`هل تريد قبول طلب ${app.full_name}؟`)) return;
    setActionLoading(app.id);
    try {
      if (!supabase) {
        alert("خدمة المصادقة غير متاحة حالياً.");
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert("انتهت جلسة الإدارة. الرجاء تسجيل الدخول مجدداً.");
        return;
      }
      const res = await fetch(`${API_BASE}/driver/applications/${app.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_email: "admin@fll.sa" }),
      });
      if (res.ok) {
        // Optimistic update
        setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "approved" as const } : a));
        setSelectedApp(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`فشل القبول: ${(err as Record<string, string>).message ?? res.statusText}`);
      }
    } catch (e) {
      console.error(e);
      // Fallback: optimistic update for dev mode
      setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "approved" as const } : a));
      setSelectedApp(null);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(app: DriverApplication) {
    const reason = prompt("سبب الرفض:");
    if (!reason) return;
    setActionLoading(app.id);
    try {
      if (!supabase) {
        alert("خدمة المصادقة غير متاحة حالياً.");
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert("انتهت جلسة الإدارة. الرجاء تسجيل الدخول مجدداً.");
        return;
      }
      const res = await fetch(`${API_BASE}/driver/applications/${app.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_email: "admin@fll.sa", reason }),
      });
      if (res.ok) {
        setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "rejected" as const, admin_notes: reason } : a));
        setSelectedApp(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`فشل الرفض: ${(err as Record<string, string>).message ?? res.statusText}`);
      }
    } catch (e) {
      console.error(e);
      setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "rejected" as const, admin_notes: reason } : a));
      setSelectedApp(null);
    } finally {
      setActionLoading(null);
    }
  }

  /* ── Computed: couriers ── */
  const filteredCouriers = couriers.filter((c) => {
    const matchSearch = c.full_name.includes(courierSearch) || c.phone.includes(courierSearch);
    const matchStatus = courierStatusFilter === "all" || c.status === courierStatusFilter;
    return matchSearch && matchStatus;
  });

  const courierStats = {
    total:      couriers.length,
    active:     couriers.filter((c) => c.status === "active").length,
    onDelivery: couriers.filter((c) => c.status === "on_delivery").length,
    pending:    couriers.filter((c) => c.status === "pending").length,
  };

  /* ── Computed: applications ── */
  const filteredApps = applications.filter((a) => {
    const matchSearch = a.full_name.includes(appSearch) || a.app_ref.includes(appSearch) || a.phone.includes(appSearch);
    const matchStatus = appStatusFilter === "all" || a.status === appStatusFilter;
    return matchSearch && matchStatus;
  });

  const appStats = {
    total:        applications.length,
    pending:      applications.filter((a) => a.status === "pending").length,
    under_review: applications.filter((a) => a.status === "under_review").length,
    approved:     applications.filter((a) => a.status === "approved").length,
    rejected:     applications.filter((a) => a.status === "rejected").length,
  };

  const pendingCount = appStats.pending + appStats.under_review;

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }} dir="rtl">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", lineHeight: 1.2 }}>
            المناديب
          </h1>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>
            إدارة المناديب وطلبات التسجيل
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
            className="con-btn-primary"
            onClick={() => fetchApplications()}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <RefreshCw size={15} />
            تحديث
          </button>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--con-border-default)", paddingBottom: 0 }}>
        <button
          onClick={() => setActiveTab("couriers")}
          style={{
            padding: "0.625rem 1.25rem",
            fontSize: "var(--con-text-body)",
            fontWeight: activeTab === "couriers" ? 600 : 400,
            color: activeTab === "couriers" ? "var(--con-brand)" : "var(--con-text-muted)",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "couriers" ? "2px solid var(--con-brand)" : "2px solid transparent",
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: "-1px",
            transition: "all 0.15s ease",
          }}
        >
          المناديب
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          style={{
            padding: "0.625rem 1.25rem",
            fontSize: "var(--con-text-body)",
            fontWeight: activeTab === "applications" ? 600 : 400,
            color: activeTab === "applications" ? "var(--con-brand)" : "var(--con-text-muted)",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "applications" ? "2px solid var(--con-brand)" : "2px solid transparent",
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: "-1px",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          طلبات التسجيل
          {pendingCount > 0 && (
            <span style={{
              background: "var(--con-danger, #ef4444)",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 700,
              padding: "1px 7px",
              borderRadius: "9999px",
              minWidth: "1.25rem",
              textAlign: "center",
              fontFamily: "var(--con-font-mono)",
            }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════ TAB: COURIERS ═══════════════ */}
      {activeTab === "couriers" && (
        <Fragment>
          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            {courierKpiConfig.map((k) => {
              const s = variantStyle(k.variant);
              const value = courierStats[k.key as keyof typeof courierStats];
              return (
                <div key={k.key} className="con-kpi-card">
                  <div className="con-icon-wrap" style={{ background: s.bg, color: s.icon, marginBottom: "0.75rem" }}>
                    <k.icon size={18} />
                  </div>
                  <div className="con-kpi-value">{courierLoading ? "—" : value}</div>
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
                value={courierSearch}
                onChange={(e) => setCourierSearch(e.target.value)}
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
                  onClick={() => setCourierStatusFilter(opt.value)}
                  className={`con-tab${courierStatusFilter === opt.value ? " con-tab-active" : ""}`}
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
                  {courierLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 8 }).map((__, j) => (
                            <td key={j}><div className="con-skeleton" style={{ height: "1rem", borderRadius: "4px" }} /></td>
                          ))}
                        </tr>
                      ))
                    : filteredCouriers.map((courier) => {
                        const sc = courierStatusConfig[courier.status];
                        return (
                          <tr key={courier.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                <div
                                  style={{
                                    width: "2rem", height: "2rem", borderRadius: "var(--con-radius)",
                                    background: "var(--con-brand-subtle)", color: "var(--con-brand)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "var(--con-text-caption)", fontWeight: 600, flexShrink: 0,
                                  }}
                                >
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

            {!courierLoading && filteredCouriers.length === 0 && (
              <div className="con-empty">
                <Users size={28} style={{ marginBottom: "0.5rem", opacity: 0.3 }} />
                <p>لا توجد نتائج تطابق المعايير المحددة</p>
              </div>
            )}

            {!courierLoading && filteredCouriers.length > 0 && (
              <div
                style={{
                  padding: "0.625rem 1.25rem",
                  borderTop: "1px solid var(--con-border-default)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
                }}
              >
                <span>
                  {filteredCouriers.length} مندوب
                  {courierStatusFilter !== "all" && ` · تصفية: ${courierStatusConfig[courierStatusFilter]?.label ?? courierStatusFilter}`}
                </span>
                <span>
                  نشط: {filteredCouriers.filter((c) => c.status === "active").length}
                  {" · "}
                  في التوصيل: {filteredCouriers.filter((c) => c.status === "on_delivery").length}
                </span>
              </div>
            )}
          </div>
        </Fragment>
      )}

      {/* ═══════════════ TAB: APPLICATIONS ═══════════════ */}
      {activeTab === "applications" && (
        <Fragment>
          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {appKpiConfig.map((k) => {
              const s = variantStyle(k.variant);
              const value = appStats[k.key as keyof typeof appStats];
              return (
                <div key={k.key} className="con-kpi-card">
                  <div className="con-icon-wrap" style={{ background: s.bg, color: s.icon, marginBottom: "0.75rem" }}>
                    <k.icon size={18} />
                  </div>
                  <div className="con-kpi-value">{appLoading ? "—" : value}</div>
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
                placeholder="ابحث بالاسم أو رقم الطلب أو الجوال..."
                style={{ paddingRight: "2.25rem", width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {[
                { value: "all",           label: "الكل" },
                { value: "pending",       label: "بانتظار" },
                { value: "under_review",  label: "قيد المراجعة" },
                { value: "requires_correction", label: "استكمال مطلوب" },
                { value: "approved",      label: "مقبولة" },
                { value: "rejected",      label: "مرفوضة" },
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
                    <th>مقدم الطلب</th>
                    <th>الجوال</th>
                    <th>المدينة</th>
                    <th>المركبة</th>
                    <th>تاريخ التقديم</th>
                    <th>الحالة</th>
                    <th style={{ width: "7rem" }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {appLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 8 }).map((__, j) => (
                            <td key={j}><div className="con-skeleton" style={{ height: "1rem", borderRadius: "4px" }} /></td>
                          ))}
                        </tr>
                      ))
                    : filteredApps.map((app) => {
                        const sc = appStatusConfig[app.status];
                        const isActionable = app.status === "pending" || app.status === "under_review" || app.status === "requires_correction";
                        return (
                          <tr key={app.id}>
                            {/* Ref */}
                            <td>
                              <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "12px", color: "var(--con-text-secondary)" }}>
                                {app.app_ref}
                              </span>
                            </td>

                            {/* Name */}
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                <div
                                  style={{
                                    width: "2rem", height: "2rem", borderRadius: "var(--con-radius)",
                                    background: "var(--con-brand-subtle)", color: "var(--con-brand)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "var(--con-text-caption)", fontWeight: 600, flexShrink: 0,
                                  }}
                                >
                                  {initials(app.full_name)}
                                </div>
                                <span style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>
                                  {app.full_name}
                                </span>
                              </div>
                            </td>

                            {/* Phone */}
                            <td>
                              <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>
                                {app.phone}
                              </span>
                            </td>

                            {/* City */}
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--con-text-secondary)" }}>
                                <MapPin size={12} style={{ color: "var(--con-text-muted)" }} />
                                {app.city}
                              </div>
                            </td>

                            {/* Vehicle */}
                            <td>
                              {app.has_vehicle ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                  {app.vehicle_type === "سيارة"
                                    ? <Truck size={13} style={{ color: "var(--con-text-muted)" }} />
                                    : <Bike  size={13} style={{ color: "var(--con-text-muted)" }} />
                                  }
                                  <span style={{ color: "var(--con-text-secondary)" }}>{app.vehicle_type ?? "—"}</span>
                                </div>
                              ) : (
                                <span style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>بدون مركبة</span>
                              )}
                            </td>

                            {/* Date */}
                            <td>
                              <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "12px", color: "var(--con-text-secondary)" }}>
                                {formatDate(app.created_at)}
                              </span>
                            </td>

                            {/* Status */}
                            <td>
                              <span className={sc?.cls ?? "con-badge con-badge-muted"}>
                                {sc?.label ?? app.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td>
                              <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                                {/* View detail */}
                                <button
                                  onClick={() => setSelectedApp(app)}
                                  title="عرض التفاصيل"
                                  style={{
                                    padding: "0.3rem", borderRadius: "var(--con-radius-sm)",
                                    color: "var(--con-brand)", background: "transparent", border: "none", cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--con-brand-subtle)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                >
                                  <Eye size={15} />
                                </button>

                                {isActionable && (
                                  <>
                                    {/* Approve */}
                                    <button
                                      onClick={() => handleApprove(app)}
                                      disabled={actionLoading === app.id}
                                      title="قبول"
                                      style={{
                                        padding: "0.3rem", borderRadius: "var(--con-radius-sm)",
                                        color: "var(--con-success)", background: "transparent", border: "none", cursor: "pointer",
                                        opacity: actionLoading === app.id ? 0.5 : 1,
                                      }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--con-success-subtle)"; }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                    >
                                      <ThumbsUp size={15} />
                                    </button>

                                    {/* Reject */}
                                    <button
                                      onClick={() => handleReject(app)}
                                      disabled={actionLoading === app.id}
                                      title="رفض"
                                      style={{
                                        padding: "0.3rem", borderRadius: "var(--con-radius-sm)",
                                        color: "var(--con-danger, #ef4444)", background: "transparent", border: "none", cursor: "pointer",
                                        opacity: actionLoading === app.id ? 0.5 : 1,
                                      }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--con-danger-subtle, rgba(239,68,68,0.1))"; }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                    >
                                      <ThumbsDown size={15} />
                                    </button>
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

            {!appLoading && filteredApps.length === 0 && (
              <div className="con-empty">
                <FileText size={28} style={{ marginBottom: "0.5rem", opacity: 0.3 }} />
                <p>لا توجد طلبات تسجيل تطابق المعايير المحددة</p>
              </div>
            )}

            {!appLoading && filteredApps.length > 0 && (
              <div
                style={{
                  padding: "0.625rem 1.25rem",
                  borderTop: "1px solid var(--con-border-default)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
                }}
              >
                <span>
                  {filteredApps.length} طلب
                  {appStatusFilter !== "all" && ` · تصفية: ${appStatusConfig[appStatusFilter]?.label ?? appStatusFilter}`}
                </span>
                <span>
                  بانتظار: {filteredApps.filter((a) => a.status === "pending").length}
                  {" · "}
                  مقبولة: {filteredApps.filter((a) => a.status === "approved").length}
                </span>
              </div>
            )}
          </div>
        </Fragment>
      )}

      {/* ═══════════════ APPLICATION DETAIL MODAL ═══════════════ */}
      {selectedApp && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedApp(null); }}
        >
          <div
            style={{
              background: "var(--con-bg-card, #1a2332)",
              border: "1px solid var(--con-border-default)",
              borderRadius: "var(--con-radius-lg, 12px)",
              width: "100%",
              maxWidth: "640px",
              maxHeight: "85vh",
              overflow: "auto",
              padding: "1.5rem",
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedApp(null)}
              style={{
                position: "absolute", top: "1rem", left: "1rem",
                background: "transparent", border: "none", cursor: "pointer",
                color: "var(--con-text-muted)", padding: "0.25rem",
                borderRadius: "var(--con-radius-sm)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--con-bg-elevated)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <div
                  style={{
                    width: "2.5rem", height: "2.5rem", borderRadius: "var(--con-radius)",
                    background: "var(--con-brand-subtle)", color: "var(--con-brand)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: 700,
                  }}
                >
                  {initials(selectedApp.full_name)}
                </div>
                <div>
                  <h2 style={{ fontSize: "var(--con-text-section-title, 18px)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>
                    {selectedApp.full_name}
                  </h2>
                  <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "12px", color: "var(--con-text-muted)" }}>
                    {selectedApp.app_ref}
                  </span>
                </div>
              </div>
              <span className={appStatusConfig[selectedApp.status]?.cls ?? "con-badge con-badge-muted"}>
                {appStatusConfig[selectedApp.status]?.label ?? selectedApp.status}
              </span>
            </div>

            {/* Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <DetailField icon={CreditCard} label="الهوية الوطنية" value={selectedApp.national_id} />
              <DetailField icon={Mail} label="البريد الإلكتروني" value={selectedApp.email} />
              <DetailField icon={Phone} label="رقم الجوال" value={selectedApp.phone} />
              <DetailField icon={MapPin} label="المدينة" value={selectedApp.city} />
              <DetailField icon={Calendar} label="تاريخ الميلاد" value={selectedApp.date_of_birth ?? "—"} />
              <DetailField icon={Calendar} label="تاريخ التقديم" value={formatDate(selectedApp.created_at)} />
            </div>

            {/* Vehicle Info */}
            {selectedApp.has_vehicle && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "var(--con-text-body)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Car size={16} />
                  بيانات المركبة
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <DetailField icon={Truck} label="النوع" value={selectedApp.vehicle_type ?? "—"} />
                  <DetailField icon={FileText} label="الموديل" value={selectedApp.vehicle_model ?? "—"} />
                  <DetailField icon={Calendar} label="السنة" value={selectedApp.vehicle_year?.toString() ?? "—"} />
                  <DetailField icon={Shield} label="اللوحة" value={selectedApp.plate_number ?? "—"} />
                </div>
              </div>
            )}

            {/* Documents */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "var(--con-text-body)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={16} />
                المستندات المرفقة
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <DocBadge label="صورة شخصية" url={selectedApp.selfie_url || selectedApp.doc_selfie} icon={Camera} />
                <DocBadge label="هوية (أمام)" url={selectedApp.id_front_url || selectedApp.doc_national_id} icon={CreditCard} />
                <DocBadge label="هوية (خلف)" url={selectedApp.id_back_url || selectedApp.doc_national_id_back} icon={CreditCard} />
                <DocBadge label="رخصة قيادة" url={selectedApp.license_url || selectedApp.doc_driver_license} icon={Car} />
                <DocBadge label="شهادة بنكية" url={selectedApp.bank_cert_url || selectedApp.doc_bank_cert} icon={FileText} />
                {selectedApp.has_vehicle && (
                  <>
                    <DocBadge label="استمارة المركبة" url={selectedApp.vehicle_registration_url || selectedApp.doc_vehicle_reg} icon={FileText} />
                    <DocBadge label="تأمين المركبة" url={selectedApp.vehicle_insurance_url || selectedApp.doc_vehicle_insurance} icon={Shield} />
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem", border: "1px solid var(--con-border-default)", borderRadius: "var(--con-radius)", padding: "0.875rem" }}>
              <p style={{ margin: "0 0 0.75rem", fontSize: "var(--con-text-body)", fontWeight: 600, color: "var(--con-text-primary)" }}>
                التحقق من onboarding
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem", marginBottom: "0.75rem" }}>
                {[
                  { key: "identity", label: "مطابقة وثائق الهوية" },
                  { key: "liveness", label: "اجتياز التحقق الحيوي" },
                  { key: "license", label: "رخصة القيادة صالحة" },
                  { key: "bank", label: "توثيق الحساب البنكي" },
                  { key: "vehicleDocs", label: "وثائق المركبة" },
                  { key: "contact", label: "البيانات التواصلية صحيحة" },
                ].map((item) => (
                  <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>
                    <input
                      type="checkbox"
                      checked={verificationChecks[item.key as keyof VerificationChecks]}
                      onChange={(e) => {
                        setVerificationError("");
                        setVerificationChecks((prev) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }));
                      }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <textarea
                className="con-input"
                value={reviewNotes}
                onChange={(e) => {
                  setVerificationError("");
                  setReviewNotes(e.target.value);
                }}
                placeholder="ملاحظات المراجع أو متطلبات الاستكمال"
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
              />
              {verificationError && (
                <p style={{ margin: "0.5rem 0 0", color: "var(--con-danger, #ef4444)", fontSize: "var(--con-text-caption)" }}>
                  {verificationError}
                </p>
              )}
            </div>

            {/* Admin Notes */}
            {selectedApp.admin_notes && (
              <div style={{ marginBottom: "1.5rem", padding: "0.75rem", background: "var(--con-bg-elevated)", borderRadius: "var(--con-radius)", border: "1px solid var(--con-border-default)" }}>
                <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: "0.25rem" }}>ملاحظات المراجع</p>
                <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-primary)", margin: 0 }}>{selectedApp.admin_notes}</p>
              </div>
            )}

            {/* Review info */}
            {selectedApp.reviewed_by && (
              <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: "1.5rem" }}>
                تمت المراجعة بواسطة: <span style={{ fontFamily: "var(--con-font-mono)" }}>{selectedApp.reviewed_by}</span>
                {selectedApp.reviewed_at && ` · ${formatDate(selectedApp.reviewed_at)}`}
              </div>
            )}

            {/* Action Buttons */}
            {(selectedApp.status === "pending" || selectedApp.status === "under_review" || selectedApp.status === "requires_correction") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", borderTop: "1px solid var(--con-border-default)", paddingTop: "1.25rem" }}>
                <button
                  onClick={() => markUnderReview(selectedApp)}
                  disabled={actionLoading === selectedApp.id}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: "var(--con-radius)",
                    border: "1px solid var(--con-info, #0ea5e9)", color: "var(--con-info, #0ea5e9)",
                    background: "transparent", cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
                  }}
                >
                  بدء/تحديث المراجعة
                </button>
                <button
                  onClick={() => requestCorrection(selectedApp)}
                  disabled={actionLoading === selectedApp.id}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: "var(--con-radius)",
                    border: "1px solid var(--con-warning)", color: "var(--con-warning)",
                    background: "transparent", cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
                  }}
                >
                  طلب استكمال
                </button>
                <button
                  className="con-btn-primary"
                  onClick={() => handleApprove(selectedApp)}
                  disabled={actionLoading === selectedApp.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                >
                  <ThumbsUp size={15} />
                  قبول الطلب
                </button>
                <button
                  onClick={() => handleReject(selectedApp)}
                  disabled={actionLoading === selectedApp.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    padding: "0.5rem 1rem", borderRadius: "var(--con-radius)",
                    border: "1px solid var(--con-danger, #ef4444)",
                    color: "var(--con-danger, #ef4444)",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    fontSize: "var(--con-text-body)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--con-danger-subtle, rgba(239,68,68,0.1))";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <ThumbsDown size={15} />
                  رفض الطلب
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

function DetailField({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <Icon size={12} />
        {label}
      </span>
      <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-primary)", fontFamily: value.match(/[0-9@.]/) ? "var(--con-font-mono)" : "inherit" }}>
        {value}
      </span>
    </div>
  );
}

function DocBadge({ label, url, icon: Icon }: { label: string; url?: string; icon: typeof FileText }) {
  const hasDoc = !!url;
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "0.375rem",
        padding: "0.375rem 0.625rem",
        borderRadius: "var(--con-radius)",
        border: `1px solid ${hasDoc ? "var(--con-success-subtle)" : "var(--con-border-default)"}`,
        background: hasDoc ? "var(--con-success-subtle)" : "var(--con-bg-elevated)",
        fontSize: "var(--con-text-caption)",
        color: hasDoc ? "var(--con-success)" : "var(--con-text-muted)",
        cursor: hasDoc ? "pointer" : "default",
      }}
      onClick={() => { if (url) window.open(url, "_blank"); }}
      title={hasDoc ? "اضغط لعرض المستند" : "لم يتم رفعه"}
    >
      <Icon size={12} />
      <span>{label}</span>
      {hasDoc && <ExternalLink size={10} />}
      {!hasDoc && <XCircle size={10} />}
    </div>
  );
}
