import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/admin/auth";
import { API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import {
  Settings2,
  User,
  Server,
  Shield,
  Bell,
  Globe,
  Database,
  Palette,
  Mail,
  Clock,
  Save,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Lock,
  Key,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Monitor,
  Moon,
  Sun,
  Languages,
  Megaphone,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  HardDrive,
  ShieldCheck,
  ExternalLink,
  Users,
  Building2,
  FileText,
  Cloud,
  GitBranch,
  Rocket,
  Activity,
  BarChart3,
  Terminal,
  Copy,
  Link2,
  Power,
  PlayCircle,
  PauseCircle,
  Upload,
  Download,
  RefreshCcw,
  Webhook,
  CircleDot,
  Crown,
  Gauge,
  Cpu,
  Boxes,
  CalendarClock,
  Layers,
  Paintbrush,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────── */
type Tab =
  | "general"
  | "security"
  | "notifications"
  | "system"
  | "advanced"
  | "services"
  | "permissions"
  | "ai-features"
  | "power";

interface SystemSetting {
  key: string;
  value: string | boolean | number;
  label: string;
  description: string;
  type: "toggle" | "text" | "number" | "select";
  options?: { value: string; label: string }[];
  group: Tab;
  icon: React.ElementType;
}

/* ── Defaults ──────────────────────────────────────────────────────────── */
const STORAGE_KEY = "fll_system_settings_v1";

function loadSettingsFromLocalStorage(): Record<string, string | boolean | number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistToLocalStorage(s: Record<string, string | boolean | number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/** Fetch all rows from Supabase system_settings and merge into a flat object */
async function loadSettingsFromSupabase(): Promise<Record<string, string | boolean | number>> {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value");
    if (error || !data) return {};
    const result: Record<string, string | boolean | number> = {};
    for (const row of data) {
      // value is stored as jsonb; unwrap the primitive
      result[row.key] = row.value as string | boolean | number;
    }
    return result;
  } catch {
    return {};
  }
}

/** Upsert all settings to Supabase (fire-and-forget) */
function persistToSupabase(s: Record<string, string | boolean | number>) {
  if (!supabase) return;
  const now = new Date().toISOString();
  const rows = Object.entries(s).map(([key, value]) => ({
    key,
    value: value as unknown,
    updated_at: now,
  }));
  // fire-and-forget — don't await
  supabase
    .from("system_settings")
    .upsert(rows, { onConflict: "key" })
    .then(({ error }) => {
      if (error) console.warn("[Settings] Supabase upsert failed:", error.message);
    });
}

const ALL_SETTINGS: SystemSetting[] = [
  // ── General ──
  {
    key: "company_name",
    value: "شركة الخط الأول للخدمات اللوجستية",
    label: "اسم الشركة",
    description: "يظهر في الإيميلات والفواتير",
    type: "text",
    group: "general",
    icon: Building2,
  },
  {
    key: "company_email",
    value: "support@fll.sa",
    label: "البريد الرسمي",
    description: "بريد الدعم الفني والتواصل",
    type: "text",
    group: "general",
    icon: Mail,
  },
  {
    key: "company_phone",
    value: "920014948",
    label: "رقم التواصل",
    description: "يظهر في الإيميلات وصفحة التواصل",
    type: "text",
    group: "general",
    icon: Megaphone,
  },
  {
    key: "default_city",
    value: "الرياض",
    label: "المدينة الافتراضية",
    description: "المدينة الافتراضية للطلبات الجديدة",
    type: "text",
    group: "general",
    icon: Globe,
  },
  {
    key: "timezone",
    value: "Asia/Riyadh",
    label: "المنطقة الزمنية",
    description: "تؤثر على التقارير والجدولة",
    type: "select",
    group: "general",
    icon: Clock,
    options: [
      { value: "Asia/Riyadh", label: "الرياض (UTC+3)" },
      { value: "Asia/Dubai", label: "دبي (UTC+4)" },
      { value: "UTC", label: "UTC" },
    ],
  },
  {
    key: "language",
    value: "ar",
    label: "لغة النظام",
    description: "اللغة الافتراضية للوحة التحكم",
    type: "select",
    group: "general",
    icon: Languages,
    options: [
      { value: "ar", label: "العربية" },
      { value: "en", label: "English" },
    ],
  },

  // ── Security ──
  {
    key: "2fa_enabled",
    value: true,
    label: "المصادقة الثنائية (2FA)",
    description: "طلب رمز تحقق بعد كلمة المرور",
    type: "toggle",
    group: "security",
    icon: Shield,
  },
  {
    key: "session_timeout",
    value: 60,
    label: "مهلة الجلسة (دقيقة)",
    description: "تسجيل خروج تلقائي بعد عدم النشاط",
    type: "number",
    group: "security",
    icon: Clock,
  },
  {
    key: "max_login_attempts",
    value: 5,
    label: "محاولات الدخول القصوى",
    description: "قفل الحساب بعد تجاوز العدد",
    type: "number",
    group: "security",
    icon: Lock,
  },
  {
    key: "ip_whitelist",
    value: "",
    label: "قائمة IP المسموح",
    description: "IPs مسموحة فقط (فارغ = الكل مسموح)",
    type: "text",
    group: "security",
    icon: Wifi,
  },
  {
    key: "password_min_length",
    value: 8,
    label: "الحد الأدنى لكلمة المرور",
    description: "عدد الأحرف الأدنى المطلوب",
    type: "number",
    group: "security",
    icon: Key,
  },
  {
    key: "audit_logging",
    value: true,
    label: "تسجيل التدقيق",
    description: "تسجيل كل العمليات الحساسة",
    type: "toggle",
    group: "security",
    icon: FileText,
  },

  // ── Notifications ──
  {
    key: "email_notifications",
    value: true,
    label: "إشعارات البريد",
    description: "إرسال إشعارات عبر البريد الإلكتروني",
    type: "toggle",
    group: "notifications",
    icon: Mail,
  },
  {
    key: "new_order_alert",
    value: true,
    label: "تنبيه طلب جديد",
    description: "إشعار عند وصول طلب جديد",
    type: "toggle",
    group: "notifications",
    icon: Bell,
  },
  {
    key: "complaint_alert",
    value: true,
    label: "تنبيه شكوى جديدة",
    description: "إشعار عند تسجيل شكوى",
    type: "toggle",
    group: "notifications",
    icon: AlertTriangle,
  },
  {
    key: "driver_register_alert",
    value: true,
    label: "تنبيه تسجيل مندوب",
    description: "إشعار عند تقديم طلب تسجيل جديد",
    type: "toggle",
    group: "notifications",
    icon: Users,
  },
  {
    key: "payout_alert",
    value: true,
    label: "تنبيه دفعة مالية",
    description: "إشعار عند إنشاء أو اعتماد دفعة",
    type: "toggle",
    group: "notifications",
    icon: Zap,
  },
  {
    key: "admin_emails",
    value: "m_shaikhi@yahoo.com,A.ALZAMIL@FLL.SA",
    label: "إيميلات المدراء",
    description: "إيميلات تستقبل التنبيهات (مفصولة بفاصلة)",
    type: "text",
    group: "notifications",
    icon: Mail,
  },

  // ── System ──
  {
    key: "maintenance_mode",
    value: false,
    label: "وضع الصيانة",
    description: "إيقاف الموقع مؤقتاً وعرض صفحة صيانة",
    type: "toggle",
    group: "system",
    icon: AlertTriangle,
  },
  {
    key: "api_rate_limit",
    value: 100,
    label: "حد الطلبات (لكل دقيقة)",
    description: "الحد الأقصى للطلبات لكل مستخدم",
    type: "number",
    group: "system",
    icon: Zap,
  },
  {
    key: "file_upload_max_mb",
    value: 10,
    label: "حد رفع الملفات (MB)",
    description: "الحجم الأقصى لرفع الملفات",
    type: "number",
    group: "system",
    icon: HardDrive,
  },
  {
    key: "cache_ttl_minutes",
    value: 15,
    label: "مدة التخزين المؤقت",
    description: "مدة تخزين البيانات مؤقتاً (بالدقائق)",
    type: "number",
    group: "system",
    icon: Database,
  },
  {
    key: "chat_enabled",
    value: true,
    label: "المحادثة الذكية (AI)",
    description: "تفعيل مساعد FLL السحابي",
    type: "toggle",
    group: "system",
    icon: Megaphone,
  },
  {
    key: "debug_mode",
    value: false,
    label: "وضع التصحيح",
    description: "عرض معلومات تقنية إضافية (للمطورين)",
    type: "toggle",
    group: "system",
    icon: Monitor,
  },

  // ── Advanced ──
  {
    key: "api_region",
    value: "us-east-1",
    label: "منطقة API",
    description: "المنطقة الجغرافية لخدمات AWS",
    type: "select",
    group: "advanced",
    icon: Server,
    options: [
      { value: "us-east-1", label: "فرجينيا (us-east-1)" },
      { value: "me-south-1", label: "البحرين (me-south-1)" },
    ],
  },
  {
    key: "cognito_pool",
    value: "us-east-1_qHMox2NTB",
    label: "Cognito Pool",
    description: "معرّف مجموعة المصادقة",
    type: "text",
    group: "advanced",
    icon: Shield,
  },
  {
    key: "supabase_project",
    value: "djebhztfewjfyyoortvv",
    label: "Supabase Project",
    description: "معرّف مشروع Supabase",
    type: "text",
    group: "advanced",
    icon: Database,
  },
  {
    key: "ses_sender",
    value: "no-reply@fll.sa",
    label: "بريد الإرسال (SES)",
    description: "العنوان المستخدم لإرسال الإيميلات",
    type: "text",
    group: "advanced",
    icon: Mail,
  },
  {
    key: "otp_ttl_minutes",
    value: 10,
    label: "صلاحية رمز التحقق (دقيقة)",
    description: "مدة صلاحية رمز OTP",
    type: "number",
    group: "advanced",
    icon: Clock,
  },
  {
    key: "auto_backup",
    value: true,
    label: "النسخ الاحتياطي التلقائي",
    description: "نسخ احتياطي يومي للبيانات",
    type: "toggle",
    group: "advanced",
    icon: HardDrive,
  },

  // ── AI Features (Claude Code) ──
  {
    key: "ai_auto_format",
    value: true,
    label: "التنسيق التلقائي (Prettier)",
    description: "يُنسّق الكود تلقائياً بعد كل تعديل أو إنشاء ملف. يحافظ على نمط موحد للكود بدون تدخل يدوي. يدعم: TypeScript, JavaScript, CSS, JSON.",
    type: "toggle",
    group: "ai-features",
    icon: Palette,
  },
  {
    key: "ai_git_safety",
    value: true,
    label: "حماية Git",
    description: "يمنع تلقائياً الأوامر الخطيرة مثل git reset --hard و git push --force التي قد تسبب فقدان البيانات. يحمي الفرع الرئيسي (main) من التعديلات غير المقصودة.",
    type: "toggle",
    group: "ai-features",
    icon: GitBranch,
  },
  {
    key: "ai_file_safety",
    value: true,
    label: "حماية الملفات",
    description: "يمنع أوامر الحذف الخطيرة مثل rm -rf التي قد تحذف ملفات المشروع بالكامل. يطلب تأكيد قبل أي عملية حذف واسعة.",
    type: "toggle",
    group: "ai-features",
    icon: ShieldCheck,
  },
  {
    key: "ai_context_preserve",
    value: true,
    label: "حفظ السياق الحرج",
    description: "يحفظ المعلومات المهمة تلقائياً عند ضغط المحادثة: نظام OTP محمي، منطقة AWS، معرّفات Cognito. يضمن عدم نسيان القرارات الحرجة بين الجلسات.",
    type: "toggle",
    group: "ai-features",
    icon: Database,
  },
  {
    key: "ai_session_reminder",
    value: true,
    label: "تذكير نهاية الجلسة",
    description: "يعرض رسالة تذكيرية عند انتهاء كل جلسة عمل تتضمن: حالة OTP، طريقة النشر، والقواعد المهمة.",
    type: "toggle",
    group: "ai-features",
    icon: Bell,
  },
  {
    key: "ai_chatbot_enabled",
    value: true,
    label: "المساعد الذكي (AI Chatbot)",
    description: "مساعد ذكي متصل بـ AWS Bedrock (Claude Haiku 4.5). يقرأ من: DynamoDB، Lambda، GitHub، Vercel. يكتب: فقط صلاحيات الموظفين. يدعم 10 أدوات للقراءة والتحليل.",
    type: "toggle",
    group: "ai-features",
    icon: Megaphone,
  },
  {
    key: "ai_github_actions",
    value: true,
    label: "مراجعة PR تلقائية (GitHub)",
    description: "Claude يراجع تلقائياً كل Pull Request جديد على GitHub. يفحص الكود، يكتشف الأخطاء، ويعلّق بملاحظات. يعمل أيضاً عند ذكر @claude في التعليقات.",
    type: "toggle",
    group: "ai-features",
    icon: GitBranch,
  },
  {
    key: "ai_spinner_tips",
    value: true,
    label: "تلميحات المشروع",
    description: "يعرض تلميحات خاصة بالمشروع أثناء انتظار الاستجابة: حالة OTP، منطقة AWS، طريقة النشر. تساعد على تذكّر القواعد المهمة.",
    type: "toggle",
    group: "ai-features",
    icon: Zap,
  },
  {
    key: "ai_arabic_default",
    value: true,
    label: "اللغة العربية افتراضياً",
    description: "Claude يرد بالعربية دائماً إلا إذا طُلب منه الإنجليزية. يشمل: الردود، رسائل الـ commit، التعليقات على الكود.",
    type: "toggle",
    group: "ai-features",
    icon: Languages,
  },
  {
    key: "ai_chrome_debug",
    value: true,
    label: "Chrome DevTools",
    description: "يتصل بمتصفح Chrome عبر MCP للتحكم والفحص المباشر. يمكنه: فتح صفحات، قراءة Console، فحص العناصر، التقاط شاشة، وتنفيذ JavaScript.",
    type: "toggle",
    group: "ai-features",
    icon: Monitor,
  },

  // ── Services (additional) ──
  {
    key: "supabase_realtime",
    value: true,
    label: "Supabase Realtime",
    description: "تفعيل التحديثات اللحظية",
    type: "toggle",
    group: "services",
    icon: Activity,
  },
  {
    key: "lambda_warmer",
    value: true,
    label: "Lambda Warmer",
    description: "تسخين Lambda كل 5 دقائق",
    type: "toggle",
    group: "services",
    icon: Zap,
  },
  {
    key: "ses_enabled",
    value: true,
    label: "خدمة الإيميل (SES)",
    description: "تفعيل إرسال الإيميلات",
    type: "toggle",
    group: "services",
    icon: Mail,
  },
  {
    key: "mapbox_enabled",
    value: false,
    label: "خريطة Mapbox",
    description: "تفعيل الخريطة التفاعلية",
    type: "toggle",
    group: "services",
    icon: Globe,
  },
  {
    key: "almanahel_integration",
    value: false,
    label: "نظام البصمة AlManahel",
    description: "تفعيل الاتصال بنظام الحضور",
    type: "toggle",
    group: "services",
    icon: Activity,
  },
  {
    key: "github_actions",
    value: true,
    label: "GitHub Actions",
    description: "تفعيل الـ CI/CD",
    type: "toggle",
    group: "services",
    icon: GitBranch,
  },
  {
    key: "vercel_auto_deploy",
    value: true,
    label: "Vercel Auto Deploy",
    description: "النشر التلقائي عند الدفع",
    type: "toggle",
    group: "services",
    icon: Rocket,
  },
  {
    key: "stripe_payments",
    value: false,
    label: "مدفوعات Stripe",
    description: "تفعيل الدفع الإلكتروني",
    type: "toggle",
    group: "services",
    icon: Zap,
  },

  // ── Permissions (additional) ──
  {
    key: "role_admin_full",
    value: true,
    label: "صلاحية المدير الكاملة",
    description: "وصول كامل لجميع الصفحات",
    type: "toggle",
    group: "permissions",
    icon: ShieldCheck,
  },
  {
    key: "role_staff_limited",
    value: true,
    label: "تقييد الموظفين",
    description: "تقييد وصول الموظفين",
    type: "toggle",
    group: "permissions",
    icon: Lock,
  },
  {
    key: "role_driver_portal",
    value: true,
    label: "بوابة السائقين",
    description: "تفعيل بوابة السائقين",
    type: "toggle",
    group: "permissions",
    icon: Users,
  },
  {
    key: "allow_data_export",
    value: false,
    label: "السماح بالتصدير",
    description: "السماح للموظفين بتصدير البيانات",
    type: "toggle",
    group: "permissions",
    icon: Download,
  },
  {
    key: "allow_bulk_actions",
    value: false,
    label: "السماح بالعمليات الجماعية",
    description: "السماح بالعمليات الجماعية للموظفين",
    type: "toggle",
    group: "permissions",
    icon: Zap,
  },
  {
    key: "require_approval",
    value: true,
    label: "طلب اعتماد",
    description: "طلب اعتماد للعمليات الحساسة",
    type: "toggle",
    group: "permissions",
    icon: CheckCircle2,
  },

  // ── Power Controls (مركز التحكم) ──
  {
    key: "page_builder_enabled",
    value: false,
    label: "منشئ الصفحات",
    description: "تفعيل/تعطيل إنشاء صفحات مخصصة",
    type: "toggle",
    group: "power",
    icon: Layers,
  },
  {
    key: "export_all_data",
    value: false,
    label: "تصدير شامل",
    description: "السماح بتصدير جميع بيانات النظام",
    type: "toggle",
    group: "power",
    icon: Download,
  },
  {
    key: "danger_zone_delete_cache",
    value: false,
    label: "مسح التخزين المؤقت",
    description: "مسح كل بيانات الكاش",
    type: "toggle",
    group: "power",
    icon: Trash2,
  },
  {
    key: "danger_zone_reset_sessions",
    value: false,
    label: "إنهاء جميع الجلسات",
    description: "تسجيل خروج كل المستخدمين",
    type: "toggle",
    group: "power",
    icon: Power,
  },
  {
    key: "real_time_monitoring",
    value: false,
    label: "المراقبة الحية",
    description: "مراقبة حية لجميع العمليات",
    type: "toggle",
    group: "power",
    icon: Activity,
  },
  {
    key: "api_full_access",
    value: false,
    label: "وصول API كامل",
    description: "السماح بجميع عمليات API",
    type: "toggle",
    group: "power",
    icon: Cpu,
  },
  {
    key: "bulk_operations",
    value: false,
    label: "العمليات الجماعية",
    description: "تفعيل العمليات الجماعية",
    type: "toggle",
    group: "power",
    icon: Boxes,
  },
  {
    key: "developer_console",
    value: false,
    label: "وحدة المطور",
    description: "الوصول لأدوات التطوير المتقدمة",
    type: "toggle",
    group: "power",
    icon: Terminal,
  },
  {
    key: "auto_deploy",
    value: false,
    label: "النشر التلقائي",
    description: "نشر التحديثات تلقائياً",
    type: "toggle",
    group: "power",
    icon: Rocket,
  },
  {
    key: "system_override",
    value: false,
    label: "تجاوز النظام",
    description: "تجاوز قيود النظام (للمالك فقط)",
    type: "toggle",
    group: "power",
    icon: AlertTriangle,
  },
  {
    key: "webhook_manager",
    value: false,
    label: "إدارة Webhooks",
    description: "تفعيل إدارة Webhooks",
    type: "toggle",
    group: "power",
    icon: Webhook,
  },
  {
    key: "cron_scheduler",
    value: false,
    label: "جدولة المهام",
    description: "تفعيل جدولة المهام التلقائية",
    type: "toggle",
    group: "power",
    icon: CalendarClock,
  },
  {
    key: "multi_branch",
    value: false,
    label: "إدارة متعددة الفروع",
    description: "تفعيل إدارة فروع متعددة",
    type: "toggle",
    group: "power",
    icon: GitBranch,
  },
  {
    key: "advanced_analytics",
    value: false,
    label: "تحليلات متقدمة",
    description: "تفعيل لوحة تحليلات متقدمة",
    type: "toggle",
    group: "power",
    icon: BarChart3,
  },
  {
    key: "custom_themes",
    value: false,
    label: "سمات مخصصة",
    description: "تفعيل تخصيص مظهر اللوحة",
    type: "toggle",
    group: "power",
    icon: Paintbrush,
  },
];

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "عام", icon: Settings2 },
  { id: "security", label: "الأمان", icon: Shield },
  { id: "notifications", label: "الإشعارات", icon: Bell },
  { id: "system", label: "النظام", icon: Server },
  { id: "services", label: "الخدمات", icon: Cloud },
  { id: "permissions", label: "الصلاحيات", icon: Users },
  { id: "advanced", label: "متقدم", icon: Zap },
  { id: "ai-features", label: "الأدوات الذكية", icon: Rocket },
  { id: "power", label: "مركز التحكم", icon: Crown },
];

