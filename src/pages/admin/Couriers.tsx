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

const mockCouriers: Courier[] = [
  {
    id: "1",
    full_name: "أحمد محمد السالم",
    phone: "0501234567",
    status: "active",
    city: "الرياض",
    rating: 4.8,
    total_orders: 312,
    vehicle_type: "دراجة",
    created_at: "2024-01-15",
    app_id: "JHZ-1001",
    app_name: "jahez",
    nationality: "سعودي",
    iqama_number: "2388901234",
    monthly_orders: 45,
    supervisor: "محمد العلي",
    contract_type: "دوام كامل",
    registration_date: "2024-01-15",
  },
  {
    id: "2",
    full_name: "خالد العمري",
    phone: "0557654321",
    status: "on_delivery",
    city: "جدة",
    rating: 4.5,
    total_orders: 198,
    vehicle_type: "سيارة",
    created_at: "2024-02-20",
    app_id: "HS-2050",
    app_name: "hungerstation",
    nationality: "يمني",
    iqama_number: "2455678901",
    monthly_orders: 32,
    supervisor: "أحمد الشمري",
    contract_type: "دوام جزئي",
    registration_date: "2024-02-20",
  },
  {
    id: "3",
    full_name: "فهد الغامدي",
    phone: "0509876543",
    status: "on_leave",
    city: "الرياض",
    rating: 4.9,
    total_orders: 445,
    vehicle_type: "دراجة",
    created_at: "2023-11-10",
    app_id: "MRS-3022",
    app_name: "marsool",
    nationality: "سعودي",
    iqama_number: "2311234567",
    monthly_orders: 61,
    supervisor: "محمد العلي",
    contract_type: "دوام كامل",
    registration_date: "2023-11-10",
    admin_notes: "إجازة سنوية حتى 2026-04-20",
    last_active: "2026-03-28T14:30:00Z",
  },
  {
    id: "4",
    full_name: "سعد الزهراني",
    phone: "0551112233",
    status: "suspended",
    city: "الدمام",
    rating: 3.9,
    total_orders: 87,
    vehicle_type: "دراجة",
    created_at: "2024-03-05",
    app_id: "NOON-410",
    app_name: "noon",
    nationality: "باكستاني",
    iqama_number: "2499887766",
    monthly_orders: 0,
    supervisor: "أحمد الشمري",
    contract_type: "عقد مؤقت",
    registration_date: "2024-03-05",
    admin_notes: "موقوف بسبب مخالفات متكررة — بانتظار التحقيق",
    last_active: "2026-03-15T09:00:00Z",
  },
  {
    id: "5",
    full_name: "عمر الشمري",
    phone: "0503334455",
    status: "training",
    city: "الرياض",
    rating: undefined,
    total_orders: 0,
    vehicle_type: "سيارة",
    created_at: "2025-02-01",
    app_id: "AMZ-5001",
    app_name: "amazon",
    nationality: "سعودي",
    iqama_number: "2300112233",
    monthly_orders: 0,
    supervisor: "محمد العلي",
    contract_type: "حر (فريلانس)",
    registration_date: "2025-02-01",
    admin_notes: "في فترة التدريب الأولية — أسبوعين",
    last_active: "2026-04-04T11:00:00Z",
  },
  {
    id: "6",
    full_name: "محمد القحطاني",
    phone: "0556667788",
    status: "active",
    city: "مكة",
    rating: 4.7,
    total_orders: 234,
    vehicle_type: "دراجة",
    created_at: "2024-04-18",
    app_id: "TYR-6100",
    app_name: "toyor",
    nationality: "مصري",
    iqama_number: "2477665544",
    monthly_orders: 28,
    supervisor: "أحمد الشمري",
    contract_type: "دوام كامل",
    registration_date: "2024-04-18",
    last_active: "2026-04-05T08:15:00Z",
  },
];

