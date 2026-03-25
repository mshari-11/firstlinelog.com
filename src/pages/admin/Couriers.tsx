import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/admin/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Star,
  Package,
  Bike,
  Truck,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Shield,
  Camera,
  Car,
  ScanFace,
  ShieldCheck,
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  KPIGrid,
  KPICard,
  Tabs,
  Toolbar,
  Card,
  Table,
  Badge,
  Button,
  IconButton,
  Modal,
  DetailField,
  DetailGrid,
  Section,
  TextArea,
  EmptyState,
  SkeletonRows,
  Select,
} from "@/components/admin/ui";

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

import { API_BASE } from "@/lib/api";

const courierStatusConfig: Record<string, { label: string; variant: "success" | "warning" | "info" | "muted" }> = {
  active: { label: "نشط", variant: "success" },
  inactive: { label: "غير نشط", variant: "muted" },
  on_delivery: { label: "في التوصيل", variant: "info" },
  pending: { label: "قيد المراجعة", variant: "warning" },
};

const appStatusConfig: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger"; icon: typeof Clock }> = {
  pending: { label: "قيد الانتظار", variant: "warning", icon: Clock },
  under_review: { label: "قيد المراجعة", variant: "info", icon: Eye },
  approved: { label: "مقبول", variant: "success", icon: CheckCircle2 },
  rejected: { label: "مرفوض", variant: "danger", icon: XCircle },
  requires_correction: { label: "استكمال مطلوب", variant: "warning", icon: AlertCircle },
};

const mockCouriers: Courier[] = [
  { id: "1", full_name: "أحمد محمد السالم", phone: "0501234567", status: "active", city: "الرياض", rating: 4.8, total_orders: 312, vehicle_type: "دراجة", created_at: "2024-01-15" },
  { id: "2", full_name: "خالد العمري", phone: "0557654321", status: "on_delivery", city: "جدة", rating: 4.5, total_orders: 198, vehicle_type: "سيارة", created_at: "2024-02-20" },
  { id: "3", full_name: "فهد الغامدي", phone: "0509876543", status: "active", city: "الرياض", rating: 4.9, total_orders: 445, vehicle_type: "دراجة", created_at: "2023-11-10" },
  { id: "4", full_name: "سعد الزهراني", phone: "0551112233", status: "inactive", city: "الدمام", rating: 3.9, total_orders: 87, vehicle_type: "دراجة", created_at: "2024-03-05" },
  { id: "5", full_name: "عمر الشمري", phone: "0503334455", status: "pending", city: "الرياض", rating: undefined, total_orders: 0, vehicle_type: "سيارة", created_at: "2025-02-01" },
  { id: "6", full_name: "محمد القحطاني", phone: "0556667788", status: "active", city: "مكة", rating: 4.7, total_orders: 234, vehicle_type: "دراجة", created_at: "2024-04-18" },
];

const mockApplications: DriverApplication[] = [
  { id: "app-1", app_ref: "FLL-20250301-A1B2", full_name: "ناصر الحربي", national_id: "1088******", email: "n***@gmail.com", phone: "055***4567", city: "الرياض", date_of_birth: "1995-06-15", has_vehicle: true, vehicle_type: "سيارة", vehicle_model: "هيونداي أكسنت", vehicle_year: 2022, plate_number: "أ ب ج ١٢٣٤", status: "pending", created_at: "2025-03-01T10:00:00Z" },
  { id: "app-2", app_ref: "FLL-20250228-C3D4", full_name: "عبدالله الدوسري", national_id: "1092******", email: "a***@outlook.com", phone: "050***8901", city: "جدة", date_of_birth: "1998-11-20", has_vehicle: false, status: "under_review", created_at: "2025-02-28T14:30:00Z" },
  { id: "app-3", app_ref: "FLL-20250225-E5F6", full_name: "يوسف الشهري", national_id: "1075******", email: "y***@gmail.com", phone: "053***2345", city: "الدمام", date_of_birth: "1992-03-08", has_vehicle: true, vehicle_type: "دراجة", status: "approved", reviewed_by: "admin@fll.sa", reviewed_at: "2025-02-26T09:00:00Z", created_at: "2025-02-25T08:00:00Z" },
  { id: "app-4", app_ref: "FLL-20250220-G7H8", full_name: "تركي المطيري", national_id: "1100******", email: "t***@yahoo.com", phone: "054***6789", city: "مكة", date_of_birth: "2000-01-12", has_vehicle: true, vehicle_type: "سيارة", vehicle_model: "تويوتا كورولا", vehicle_year: 2021, status: "rejected", admin_notes: "الهوية غير واضحة", reviewed_by: "admin@fll.sa", reviewed_at: "2025-02-21T16:00:00Z", created_at: "2025-02-20T11:00:00Z" },
];

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