/* ── Component ─────────────────────────────────────────────────────────── */
export default function AdminSettings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("general");
  const [values, setValues] = useState<
    Record<string, string | boolean | number>
  >({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);

  const canAccess = user?.role === "admin" || user?.role === "owner";

  const supabaseMerged = useRef(false);

  useEffect(() => {
    // 1. Immediate: load from localStorage (fast)
    const stored = loadSettingsFromLocalStorage();
    const defaults: Record<string, string | boolean | number> = {};
    ALL_SETTINGS.forEach((s) => {
      defaults[s.key] = s.value;
    });
    const merged = { ...defaults, ...stored };
    setValues(merged);

    // 2. Background: fetch from Supabase and merge (durable store wins for conflicts)
    if (!supabaseMerged.current) {
      supabaseMerged.current = true;
      loadSettingsFromSupabase().then((remote) => {
        if (Object.keys(remote).length === 0) return;
        setValues((prev) => {
          const updated = { ...prev, ...remote };
          // Sync the merged result back to localStorage
          persistToLocalStorage(updated);
          return updated;
        });
      });
    }
  }, []);

  function updateValue(key: string, val: string | boolean | number) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    // 1. Immediate: persist to localStorage (fast, always works)
    persistToLocalStorage(values);
    // 2. Background: persist to Supabase (durable, cross-device)
    persistToSupabase(values);
    // 3. Best-effort: also push to API (existing behavior)
    try {
      await fetch(`${API_BASE}/system-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "global",
          ...values,
          updatedAt: new Date().toISOString(),
        }),
      });
    } catch {
      /* saved locally + Supabase */
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    const defaults: Record<string, string | boolean | number> = {};
    ALL_SETTINGS.filter((s) => s.group === tab).forEach((s) => {
      defaults[s.key] = s.value;
    });
    setValues((prev) => ({ ...prev, ...defaults }));
    setSaved(false);
  }

  if (!canAccess) {
    return (
      <div dir="rtl" style={{ padding: "3rem", textAlign: "center" }}>
        <ShieldCheck
          size={48}
          style={{ color: "var(--con-text-muted)", margin: "0 auto 1rem" }}
        />
        <h2
          style={{
            fontSize: 18,
            color: "var(--con-text-primary)",
            marginBottom: 8,
          }}
        >
          وصول مقيّد
        </h2>
        <p style={{ fontSize: 13, color: "var(--con-text-muted)" }}>
          ليس لديك صلاحية لعرض إعدادات النظام.
        </p>
      </div>
    );
  }

  const currentSettings = ALL_SETTINGS.filter((s) => s.group === tab);

  return (
    <div
      dir="rtl"
      style={{
        padding: "1.5rem",
        fontFamily: "var(--con-font-arabic)",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
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
            <Settings2 size={18} style={{ color: "var(--con-accent)" }} />{" "}
            إعدادات النظام
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--con-text-muted)",
              margin: "4px 0 0",
            }}
          >
            تحكّم كامل في إعدادات المنصة والخدمات
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleReset}
            className="con-btn con-btn-ghost"
            style={{ gap: 6, fontSize: 12 }}
          >
            <RefreshCw size={13} /> استعادة الافتراضي
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="con-btn-primary"
            style={{ gap: 6, fontSize: 12, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : saved ? (
              <CheckCircle2 size={13} />
            ) : (
              <Save size={13} />
            )}
            {saving ? "جارٍ الحفظ..." : saved ? "تم الحفظ" : "حفظ الإعدادات"}
          </button>
        </div>
      </div>

      {/* User Info Bar */}
      <div
        className="con-card"
        style={{
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--con-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {(user?.full_name || "A").charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--con-text-primary)",
            }}
          >
            {user?.full_name || "—"}
          </div>
          <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>
            {user?.email} —{" "}
            {user?.role === "admin" ? "مدير النظام" : user?.role}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--con-success)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--con-success)",
            }}
          />{" "}
          متصل
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          marginBottom: "1.25rem",
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {TAB_CONFIG.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="con-btn"
              style={{
                background: isActive ? "var(--con-accent)" : "transparent",
                color: isActive ? "#fff" : "var(--con-text-muted)",
                border: isActive
                  ? "none"
                  : "1px solid var(--con-border-default)",
                fontSize: 12,
                gap: 6,
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Settings List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {currentSettings.map((setting) => {
          const Icon = setting.icon;
          const val = values[setting.key] ?? setting.value;
          const isExpanded = expandedInfo === setting.key;
          return (
            <div
              key={setting.key}
              className="con-card"
              style={{
                padding: "1rem 1.25rem",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background:
                      setting.type === "toggle" && val === true
                        ? "rgba(34,197,94,0.1)"
                        : "var(--con-bg-elevated)",
                    border: `1px solid ${setting.type === "toggle" && val === true ? "rgba(34,197,94,0.3)" : "var(--con-border-default)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    size={16}
                    style={{
                      color:
                        setting.type === "toggle" && val === true
                          ? "var(--con-success)"
                          : "var(--con-text-muted)",
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--con-text-primary)",
                      }}
                    >
                      {setting.label}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedInfo(isExpanded ? null : setting.key)
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        color: "var(--con-text-muted)",
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button>
                  </div>
                  {isExpanded && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--con-text-muted)",
                        margin: "4px 0 0",
                      }}
                    >
                      {setting.description}
                    </p>
                  )}
                </div>

                {/* Control */}
                <div style={{ flexShrink: 0 }}>
                  {setting.type === "toggle" && (
                    <button
                      onClick={() => updateValue(setting.key, !val)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      {val ? (
                        <ToggleRight
                          size={32}
                          style={{ color: "var(--con-success)" }}
                        />
                      ) : (
                        <ToggleLeft
                          size={32}
                          style={{ color: "var(--con-text-muted)" }}
                        />
                      )}
                    </button>
                  )}
                  {setting.type === "text" && (
                    <input
                      className="con-input"
                      dir={
                        /^[a-zA-Z0-9@._\-:/]/.test(String(val)) ? "ltr" : "rtl"
                      }
                      value={String(val)}
                      onChange={(e) => updateValue(setting.key, e.target.value)}
                      style={{
                        width: 220,
                        fontSize: 12,
                        fontFamily: /^[a-zA-Z0-9@._\-:/]/.test(String(val))
                          ? "monospace"
                          : "inherit",
                      }}
                    />
                  )}
                  {setting.type === "number" && (
                    <input
                      className="con-input"
                      type="number"
                      dir="ltr"
                      value={Number(val)}
                      onChange={(e) =>
                        updateValue(setting.key, parseInt(e.target.value) || 0)
                      }
                      style={{ width: 80, fontSize: 12, textAlign: "center" }}
                    />
                  )}
                  {setting.type === "select" && (
                    <select
                      className="con-input"
                      value={String(val)}
                      onChange={(e) => updateValue(setting.key, e.target.value)}
                      style={{ width: 180, fontSize: 12 }}
                    >
                      {setting.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Services Tab ──────────────────────────────────────────────── */}
      {tab === "services" && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {/* AWS Services */}
          <div className="con-card" style={{ padding: "1.25rem" }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--con-text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Cloud size={16} style={{ color: "#FF9900" }} /> خدمات AWS
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.5rem",
              }}
            >
              {[
                {
                  name: "Lambda Functions",
                  desc: "16 وظيفة (Python + Node.js)",
                  status: "active",
                  url: "https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions",
                  icon: Zap,
                  color: "#FF9900",
                },
                {
                  name: "API Gateway",
                  desc: "3 واجهات API (Platform + AI + Auth)",
                  status: "active",
                  url: "https://us-east-1.console.aws.amazon.com/apigateway/main/apis?region=us-east-1",
                  icon: Globe,
                  color: "#3b82f6",
                },
                {
                  name: "DynamoDB",
                  desc: "39 جدول بيانات",
                  status: "active",
                  url: "https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables",
                  icon: Database,
                  color: "#4F46E5",
                },
                {
                  name: "S3 Storage",
                  desc: "17 حاوية تخزين",
                  status: "active",
                  url: "https://s3.console.aws.amazon.com/s3/home?region=us-east-1",
                  icon: HardDrive,
                  color: "#22c55e",
                },
                {
                  name: "SES (Email)",
                  desc: "50K/يوم من no-reply@fll.sa",
                  status: "active",
                  url: "https://us-east-1.console.aws.amazon.com/ses/home?region=me-south-1",
                  icon: Mail,
                  color: "#EC4899",
                },
                {
                  name: "Cognito",
                  desc: "مصادقة المستخدمين",
                  status: "active",
                  url: "https://us-east-1.console.aws.amazon.com/cognito/v2/idp/user-pools?region=us-east-1",
                  icon: Shield,
                  color: "#8B5CF6",
                },
                {
                  name: "CloudWatch",
                  desc: "37 تنبيه مراقبة",
                  status: "active",
                  url: "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1",
                  icon: Activity,
                  color: "#06b6d4",
                },
                {
                  name: "EventBridge",
                  desc: "10 قواعد مجدولة",
                  status: "active",
                  url: "https://us-east-1.console.aws.amazon.com/events/home?region=us-east-1",
                  icon: Clock,
                  color: "#f59e0b",
                },
                {
                  name: "Bedrock (AI)",
                  desc: "Claude Haiku 4.5 للمحادثة",
                  status: "active",
                  url: "https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1",
                  icon: Megaphone,
                  color: "#D97706",
                },
              ].map((svc) => (
                <a
                  key={svc.name}
                  href={svc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="con-card"
                  style={{
                    padding: "0.75rem",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = svc.color)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: svc.color + "18",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svc.icon size={14} style={{ color: svc.color }} />
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--con-text-primary)",
                      }}
                    >
                      {svc.name}
                    </span>
                    <ExternalLink
                      size={10}
                      style={{
                        color: "var(--con-text-muted)",
                        marginRight: "auto",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--con-text-muted)" }}>
                    {svc.desc}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--con-success)",
                      }}
                    />
                    <span style={{ fontSize: 9, color: "var(--con-success)" }}>
                      نشط
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Vercel */}
          <div className="con-card" style={{ padding: "1.25rem" }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--con-text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Rocket size={16} /> Vercel — الاستضافة والنشر
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.5rem",
              }}
            >
              {[
                {
                  name: "لوحة المشروع",
                  desc: "إعدادات النشر والدومين",
                  url: "https://vercel.com/mshari-as-projects/first-line-logistics",
                  icon: Rocket,
                },
                {
                  name: "Deployments",
                  desc: "سجل عمليات النشر",
                  url: "https://vercel.com/mshari-as-projects/first-line-logistics/deployments",
                  icon: Upload,
                },
                {
                  name: "Environment Variables",
                  desc: "المتغيرات البيئية (API keys)",
                  url: "https://vercel.com/mshari-as-projects/first-line-logistics/settings/environment-variables",
                  icon: Key,
                },
                {
                  name: "Analytics",
                  desc: "إحصائيات الزوار والأداء",
                  url: "https://vercel.com/mshari-as-projects/first-line-logistics/analytics",
                  icon: BarChart3,
                },
                {
                  name: "Domains",
                  desc: "إدارة النطاقات (fll.sa)",
                  url: "https://vercel.com/mshari-as-projects/first-line-logistics/settings/domains",
                  icon: Globe,
                },
                {
                  name: "Logs",
                  desc: "سجلات الأخطاء والطلبات",
                  url: "https://vercel.com/mshari-as-projects/first-line-logistics/logs",
                  icon: Terminal,
                },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--con-bg-elevated)",
                    border: "1px solid var(--con-border-default)",
                    textDecoration: "none",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--con-accent)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      "var(--con-border-default)")
                  }
                >
                  <item.icon
                    size={16}
                    style={{ color: "var(--con-text-muted)", flexShrink: 0 }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--con-text-primary)",
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "var(--con-text-muted)" }}
                    >
                      {item.desc}
                    </div>
                  </div>
                  <ExternalLink
                    size={10}
                    style={{
                      color: "var(--con-text-muted)",
                      marginRight: "auto",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* GitHub */}
          <div className="con-card" style={{ padding: "1.25rem" }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--con-text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <GitBranch size={16} /> GitHub — إدارة الكود
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.5rem",
              }}
            >
              {[
                {
                  name: "Repository",
                  desc: "الكود المصدري",
                  url: "https://github.com/mshari-11/firstlinelog.com",
                  icon: GitBranch,
                },
                {
                  name: "Pull Requests",
                  desc: "مراجعات الكود + Claude AI",
                  url: "https://github.com/mshari-11/firstlinelog.com/pulls",
                  icon: GitBranch,
                },
                {
                  name: "Issues",
                  desc: "المشاكل والمهام",
                  url: "https://github.com/mshari-11/firstlinelog.com/issues",
                  icon: AlertTriangle,
                },
                {
                  name: "Actions",
                  desc: "CI/CD + Claude Code Action",
                  url: "https://github.com/mshari-11/firstlinelog.com/actions",
                  icon: PlayCircle,
                },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--con-bg-elevated)",
                    border: "1px solid var(--con-border-default)",
                    textDecoration: "none",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--con-accent)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      "var(--con-border-default)")
                  }
                >
                  <item.icon
                    size={16}
                    style={{ color: "var(--con-text-muted)", flexShrink: 0 }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--con-text-primary)",
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "var(--con-text-muted)" }}
                    >
                      {item.desc}
                    </div>
                  </div>
                  <ExternalLink
                    size={10}
                    style={{
                      color: "var(--con-text-muted)",
                      marginRight: "auto",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Supabase */}
          <div className="con-card" style={{ padding: "1.25rem" }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--con-text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Database size={16} style={{ color: "#3ECF8E" }} /> Supabase —
              قاعدة البيانات
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.5rem",
              }}
            >
              {[
                {
                  name: "Database",
                  desc: "الجداول والعلاقات (8 schemas)",
                  url: "https://supabase.com/dashboard/project/djebhztfewjfyyoortvv/editor",
                  icon: Database,
                },
                {
                  name: "Auth",
                  desc: "المستخدمين والصلاحيات",
                  url: "https://supabase.com/dashboard/project/djebhztfewjfyyoortvv/auth/users",
                  icon: Users,
                },
                {
                  name: "Edge Functions",
                  desc: "35 وظيفة خادم",
                  url: "https://supabase.com/dashboard/project/djebhztfewjfyyoortvv/functions",
                  icon: Zap,
                },
                {
                  name: "Storage",
                  desc: "الملفات والوثائق",
                  url: "https://supabase.com/dashboard/project/djebhztfewjfyyoortvv/storage/buckets",
                  icon: HardDrive,
                },
                {
                  name: "SQL Editor",
                  desc: "تنفيذ استعلامات SQL",
                  url: "https://supabase.com/dashboard/project/djebhztfewjfyyoortvv/sql",
                  icon: Terminal,
                },
                {
                  name: "Logs",
                  desc: "سجلات الأحداث",
                  url: "https://supabase.com/dashboard/project/djebhztfewjfyyoortvv/logs/explorer",
                  icon: FileText,
                },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--con-bg-elevated)",
                    border: "1px solid var(--con-border-default)",
                    textDecoration: "none",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#3ECF8E")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      "var(--con-border-default)")
                  }
                >
                  <item.icon
                    size={16}
                    style={{ color: "var(--con-text-muted)", flexShrink: 0 }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--con-text-primary)",
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "var(--con-text-muted)" }}
                    >
                      {item.desc}
                    </div>
                  </div>
                  <ExternalLink
                    size={10}
                    style={{
                      color: "var(--con-text-muted)",
                      marginRight: "auto",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Permissions Tab ─────────────────────────────────────────────── */}
      {tab === "permissions" && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div
            className="con-card"
            style={{
              padding: "1rem",
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "var(--con-text-secondary)",
                margin: 0,
              }}
            >
              إدارة صلاحيات الأقسام — كل صلاحية تفتح وصول لقسم معين في لوحة
              التحكم. لإدارة صلاحيات الموظفين الفردية، انتقل إلى
              <a
                href="/admin-panel/staff"
                style={{
                  color: "var(--con-accent)",
                  marginRight: 4,
                  marginLeft: 4,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                الأقسام والموظفين
              </a>
            </p>
          </div>
          {[
            {
              key: "couriers",
              label: "المناديب",
              desc: "عرض وإدارة المناديب والطلبات وتعيين السائقين",
              pages: ["المناديب", "الطلبات", "الخريطة"],
              icon: Users,
              color: "#3b82f6",
            },
            {
              key: "orders",
              label: "الطلبات",
              desc: "عرض وتتبع وتعديل الطلبات والشحنات",
              pages: ["الطلبات", "الشحنات", "الإرسال"],
              icon: FileText,
              color: "#8B5CF6",
            },
            {
              key: "finance",
              label: "المالية",
              desc: "الوصول لكل الأدوات المالية والرواتب والدفعات",
              pages: [
                "لوحة المالية",
                "الإيرادات",
                "المصروفات",
                "التدفقات",
                "الرواتب",
                "الدفعات",
                "حاسبة الرواتب",
              ],
              icon: Building2,
              color: "#22c55e",
            },
            {
              key: "reports",
              label: "التقارير",
              desc: "عرض وتصدير التقارير التحليلية",
              pages: ["التقارير", "تقارير AI", "التقارير المالية"],
              icon: BarChart3,
              color: "#f59e0b",
            },
            {
              key: "excel",
              label: "Excel",
              desc: "استيراد وتصدير ملفات Excel",
              pages: ["استيراد Excel"],
              icon: Download,
              color: "#06b6d4",
            },
            {
              key: "hr",
              label: "الموارد البشرية",
              desc: "إدارة الموظفين والحضور والتصنيفات",
              pages: ["الموظفين", "الحضور", "تصنيف السائقين"],
              icon: Users,
              color: "#EC4899",
            },
            {
              key: "system",
              label: "النظام",
              desc: "إعدادات النظام والتدقيق والمخاطر",
              pages: ["الإعدادات", "سجل التدقيق", "المخاطر", "الاعتمادات"],
              icon: Settings2,
              color: "#64748b",
            },
            {
              key: "governance",
              label: "الحوكمة",
              desc: "إدارة API والصلاحيات والبنية التحتية",
              pages: ["إدارة API", "الأذونات", "البنية التحتية"],
              icon: Shield,
              color: "#8B5CF6",
            },
          ].map((perm) => (
            <div
              key={perm.key}
              className="con-card"
              style={{ padding: "1rem 1.25rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: perm.color + "18",
                    border: `1px solid ${perm.color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <perm.icon size={18} style={{ color: perm.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--con-text-primary)",
                    }}
                  >
                    {perm.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--con-text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {perm.desc}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      marginTop: 6,
                    }}
                  >
                    {perm.pages.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontSize: 9,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "var(--con-bg-elevated)",
                          color: "var(--con-text-muted)",
                          border: "1px solid var(--con-border-default)",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--con-text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    المفتاح
                  </div>
                  <code
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: "var(--con-bg-elevated)",
                      color: perm.color,
                    }}
                  >
                    {perm.key}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* System Info Footer */}
      {tab === "advanced" && (
        <div
          className="con-card"
          style={{ marginTop: "1rem", padding: "1rem 1.25rem" }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--con-text-primary)",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Monitor size={14} /> معلومات النظام
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.5rem",
            }}
          >
            {[
              { l: "الإصدار", v: "1.1.0" },
              { l: "البيئة", v: import.meta.env.MODE || "production" },
              { l: "المنطقة", v: "us-east-1 (فرجينيا)" },
              { l: "قاعدة البيانات", v: "Supabase (PostgreSQL)" },
              { l: "المصادقة", v: "AWS Cognito" },
              { l: "الاستضافة", v: "Vercel" },
              { l: "البريد", v: "AWS SES" },
              { l: "التخزين", v: "AWS S3 + DynamoDB" },
            ].map((r) => (
              <div
                key={r.l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: 6,
                  background: "var(--con-bg-elevated)",
                  fontSize: 11,
                }}
              >
                <span style={{ color: "var(--con-text-muted)" }}>{r.l}</span>
                <span
                  style={{
                    color: "var(--con-text-secondary)",
                    fontWeight: 500,
                    fontFamily: "monospace",
                  }}
                >
                  {r.v}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: "0.5rem" }}>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="con-btn con-btn-ghost"
              style={{ fontSize: 11, gap: 4, textDecoration: "none" }}
            >
              <ExternalLink size={12} /> Vercel
            </a>
            <a
              href="https://console.aws.amazon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="con-btn con-btn-ghost"
              style={{ fontSize: 11, gap: 4, textDecoration: "none" }}
            >
              <ExternalLink size={12} /> AWS Console
            </a>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="con-btn con-btn-ghost"
              style={{ fontSize: 11, gap: 4, textDecoration: "none" }}
            >
              <ExternalLink size={12} /> Supabase
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