const mockApplications: DriverApplication[] = [
  {
    id: "app-1",
    app_ref: "FLL-20250301-A1B2",
    full_name: "ناصر الحربي",
    national_id: "1088******",
    email: "n***@gmail.com",
    phone: "055***4567",
    city: "الرياض",
    date_of_birth: "1995-06-15",
    has_vehicle: true,
    vehicle_type: "سيارة",
    vehicle_model: "هيونداي أكسنت",
    vehicle_year: 2022,
    plate_number: "أ ب ج ١٢٣٤",
    status: "pending",
    supervisor: "محمد العلي",
    contract_type: "دوام كامل",
    created_at: "2025-03-01T10:00:00Z",
  },
  {
    id: "app-2",
    app_ref: "FLL-20250228-C3D4",
    full_name: "عبدالله الدوسري",
    national_id: "1092******",
    email: "a***@outlook.com",
    phone: "050***8901",
    city: "جدة",
    date_of_birth: "1998-11-20",
    has_vehicle: false,
    status: "under_review",
    supervisor: "أحمد الشمري",
    contract_type: "دوام جزئي",
    created_at: "2025-02-28T14:30:00Z",
  },
  {
    id: "app-3",
    app_ref: "FLL-20250225-E5F6",
    full_name: "يوسف الشهري",
    national_id: "1075******",
    email: "y***@gmail.com",
    phone: "053***2345",
    city: "الدمام",
    date_of_birth: "1992-03-08",
    has_vehicle: true,
    vehicle_type: "دراجة",
    status: "approved",
    supervisor: "محمد العلي",
    contract_type: "عقد مؤقت",
    reviewed_by: "admin@fll.sa",
    reviewed_at: "2025-02-26T09:00:00Z",
    created_at: "2025-02-25T08:00:00Z",
  },
  {
    id: "app-4",
    app_ref: "FLL-20250220-G7H8",
    full_name: "تركي المطيري",
    national_id: "1100******",
    email: "t***@yahoo.com",
    phone: "054***6789",
    city: "مكة",
    date_of_birth: "2000-01-12",
    has_vehicle: true,
    vehicle_type: "سيارة",
    vehicle_model: "تويوتا كورولا",
    vehicle_year: 2021,
    status: "rejected",
    admin_notes: "الهوية غير واضحة",
    supervisor: "أحمد الشمري",
    contract_type: "حر (فريلانس)",
    rejection_category: "مستندات ناقصة",
    reviewed_by: "admin@fll.sa",
    reviewed_at: "2025-02-21T16:00:00Z",
    created_at: "2025-02-20T11:00:00Z",
  },
];

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

