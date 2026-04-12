import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/admin/auth";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import * as XLSX from "xlsx";
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
  Upload,
  MessageSquare,
  Bell,
  Send,
  Download,
  Edit2,
  Trash2,
  Pause,
  GraduationCap,
  Ban,
  TrendingUp,
  Wallet,
  Briefcase,
  User,
  AlertTriangle,
  Filter,
  ChevronUp,
  ChevronDown,
  Columns,
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
  email?: string;
  status: "active" | "inactive" | "on_delivery" | "pending" | "on_leave" | "terminated" | "suspended" | "training";
  city?: string;
  rating?: number;
  total_orders?: number;
  vehicle_type?: string;
  created_at: string;
  app_id?: string;
  app_name?: string;
  nationality?: string;
  iqama_number?: string;
  photo_url?: string;
  monthly_orders?: number;
  extra_info?: Record<string, string>;
  supervisor?: string;
  contract_type?: string;
  registration_date?: string;
  admin_notes?: string;
  last_active?: string;
  status_changed_at?: string;
  app_violations?: { date: string; type: string; amount?: number; notes?: string }[];
  traffic_violations?: { date: string; type: string; fine_amount?: number; plate?: string; notes?: string }[];
  has_company_vehicle?: boolean;
  delivery_success_rate?: number;
  avg_delivery_time?: number;
  cancellation_rate?: number;
  total_earnings?: number;
  monthly_earnings?: number;
  pending_payout?: number;
  completed_orders?: number;
  failed_orders?: number;
  joined_platforms?: string[];
  vehicle_model?: string;
  vehicle_year?: number;
  plate_number?: string;
  license_expiry?: string;
  insurance_expiry?: string;
  iban?: string;
  bank_name?: string;
  emergency_contact?: string;
  emergency_name?: string;
  notes_history?: { date: string; note: string; by: string }[];
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
  status:
    | "pending"
    | "under_review"
    | "approved"
    | "rejected"
    | "requires_correction";
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  device_fingerprint?: string;
  supervisor?: string;
  contract_type?: string;
  rejection_category?: string;
  pending_notification?: boolean;
  created_at: string;
  updated_at?: string;
}

const CONTRACT_TYPE_OPTIONS = [
  { value: "دوام كامل", label: "دوام كامل" },
  { value: "دوام جزئي", label: "دوام جزئي" },
  { value: "عقد مؤقت", label: "عقد مؤقت" },
  { value: "حر (فريلانس)", label: "حر (فريلانس)" },
];

const REJECTION_CATEGORY_OPTIONS = [
  { value: "مستندات ناقصة", label: "مستندات ناقصة" },
  { value: "معلومات خاطئة", label: "معلومات خاطئة" },
  { value: "لا يستوفي الشروط", label: "لا يستوفي الشروط" },
  { value: "أخرى", label: "أخرى" },
];

function sendWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const intl = cleaned.startsWith("0") ? "966" + cleaned.slice(1) : cleaned;
  window.open(`https://wa.me/${intl}?text=${encodeURIComponent(message)}`, "_blank");
}

function sendEmail(email: string, subject: string, body: string) {
  window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
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

const courierStatusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "info" | "muted" | "danger" }
> = {
  active: { label: "يعمل", variant: "success" },
  inactive: { label: "لا يعمل", variant: "muted" },
  on_delivery: { label: "في التوصيل", variant: "info" },
  on_leave: { label: "إجازة", variant: "warning" },
  terminated: { label: "مفصول", variant: "danger" },
  suspended: { label: "متوقف", variant: "danger" },
  training: { label: "تحت التدريب", variant: "info" },
  pending: { label: "قيد المراجعة", variant: "warning" },
};

const appStatusConfig: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "info" | "danger";
    icon: typeof Clock;
  }
> = {
  pending: { label: "قيد الانتظار", variant: "warning", icon: Clock },
  under_review: { label: "قيد المراجعة", variant: "info", icon: Eye },
  approved: { label: "مقبول", variant: "success", icon: CheckCircle2 },
  rejected: { label: "مرفوض", variant: "danger", icon: XCircle },
  requires_correction: {
    label: "استكمال مطلوب",
    variant: "warning",
    icon: AlertCircle,
  },
};

const APP_NAME_OPTIONS = [
  { value: "jahez", label: "Jahez" },
  { value: "hungerstation", label: "HungerStation" },
  { value: "marsool", label: "Marsool" },
  { value: "toyor", label: "Toyor" },
  { value: "mrsool", label: "Mrsool" },
  { value: "noon", label: "Noon" },
  { value: "amazon", label: "Amazon" },
];

const CITY_OPTIONS = [
  { value: "الرياض", label: "الرياض" },
  { value: "جدة", label: "جدة" },
  { value: "الدمام", label: "الدمام" },
  { value: "مكة", label: "مكة" },
  { value: "المدينة", label: "المدينة" },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: "دراجة", label: "دراجة" },
  { value: "سيارة", label: "سيارة" },
  { value: "شاحنة صغيرة", label: "شاحنة صغيرة" },
];

const KNOWN_IMPORT_COLUMNS = [
  "full_name",
  "phone",
  "email",
  "city",
  "vehicle_type",
  "app_id",
  "app_name",
  "nationality",
  "iqama_number",
];

const mockCouriers: Courier[] = [];

const mockApplications: DriverApplication[] = [];

function getOnlineStatus(lastActive?: string): { color: string; label: string } {
  if (!lastActive) return { color: "#64748b", label: "غير متصل" };
  const diff = Date.now() - new Date(lastActive).getTime();
  const minutes = diff / 60000;
  if (minutes < 60) return { color: "#22c55e", label: `منذ ${Math.round(minutes)} دقيقة` };
  const hours = minutes / 60;
  if (hours < 24) return { color: "#f59e0b", label: `منذ ${Math.round(hours)} ساعة` };
  const days = hours / 24;
  return { color: "#64748b", label: `منذ ${Math.round(days)} يوم` };
}