function DocBadge({ label, url, icon: Icon }: { label: string; url?: string; icon: typeof FileText }) {
  const hasDoc = !!url;
  return (
    <button
      type="button"
      onClick={() => {
        if (url) window.open(url, "_blank");
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.45rem 0.7rem",
        borderRadius: "var(--con-radius)",
        border: `1px solid ${hasDoc ? "rgba(34,197,94,0.22)" : "var(--con-border-default)"}`,
        background: hasDoc ? "var(--con-success-subtle)" : "var(--con-bg-elevated)",
        fontSize: "var(--con-text-caption)",
        color: hasDoc ? "var(--con-success)" : "var(--con-text-muted)",
        cursor: hasDoc ? "pointer" : "default",
      }}
      title={hasDoc ? "اضغط لعرض المستند" : "لم يتم رفعه"}
    >
      <Icon size={12} />
      <span>{label}</span>
      {hasDoc ? <ExternalLink size={10} /> : <XCircle size={10} />}
    </button>
  );
}

export default function AdminCouriers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"couriers" | "applications">("couriers");
  const [couriers, setCouriers] = useState<Courier[]>(mockCouriers);
  const [courierLoading, setCourierLoading] = useState(true);
  const [courierSearch, setCourierSearch] = useState("");
  const [courierStatusFilter, setCourierStatusFilter] = useState<string>("all");
  const [applications, setApplications] = useState<DriverApplication[]>(mockApplications);
  const [appLoading, setAppLoading] = useState(true);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<DriverApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogApp, setRejectDialogApp] = useState<DriverApplication | null>(null);
  const [approveDialogApp, setApproveDialogApp] = useState<DriverApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verificationChecks, setVerificationChecks] = useState<VerificationChecks>({
    identity: false,
    liveness: false,
    license: false,
    bank: false,
    vehicleDocs: false,
    contact: false,
  });

  useEffect(() => {
    fetchCouriers();
  }, []);

  async function fetchCouriers() {
    if (!supabase) {
      setCourierLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from("couriers").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setCouriers(data as Courier[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCourierLoading(false);
    }
  }

  const fetchApplications = useCallback(async () => {
    setAppLoading(true);
    if (!supabase) {
      setAppLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from("driver_applications").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setApplications(data as DriverApplication[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAppLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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
      reviewed_by: user?.email || "admin",
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActionLoading(app.id);
    try {
      if (supabase) {
        const { error } = await supabase.from("driver_applications").update(payload).eq("id", app.id);
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
    setApproveDialogApp(app);
  }

  async function executeApprove(app: DriverApplication) {
    setApproveDialogApp(null);
    setActionLoading(app.id);
    try {
      if (!supabase) {
        toast.error("خدمة المصادقة غير متاحة حالياً.");
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("انتهت جلسة الإدارة. الرجاء تسجيل الدخول مجدداً.");
        return;
      }
      const res = await fetch(`${API_BASE}/driver/applications/${app.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_email: user?.email || "admin" }),
      });
      if (res.ok) {
        setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "approved" as const } : a)));
        setSelectedApp(null);
        toast.success(`تم قبول طلب ${app.full_name} بنجاح`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`فشل القبول: ${(err as Record<string, string>).message ?? res.statusText}`);
      }
    } catch (e) {
      console.error(e);
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "approved" as const } : a)));
      setSelectedApp(null);
      toast.success(`تم قبول طلب ${app.full_name}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(app: DriverApplication, reason: string) {
    if (!reason.trim()) return;
    setRejectDialogApp(null);
    setRejectReason("");
    setActionLoading(app.id);
    try {
      if (!supabase) {
        toast.error("خدمة المصادقة غير متاحة حالياً.");
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("انتهت جلسة الإدارة. الرجاء تسجيل الدخول مجدداً.");
        return;
      }
      const res = await fetch(`${API_BASE}/driver/applications/${app.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_email: user?.email || "admin", reason }),
      });
      if (res.ok) {
        setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "rejected" as const, admin_notes: reason } : a)));
        setSelectedApp(null);
        toast.success(`تم رفض طلب ${app.full_name}`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`فشل الرفض: ${(err as Record<string, string>).message ?? res.statusText}`);
      }
    } catch (e) {
      console.error(e);
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "rejected" as const, admin_notes: reason } : a)));
      setSelectedApp(null);
      toast.success(`تم رفض طلب ${app.full_name}`);
    } finally {
      setActionLoading(null);
    }
  }

  const filteredCouriers = couriers.filter((c) => {
    const matchSearch = c.full_name.includes(courierSearch) || c.phone.includes(courierSearch);
    const matchStatus = courierStatusFilter === "all" || c.status === courierStatusFilter;
    return matchSearch && matchStatus;
  });

  const courierStats = {
    total: couriers.length,
    active: couriers.filter((c) => c.status === "active").length,
    onDelivery: couriers.filter((c) => c.status === "on_delivery").length,
    pending: couriers.filter((c) => c.status === "pending").length,
  };

  const filteredApps = applications.filter((a) => {
    const matchSearch = a.full_name.includes(appSearch) || a.app_ref.includes(appSearch) || a.phone.includes(appSearch);
    const matchStatus = appStatusFilter === "all" || a.status === appStatusFilter;
    return matchSearch && matchStatus;
  });

  const appStats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    under_review: applications.filter((a) => a.status === "under_review").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const pendingCount = appStats.pending + appStats.under_review;

  return (
    <PageWrapper>
      <PageHeader
        icon={Users}
        title="المناديب"
        subtitle="إدارة المناديب النشطين وطلبات التسجيل الجديدة"
        actions={
          activeTab === "couriers" ? (
            <Button icon={Plus} onClick={() => navigate("/courier/register")}>إضافة مندوب</Button>
          ) : (
            <Button icon={RefreshCw} onClick={fetchApplications}>
              تحديث
            </Button>
          )
        }
      />

      <Tabs
        active={activeTab}
        onChange={(key) => setActiveTab(key as "couriers" | "applications")}
        items={[
          { key: "couriers", label: "المناديب", icon: Users, count: courierStats.total },
          { key: "applications", label: "طلبات التسجيل", icon: FileText, count: pendingCount },
        ]}
      />

      {activeTab === "couriers" && (
        <Fragment>
          <KPIGrid>
            <KPICard label="إجمالي المناديب" value={courierStats.total} icon={Users} accent="var(--con-brand)" loading={courierLoading} />
            <KPICard label="نشطون الآن" value={courierStats.active} icon={CheckCircle2} accent="var(--con-success)" loading={courierLoading} />
            <KPICard label="في التوصيل" value={courierStats.onDelivery} icon={Bike} accent="var(--con-info)" loading={courierLoading} />
            <KPICard label="قيد المراجعة" value={courierStats.pending} icon={Clock} accent="var(--con-warning)" loading={courierLoading} />
          </KPIGrid>

          <Toolbar
            search={courierSearch}
            onSearch={setCourierSearch}
            searchPlaceholder="ابحث بالاسم أو الجوال..."
          >
            <Select
              value={courierStatusFilter}
              onChange={setCourierStatusFilter}
              options={[
                { value: "all", label: "كل الحالات" },
                { value: "active", label: "نشط" },
                { value: "on_delivery", label: "في التوصيل" },
                { value: "inactive", label: "غير نشط" },
                { value: "pending", label: "قيد المراجعة" },
              ]}
              style={{ minWidth: 160 }}
            />
          </Toolbar>

          <Card noPadding>
            <Table headers={["المندوب", "رقم الجوال", "المدينة", "المركبة", "التقييم", "إجمالي الطلبات", "الحالة", ""]} isEmpty={!courierLoading && filteredCouriers.length === 0} emptyIcon={Users} emptyText="لا توجد نتائج تطابق المعايير المحددة">
              {courierLoading ? (
                <SkeletonRows rows={4} cols={8} />
              ) : (
                filteredCouriers.map((courier) => {
                  const sc = courierStatusConfig[courier.status];
                  return (
                    <tr key={courier.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div style={{ width: "2rem", height: "2rem", borderRadius: "var(--con-radius)", background: "var(--con-brand-subtle)", color: "var(--con-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--con-text-caption)", fontWeight: 600, flexShrink: 0 }}>{initials(courier.full_name)}</div>
                          <span style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>{courier.full_name}</span>
                        </div>
                      </td>
                      <td className="con-td-mono">{courier.phone}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--con-text-secondary)" }}>
                          <MapPin size={12} style={{ color: "var(--con-text-muted)" }} />
                          {courier.city ?? "—"}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          {courier.vehicle_type === "سيارة" ? <Truck size={13} style={{ color: "var(--con-text-muted)" }} /> : <Bike size={13} style={{ color: "var(--con-text-muted)" }} />}
                          <span style={{ color: "var(--con-text-secondary)" }}>{courier.vehicle_type ?? "—"}</span>
                        </div>
                      </td>
                      <td>
                        {courier.rating != null ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Star size={12} style={{ color: "var(--con-warning)", fill: "var(--con-warning)" }} />
                            <span className="con-mono" style={{ color: "var(--con-text-primary)" }}>{courier.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--con-text-muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <Package size={12} style={{ color: "var(--con-text-muted)" }} />
                          <span className="con-mono" style={{ color: "var(--con-text-secondary)" }}>{(courier.total_orders ?? 0).toLocaleString("ar-SA")}</span>
                        </div>
                      </td>
                      <td><Badge variant={sc?.variant ?? "muted"}>{sc?.label ?? courier.status}</Badge></td>
                      <td><IconButton icon={Eye} title="عرض" /></td>
                    </tr>
                  );
                })
              )}
            </Table>
            {!courierLoading && filteredCouriers.length > 0 && (
              <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--con-border-default)", display: "flex", justifyContent: "space-between", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                <span>{filteredCouriers.length} مندوب</span>
                <span>نشط: {filteredCouriers.filter((c) => c.status === "active").length} · في التوصيل: {filteredCouriers.filter((c) => c.status === "on_delivery").length}</span>
              </div>
            )}
          </Card>
        </Fragment>
      )}

      {activeTab === "applications" && (
        <Fragment>
          <KPIGrid cols="repeat(auto-fit, minmax(160px, 1fr))">
            <KPICard label="إجمالي الطلبات" value={appStats.total} icon={FileText} accent="var(--con-brand)" loading={appLoading} />
            <KPICard label="بانتظار المراجعة" value={appStats.pending} icon={Clock} accent="var(--con-warning)" loading={appLoading} />
            <KPICard label="قيد المراجعة" value={appStats.under_review} icon={Eye} accent="var(--con-info)" loading={appLoading} />
            <KPICard label="مقبولة" value={appStats.approved} icon={CheckCircle2} accent="var(--con-success)" loading={appLoading} />
            <KPICard label="مرفوضة" value={appStats.rejected} icon={XCircle} accent="var(--con-danger)" loading={appLoading} />
          </KPIGrid>

          <Toolbar search={appSearch} onSearch={setAppSearch} searchPlaceholder="ابحث بالاسم أو رقم الطلب أو الجوال...">
            <Select
              value={appStatusFilter}
              onChange={setAppStatusFilter}
              options={[
                { value: "all", label: "كل الحالات" },
                { value: "pending", label: "بانتظار" },
                { value: "under_review", label: "قيد المراجعة" },
                { value: "requires_correction", label: "استكمال مطلوب" },
                { value: "approved", label: "مقبولة" },
                { value: "rejected", label: "مرفوضة" },
              ]}
              style={{ minWidth: 170 }}
            />
          </Toolbar>

          <Card noPadding>
            <Table headers={["رقم الطلب", "مقدم الطلب", "الجوال", "المدينة", "المركبة", "تاريخ التقديم", "الحالة", "إجراءات"]} isEmpty={!appLoading && filteredApps.length === 0} emptyIcon={FileText} emptyText="لا توجد طلبات تسجيل تطابق المعايير المحددة">
              {appLoading ? (
                <SkeletonRows rows={4} cols={8} />
              ) : (
                filteredApps.map((app) => {
                  const sc = appStatusConfig[app.status];
                  const isActionable = app.status === "pending" || app.status === "under_review" || app.status === "requires_correction";
                  return (
                    <tr key={app.id}>
                      <td className="con-td-mono">{app.app_ref}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div style={{ width: "2rem", height: "2rem", borderRadius: "var(--con-radius)", background: "var(--con-brand-subtle)", color: "var(--con-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--con-text-caption)", fontWeight: 600, flexShrink: 0 }}>{initials(app.full_name)}</div>
                          <span style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>{app.full_name}</span>
                        </div>
                      </td>
                      <td className="con-td-mono">{app.phone}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--con-text-secondary)" }}>
                          <MapPin size={12} style={{ color: "var(--con-text-muted)" }} />
                          {app.city}
                        </div>
                      </td>
                      <td>
                        {app.has_vehicle ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            {app.vehicle_type === "سيارة" ? <Truck size={13} style={{ color: "var(--con-text-muted)" }} /> : <Bike size={13} style={{ color: "var(--con-text-muted)" }} />}
                            <span style={{ color: "var(--con-text-secondary)" }}>{app.vehicle_type ?? "—"}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--con-text-muted)" }}>بدون مركبة</span>
                        )}
                      </td>
                      <td className="con-td-mono">{formatDate(app.created_at)}</td>
                      <td><Badge variant={sc?.variant ?? "muted"}>{sc?.label ?? app.status}</Badge></td>
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                          <IconButton icon={Eye} onClick={() => setSelectedApp(app)} title="عرض التفاصيل" variant="brand" />
                          {isActionable && (
                            <>
                              <IconButton icon={ThumbsUp} onClick={() => handleApprove(app)} title="قبول" variant="brand" />
                              <IconButton icon={ThumbsDown} onClick={() => { setRejectDialogApp(app); setRejectReason(""); }} title="رفض" variant="danger" />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </Table>
            {!appLoading && filteredApps.length > 0 && (
              <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--con-border-default)", display: "flex", justifyContent: "space-between", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                <span>{filteredApps.length} طلب</span>
                <span>بانتظار: {filteredApps.filter((a) => a.status === "pending").length} · مقبولة: {filteredApps.filter((a) => a.status === "approved").length}</span>
              </div>
            )}
          </Card>
        </Fragment>
      )}

      <Modal
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={selectedApp?.full_name}
        width={760}
        actions={
          selectedApp && (selectedApp.status === "pending" || selectedApp.status === "under_review" || selectedApp.status === "requires_correction") ? (
            <>
              <Button variant="ghost" onClick={() => markUnderReview(selectedApp)} disabled={actionLoading === selectedApp.id}>بدء/تحديث المراجعة</Button>
              <Button variant="ghost" onClick={() => requestCorrection(selectedApp)} disabled={actionLoading === selectedApp.id}>طلب استكمال</Button>
              <Button onClick={() => handleApprove(selectedApp)} disabled={actionLoading === selectedApp.id} icon={ThumbsUp}>قبول الطلب</Button>
              <Button variant="danger" onClick={() => { setRejectDialogApp(selectedApp); setRejectReason(""); }} disabled={actionLoading === selectedApp.id} icon={ThumbsDown}>رفض الطلب</Button>
            </>
          ) : undefined
        }
      >
        {selectedApp && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "var(--con-radius)", background: "var(--con-brand-subtle)", color: "var(--con-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{initials(selectedApp.full_name)}</div>
              <div>
                <div style={{ fontSize: "var(--con-text-card-title)", fontWeight: 700, color: "var(--con-text-primary)" }}>{selectedApp.full_name}</div>
                <div className="con-mono" style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{selectedApp.app_ref}</div>
              </div>
              <div style={{ marginRight: "auto" }}>
                <Badge variant={appStatusConfig[selectedApp.status]?.variant ?? "muted"}>{appStatusConfig[selectedApp.status]?.label ?? selectedApp.status}</Badge>
              </div>
            </div>

            <Collapsible defaultOpen>
              <Section title={<CollapsibleTrigger className="flex items-center gap-2 cursor-pointer w-full hover:opacity-80">بيانات مقدم الطلب</CollapsibleTrigger>}>
                <CollapsibleContent>
                  <DetailGrid>
                    <DetailField icon={CreditCard} label="الهوية الوطنية" value={selectedApp.national_id} mono />
                    <DetailField icon={Mail} label="البريد الإلكتروني" value={selectedApp.email} mono />
                    <DetailField icon={Phone} label="رقم الجوال" value={selectedApp.phone} mono />
                    <DetailField icon={MapPin} label="المدينة" value={selectedApp.city} />
                    <DetailField icon={Calendar} label="تاريخ الميلاد" value={selectedApp.date_of_birth ?? "—"} />
                    <DetailField icon={Calendar} label="تاريخ التقديم" value={formatDate(selectedApp.created_at)} mono />
                  </DetailGrid>
                </CollapsibleContent>
              </Section>
            </Collapsible>

            {selectedApp.has_vehicle && (
              <Section title="بيانات المركبة">
                <DetailGrid>
                  <DetailField icon={Truck} label="النوع" value={selectedApp.vehicle_type ?? "—"} />
                  <DetailField icon={Car} label="الموديل" value={selectedApp.vehicle_model ?? "—"} />
                  <DetailField icon={Calendar} label="السنة" value={selectedApp.vehicle_year?.toString() ?? "—"} mono />
                  <DetailField icon={Shield} label="اللوحة" value={selectedApp.plate_number ?? "—"} mono />
                </DetailGrid>
              </Section>
            )}

            <Section title="المستندات المرفقة">
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
            </Section>

            <Section title="التحقق من onboarding">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem", marginBottom: "0.75rem" }}>
                {[
                  { key: "identity", label: "مطابقة وثائق الهوية", icon: ShieldCheck },
                  { key: "liveness", label: "اجتياز التحقق الحيوي", icon: ScanFace },
                  { key: "license", label: "رخصة القيادة صالحة", icon: Car },
                  { key: "bank", label: "توثيق الحساب البنكي", icon: FileText },
                  { key: "vehicleDocs", label: "وثائق المركبة", icon: Truck },
                  { key: "contact", label: "البيانات التواصلية صحيحة", icon: Phone },
                ].map((item) => {
                  const checked = verificationChecks[item.key as keyof VerificationChecks];
                  return (
                    <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: checked ? "var(--con-brand-subtle)" : "var(--con-bg-elevated)", border: `1px solid ${checked ? "var(--con-border-brand)" : "var(--con-border-default)"}`, borderRadius: "var(--con-radius)", padding: "0.55rem 0.75rem", fontSize: "var(--con-text-caption)", color: checked ? "var(--con-text-primary)" : "var(--con-text-secondary)", cursor: "pointer" }}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(val) => {
                          setVerificationError("");
                          setVerificationChecks((prev) => ({ ...prev, [item.key]: !!val }));
                        }}
                      />
                      <item.icon size={13} />
                      {item.label}
                    </label>
                  );
                })}
              </div>
              <TextArea value={reviewNotes} onChange={(v) => { setVerificationError(""); setReviewNotes(v); }} placeholder="ملاحظات المراجع أو متطلبات الاستكمال" rows={3} />
              {verificationError && <p style={{ margin: "0.5rem 0 0", color: "var(--con-danger)", fontSize: "var(--con-text-caption)" }}>{verificationError}</p>}
            </Section>

            {selectedApp.admin_notes && (
              <Section title="ملاحظات المراجع">
                <p style={{ margin: 0, fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)", lineHeight: 1.7 }}>{selectedApp.admin_notes}</p>
              </Section>
            )}

            {selectedApp.reviewed_by && (
              <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                تمت المراجعة بواسطة: <span className="con-mono">{selectedApp.reviewed_by}</span>
                {selectedApp.reviewed_at && ` · ${formatDate(selectedApp.reviewed_at)}`}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={!!approveDialogApp} onOpenChange={(open) => { if (!open) setApproveDialogApp(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد القبول</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد قبول طلب <strong>{approveDialogApp?.full_name}</strong>؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveDialogApp && executeApprove(approveDialogApp)}
              style={{ background: "var(--con-success)" }}
            >
              تأكيد القبول
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={!!rejectDialogApp} onOpenChange={(open) => { if (!open) { setRejectDialogApp(null); setRejectReason(""); } }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الرفض</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رفض طلب <strong>{rejectDialogApp?.full_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div style={{ padding: "8px 0" }}>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="سبب الرفض (إلزامي)"
              rows={3}
              className="con-input"
              style={{ width: "100%", resize: "none", fontSize: "var(--con-text-table)" }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectDialogApp && handleReject(rejectDialogApp, rejectReason)}
              disabled={!rejectReason.trim()}
              style={{ background: "var(--con-danger)", opacity: rejectReason.trim() ? 1 : 0.5 }}
            >
              تأكيد الرفض
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </PageWrapper>
  );
}