export default function AdminCouriers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"couriers" | "applications">(
    "couriers",
  );
  const [couriers, setCouriers] = useState<Courier[]>(mockCouriers);
  const [courierLoading, setCourierLoading] = useState(true);
  const [courierSearch, setCourierSearch] = useState("");
  const [courierStatusFilter, setCourierStatusFilter] = useState<string>("all");
  const [applications, setApplications] =
    useState<DriverApplication[]>(mockApplications);
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

  const filteredCouriers = couriers.filter((c) => {
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
          </Toolbar>

          <Card noPadding>
            <Table
              headers={[
                "المندوب",
                "رقم الجوال",
                "المدينة",
                "المركبة",
                "التطبيق",
                "الجنسية",
                "المشرف المباشر",
                "نوع التعاقد",
                "تاريخ التسجيل",
                "التقييم",
                "طلبات الشهر",
                "الحالة",
                "إجراءات",
              ]}
              isEmpty={!courierLoading && filteredCouriers.length === 0}
              emptyIcon={Users}
              emptyText="لا توجد نتائج تطابق المعايير المحددة"
            >
              {courierLoading ? (
                <SkeletonRows rows={4} cols={13} />
              ) : (
                filteredCouriers.map((courier) => {
                  const sc = courierStatusConfig[courier.status];
                  return (
                    <tr key={courier.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.625rem",
                          }}
                        >
                          {courier.photo_url ? (
                            <img
                              src={courier.photo_url}
                              alt={courier.full_name}
                              style={{
                                width: "2rem",
                                height: "2rem",
                                borderRadius: "var(--con-radius)",
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
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
                              {initials(courier.full_name)}
                            </div>
                          )}
                          <span
                            style={{
                              fontWeight: 500,
                              color: "var(--con-text-primary)",
                            }}
                          >
                            <span
                              onClick={() => navigate(`/admin-panel/driver-profile/${courier.id}`)}
                              style={{ cursor: "pointer", color: "var(--con-brand)", textDecoration: "underline" }}
                            >
                              {courier.full_name}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="con-td-mono">{courier.phone}</td>
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
                          {courier.city ?? "—"}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                          }}
                        >
                          {courier.vehicle_type === "سيارة" ? (
                            <Truck
                              size={13}
                              style={{ color: "var(--con-text-muted)" }}
                            />
                          ) : courier.vehicle_type === "شاحنة صغيرة" ? (
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
                          <span style={{ color: "var(--con-text-secondary)" }}>
                            {courier.vehicle_type ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: "var(--con-text-secondary)", fontSize: "var(--con-text-table)" }}>
                          {courier.app_name
                            ? APP_NAME_OPTIONS.find((o) => o.value === courier.app_name)?.label ?? courier.app_name
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "var(--con-text-secondary)" }}>
                          {courier.nationality ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "var(--con-text-secondary)" }}>
                          {courier.supervisor ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "var(--con-text-secondary)" }}>
                          {courier.contract_type ?? "—"}
                        </span>
                      </td>
                      <td className="con-td-mono">
                        {courier.registration_date ? formatDate(courier.registration_date) : formatDate(courier.created_at)}
                      </td>
                      <td>
                        {courier.rating != null ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <Star
                              size={12}
                              style={{
                                color: "var(--con-warning)",
                                fill: "var(--con-warning)",
                              }}
                            />
                            <span
                              className="con-mono"
                              style={{ color: "var(--con-text-primary)" }}
                            >
                              {courier.rating.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--con-text-muted)" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                          }}
                        >
                          <Package
                            size={12}
                            style={{ color: "var(--con-text-muted)" }}
                          />
                          <span
                            className="con-mono"
                            style={{ color: "var(--con-text-secondary)" }}
                          >
                            {(courier.monthly_orders ?? 0).toLocaleString(
                              "ar-SA",
                            )}
                          </span>
                        </div>
                      </td>
                      <td>
                        <select
                          value={courier.status}
                          onChange={(e) => handleQuickStatusChange(courier.id, e.target.value as Courier["status"])}
                          className="con-input"
                          style={{
                            fontSize: "var(--con-text-caption)",
                            padding: "0.25rem 0.4rem",
                            minWidth: 110,
                            background: "var(--con-bg-elevated)",
                            border: "1px solid var(--con-border-default)",
                            borderRadius: "var(--con-radius)",
                            color: "var(--con-text-primary)",
                            cursor: "pointer",
                          }}
                        >
                          {Object.entries(courierStatusConfig).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                          <IconButton icon={Eye} title="عرض التفاصيل" onClick={() => setViewCourier(courier)} variant="brand" />
                          <IconButton icon={Edit2} title="تعديل" onClick={() => setEditCourier({ ...courier })} />
                          <IconButton icon={Trash2} title="حذف" onClick={() => setDeleteCourierId(courier.id)} variant="danger" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </Table>
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
              emptyText="لا توجد طلبات تسجيل تطابق المعايير المحددة"
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
      <Modal
        open={!!viewCourier}
        onClose={() => setViewCourier(null)}
        title={viewCourier?.full_name ?? "تفاصيل المندوب"}
        width={700}
      >
        {viewCourier && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {viewCourier.photo_url ? (
                <img
                  src={viewCourier.photo_url}
                  alt={viewCourier.full_name}
                  style={{ width: 48, height: 48, borderRadius: "var(--con-radius)", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: "var(--con-radius)", background: "var(--con-brand-subtle)", color: "var(--con-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>
                  {initials(viewCourier.full_name)}
                </div>
              )}
              <div>
                <div style={{ fontSize: "var(--con-text-card-title)", fontWeight: 700, color: "var(--con-text-primary)" }}>{viewCourier.full_name}</div>
                <div className="con-mono" style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{viewCourier.phone}</div>
              </div>
              <div style={{ marginRight: "auto" }}>
                <Badge variant={courierStatusConfig[viewCourier.status]?.variant ?? "muted"}>
                  {courierStatusConfig[viewCourier.status]?.label ?? viewCourier.status}
                </Badge>
              </div>
            </div>

            <Section title="معلومات أساسية">
              <DetailGrid>
                <DetailField icon={Users} label="الاسم الكامل" value={viewCourier.full_name} />
                <DetailField icon={Phone} label="رقم الجوال" value={viewCourier.phone} mono />
                <DetailField icon={Mail} label="البريد الإلكتروني" value={viewCourier.email ?? "—"} mono />
                <DetailField icon={MapPin} label="المدينة" value={viewCourier.city ?? "—"} />
              </DetailGrid>
            </Section>

            <Section title="معلومات العمل">
              <DetailGrid>
                <DetailField icon={Package} label="التطبيق" value={viewCourier.app_name ? (APP_NAME_OPTIONS.find((o) => o.value === viewCourier.app_name)?.label ?? viewCourier.app_name) : "—"} />
                <DetailField icon={CreditCard} label="رقم ID التطبيق" value={viewCourier.app_id ?? "—"} mono />
                <DetailField icon={Bike} label="نوع المركبة" value={viewCourier.vehicle_type ?? "—"} />
                <DetailField icon={Users} label="المشرف المباشر" value={viewCourier.supervisor ?? "—"} />
                <DetailField icon={FileText} label="نوع التعاقد" value={viewCourier.contract_type ?? "—"} />
                <DetailField icon={Shield} label="الحالة" value={courierStatusConfig[viewCourier.status]?.label ?? viewCourier.status} />
              </DetailGrid>
            </Section>

            <Section title="معلومات الهوية">
              <DetailGrid>
                <DetailField icon={Shield} label="الجنسية" value={viewCourier.nationality ?? "—"} />
                <DetailField icon={CreditCard} label="رقم الإقامة" value={viewCourier.iqama_number ?? "—"} mono />
              </DetailGrid>
            </Section>

            <Section title="إحصائيات">
              <DetailGrid>
                <DetailField icon={Star} label="التقييم" value={viewCourier.rating != null ? viewCourier.rating.toFixed(1) : "—"} />
                <DetailField icon={Package} label="طلبات الشهر" value={String(viewCourier.monthly_orders ?? 0)} />
                <DetailField icon={Calendar} label="تاريخ التسجيل" value={viewCourier.registration_date ? formatDate(viewCourier.registration_date) : formatDate(viewCourier.created_at)} mono />
                <DetailField icon={Clock} label="آخر نشاط" value={viewCourier.last_active ? formatDate(viewCourier.last_active) : "—"} mono />
              </DetailGrid>
            </Section>

            {viewCourier.admin_notes && (
              <Section title="ملاحظات إدارية">
                <p style={{ margin: 0, fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)", lineHeight: 1.7 }}>
                  {viewCourier.admin_notes}
                </p>
              </Section>
            )}
          </div>
        )}
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