function initials(name: string) {
  return name.trim().charAt(0);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function DocBadge({
  label,
  url,
  icon: Icon,
}: {
  label: string;
  url?: string;
  icon: typeof FileText;
}) {
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
        background: hasDoc
          ? "var(--con-success-subtle)"
          : "var(--con-bg-elevated)",
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

const ALL_COLUMNS = [
  { key: "name", label: "المندوب", default: true },
  { key: "phone", label: "الجوال", default: true },
  { key: "city", label: "المدينة", default: true },
  { key: "vehicle", label: "المركبة", default: true },
  { key: "app", label: "التطبيق", default: true },
  { key: "nationality", label: "الجنسية", default: false },
  { key: "supervisor", label: "المشرف", default: false },
  { key: "contract", label: "التعاقد", default: false },
  { key: "registration", label: "التسجيل", default: false },
  { key: "rating", label: "التقييم", default: true },
  { key: "orders", label: "طلبات الشهر", default: true },
  { key: "status", label: "الحالة", default: true },
  { key: "classification", label: "التصنيف", default: true },
  { key: "iqama", label: "الإقامة", default: false },
  { key: "violations", label: "المخالفات", default: true },
  { key: "actions", label: "إجراءات", default: true },
];

const CLASSIFICATION_OPTIONS = [
  { value: "نجم", label: "نجم" },
  { value: "ذهبي", label: "ذهبي" },
  { value: "فضي", label: "فضي" },
  { value: "برونزي", label: "برونزي" },
];

function getClassification(c: Courier): string {
  const r = c.rating ?? 0;
  const o = c.monthly_orders ?? 0;
  if (r >= 4.8 && o >= 50) return "نجم";
  if (r >= 4.5 && o >= 30) return "ذهبي";
  if (r >= 4.0 && o >= 15) return "فضي";
  return "برونزي";
}

function getClassificationVariant(cls: string): "success" | "warning" | "info" | "muted" {
  if (cls === "نجم") return "success";
  if (cls === "ذهبي") return "warning";
  if (cls === "فضي") return "info";
  return "muted";
}

function loadSavedColumns(): Set<string> {
  try {
    const saved = localStorage.getItem("fll_courier_columns");
    if (saved) {
      const arr = JSON.parse(saved) as string[];
      if (Array.isArray(arr) && arr.length > 0) return new Set(arr);
    }
  } catch {}
  return new Set(ALL_COLUMNS.filter((c) => c.default).map((c) => c.key));
}

export default function AdminCouriers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"couriers" | "applications">(
    "couriers",
  );
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [courierLoading, setCourierLoading] = useState(true);
  const [courierSearch, setCourierSearch] = useState("");
  const [courierStatusFilter, setCourierStatusFilter] = useState<string>("all");
  const [applications, setApplications] =
    useState<DriverApplication[]>([]);
  const [appLoading, setAppLoading] = useState(true);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<DriverApplication | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogApp, setRejectDialogApp] =
    useState<DriverApplication | null>(null);
  const [approveDialogApp, setApproveDialogApp] =
    useState<DriverApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCategory, setRejectCategory] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [verificationError, setVerificationError] = useState("");

  // Correction/Return modal state
  const [correctionModalApp, setCorrectionModalApp] = useState<DriverApplication | null>(null);
  const [correctionNote, setCorrectionNote] = useState("");
  const [correctionPendingNotification, setCorrectionPendingNotification] = useState(false);

  // View / Edit / Delete courier state
  const [viewCourier, setViewCourier] = useState<Courier | null>(null);
  const [editCourier, setEditCourier] = useState<Courier | null>(null);
  const [deleteCourierId, setDeleteCourierId] = useState<string | null>(null);

  // Extra filters
  const [contractTypeFilter, setContractTypeFilter] = useState<string>("all");
  const [appNameFilter, setAppNameFilter] = useState<string>("all");

  // Advanced filter popup
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    ratingMin: "", ratingMax: "",
    ordersMin: "", ordersMax: "",
    cities: [] as string[],
    apps: [] as string[],
    classifications: [] as string[],
    dateFrom: "", dateTo: "",
  });
  const advancedFilterRef = useRef<HTMLDivElement>(null);

  // Column sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(loadSavedColumns);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  // Add Courier Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    city: "",
    vehicle_type: "",
    app_id: "",
    app_name: "",
    nationality: "",
    iqama_number: "",
    photo_url: "",
    supervisor: "",
    contract_type: "",
  });

  // Excel Import Modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([]);
  const [importExtraCols, setImportExtraCols] = useState<string[]>([]);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [verificationChecks, setVerificationChecks] =
    useState<VerificationChecks>({
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

  const fetchApplications = useCallback(async () => {
    setAppLoading(true);
    if (!supabase) {
      setAppLoading(false);
      return;
    }
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

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Persist column visibility
  useEffect(() => {
    localStorage.setItem("fll_courier_columns", JSON.stringify([...visibleColumns]));
  }, [visibleColumns]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (advancedFilterRef.current && !advancedFilterRef.current.contains(e.target as Node)) {
        setShowAdvancedFilter(false);
      }
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!selectedApp) return;
    setReviewNotes(selectedApp.admin_notes ?? "");
    setVerificationError("");
    setVerificationChecks({
      identity: Boolean(
        (selectedApp.id_front_url || selectedApp.doc_national_id) &&
        (selectedApp.id_back_url || selectedApp.doc_national_id_back),
      ),
      liveness: Boolean(
        selectedApp.liveness_passed ||
        selectedApp.selfie_url ||
        selectedApp.doc_selfie,
      ),
      license: Boolean(
        selectedApp.license_url || selectedApp.doc_driver_license,
      ),
      bank: Boolean(selectedApp.bank_cert_url || selectedApp.doc_bank_cert),
      vehicleDocs:
        !selectedApp.has_vehicle ||
        Boolean(
          (selectedApp.vehicle_registration_url ||
            selectedApp.doc_vehicle_reg) &&
          (selectedApp.vehicle_insurance_url ||
            selectedApp.doc_vehicle_insurance),
        ),
      contact: Boolean(selectedApp.email_verified || selectedApp.phone),
    });
  }, [selectedApp]);

  async function updateApplicationReview(
    app: DriverApplication,
    patch: Partial<DriverApplication>,
  ) {
    const payload = {
      ...patch,
      reviewed_by: user?.email || "admin",
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
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, ...payload } : a)),
      );
      setSelectedApp((prev) =>
        prev && prev.id === app.id ? { ...prev, ...payload } : prev,
      );
    } catch (e) {
      console.error(e);
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, ...payload } : a)),
      );
      setSelectedApp((prev) =>
        prev && prev.id === app.id ? { ...prev, ...payload } : prev,
      );
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

  function openCorrectionModal(app: DriverApplication) {
    setCorrectionModalApp(app);
    setCorrectionNote(reviewNotes.trim());
    setCorrectionPendingNotification(false);
  }

  async function executeCorrectionReturn() {
    if (!correctionModalApp) return;
    const note = correctionNote.trim();
    if (!note) return;
    await updateApplicationReview(correctionModalApp, {
      status: "requires_correction",
      admin_notes: note,
      pending_notification: correctionPendingNotification || undefined,
    });
    setCorrectionModalApp(null);
    setCorrectionNote("");
    setCorrectionPendingNotification(false);
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
      const res = await fetch(
        `${API_BASE}/driver/applications/${app.id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ admin_email: user?.email || "admin" }),
        },
      );
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === app.id ? { ...a, status: "approved" as const } : a,
          ),
        );
        setSelectedApp(null);
        toast.success(`تم قبول طلب ${app.full_name} بنجاح`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(
          `فشل القبول: ${(err as Record<string, string>).message ?? res.statusText}`,
        );
      }
    } catch (e) {
      console.error(e);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === app.id ? { ...a, status: "approved" as const } : a,
        ),
      );
      setSelectedApp(null);
      toast.success(`تم قبول طلب ${app.full_name}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(app: DriverApplication, reason: string, category: string) {
    if (!reason.trim()) return;
    setRejectDialogApp(null);
    setRejectReason("");
    setRejectCategory("");
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
      const res = await fetch(
        `${API_BASE}/driver/applications/${app.id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ admin_email: user?.email || "admin", reason, rejection_category: category || undefined }),
        },
      );
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === app.id
              ? { ...a, status: "rejected" as const, admin_notes: reason, rejection_category: category || undefined }
              : a,
          ),
        );
        setSelectedApp(null);
        toast.success(`تم رفض طلب ${app.full_name}`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(
          `فشل الرفض: ${(err as Record<string, string>).message ?? res.statusText}`,
        );
      }
    } catch (e) {
      console.error(e);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? { ...a, status: "rejected" as const, admin_notes: reason, rejection_category: category || undefined }
            : a,
        ),
      );
      setSelectedApp(null);
      toast.success(`تم رفض طلب ${app.full_name}`);
    } finally {
      setActionLoading(null);
    }
  }

  const basicFilteredCouriers = couriers.filter((c) => {
    const q = courierSearch.toLowerCase();
    const matchSearch =
      !q ||
      c.full_name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.city && c.city.includes(q)) ||
      (c.app_id && c.app_id.toLowerCase().includes(q)) ||
      (c.app_name && c.app_name.toLowerCase().includes(q)) ||
      (c.nationality && c.nationality.includes(q)) ||
      (c.iqama_number && c.iqama_number.includes(q));
    const matchStatus =
      courierStatusFilter === "all" || c.status === courierStatusFilter;
    const matchContract =
      contractTypeFilter === "all" || c.contract_type === contractTypeFilter;
    const matchApp =
      appNameFilter === "all" || c.app_name === appNameFilter;
    return matchSearch && matchStatus && matchContract && matchApp;
  });

  const advancedFilterCount = [
    advancedFilters.ratingMin || advancedFilters.ratingMax,
    advancedFilters.ordersMin || advancedFilters.ordersMax,
    advancedFilters.cities.length > 0,
    advancedFilters.apps.length > 0,
    advancedFilters.classifications.length > 0,
    advancedFilters.dateFrom || advancedFilters.dateTo,
  ].filter(Boolean).length;

  const filteredCouriers = (() => {
    let result = basicFilteredCouriers.filter((c) => {
      const af = advancedFilters;
      if (af.ratingMin && (c.rating ?? 0) < Number(af.ratingMin)) return false;
      if (af.ratingMax && (c.rating ?? 0) > Number(af.ratingMax)) return false;
      if (af.ordersMin && (c.monthly_orders ?? 0) < Number(af.ordersMin)) return false;
      if (af.ordersMax && (c.monthly_orders ?? 0) > Number(af.ordersMax)) return false;
      if (af.cities.length > 0 && !af.cities.includes(c.city ?? "")) return false;
      if (af.apps.length > 0 && !af.apps.includes(c.app_name ?? "")) return false;
      if (af.classifications.length > 0 && !af.classifications.includes(getClassification(c))) return false;
      if (af.dateFrom) { const rd = c.registration_date || c.created_at; if (rd < af.dateFrom) return false; }
      if (af.dateTo) { const rd = c.registration_date || c.created_at; if (rd > af.dateTo) return false; }
      return true;
    });
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let va: string | number = 0, vb: string | number = 0;
        switch (sortColumn) {
          case "name": va = a.full_name; vb = b.full_name; break;
          case "rating": va = a.rating ?? 0; vb = b.rating ?? 0; break;
          case "orders": va = a.monthly_orders ?? 0; vb = b.monthly_orders ?? 0; break;
          case "city": va = a.city ?? ""; vb = b.city ?? ""; break;
          case "registration": va = a.registration_date || a.created_at; vb = b.registration_date || b.created_at; break;
          case "violations": va = (a.app_violations?.length ?? 0) + (a.traffic_violations?.length ?? 0); vb = (b.app_violations?.length ?? 0) + (b.traffic_violations?.length ?? 0); break;
          default: return 0;
        }
        if (typeof va === "string" && typeof vb === "string") { const cmp = va.localeCompare(vb, "ar"); return sortDirection === "asc" ? cmp : -cmp; }
        return sortDirection === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
      });
    }
    return result;
  })();

  function handleSort(col: string) {
    if (sortColumn === col) {
      if (sortDirection === "asc") setSortDirection("desc");
      else { setSortColumn(null); setSortDirection("asc"); }
    } else { setSortColumn(col); setSortDirection("asc"); }
  }

  function toggleColumnVisibility(key: string) {
    setVisibleColumns((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }

  function clearAdvancedFilters() {
    setAdvancedFilters({ ratingMin: "", ratingMax: "", ordersMin: "", ordersMax: "", cities: [], apps: [], classifications: [], dateFrom: "", dateTo: "" });
  }

  const courierStats = {
    total: couriers.length,
    active: couriers.filter((c) => c.status === "active").length,
    onDelivery: couriers.filter((c) => c.status === "on_delivery").length,
    pending: couriers.filter((c) => c.status === "pending").length,
    monthlyOrders: couriers.reduce((sum, c) => sum + (c.monthly_orders ?? 0), 0),
  };

  async function handleEditCourier() {
    if (!editCourier) return;
    try {
      if (supabase) {
        const { error } = await supabase
          .from("couriers")
          .update(editCourier)
          .eq("id", editCourier.id);
        if (error) console.error("Supabase update error:", error);
      }
    } catch (e) {
      console.error(e);
    }
    setCouriers((prev) =>
      prev.map((c) => (c.id === editCourier.id ? { ...editCourier } : c)),
    );
    toast.success(`تم تحديث بيانات ${editCourier.full_name}`);
    setEditCourier(null);
  }

  async function handleDeleteCourier() {
    if (!deleteCourierId) return;
    const target = couriers.find((c) => c.id === deleteCourierId);
    try {
      if (supabase) {
        const { error } = await supabase
          .from("couriers")
          .delete()
          .eq("id", deleteCourierId);
        if (error) console.error("Supabase delete error:", error);
      }
    } catch (e) {
      console.error(e);
    }
    setCouriers((prev) => prev.filter((c) => c.id !== deleteCourierId));
    toast.success(`تم حذف المندوب ${target?.full_name ?? ""}`);
    setDeleteCourierId(null);
  }

  async function handleQuickStatusChange(courierId: string, newStatus: Courier["status"]) {
    const now = new Date().toISOString();
    try {
      if (supabase) {
        const { error } = await supabase
          .from("couriers")
          .update({ status: newStatus, status_changed_at: now })
          .eq("id", courierId);
        if (error) console.error("Supabase status update error:", error);
      }
    } catch (e) {
      console.error(e);
    }
    setCouriers((prev) =>
      prev.map((c) =>
        c.id === courierId ? { ...c, status: newStatus, status_changed_at: now } : c,
      ),
    );
    const label = courierStatusConfig[newStatus]?.label ?? newStatus;
    toast.success(`تم تغيير الحالة إلى: ${label}`);
  }

  async function handleAddCourier() {
    if (!addForm.full_name.trim() || !addForm.phone.trim()) {
      toast.error("الاسم ورقم الجوال مطلوبان");
      return;
    }
    const newCourier: Courier = {
      id: crypto.randomUUID(),
      full_name: addForm.full_name.trim(),
      phone: addForm.phone.trim(),
      email: addForm.email.trim() || undefined,
      status: "pending",
      city: addForm.city || undefined,
      vehicle_type: addForm.vehicle_type || undefined,
      app_id: addForm.app_id.trim() || undefined,
      app_name: addForm.app_name || undefined,
      nationality: addForm.nationality.trim() || undefined,
      iqama_number: addForm.iqama_number.trim() || undefined,
      photo_url: addForm.photo_url.trim() || undefined,
      supervisor: addForm.supervisor.trim() || undefined,
      contract_type: addForm.contract_type || undefined,
      created_at: new Date().toISOString(),
      registration_date: new Date().toISOString().split("T")[0],
      monthly_orders: 0,
      total_orders: 0,
    };
    try {
      if (supabase) {
        const { error } = await supabase.from("couriers").insert(newCourier);
        if (error) console.error("Supabase insert error:", error);
      }
    } catch (e) {
      console.error(e);
    }
    setCouriers((prev) => [newCourier, ...prev]);
    setAddForm({ full_name: "", phone: "", email: "", city: "", vehicle_type: "", app_id: "", app_name: "", nationality: "", iqama_number: "", photo_url: "", supervisor: "", contract_type: "" });
    setAddModalOpen(false);
    toast.success(`تم إضافة المندوب ${newCourier.full_name}`);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        if (!jsonData.length) {
          toast.error("الملف فارغ أو غير صالح");
          return;
        }
        const allCols = Object.keys(jsonData[0]);
        const extraCols = allCols.filter((col) => !KNOWN_IMPORT_COLUMNS.includes(col));
        setImportExtraCols(extraCols);
        const rows = jsonData.map((row) => {
          const mapped: Record<string, string> = {};
          for (const col of allCols) {
            mapped[col] = String(row[col] ?? "");
          }
          return mapped;
        });
        setImportPreview(rows);
      } catch (err) {
        console.error(err);
        toast.error("فشل في قراءة الملف");
      }
    };
    reader.readAsBinaryString(file);
  }

  async function executeImport() {
    if (!importPreview.length) return;
    const newCouriers: Courier[] = importPreview.map((row) => {
      const extraInfo: Record<string, string> = {};
      for (const col of importExtraCols) {
        if (row[col]) extraInfo[col] = row[col];
      }
      return {
        id: crypto.randomUUID(),
        full_name: row.full_name || "بدون اسم",
        phone: row.phone || "",
        email: row.email || undefined,
        status: "pending" as const,
        city: row.city || undefined,
        vehicle_type: row.vehicle_type || undefined,
        app_id: row.app_id || undefined,
        app_name: row.app_name || undefined,
        nationality: row.nationality || undefined,
        iqama_number: row.iqama_number || undefined,
        created_at: new Date().toISOString(),
        monthly_orders: 0,
        total_orders: 0,
        extra_info: Object.keys(extraInfo).length > 0 ? extraInfo : undefined,
      };
    });
    try {
      if (supabase) {
        const { error } = await supabase.from("couriers").insert(newCouriers);
        if (error) console.error("Supabase bulk insert error:", error);
      }
    } catch (e) {
      console.error(e);
    }
    setCouriers((prev) => [...newCouriers, ...prev]);
    setImportPreview([]);
    setImportExtraCols([]);
    setImportModalOpen(false);
    if (importFileRef.current) importFileRef.current.value = "";
    toast.success(`تم استيراد ${newCouriers.length} مندوب بنجاح`);
  }

  const filteredApps = applications.filter((a) => {
    const matchSearch =
      a.full_name.includes(appSearch) ||
      a.app_ref.includes(appSearch) ||
      a.phone.includes(appSearch);
    const matchStatus =
      appStatusFilter === "all" || a.status === appStatusFilter;
    return matchSearch && matchStatus;
  });

  const appStats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    under_review: applications.filter((a) => a.status === "under_review")
      .length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const pendingCount = appStats.pending + appStats.under_review;

  function handleExcelExport() {
    const exportData = filteredCouriers.map((c, i) => ({
      "#": i + 1,
      "الاسم الكامل": c.full_name,
      "رقم الجوال": c.phone,
      "البريد الإلكتروني": c.email || "-",
      "المدينة": c.city || "-",
      "التطبيق": c.app_name || "-",
      "رقم ID التطبيق": c.app_id || "-",
      "الجنسية": c.nationality || "-",
      "رقم الإقامة": c.iqama_number || "-",
      "نوع المركبة": c.vehicle_type || "-",
      "التقييم": c.rating ?? "-",
      "طلبات الشهر": c.monthly_orders ?? 0,
      "الحالة": courierStatusConfig[c.status]?.label || c.status,
      "المشرف المباشر": c.supervisor || "-",
      "نوع التعاقد": c.contract_type || "-",
      "تاريخ التسجيل": c.registration_date || c.created_at || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    ws["!cols"] = [
      { wch: 5 },   // #
      { wch: 25 },  // الاسم
      { wch: 15 },  // الجوال
      { wch: 25 },  // الإيميل
      { wch: 12 },  // المدينة
      { wch: 15 },  // التطبيق
      { wch: 15 },  // ID التطبيق
      { wch: 12 },  // الجنسية
      { wch: 15 },  // الإقامة
      { wch: 12 },  // المركبة
      { wch: 8 },   // التقييم
      { wch: 12 },  // طلبات الشهر
      { wch: 12 },  // الحالة
      { wch: 18 },  // المشرف
      { wch: 15 },  // التعاقد
      { wch: 15 },  // التسجيل
    ];

    ws["!rtl"] = true;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المناديب");

    XLSX.writeFile(wb, `مناديب_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("تم تصدير بيانات المناديب بنجاح");
  }

  function handleAppsExcelExport() {
    const exportData = filteredApps.map((a, i) => ({
      "#": i + 1,
      "رقم الطلب": a.app_ref,
      "الاسم": a.full_name,
      "الجوال": a.phone,
      "الإيميل": a.email || "-",
      "المدينة": a.city || "-",
      "نوع المركبة": a.vehicle_type || "-",
      "الحالة": appStatusConfig[a.status]?.label || a.status,
      "المشرف": a.supervisor || "-",
      "نوع التعاقد": a.contract_type || "-",
      "تاريخ التقديم": a.created_at ? a.created_at.slice(0, 10) : "-",
      "ملاحظات المراجعة": a.admin_notes || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    ws["!cols"] = [
      { wch: 5 },   // #
      { wch: 22 },  // رقم الطلب
      { wch: 25 },  // الاسم
      { wch: 15 },  // الجوال
      { wch: 25 },  // الإيميل
      { wch: 12 },  // المدينة
      { wch: 12 },  // المركبة
      { wch: 14 },  // الحالة
      { wch: 18 },  // المشرف
      { wch: 15 },  // التعاقد
      { wch: 15 },  // التقديم
      { wch: 25 },  // ملاحظات
    ];

    ws["!rtl"] = true;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "طلبات التسجيل");

    XLSX.writeFile(wb, `طلبات_تسجيل_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("تم تصدير طلبات التسجيل بنجاح");
  }

  return (
    <PageWrapper>
      <PageHeader
        icon={Users}
        title="المناديب"
        subtitle="إدارة المناديب النشطين وطلبات التسجيل الجديدة"
        actions={
          activeTab === "couriers" ? (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button icon={Download} variant="ghost" onClick={handleExcelExport}>
                تصدير Excel
              </Button>
              <Button icon={Upload} variant="ghost" onClick={() => setImportModalOpen(true)}>
                استيراد Excel
              </Button>
              <Button icon={Plus} onClick={() => setAddModalOpen(true)}>
                إضافة مندوب
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button icon={Download} variant="ghost" onClick={handleAppsExcelExport}>
                تصدير Excel
              </Button>
              <Button icon={RefreshCw} onClick={fetchApplications}>
                تحديث
              </Button>
            </div>
          )
        }
      />

      <Tabs
        active={activeTab}
        onChange={(key) => setActiveTab(key as "couriers" | "applications")}
        items={[
          {
            key: "couriers",
            label: "المناديب",
            icon: Users,
            count: courierStats.total,
          },
          {
            key: "applications",
            label: "طلبات التسجيل",
            icon: FileText,
            count: pendingCount,
          },
        ]}
      />

      {activeTab === "couriers" && (
        <Fragment>
          <KPIGrid>
            <KPICard
              label="إجمالي المناديب"
              value={courierStats.total}
              icon={Users}
              accent="var(--con-brand)"
              loading={courierLoading}
            />
            <KPICard
              label="نشطون الآن"
              value={courierStats.active}
              icon={CheckCircle2}
              accent="var(--con-success)"
              loading={courierLoading}
            />
            <KPICard
              label="في التوصيل"
              value={courierStats.onDelivery}
              icon={Bike}
              accent="var(--con-info)"
              loading={courierLoading}
            />
            <KPICard
              label="قيد المراجعة"
              value={courierStats.pending}
              icon={Clock}
              accent="var(--con-warning)"
              loading={courierLoading}
            />
            <KPICard
              label="طلبات الشهر"
              value={courierStats.monthlyOrders}
              icon={Package}
              accent="var(--con-brand)"
              loading={courierLoading}
            />
          </KPIGrid>

          <Toolbar
            search={courierSearch}
            onSearch={setCourierSearch}
            searchPlaceholder="ابحث بالاسم، الجوال، التطبيق، الجنسية، الإقامة..."
          >
            <Select
              value={courierStatusFilter}
              onChange={setCourierStatusFilter}
              options={[
                { value: "all", label: "كل الحالات" },
                ...Object.entries(courierStatusConfig).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
              style={{ minWidth: 160 }}
            />
            <Select
              value={contractTypeFilter}
              onChange={setContractTypeFilter}
              options={[
                { value: "all", label: "نوع التعاقد" },
                ...CONTRACT_TYPE_OPTIONS,
              ]}
              style={{ minWidth: 150 }}
            />
            <Select
              value={appNameFilter}
              onChange={setAppNameFilter}
              options={[
                { value: "all", label: "التطبيق" },
                ...APP_NAME_OPTIONS,
              ]}
              style={{ minWidth: 140 }}
            />
            {/* Advanced Filter Button */}
            <div style={{ position: "relative" }} ref={advancedFilterRef}>
              <button
                type="button"
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.45rem 0.75rem", borderRadius: "var(--con-radius)",
                  border: `1px solid ${advancedFilterCount > 0 ? "var(--con-border-brand)" : "var(--con-border-default)"}`,
                  background: advancedFilterCount > 0 ? "var(--con-brand-subtle)" : "var(--con-bg-elevated)",
                  color: advancedFilterCount > 0 ? "var(--con-brand)" : "var(--con-text-secondary)",
                  fontSize: "var(--con-text-caption)", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                <Filter size={14} />
                فلتر متقدم{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""}
              </button>
              {showAdvancedFilter && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
                  background: "var(--con-bg-card)", border: "1px solid var(--con-border-default)",
                  borderRadius: "var(--con-radius)", padding: "1rem", minWidth: 380, maxWidth: 420,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}>
                  <div style={{ fontSize: "var(--con-text-card-title)", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.75rem" }}>فلتر متقدم</div>
                  {/* Rating */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", fontWeight: 600, marginBottom: "0.25rem", display: "block" }}>التقييم</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input className="con-input" type="number" min={0} max={5} step={0.1} placeholder="من" value={advancedFilters.ratingMin} onChange={(e) => setAdvancedFilters((p) => ({ ...p, ratingMin: e.target.value }))} style={{ width: "100%", fontSize: "var(--con-text-caption)" }} />
                      <span style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>—</span>
                      <input className="con-input" type="number" min={0} max={5} step={0.1} placeholder="إلى" value={advancedFilters.ratingMax} onChange={(e) => setAdvancedFilters((p) => ({ ...p, ratingMax: e.target.value }))} style={{ width: "100%", fontSize: "var(--con-text-caption)" }} />
                    </div>
                  </div>
                  {/* Orders */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", fontWeight: 600, marginBottom: "0.25rem", display: "block" }}>عدد طلبات الشهر</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input className="con-input" type="number" min={0} placeholder="من" value={advancedFilters.ordersMin} onChange={(e) => setAdvancedFilters((p) => ({ ...p, ordersMin: e.target.value }))} style={{ width: "100%", fontSize: "var(--con-text-caption)" }} />
                      <span style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>—</span>
                      <input className="con-input" type="number" min={0} placeholder="إلى" value={advancedFilters.ordersMax} onChange={(e) => setAdvancedFilters((p) => ({ ...p, ordersMax: e.target.value }))} style={{ width: "100%", fontSize: "var(--con-text-caption)" }} />
                    </div>
                  </div>
                  {/* Cities */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", fontWeight: 600, marginBottom: "0.25rem", display: "block" }}>المدينة</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {["الرياض", "جدة", "الدمام", "مكة", "المدينة"].map((city) => (
                        <label key={city} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", borderRadius: "var(--con-radius)", border: `1px solid ${advancedFilters.cities.includes(city) ? "var(--con-border-brand)" : "var(--con-border-default)"}`, background: advancedFilters.cities.includes(city) ? "var(--con-brand-subtle)" : "var(--con-bg-elevated)", fontSize: "var(--con-text-caption)", color: advancedFilters.cities.includes(city) ? "var(--con-brand)" : "var(--con-text-secondary)", cursor: "pointer" }}>
                          <input type="checkbox" checked={advancedFilters.cities.includes(city)} onChange={() => setAdvancedFilters((p) => ({ ...p, cities: p.cities.includes(city) ? p.cities.filter((x) => x !== city) : [...p.cities, city] }))} style={{ display: "none" }} />
                          {city}
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Apps */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", fontWeight: 600, marginBottom: "0.25rem", display: "block" }}>التطبيق</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {APP_NAME_OPTIONS.map((app) => (
                        <label key={app.value} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", borderRadius: "var(--con-radius)", border: `1px solid ${advancedFilters.apps.includes(app.value) ? "var(--con-border-brand)" : "var(--con-border-default)"}`, background: advancedFilters.apps.includes(app.value) ? "var(--con-brand-subtle)" : "var(--con-bg-elevated)", fontSize: "var(--con-text-caption)", color: advancedFilters.apps.includes(app.value) ? "var(--con-brand)" : "var(--con-text-secondary)", cursor: "pointer" }}>
                          <input type="checkbox" checked={advancedFilters.apps.includes(app.value)} onChange={() => setAdvancedFilters((p) => ({ ...p, apps: p.apps.includes(app.value) ? p.apps.filter((x) => x !== app.value) : [...p.apps, app.value] }))} style={{ display: "none" }} />
                          {app.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Classification */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", fontWeight: 600, marginBottom: "0.25rem", display: "block" }}>التصنيف</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {CLASSIFICATION_OPTIONS.map((cls) => (
                        <label key={cls.value} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", borderRadius: "var(--con-radius)", border: `1px solid ${advancedFilters.classifications.includes(cls.value) ? "var(--con-border-brand)" : "var(--con-border-default)"}`, background: advancedFilters.classifications.includes(cls.value) ? "var(--con-brand-subtle)" : "var(--con-bg-elevated)", fontSize: "var(--con-text-caption)", color: advancedFilters.classifications.includes(cls.value) ? "var(--con-brand)" : "var(--con-text-secondary)", cursor: "pointer" }}>
                          <input type="checkbox" checked={advancedFilters.classifications.includes(cls.value)} onChange={() => setAdvancedFilters((p) => ({ ...p, classifications: p.classifications.includes(cls.value) ? p.classifications.filter((x) => x !== cls.value) : [...p.classifications, cls.value] }))} style={{ display: "none" }} />
                          {cls.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Date range */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", fontWeight: 600, marginBottom: "0.25rem", display: "block" }}>تاريخ التسجيل</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input className="con-input" type="date" value={advancedFilters.dateFrom} onChange={(e) => setAdvancedFilters((p) => ({ ...p, dateFrom: e.target.value }))} style={{ width: "100%", fontSize: "var(--con-text-caption)" }} />
                      <span style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>—</span>
                      <input className="con-input" type="date" value={advancedFilters.dateTo} onChange={(e) => setAdvancedFilters((p) => ({ ...p, dateTo: e.target.value }))} style={{ width: "100%", fontSize: "var(--con-text-caption)" }} />
                    </div>
                  </div>
                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", borderTop: "1px solid var(--con-border-default)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                    <button type="button" onClick={() => { clearAdvancedFilters(); }} style={{ padding: "0.4rem 0.75rem", borderRadius: "var(--con-radius)", border: "1px solid var(--con-border-default)", background: "var(--con-bg-elevated)", color: "var(--con-text-secondary)", fontSize: "var(--con-text-caption)", cursor: "pointer" }}>مسح الفلاتر</button>
                    <button type="button" onClick={() => setShowAdvancedFilter(false)} style={{ padding: "0.4rem 0.75rem", borderRadius: "var(--con-radius)", border: "none", background: "var(--con-brand)", color: "#fff", fontSize: "var(--con-text-caption)", cursor: "pointer", fontWeight: 600 }}>تطبيق الفلتر</button>
                  </div>
                </div>
              )}
            </div>
            {/* Column Visibility Button */}
            <div style={{ position: "relative" }} ref={columnPickerRef}>
              <button
                type="button"
                onClick={() => setShowColumnPicker(!showColumnPicker)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.45rem 0.75rem", borderRadius: "var(--con-radius)",
                  border: "1px solid var(--con-border-default)",
                  background: "var(--con-bg-elevated)",
                  color: "var(--con-text-secondary)",
                  fontSize: "var(--con-text-caption)", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                <Columns size={14} />
                الأعمدة
              </button>
              {showColumnPicker && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
                  background: "var(--con-bg-card)", border: "1px solid var(--con-border-default)",
                  borderRadius: "var(--con-radius)", padding: "0.75rem", minWidth: 200,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}>
                  <div style={{ fontSize: "var(--con-text-caption)", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.5rem" }}>إظهار/إخفاء الأعمدة</div>
                  {ALL_COLUMNS.map((col) => (
                    <label key={col.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.25rem", fontSize: "var(--con-text-caption)", color: visibleColumns.has(col.key) ? "var(--con-text-primary)" : "var(--con-text-muted)", cursor: "pointer" }}>
                      <input type="checkbox" checked={visibleColumns.has(col.key)} onChange={() => toggleColumnVisibility(col.key)} style={{ accentColor: "var(--con-brand)" }} />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </Toolbar>

          <Card noPadding>
            {!courierLoading && filteredCouriers.length === 0 ? (
              <div className="con-empty">
                <Users size={40} />
                <p style={{ fontSize: "var(--con-text-body)" }}>
                  {couriers.length === 0 ? "لا توجد مناديب" : "لا توجد نتائج تطابق المعايير المحددة"}
                </p>
              </div>
            ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="con-table">
                <thead>
                  <tr>
                    {ALL_COLUMNS.filter((col) => visibleColumns.has(col.key)).map((col) => {
                      const sortable = ["name", "rating", "orders", "city", "registration", "violations"].includes(col.key);
                      const isActive = sortColumn === col.key;
                      return (
                        <th
                          key={col.key}
                          onClick={sortable ? () => handleSort(col.key) : undefined}
                          style={{ cursor: sortable ? "pointer" : "default", userSelect: "none", whiteSpace: "nowrap" }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            {col.label}
                            {sortable && isActive && (sortDirection === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {courierLoading ? (
                    <SkeletonRows rows={4} cols={ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).length} />
                  ) : (
                    filteredCouriers.map((courier) => {
                      const sc = courierStatusConfig[courier.status];
                      const onlineStatus = getOnlineStatus(courier.last_active);
                      const cls = getClassification(courier);
                      const violationCount = (courier.app_violations?.length ?? 0) + (courier.traffic_violations?.length ?? 0);
                      return (
                        <tr key={courier.id}>
                          {visibleColumns.has("name") && (
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                {courier.photo_url ? (
                                  <img src={courier.photo_url} alt={courier.full_name} style={{ width: "2rem", height: "2rem", borderRadius: "var(--con-radius)", objectFit: "cover", flexShrink: 0 }} />
                                ) : (
                                  <div style={{ width: "2rem", height: "2rem", borderRadius: "var(--con-radius)", background: "var(--con-brand-subtle)", color: "var(--con-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--con-text-caption)", fontWeight: 600, flexShrink: 0 }}>{initials(courier.full_name)}</div>
                                )}
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: onlineStatus.color, flexShrink: 0, boxShadow: onlineStatus.color === "#22c55e" ? "0 0 6px rgba(34,197,94,0.5)" : "none" }} title={onlineStatus.label} />
                                <span style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>
                                  <span onClick={() => navigate(`/admin-panel/driver-profile/${courier.id}`)} style={{ cursor: "pointer", color: "var(--con-brand)", textDecoration: "underline" }}>{courier.full_name}</span>
                                </span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.has("phone") && <td className="con-td-mono">{courier.phone}</td>}
                          {visibleColumns.has("city") && (
                            <td><div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--con-text-secondary)" }}><MapPin size={12} style={{ color: "var(--con-text-muted)" }} />{courier.city ?? "—"}</div></td>
                          )}
                          {visibleColumns.has("vehicle") && (
                            <td><div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>{courier.vehicle_type === "سيارة" || courier.vehicle_type === "شاحنة صغيرة" ? <Truck size={13} style={{ color: "var(--con-text-muted)" }} /> : <Bike size={13} style={{ color: "var(--con-text-muted)" }} />}<span style={{ color: "var(--con-text-secondary)" }}>{courier.vehicle_type ?? "—"}</span></div></td>
                          )}
                          {visibleColumns.has("app") && (
                            <td><span style={{ color: "var(--con-text-secondary)", fontSize: "var(--con-text-table)" }}>{courier.app_name ? APP_NAME_OPTIONS.find((o) => o.value === courier.app_name)?.label ?? courier.app_name : "—"}</span></td>
                          )}
                          {visibleColumns.has("nationality") && <td><span style={{ color: "var(--con-text-secondary)" }}>{courier.nationality ?? "—"}</span></td>}
                          {visibleColumns.has("supervisor") && <td><span style={{ color: "var(--con-text-secondary)" }}>{courier.supervisor ?? "—"}</span></td>}
                          {visibleColumns.has("contract") && <td><span style={{ color: "var(--con-text-secondary)" }}>{courier.contract_type ?? "—"}</span></td>}
                          {visibleColumns.has("registration") && <td className="con-td-mono">{courier.registration_date ? formatDate(courier.registration_date) : formatDate(courier.created_at)}</td>}
                          {visibleColumns.has("rating") && (
                            <td>{courier.rating != null ? (<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Star size={12} style={{ color: "var(--con-warning)", fill: "var(--con-warning)" }} /><span className="con-mono" style={{ color: "var(--con-text-primary)" }}>{courier.rating.toFixed(1)}</span></div>) : (<span style={{ color: "var(--con-text-muted)" }}>—</span>)}</td>
                          )}
                          {visibleColumns.has("orders") && (
                            <td><div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}><Package size={12} style={{ color: "var(--con-text-muted)" }} /><span className="con-mono" style={{ color: "var(--con-text-secondary)" }}>{(courier.monthly_orders ?? 0).toLocaleString("ar-SA")}</span></div></td>
                          )}
                          {visibleColumns.has("status") && (
                            <td>
                              <select value={courier.status} onChange={(e) => handleQuickStatusChange(courier.id, e.target.value as Courier["status"])} className="con-input" style={{ fontSize: "var(--con-text-caption)", padding: "0.25rem 0.4rem", minWidth: 110, background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-default)", borderRadius: "var(--con-radius)", color: "var(--con-text-primary)", cursor: "pointer" }}>
                                {Object.entries(courierStatusConfig).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                              </select>
                            </td>
                          )}
                          {visibleColumns.has("classification") && (
                            <td><Badge variant={getClassificationVariant(cls)}>{cls}</Badge></td>
                          )}
                          {visibleColumns.has("iqama") && <td className="con-td-mono"><span style={{ color: "var(--con-text-secondary)" }}>{courier.iqama_number ?? "—"}</span></td>}
                          {visibleColumns.has("violations") && (
                            <td><span className="con-mono" style={{ color: violationCount > 0 ? "var(--con-danger)" : "var(--con-text-muted)" }}>{violationCount}</span></td>
                          )}
                          {visibleColumns.has("actions") && (
                            <td>
                              <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                                <IconButton icon={Eye} title="عرض التفاصيل" onClick={() => setViewCourier(courier)} variant="brand" />
                                <IconButton icon={Edit2} title="تعديل" onClick={() => setEditCourier({ ...courier })} />
                                <IconButton icon={Trash2} title="حذف" onClick={() => setDeleteCourierId(courier.id)} variant="danger" />
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            )}
            {!courierLoading && filteredCouriers.length > 0 && (
              <div
                style={{
                  padding: "0.75rem 1.25rem",
                  borderTop: "1px solid var(--con-border-default)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-muted)",
                }}
              >
                <span>{filteredCouriers.length} مندوب</span>
                <span>
                  نشط:{" "}
                  {filteredCouriers.filter((c) => c.status === "active").length}{" "}
                  · في التوصيل:{" "}
                  {
                    filteredCouriers.filter((c) => c.status === "on_delivery")
                      .length
                  }
                </span>
              </div>
            )}
          </Card>
        </Fragment>
      )}

      {activeTab === "applications" && (
        <Fragment>
          <KPIGrid cols="repeat(auto-fit, minmax(160px, 1fr))">
            <KPICard
              label="إجمالي الطلبات"
              value={appStats.total}
              icon={FileText}
              accent="var(--con-brand)"
              loading={appLoading}
            />
            <KPICard
              label="بانتظار المراجعة"
              value={appStats.pending}
              icon={Clock}
              accent="var(--con-warning)"
              loading={appLoading}
            />
            <KPICard
              label="قيد المراجعة"
              value={appStats.under_review}
              icon={Eye}
              accent="var(--con-info)"
              loading={appLoading}
            />
            <KPICard
              label="مقبولة"
              value={appStats.approved}
              icon={CheckCircle2}
              accent="var(--con-success)"
              loading={appLoading}
            />
            <KPICard
              label="مرفوضة"
              value={appStats.rejected}
              icon={XCircle}
              accent="var(--con-danger)"
              loading={appLoading}
            />
          </KPIGrid>

          <Toolbar
            search={appSearch}
            onSearch={setAppSearch}
            searchPlaceholder="ابحث بالاسم أو رقم الطلب أو الجوال..."
          >
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
            <Table
              headers={[
                "رقم الطلب",
                "مقدم الطلب",
                "الجوال",
                "المدينة",
                "المركبة",
                "المشرف المباشر",
                "نوع التعاقد",
                "تاريخ التقديم",
                "الحالة",
                "إجراءات",
              ]}
              isEmpty={!appLoading && filteredApps.length === 0}
              emptyIcon={FileText}
              emptyText={applications.length === 0 ? "لا توجد طلبات تسجيل" : "لا توجد طلبات تسجيل تطابق المعايير المحددة"}
            >
              {appLoading ? (
                <SkeletonRows rows={4} cols={10} />
              ) : (
                filteredApps.map((app) => {
                  const sc = appStatusConfig[app.status];
                  const isActionable =
                    app.status === "pending" ||
                    app.status === "under_review" ||
                    app.status === "requires_correction";
                  return (
                    <tr key={app.id}>
                      <td className="con-td-mono">{app.app_ref}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.625rem",
                          }}
                        >
                          <div
                            style={{
                              width: "2rem",
                              height: "2rem",
                              borderRadius: "var(--con-radius)",
                              background: "var(--con-brand-subtle)",
                              color: "var(--con-brand)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "var(--con-text-caption)",
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {initials(app.full_name)}
                          </div>
                          <span
                            style={{
                              fontWeight: 500,
                              color: "var(--con-text-primary)",
                            }}
                          >
                            {app.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="con-td-mono">{app.phone}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            color: "var(--con-text-secondary)",
                          }}
                        >
                          <MapPin
                            size={12}
                            style={{ color: "var(--con-text-muted)" }}
                          />
                          {app.city}
                        </div>
                      </td>
                      <td>
                        {app.has_vehicle ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.375rem",
                            }}
                          >
                            {app.vehicle_type === "سيارة" ? (
                              <Truck
                                size={13}
                                style={{ color: "var(--con-text-muted)" }}
                              />
                            ) : (
                              <Bike
                                size={13}
                                style={{ color: "var(--con-text-muted)" }}
                              />
                            )}
                            <span
                              style={{ color: "var(--con-text-secondary)" }}
                            >
                              {app.vehicle_type ?? "—"}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--con-text-muted)" }}>
                            بدون مركبة
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ color: "var(--con-text-secondary)" }}>
                          {app.supervisor ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "var(--con-text-secondary)" }}>
                          {app.contract_type ?? "—"}
                        </span>
                      </td>
                      <td className="con-td-mono">
                        {formatDate(app.created_at)}
                      </td>
                      <td>
                        <Badge variant={sc?.variant ?? "muted"}>
                          {sc?.label ?? app.status}
                        </Badge>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.25rem",
                            alignItems: "center",
                          }}
                        >
                          <IconButton
                            icon={Eye}
                            onClick={() => setSelectedApp(app)}
                            title="عرض التفاصيل"
                            variant="brand"
                          />
                          {isActionable && (
                            <>
                              <IconButton
                                icon={ThumbsUp}
                                onClick={() => handleApprove(app)}
                                title="قبول"
                                variant="brand"
                              />
                              <IconButton
                                icon={ThumbsDown}
                                onClick={() => {
                                  setRejectDialogApp(app);
                                  setRejectReason("");
                                }}
                                title="رفض"
                                variant="danger"
                              />
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
              <div
                style={{
                  padding: "0.75rem 1.25rem",
                  borderTop: "1px solid var(--con-border-default)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-muted)",
                }}
              >
                <span>{filteredApps.length} طلب</span>
                <span>
                  بانتظار:{" "}
                  {filteredApps.filter((a) => a.status === "pending").length} ·
                  مقبولة:{" "}
                  {filteredApps.filter((a) => a.status === "approved").length}
                </span>
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
          selectedApp &&
          (selectedApp.status === "pending" ||
            selectedApp.status === "under_review" ||
            selectedApp.status === "requires_correction") ? (
            <>
              <Button
                variant="ghost"
                onClick={() => markUnderReview(selectedApp)}
                disabled={actionLoading === selectedApp.id}
              >
                بدء/تحديث المراجعة
              </Button>
              <Button
                variant="ghost"
                onClick={() => openCorrectionModal(selectedApp)}
                disabled={actionLoading === selectedApp.id}
              >
                طلب استكمال
              </Button>
              <Button
                onClick={() => handleApprove(selectedApp)}
                disabled={actionLoading === selectedApp.id}
                icon={ThumbsUp}
              >
                قبول الطلب
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setRejectDialogApp(selectedApp);
                  setRejectReason("");
                }}
                disabled={actionLoading === selectedApp.id}
                icon={ThumbsDown}
              >
                رفض الطلب
              </Button>
            </>
          ) : undefined
        }
      >
        {selectedApp && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "var(--con-radius)",
                  background: "var(--con-brand-subtle)",
                  color: "var(--con-brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                {initials(selectedApp.full_name)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--con-text-card-title)",
                    fontWeight: 700,
                    color: "var(--con-text-primary)",
                  }}
                >
                  {selectedApp.full_name}
                </div>
                <div
                  className="con-mono"
                  style={{
                    fontSize: "var(--con-text-caption)",
                    color: "var(--con-text-muted)",
                  }}
                >
                  {selectedApp.app_ref}
                </div>
              </div>
              <div style={{ marginRight: "auto" }}>
                <Badge
                  variant={
                    appStatusConfig[selectedApp.status]?.variant ?? "muted"
                  }
                >
                  {appStatusConfig[selectedApp.status]?.label ??
                    selectedApp.status}
                </Badge>
              </div>
            </div>

            <Collapsible defaultOpen>
              <Section
                title={
                  <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer w-full hover:opacity-80">
                    بيانات مقدم الطلب
                  </CollapsibleTrigger>
                }
              >
                <CollapsibleContent>
                  <DetailGrid>
                    <DetailField
                      icon={CreditCard}
                      label="الهوية الوطنية"
                      value={selectedApp.national_id}
                      mono
                    />
                    <DetailField
                      icon={Mail}
                      label="البريد الإلكتروني"
                      value={selectedApp.email}
                      mono
                    />
                    <DetailField
                      icon={Phone}
                      label="رقم الجوال"
                      value={selectedApp.phone}
                      mono
                    />
                    <DetailField
                      icon={MapPin}
                      label="المدينة"
                      value={selectedApp.city}
                    />
                    <DetailField
                      icon={Calendar}
                      label="تاريخ الميلاد"
                      value={selectedApp.date_of_birth ?? "—"}
                    />
                    <DetailField
                      icon={Calendar}
                      label="تاريخ التقديم"
                      value={formatDate(selectedApp.created_at)}
                      mono
                    />
                  </DetailGrid>
                </CollapsibleContent>
              </Section>
            </Collapsible>

            {selectedApp.has_vehicle && (
              <Section title="بيانات المركبة">
                <DetailGrid>
                  <DetailField
                    icon={Truck}
                    label="النوع"
                    value={selectedApp.vehicle_type ?? "—"}
                  />
                  <DetailField
                    icon={Car}
                    label="الموديل"
                    value={selectedApp.vehicle_model ?? "—"}
                  />
                  <DetailField
                    icon={Calendar}
                    label="السنة"
                    value={selectedApp.vehicle_year?.toString() ?? "—"}
                    mono
                  />
                  <DetailField
                    icon={Shield}
                    label="اللوحة"
                    value={selectedApp.plate_number ?? "—"}
                    mono
                  />
                </DetailGrid>
              </Section>
            )}

            <Section title="المستندات المرفقة">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <DocBadge
                  label="صورة شخصية"
                  url={selectedApp.selfie_url || selectedApp.doc_selfie}
                  icon={Camera}
                />
                <DocBadge
                  label="هوية (أمام)"
                  url={selectedApp.id_front_url || selectedApp.doc_national_id}
                  icon={CreditCard}
                />
                <DocBadge
                  label="هوية (خلف)"
                  url={
                    selectedApp.id_back_url || selectedApp.doc_national_id_back
                  }
                  icon={CreditCard}
                />
                <DocBadge
                  label="رخصة قيادة"
                  url={
                    selectedApp.license_url || selectedApp.doc_driver_license
                  }
                  icon={Car}
                />
                <DocBadge
                  label="شهادة بنكية"
                  url={selectedApp.bank_cert_url || selectedApp.doc_bank_cert}
                  icon={FileText}
                />
                {selectedApp.has_vehicle && (
                  <>
                    <DocBadge
                      label="استمارة المركبة"
                      url={
                        selectedApp.vehicle_registration_url ||
                        selectedApp.doc_vehicle_reg
                      }
                      icon={FileText}
                    />
                    <DocBadge
                      label="تأمين المركبة"
                      url={
                        selectedApp.vehicle_insurance_url ||
                        selectedApp.doc_vehicle_insurance
                      }
                      icon={Shield}
                    />
                  </>
                )}
              </div>
            </Section>

            <Section title="التحقق من onboarding">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem 1rem",
                  marginBottom: "0.75rem",
                }}
              >
                {[
                  {
                    key: "identity",
                    label: "مطابقة وثائق الهوية",
                    icon: ShieldCheck,
                  },
                  {
                    key: "liveness",
                    label: "اجتياز التحقق الحيوي",
                    icon: ScanFace,
                  },
                  { key: "license", label: "رخصة القيادة صالحة", icon: Car },
                  { key: "bank", label: "توثيق الحساب البنكي", icon: FileText },
                  { key: "vehicleDocs", label: "وثائق المركبة", icon: Truck },
                  {
                    key: "contact",
                    label: "البيانات التواصلية صحيحة",
                    icon: Phone,
                  },
                ].map((item) => {
                  const checked =
                    verificationChecks[item.key as keyof VerificationChecks];
                  return (
                    <label
                      key={item.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: checked
                          ? "var(--con-brand-subtle)"
                          : "var(--con-bg-elevated)",
                        border: `1px solid ${checked ? "var(--con-border-brand)" : "var(--con-border-default)"}`,
                        borderRadius: "var(--con-radius)",
                        padding: "0.55rem 0.75rem",
                        fontSize: "var(--con-text-caption)",
                        color: checked
                          ? "var(--con-text-primary)"
                          : "var(--con-text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(val) => {
                          setVerificationError("");
                          setVerificationChecks((prev) => ({
                            ...prev,
                            [item.key]: !!val,
                          }));
                        }}
                      />
                      <item.icon size={13} />
                      {item.label}
                    </label>
                  );
                })}
              </div>
              <TextArea
                value={reviewNotes}
                onChange={(v) => {
                  setVerificationError("");
                  setReviewNotes(v);
                }}
                placeholder="ملاحظات المراجع أو متطلبات الاستكمال"
                rows={3}
              />
              {verificationError && (
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    color: "var(--con-danger)",
                    fontSize: "var(--con-text-caption)",
                  }}
                >
                  {verificationError}
                </p>
              )}
            </Section>

            {selectedApp.admin_notes && (
              <Section title="ملاحظات المراجع">
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--con-text-body)",
                    color: "var(--con-text-secondary)",
                    lineHeight: 1.7,
                  }}
                >
                  {selectedApp.admin_notes}
                </p>
              </Section>
            )}

            {selectedApp.reviewed_by && (
              <div
                style={{
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-muted)",
                }}
              >
                تمت المراجعة بواسطة:{" "}
                <span className="con-mono">{selectedApp.reviewed_by}</span>
                {selectedApp.reviewed_at &&
                  ` · ${formatDate(selectedApp.reviewed_at)}`}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Courier Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="إضافة مندوب جديد"
        width={600}
        actions={
          <>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>
              إلغاء
            </Button>
            <Button icon={Plus} onClick={handleAddCourier}>
              إضافة
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>الاسم الكامل *</label>
            <input
              className="con-input"
              value={addForm.full_name}
              onChange={(e) => setAddForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="الاسم الكامل"
              style={{ width: "100%", fontSize: "var(--con-text-table)" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>رقم الجوال *</label>
            <input
              className="con-input"
              value={addForm.phone}
              onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="05XXXXXXXX"
              style={{ width: "100%", fontSize: "var(--con-text-table)" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>البريد الإلكتروني</label>
            <input
              className="con-input"
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="email@example.com"
              style={{ width: "100%", fontSize: "var(--con-text-table)" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>المدينة</label>
            <Select
              value={addForm.city}
              onChange={(v) => setAddForm((p) => ({ ...p, city: v }))}
              options={[{ value: "", label: "اختر المدينة" }, ...CITY_OPTIONS]}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>نوع المركبة</label>
            <Select
              value={addForm.vehicle_type}
              onChange={(v) => setAddForm((p) => ({ ...p, vehicle_type: v }))}
              options={[{ value: "", label: "اختر المركبة" }, ...VEHICLE_TYPE_OPTIONS]}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>رقم ID التطبيق</label>
            <input
              className="con-input"
              value={addForm.app_id}
              onChange={(e) => setAddForm((p) => ({ ...p, app_id: e.target.value }))}
              placeholder="رقم ID التطبيق"
              style={{ width: "100%", fontSize: "var(--con-text-table)" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>التطبيق</label>
            <Select
              value={addForm.app_name}
              onChange={(v) => setAddForm((p) => ({ ...p, app_name: v }))}
              options={[{ value: "", label: "اختر التطبيق" }, ...APP_NAME_OPTIONS]}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>الجنسية</label>
            <input
              className="con-input"
              value={addForm.nationality}
              onChange={(e) => setAddForm((p) => ({ ...p, nationality: e.target.value }))}
              placeholder="الجنسية"
              style={{ width: "100%", fontSize: "var(--con-text-table)" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>رقم الإقامة</label>
            <input
              className="con-input"
              value={addForm.iqama_number}
              onChange={(e) => setAddForm((p) => ({ ...p, iqama_number: e.target.value }))}
              placeholder="رقم الإقامة"
              style={{ width: "100%", fontSize: "var(--con-text-table)" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>رابط الصورة</label>
            <input
              className="con-input"
              value={addForm.photo_url}
              onChange={(e) => setAddForm((p) => ({ ...p, photo_url: e.target.value }))}
              placeholder="https://..."
              style={{ width: "100%", fontSize: "var(--con-text-table)" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>المشرف المباشر</label>
            <input
              className="con-input"
              value={addForm.supervisor}
              onChange={(e) => setAddForm((p) => ({ ...p, supervisor: e.target.value }))}
              placeholder="اسم المشرف"
              style={{ width: "100%", fontSize: "var(--con-text-table)" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>نوع التعاقد</label>
            <Select
              value={addForm.contract_type}
              onChange={(v) => setAddForm((p) => ({ ...p, contract_type: v }))}
              options={[{ value: "", label: "اختر نوع التعاقد" }, ...CONTRACT_TYPE_OPTIONS]}
            />
          </div>
        </div>
      </Modal>

      {/* Excel Import Modal */}
      <Modal
        open={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setImportPreview([]);
          setImportExtraCols([]);
          if (importFileRef.current) importFileRef.current.value = "";
        }}
        title="استيراد مناديب من Excel"
        width={800}
        actions={
          importPreview.length > 0 ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setImportPreview([]);
                  setImportExtraCols([]);
                  if (importFileRef.current) importFileRef.current.value = "";
                }}
              >
                إعادة اختيار
              </Button>
              <Button icon={Upload} onClick={executeImport}>
                استيراد {importPreview.length} مندوب
              </Button>
            </>
          ) : undefined
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <input
              ref={importFileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportFile}
              className="con-input"
              style={{ width: "100%", padding: "0.5rem", fontSize: "var(--con-text-table)" }}
            />
            <p style={{ margin: "0.5rem 0 0", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
              الأعمدة المعروفة: full_name, phone, email, city, vehicle_type, app_id, app_name, nationality, iqama_number
            </p>
          </div>
          {importExtraCols.length > 0 && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--con-radius)",
                background: "var(--con-warning-subtle)",
                border: "1px solid var(--con-warning)",
                fontSize: "var(--con-text-caption)",
                color: "var(--con-text-primary)",
              }}
            >
              تم العثور على {importExtraCols.length} عمود إضافي — سيتم حفظها في معلومات إضافية: {importExtraCols.join("، ")}
            </div>
          )}
          {importPreview.length > 0 && (
            <div style={{ overflowX: "auto", maxHeight: 300 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "var(--con-text-caption)",
                }}
              >
                <thead>
                  <tr>
                    {Object.keys(importPreview[0]).map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "0.4rem 0.6rem",
                          borderBottom: "1px solid var(--con-border-default)",
                          textAlign: "start",
                          color: KNOWN_IMPORT_COLUMNS.includes(col)
                            ? "var(--con-text-primary)"
                            : "var(--con-warning)",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                        {!KNOWN_IMPORT_COLUMNS.includes(col) && " *"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "0.35rem 0.6rem",
                            borderBottom: "1px solid var(--con-border-default)",
                            color: "var(--con-text-secondary)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreview.length > 10 && (
                <p style={{ margin: "0.5rem 0 0", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", textAlign: "center" }}>
                  عرض 10 من أصل {importPreview.length} صف
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Approve Confirmation Dialog */}
      <AlertDialog
        open={!!approveDialogApp}
        onOpenChange={(open) => {
          if (!open) setApproveDialogApp(null);
        }}
      >
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
              onClick={() =>
                approveDialogApp && executeApprove(approveDialogApp)
              }
              style={{ background: "var(--con-success)" }}
            >
              تأكيد القبول
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={!!rejectDialogApp}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialogApp(null);
            setRejectReason("");
            setRejectCategory("");
          }
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الرفض</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رفض طلب{" "}
              <strong>{rejectDialogApp?.full_name}</strong>؟ لا يمكن التراجع عن
              هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>تصنيف الرفض</label>
              <Select
                value={rejectCategory}
                onChange={setRejectCategory}
                options={[{ value: "", label: "اختر التصنيف" }, ...REJECTION_CATEGORY_OPTIONS]}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>سبب الرفض التفصيلي *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="اكتب سبب الرفض بالتفصيل..."
                rows={5}
                className="con-input"
                style={{
                  width: "100%",
                  resize: "vertical",
                  fontSize: "var(--con-text-table)",
                  lineHeight: 1.7,
                }}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                rejectDialogApp && handleReject(rejectDialogApp, rejectReason, rejectCategory)
              }
              disabled={!rejectReason.trim()}
              style={{
                background: "var(--con-danger)",
                opacity: rejectReason.trim() ? 1 : 0.5,
              }}
            >
              تأكيد الرفض
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Courier Detail Modal */}
      <Modal open={!!viewCourier} onClose={() => setViewCourier(null)} title={viewCourier?.full_name ?? "تفاصيل المندوب"} width={750}>
        {viewCourier && (() => { const _sb: React.CSSProperties = { background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 10, padding: 16, marginBottom: 12 }; const _sh = (Ic: React.ElementType, t: string) => (<div style={{ fontSize: 14, fontWeight: 700, color: "var(--con-text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Ic size={16} />{t}</div>); const _sc = (l: string, v: string | number, c: string) => (<div style={{ background: `${c}11`, border: `1px solid ${c}33`, borderRadius: 8, padding: "10px 14px", textAlign: "center", minWidth: 0 }}><div style={{ fontSize: 18, fontWeight: 700, color: c, lineHeight: 1.3 }}>{v}</div><div style={{ fontSize: 11, color: "var(--con-text-secondary)", marginTop: 2 }}>{l}</div></div>); const _exp = (d?: string) => { if (!d) return false; return (new Date(d).getTime() - Date.now()) / 864e5 < 30; }; const vc = viewCourier; return (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ ..._sb, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              {vc.photo_url ? (<img src={vc.photo_url} alt={vc.full_name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", border: "2px solid var(--con-brand)" }} />) : (<div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--con-brand-subtle)", color: "var(--con-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22, border: "2px solid var(--con-brand)" }}>{initials(vc.full_name)}</div>)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--con-text-primary)" }}>{vc.full_name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  <Badge variant={courierStatusConfig[vc.status]?.variant ?? "muted"}>{courierStatusConfig[vc.status]?.label ?? vc.status}</Badge>
                  {(() => { const _os = getOnlineStatus(vc.last_active); return (<div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: _os.color, display: "inline-block", boxShadow: _os.color === "#22c55e" ? "0 0 6px rgba(34,197,94,0.5)" : "none" }} /><span style={{ fontSize: 11, color: _os.color, fontWeight: 500 }}>{_os.label}</span></div>); })()}
                  {vc.rating != null && (<div style={{ display: "flex", alignItems: "center", gap: 3 }}>{[1,2,3,4,5].map((s) => (<Star key={s} size={13} style={{ color: s <= Math.round(vc.rating!) ? "var(--con-warning)" : "var(--con-text-muted)", fill: s <= Math.round(vc.rating!) ? "var(--con-warning)" : "none" }} />))}<span className="con-mono" style={{ fontSize: 12, color: "var(--con-text-secondary)", marginInlineStart: 4 }}>{vc.rating.toFixed(1)}</span></div>)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button type="button" onClick={() => { setViewCourier(null); setEditCourier({ ...vc }); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--con-border-default)", background: "var(--con-bg-elevated)", color: "var(--con-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }} title="تعديل"><Edit2 size={13} /></button>
                <button type="button" onClick={() => sendWhatsApp(vc.phone, `مرحباً ${vc.full_name}`)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(37,211,102,0.3)", background: "rgba(37,211,102,0.08)", color: "#25D366", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }} title="واتساب"><MessageSquare size={13} /></button>
                {vc.email && (<button type="button" onClick={() => sendEmail(vc.email!, "متابعة", "")} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)", color: "#3B82F6", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }} title="إيميل"><Mail size={13} /></button>)}
              </div>
            </div>
            <div style={_sb}>{_sh(TrendingUp, "الأداء والإحصائيات")}<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>{_sc("نسبة نجاح التوصيل", vc.delivery_success_rate != null ? `${vc.delivery_success_rate}%` : "—", (vc.delivery_success_rate ?? 0) >= 90 ? "#22c55e" : "#ef4444")}{_sc("متوسط وقت التوصيل", vc.avg_delivery_time != null ? `${vc.avg_delivery_time} د` : "—", (vc.avg_delivery_time ?? 99) <= 25 ? "#22c55e" : "#f59e0b")}{_sc("نسبة الإلغاء", vc.cancellation_rate != null ? `${vc.cancellation_rate}%` : "—", (vc.cancellation_rate ?? 99) <= 2 ? "#22c55e" : "#ef4444")}{_sc("طلبات مكتملة", vc.completed_orders ?? "—", "#22c55e")}{_sc("طلبات فاشلة", vc.failed_orders ?? "—", "#ef4444")}{_sc("طلبات الشهر", vc.monthly_orders ?? 0, "#3b82f6")}</div></div>
            <div style={_sb}>{_sh(Wallet, "المعلومات المالية")}<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>{_sc("إجمالي الأرباح", vc.total_earnings != null ? `${vc.total_earnings.toLocaleString("ar-SA")} ر.س` : "—", "#22c55e")}{_sc("أرباح الشهر", vc.monthly_earnings != null ? `${vc.monthly_earnings.toLocaleString("ar-SA")} ر.س` : "—", "#3b82f6")}{_sc("رصيد معلّق", vc.pending_payout != null ? `${vc.pending_payout.toLocaleString("ar-SA")} ر.س` : "—", vc.pending_payout && vc.pending_payout > 0 ? "#f59e0b" : "#22c55e")}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--con-text-secondary)" }}><CreditCard size={13} style={{ color: "var(--con-text-muted)" }} /><span style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>IBAN:</span><span className="con-mono" style={{ fontSize: 12 }}>{vc.iban ?? "—"}</span></div><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--con-text-secondary)" }}><Wallet size={13} style={{ color: "var(--con-text-muted)" }} /><span style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>البنك:</span><span>{vc.bank_name ?? "—"}</span></div></div></div>
            <div style={_sb}>{_sh(Briefcase, "معلومات العمل")}<DetailGrid><DetailField icon={Package} label="التطبيق" value={vc.app_name ? (APP_NAME_OPTIONS.find((o) => o.value === vc.app_name)?.label ?? vc.app_name) : "—"} /><DetailField icon={CreditCard} label="رقم ID التطبيق" value={vc.app_id ?? "—"} mono /><DetailField icon={Users} label="المشرف المباشر" value={vc.supervisor ?? "—"} /><DetailField icon={FileText} label="نوع التعاقد" value={vc.contract_type ?? "—"} /><DetailField icon={Calendar} label="تاريخ التسجيل" value={vc.registration_date ? formatDate(vc.registration_date) : formatDate(vc.created_at)} mono /></DetailGrid>{(vc.joined_platforms?.length ?? 0) > 0 && (<div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><span style={{ fontSize: 12, color: "var(--con-text-secondary)", fontWeight: 600 }}>المنصات المسجّل فيها:</span>{vc.joined_platforms!.map((p) => (<Badge key={p} variant="info">{APP_NAME_OPTIONS.find((o) => o.value === p)?.label ?? p}</Badge>))}</div>)}</div>
            <div style={_sb}>{_sh(Car, "المركبة")}<DetailGrid><DetailField icon={Bike} label="نوع المركبة" value={vc.vehicle_type ?? "—"} /><DetailField icon={Car} label="الموديل" value={vc.vehicle_model ?? "—"} /><DetailField icon={Calendar} label="السنة" value={vc.vehicle_year != null ? String(vc.vehicle_year) : "—"} /><DetailField icon={CreditCard} label="اللوحة" value={vc.plate_number ?? "—"} mono /></DetailGrid><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><Shield size={12} style={{ color: _exp(vc.license_expiry) ? "#ef4444" : "var(--con-text-muted)" }} /><span style={{ color: "var(--con-text-secondary)" }}>الرخصة:</span><span className="con-mono" style={{ color: _exp(vc.license_expiry) ? "#ef4444" : "var(--con-text-primary)", fontWeight: _exp(vc.license_expiry) ? 700 : 400 }}>{vc.license_expiry ?? "—"}</span></div><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><ShieldCheck size={12} style={{ color: _exp(vc.insurance_expiry) ? "#ef4444" : "var(--con-text-muted)" }} /><span style={{ color: "var(--con-text-secondary)" }}>التأمين:</span><span className="con-mono" style={{ color: _exp(vc.insurance_expiry) ? "#ef4444" : "var(--con-text-primary)", fontWeight: _exp(vc.insurance_expiry) ? 700 : 400 }}>{vc.insurance_expiry ?? "—"}</span></div>{vc.has_company_vehicle && (<div><Badge variant="info">مركبة من الشركة</Badge></div>)}</div></div>
            <div style={_sb}>{_sh(User, "معلومات شخصية")}<DetailGrid><DetailField icon={Phone} label="الجوال" value={vc.phone} mono /><DetailField icon={Mail} label="البريد الإلكتروني" value={vc.email ?? "—"} mono /><DetailField icon={Shield} label="الجنسية" value={vc.nationality ?? "—"} /><DetailField icon={CreditCard} label="رقم الإقامة" value={vc.iqama_number ?? "—"} mono /><DetailField icon={MapPin} label="المدينة" value={vc.city ?? "—"} /><DetailField icon={Clock} label="آخر نشاط" value={(() => { const s = getOnlineStatus(vc.last_active); return vc.last_active ? `${s.label} (${formatDate(vc.last_active)})` : "غير متصل"; })()} mono /></DetailGrid>{(vc.emergency_name || vc.emergency_contact) && (<div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}><AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} /><span style={{ fontSize: 12, color: "var(--con-text-secondary)" }}>جهة الطوارئ: <strong style={{ color: "var(--con-text-primary)" }}>{vc.emergency_name ?? "—"}</strong> — <span className="con-mono">{vc.emergency_contact ?? "—"}</span></span></div>)}</div>
            <div style={_sb}>{_sh(FileText, "ملاحظات إدارية")}{vc.admin_notes ? (<p style={{ margin: 0, fontSize: 13, color: "var(--con-text-secondary)", lineHeight: 1.7, marginBottom: 10 }}>{vc.admin_notes}</p>) : (<p style={{ margin: 0, fontSize: 13, color: "var(--con-text-muted)", marginBottom: 10 }}>لا توجد ملاحظات</p>)}{(vc.notes_history?.length ?? 0) > 0 && (<div style={{ borderInlineStart: "2px solid var(--con-brand)", paddingInlineStart: 12 }}>{vc.notes_history!.map((n, i) => (<div key={i} style={{ marginBottom: i < vc.notes_history!.length - 1 ? 10 : 0 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}><span className="con-mono" style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{n.date}</span><span style={{ fontSize: 11, color: "var(--con-brand)", fontWeight: 600 }}>{n.by}</span></div><div style={{ fontSize: 12, color: "var(--con-text-secondary)", lineHeight: 1.6 }}>{n.note}</div></div>))}</div>)}</div>
            <div style={_sb}>{_sh(AlertTriangle, "مخالفات التطبيق")}{(vc.app_violations?.length ?? 0) > 0 ? (<div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--con-text-caption)" }}><thead><tr><th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", textAlign: "start", color: "var(--con-text-secondary)", fontWeight: 600 }}>التاريخ</th><th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", textAlign: "start", color: "var(--con-text-secondary)", fontWeight: 600 }}>نوع المخالفة</th><th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", textAlign: "start", color: "var(--con-text-secondary)", fontWeight: 600 }}>المبلغ</th><th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", textAlign: "start", color: "var(--con-text-secondary)", fontWeight: 600 }}>ملاحظات</th></tr></thead><tbody>{vc.app_violations!.map((v, i) => (<tr key={i}><td className="con-mono" style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", color: "var(--con-text-primary)" }}>{v.date}</td><td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", color: "var(--con-danger)" }}>{v.type}</td><td className="con-mono" style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", color: "var(--con-text-primary)" }}>{v.amount != null ? `${v.amount} ر.س` : "—"}</td><td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", color: "var(--con-text-secondary)" }}>{v.notes ?? "—"}</td></tr>))}</tbody></table></div>) : (<p style={{ margin: 0, fontSize: "var(--con-text-body)", color: "var(--con-text-muted)" }}>لا توجد مخالفات</p>)}</div>
            {vc.has_company_vehicle === true && (<div style={_sb}>{_sh(AlertTriangle, "مخالفات مرورية")}{(vc.traffic_violations?.length ?? 0) > 0 ? (<div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--con-text-caption)" }}><thead><tr><th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", textAlign: "start", color: "var(--con-text-secondary)", fontWeight: 600 }}>التاريخ</th><th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", textAlign: "start", color: "var(--con-text-secondary)", fontWeight: 600 }}>نوع المخالفة</th><th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", textAlign: "start", color: "var(--con-text-secondary)", fontWeight: 600 }}>المبلغ</th><th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", textAlign: "start", color: "var(--con-text-secondary)", fontWeight: 600 }}>اللوحة</th><th style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", textAlign: "start", color: "var(--con-text-secondary)", fontWeight: 600 }}>ملاحظات</th></tr></thead><tbody>{vc.traffic_violations!.map((v, i) => (<tr key={i}><td className="con-mono" style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", color: "var(--con-text-primary)" }}>{v.date}</td><td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", color: "var(--con-danger)" }}>{v.type}</td><td className="con-mono" style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", color: "var(--con-text-primary)" }}>{v.fine_amount != null ? `${v.fine_amount} ر.س` : "—"}</td><td className="con-mono" style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", color: "var(--con-text-primary)" }}>{v.plate ?? "—"}</td><td style={{ padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--con-border-default)", color: "var(--con-text-secondary)" }}>{v.notes ?? "—"}</td></tr>))}</tbody></table></div>) : (<p style={{ margin: 0, fontSize: "var(--con-text-body)", color: "var(--con-text-muted)" }}>لا توجد مخالفات مرورية</p>)}</div>)}
          </div>); })()}
      </Modal>

      {/* Edit Courier Modal */}
      <Modal
        open={!!editCourier}
        onClose={() => setEditCourier(null)}
        title={editCourier ? `تعديل — ${editCourier.full_name}` : "تعديل المندوب"}
        width={650}
        actions={
          <>
            <Button variant="ghost" onClick={() => setEditCourier(null)}>إلغاء</Button>
            <Button icon={Edit2} onClick={handleEditCourier}>حفظ التعديلات</Button>
          </>
        }
      >
        {editCourier && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>الاسم الكامل</label>
              <input className="con-input" value={editCourier.full_name} onChange={(e) => setEditCourier((p) => p ? { ...p, full_name: e.target.value } : p)} style={{ width: "100%", fontSize: "var(--con-text-table)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>رقم الجوال</label>
              <input className="con-input" value={editCourier.phone} onChange={(e) => setEditCourier((p) => p ? { ...p, phone: e.target.value } : p)} style={{ width: "100%", fontSize: "var(--con-text-table)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>البريد الإلكتروني</label>
              <input className="con-input" type="email" value={editCourier.email ?? ""} onChange={(e) => setEditCourier((p) => p ? { ...p, email: e.target.value || undefined } : p)} style={{ width: "100%", fontSize: "var(--con-text-table)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>المدينة</label>
              <Select value={editCourier.city ?? ""} onChange={(v) => setEditCourier((p) => p ? { ...p, city: v || undefined } : p)} options={[{ value: "", label: "اختر المدينة" }, ...CITY_OPTIONS]} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>نوع المركبة</label>
              <Select value={editCourier.vehicle_type ?? ""} onChange={(v) => setEditCourier((p) => p ? { ...p, vehicle_type: v || undefined } : p)} options={[{ value: "", label: "اختر المركبة" }, ...VEHICLE_TYPE_OPTIONS]} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>رقم ID التطبيق</label>
              <input className="con-input" value={editCourier.app_id ?? ""} onChange={(e) => setEditCourier((p) => p ? { ...p, app_id: e.target.value || undefined } : p)} style={{ width: "100%", fontSize: "var(--con-text-table)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>التطبيق</label>
              <Select value={editCourier.app_name ?? ""} onChange={(v) => setEditCourier((p) => p ? { ...p, app_name: v || undefined } : p)} options={[{ value: "", label: "اختر التطبيق" }, ...APP_NAME_OPTIONS]} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>الجنسية</label>
              <input className="con-input" value={editCourier.nationality ?? ""} onChange={(e) => setEditCourier((p) => p ? { ...p, nationality: e.target.value || undefined } : p)} style={{ width: "100%", fontSize: "var(--con-text-table)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>رقم الإقامة</label>
              <input className="con-input" value={editCourier.iqama_number ?? ""} onChange={(e) => setEditCourier((p) => p ? { ...p, iqama_number: e.target.value || undefined } : p)} style={{ width: "100%", fontSize: "var(--con-text-table)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>رابط الصورة</label>
              <input className="con-input" value={editCourier.photo_url ?? ""} onChange={(e) => setEditCourier((p) => p ? { ...p, photo_url: e.target.value || undefined } : p)} style={{ width: "100%", fontSize: "var(--con-text-table)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>المشرف المباشر</label>
              <input className="con-input" value={editCourier.supervisor ?? ""} onChange={(e) => setEditCourier((p) => p ? { ...p, supervisor: e.target.value || undefined } : p)} style={{ width: "100%", fontSize: "var(--con-text-table)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>نوع التعاقد</label>
              <Select value={editCourier.contract_type ?? ""} onChange={(v) => setEditCourier((p) => p ? { ...p, contract_type: v || undefined } : p)} options={[{ value: "", label: "اختر نوع التعاقد" }, ...CONTRACT_TYPE_OPTIONS]} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>الحالة</label>
              <Select
                value={editCourier.status}
                onChange={(v) => setEditCourier((p) => p ? { ...p, status: v as Courier["status"] } : p)}
                options={Object.entries(courierStatusConfig).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>آخر نشاط</label>
              <input className="con-input" value={editCourier.last_active ?? ""} readOnly style={{ width: "100%", fontSize: "var(--con-text-table)", opacity: 0.6, cursor: "not-allowed" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>ملاحظات إدارية</label>
              <textarea className="con-input" value={editCourier.admin_notes ?? ""} onChange={(e) => setEditCourier((p) => p ? { ...p, admin_notes: e.target.value || undefined } : p)} rows={3} style={{ width: "100%", resize: "vertical", fontSize: "var(--con-text-table)", lineHeight: 1.7 }} placeholder="ملاحظات إدارية..." />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Courier Confirmation Dialog */}
      <AlertDialog
        open={!!deleteCourierId}
        onOpenChange={(open) => { if (!open) setDeleteCourierId(null); }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المندوب <strong>{couriers.find((c) => c.id === deleteCourierId)?.full_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourier} style={{ background: "var(--con-danger)" }}>
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Correction/Return Modal */}
      <Modal
        open={!!correctionModalApp}
        onClose={() => {
          setCorrectionModalApp(null);
          setCorrectionNote("");
          setCorrectionPendingNotification(false);
        }}
        title="إعادة الطلب مع ملاحظات"
        width={560}
        actions={
          <>
            <Button variant="ghost" onClick={() => {
              setCorrectionModalApp(null);
              setCorrectionNote("");
              setCorrectionPendingNotification(false);
            }}>
              إلغاء
            </Button>
            <Button
              icon={Send}
              onClick={executeCorrectionReturn}
              disabled={!correctionNote.trim()}
            >
              إرسال وإعادة الطلب
            </Button>
          </>
        }
      >
        {correctionModalApp && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--con-warning-subtle)", borderRadius: "var(--con-radius)", border: "1px solid var(--con-warning)" }}>
              <AlertCircle size={14} style={{ color: "var(--con-warning)", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-primary)" }}>
                سيتم إعادة طلب <strong>{correctionModalApp.full_name}</strong> بحالة "استكمال مطلوب"
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>ملاحظات للمندوب *</label>
              <textarea
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="اكتب الملاحظات والمتطلبات التي يجب على المندوب استكمالها..."
                rows={5}
                className="con-input"
                style={{
                  width: "100%",
                  resize: "vertical",
                  fontSize: "var(--con-text-table)",
                  lineHeight: 1.7,
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", fontWeight: 600 }}>خيارات الإرسال</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (correctionNote.trim() && correctionModalApp.phone) {
                      sendWhatsApp(correctionModalApp.phone, `مرحباً ${correctionModalApp.full_name}،\n\nيرجى استكمال طلبك رقم ${correctionModalApp.app_ref}:\n\n${correctionNote.trim()}\n\nشكراً - First Line Logistics`);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.5rem 0.85rem",
                    borderRadius: "var(--con-radius)",
                    border: "1px solid rgba(37,211,102,0.3)",
                    background: "rgba(37,211,102,0.08)",
                    color: "#25D366",
                    fontSize: "var(--con-text-caption)",
                    fontWeight: 500,
                    cursor: correctionNote.trim() ? "pointer" : "not-allowed",
                    opacity: correctionNote.trim() ? 1 : 0.5,
                  }}
                >
                  <MessageSquare size={14} />
                  إرسال عبر واتساب
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (correctionNote.trim() && correctionModalApp.email) {
                      sendEmail(
                        correctionModalApp.email,
                        `استكمال طلب التسجيل ${correctionModalApp.app_ref}`,
                        `مرحباً ${correctionModalApp.full_name}،\n\nيرجى استكمال طلبك رقم ${correctionModalApp.app_ref}:\n\n${correctionNote.trim()}\n\nشكراً - First Line Logistics`
                      );
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.5rem 0.85rem",
                    borderRadius: "var(--con-radius)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    background: "rgba(59,130,246,0.08)",
                    color: "#3B82F6",
                    fontSize: "var(--con-text-caption)",
                    fontWeight: 500,
                    cursor: correctionNote.trim() && correctionModalApp.email ? "pointer" : "not-allowed",
                    opacity: correctionNote.trim() && correctionModalApp.email ? 1 : 0.5,
                  }}
                >
                  <Mail size={14} />
                  إرسال عبر الإيميل
                </button>
                <button
                  type="button"
                  onClick={() => setCorrectionPendingNotification(!correctionPendingNotification)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.5rem 0.85rem",
                    borderRadius: "var(--con-radius)",
                    border: `1px solid ${correctionPendingNotification ? "var(--con-border-brand)" : "var(--con-border-default)"}`,
                    background: correctionPendingNotification ? "var(--con-brand-subtle)" : "var(--con-bg-elevated)",
                    color: correctionPendingNotification ? "var(--con-brand)" : "var(--con-text-secondary)",
                    fontSize: "var(--con-text-caption)",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <Bell size={14} />
                  تنبيه مستقبلي
                  {correctionPendingNotification && <CheckCircle2 size={12} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
