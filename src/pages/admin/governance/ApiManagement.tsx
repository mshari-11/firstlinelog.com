/**
 * إدارة API — API Management & Connection Hub
 * Shows all endpoints, connection status, test tools, and integration instructions
 */
import { useState, useCallback } from "react";
import {
  Plug,
  Play,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Database,
  Shield,
  MessageSquare,
  FileText,
  Users,
  CreditCard,
  AlertTriangle,
  Server,
  Terminal,
  BookOpen,
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  Card,
  KPIGrid,
  KPICard,
  Badge,
  Button,
  Toolbar,
  Select,
} from "@/components/admin/ui";
import { toast } from "sonner";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://k8d4arcxu4.execute-api.us-east-1.amazonaws.com";
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://djebhztfewjfyyoortvv.supabase.co";

// ─── Endpoint Definitions ───────────────────────────────────────────────────
type EndpointMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type EndpointCategory =
  | "auth"
  | "operations"
  | "finance"
  | "drivers"
  | "system"
  | "ai"
  | "supabase";

interface APIEndpoint {
  id: string;
  name: string;
  nameAr: string;
  method: EndpointMethod;
  path: string;
  fullUrl: string;
  category: EndpointCategory;
  description: string;
  descriptionAr: string;
  requestBody?: string;
  responseExample?: string;
  headers?: string;
  status: "online" | "offline" | "unknown";
  latency?: number;
  dashboardWidget?: string;
  connectionCode?: string;
}

const CATEGORY_LABELS: Record<
  EndpointCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  auth: { label: "التوثيق والأمان", icon: Shield, color: "var(--con-warning)" },
  operations: { label: "التشغيل", icon: Zap, color: "var(--con-brand)" },
  finance: { label: "المالية", icon: CreditCard, color: "var(--con-success)" },
  drivers: { label: "السائقين", icon: Users, color: "var(--con-info)" },
  system: { label: "النظام", icon: Server, color: "var(--con-text-muted)" },
  ai: { label: "الذكاء الاصطناعي", icon: MessageSquare, color: "#8B5CF6" },
  supabase: { label: "قاعدة البيانات", icon: Database, color: "#3ECF8E" },
};

const ENDPOINTS: APIEndpoint[] = [
  // ── Auth ──
  {
    id: "auth-send-otp",
    name: "Send OTP",
    nameAr: "إرسال رمز التحقق",
    method: "POST",
    path: "/auth/send-otp",
    fullUrl: `${API_BASE}/auth/send-otp`,
    category: "auth",
    description: "Send 6-digit OTP to email via AWS SES (no-reply@fll.sa)",
    descriptionAr:
      "إرسال رمز تحقق من 6 أرقام إلى البريد الإلكتروني عبر AWS SES",
    requestBody: `{ "email": "user@fll.sa", "type": "login" }`,
    responseExample: `{ "success": true, "message": "OTP sent" }`,
    status: "unknown",
    connectionCode: `import { sendOtp } from "@/lib/otp-service";\nawait sendOtp("email@fll.sa", "login");`,
  },
  {
    id: "auth-verify-otp",
    name: "Verify OTP",
    nameAr: "التحقق من الرمز",
    method: "POST",
    path: "/auth/verify-custom-otp",
    fullUrl: `${API_BASE}/auth/verify-custom-otp`,
    category: "auth",
    description: "Verify 6-digit OTP code",
    descriptionAr: "التحقق من صحة رمز التحقق المكون من 6 أرقام",
    requestBody: `{ "email": "user@fll.sa", "code": "123456", "type": "login" }`,
    responseExample: `{ "success": true, "message": "OTP verified" }`,
    status: "unknown",
    connectionCode: `import { verifyOtp } from "@/lib/otp-service";\nawait verifyOtp("email@fll.sa", "123456", "login");`,
  },

  // ── Operations ──
  {
    id: "ops-orders",
    name: "Orders List",
    nameAr: "قائمة الطلبات",
    method: "GET",
    path: "/api/orders",
    fullUrl: `${API_BASE}/api/orders`,
    category: "operations",
    description: "Fetch recent orders with pagination",
    descriptionAr: "جلب أحدث الطلبات مع ترقيم الصفحات",
    responseExample: `[{ "id": 1, "courier_name": "أحمد", "platform": "جاهز", "status": "delivered" }]`,
    status: "unknown",
    dashboardWidget: "RecentActivity",
    connectionCode: `const { data } = await supabase\n  .from("orders")\n  .select("*")\n  .order("created_at", { ascending: false })\n  .limit(10);`,
  },
  {
    id: "ops-couriers",
    name: "Couriers Stats",
    nameAr: "إحصائيات المناديب",
    method: "GET",
    path: "/api/couriers",
    fullUrl: `${API_BASE}/api/couriers`,
    category: "operations",
    description: "Courier counts and status breakdown",
    descriptionAr: "عدد المناديب وتوزيع الحالات",
    status: "unknown",
    dashboardWidget: "KPIOverview",
    connectionCode: `const { data, count } = await supabase\n  .from("couriers")\n  .select("id, status", { count: "exact" });`,
  },
  {
    id: "ops-complaints",
    name: "Open Complaints",
    nameAr: "الشكاوى المفتوحة",
    method: "GET",
    path: "/api/complaints",
    fullUrl: `${API_BASE}/api/complaints`,
    category: "operations",
    description: "List of open complaints",
    descriptionAr: "قائمة الشكاوى المفتوحة",
    status: "unknown",
    dashboardWidget: "KPIOverview",
    connectionCode: `const { count } = await supabase\n  .from("complaints_requests")\n  .select("id", { count: "exact" })\n  .eq("status", "open");`,
  },

  // ── Finance ──
  {
    id: "fin-approvals",
    name: "Pending Approvals",
    nameAr: "الاعتمادات المعلقة",
    method: "GET",
    path: "/api/approvals",
    fullUrl: `${API_BASE}/api/approvals`,
    category: "finance",
    description: "Pending approval requests",
    descriptionAr: "طلبات الاعتماد المعلقة",
    status: "unknown",
    dashboardWidget: "PendingApprovals",
    connectionCode: `const { data } = await supabase\n  .from("approval_requests")\n  .select("*")\n  .eq("status", "pending")\n  .order("created_at", { ascending: false });`,
  },
  {
    id: "fin-approve-action",
    name: "Approve/Reject",
    nameAr: "اعتماد أو رفض",
    method: "POST",
    path: "/api/approvals/:id/:action",
    fullUrl: `${API_BASE}/api/approvals/{id}/approve`,
    category: "finance",
    description: "Approve or reject a pending request",
    descriptionAr: "اعتماد أو رفض طلب معلق",
    requestBody: `POST /api/approvals/apr-001/approve`,
    status: "unknown",
    dashboardWidget: "PendingApprovals",
    connectionCode: `await fetch(\`\${API_BASE}/api/approvals/\${id}/approve\`, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n});`,
  },

  // ── Drivers ──
  {
    id: "drv-otp-send",
    name: "Driver OTP Send",
    nameAr: "إرسال OTP للسائق",
    method: "POST",
    path: "/driver/otp/send",
    fullUrl: `${API_BASE}/driver/otp/send`,
    category: "drivers",
    description: "Send OTP to driver email during registration",
    descriptionAr: "إرسال رمز التحقق للسائق أثناء التسجيل",
    requestBody: `{ "email": "driver@mail.com", "full_name": "أحمد", "national_id": "1234567890" }`,
    status: "unknown",
    connectionCode: `await fetch(\`\${API_BASE}/driver/otp/send\`, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ email, full_name, national_id }),\n});`,
  },
  {
    id: "drv-otp-verify",
    name: "Driver OTP Verify",
    nameAr: "التحقق من OTP السائق",
    method: "POST",
    path: "/driver/otp/verify",
    fullUrl: `${API_BASE}/driver/otp/verify`,
    category: "drivers",
    description: "Verify driver OTP code",
    descriptionAr: "التحقق من رمز OTP للسائق",
    requestBody: `{ "email": "driver@mail.com", "code": "123456" }`,
    status: "unknown",
    connectionCode: `await fetch(\`\${API_BASE}/driver/otp/verify\`, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ email, code }),\n});`,
  },
  {
    id: "drv-applications",
    name: "Driver Applications",
    nameAr: "طلبات السائقين",
    method: "GET",
    path: "/api/driver-applications",
    fullUrl: `${API_BASE}/api/driver-applications`,
    category: "drivers",
    description: "List driver applications with status",
    descriptionAr: "قائمة طلبات انضمام السائقين",
    status: "unknown",
    connectionCode: `const { data } = await supabase\n  .from("driver_applications")\n  .select("*")\n  .order("created_at", { ascending: false });`,
  },

  // ── System ──
  {
    id: "sys-notifications",
    name: "Notifications",
    nameAr: "الإشعارات",
    method: "GET",
    path: "/api/notifications",
    fullUrl: `${API_BASE}/api/notifications`,
    category: "system",
    description: "Fetch admin notifications",
    descriptionAr: "جلب إشعارات لوحة التحكم",
    status: "unknown",
    dashboardWidget: "AlertsPanel",
    connectionCode: `import { useNotificationStore } from "@/stores/useNotificationStore";\nconst { loadNotifications } = useNotificationStore();`,
  },
  {
    id: "sys-audit-log",
    name: "Audit Log",
    nameAr: "سجل التدقيق",
    method: "GET",
    path: "/api/audit-log",
    fullUrl: `${API_BASE}/api/audit-log`,
    category: "system",
    description: "Fetch system audit log",
    descriptionAr: "جلب سجل التدقيق للنظام",
    status: "unknown",
    connectionCode: `const { data } = await supabase\n  .from("fll_activity_log")\n  .select("*")\n  .order("created_at", { ascending: false })\n  .limit(200);`,
  },
  {
    id: "sys-health",
    name: "Health Check",
    nameAr: "فحص صحة النظام",
    method: "GET",
    path: "/ops/health",
    fullUrl: `${API_BASE}/ops/health`,
    category: "system",
    description: "System health and uptime status",
    descriptionAr: "حالة صحة النظام ووقت التشغيل",
    status: "unknown",
    dashboardWidget: "SystemHealth",
    connectionCode: `const res = await fetch(\`\${API_BASE}/ops/health\`);\nconst health = await res.json();`,
  },

  // ── AI ──
  {
    id: "ai-chat",
    name: "AI Chat",
    nameAr: "المساعد الذكي",
    method: "POST",
    path: "/ai/chat",
    fullUrl: `${API_BASE}/ai/chat`,
    category: "ai",
    description: "AI chatbot powered by AWS Bedrock Claude Haiku",
    descriptionAr: "المساعد الذكي المدعوم بـ AWS Bedrock Claude Haiku",
    requestBody: `{ "message": "كم عدد الطلبات اليوم؟", "role": "admin", "user_id": "xxx" }`,
    responseExample: `{ "reply": "عدد الطلبات اليوم 245 طلب..." }`,
    status: "unknown",
    dashboardWidget: "AdminAiAssistant",
    connectionCode: `import { CHAT_API_URL } from "@/lib/api";\nconst res = await fetch(CHAT_API_URL, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ message, role: "admin" }),\n});`,
  },

  // ── Supabase Direct ──
  {
    id: "sb-rest",
    name: "Supabase REST",
    nameAr: "Supabase REST API",
    method: "GET",
    path: "/rest/v1/",
    fullUrl: `${SUPABASE_URL}/rest/v1/`,
    category: "supabase",
    description: "Supabase PostgREST API (auto-generated from schema)",
    descriptionAr: "واجهة Supabase REST التلقائية من قاعدة البيانات",
    status: "unknown",
    connectionCode: `import { supabase } from "@/lib/supabase";\nconst { data, error } = await supabase\n  .from("table_name")\n  .select("*");`,
  },
  {
    id: "sb-edge",
    name: "Edge Functions",
    nameAr: "Supabase Edge Functions",
    method: "POST",
    path: "/functions/v1/ai-support-system",
    fullUrl: `${SUPABASE_URL}/functions/v1/ai-support-system`,
    category: "supabase",
    description: "Supabase Edge Function for AI support (fallback)",
    descriptionAr: "دالة Supabase Edge للمساعد الذكي (احتياطي)",
    status: "unknown",
    connectionCode: `const res = await fetch(\n  "${SUPABASE_URL}/functions/v1/ai-support-system",\n  {\n    method: "POST",\n    headers: {\n      "Content-Type": "application/json",\n      "Authorization": "Bearer " + SUPABASE_ANON_KEY,\n    },\n    body: JSON.stringify({ message }),\n  }\n);`,
  },

  // ── Salary & Payroll ──
  {
    id: "salary-calculate",
    name: "Salary Calculate",
    nameAr: "حساب الرواتب التلقائي",
    method: "POST",
    path: "/salary/calculate",
    fullUrl: `${API_BASE}/salary/calculate`,
    category: "finance",
    description: "Auto-calculate payroll for all active drivers using accounting rules",
    descriptionAr: "حساب تلقائي لرواتب جميع السائقين النشطين حسب القواعد المحاسبية",
    requestBody: `{ "period": "2026-04" }`,
    responseExample: `{ "batchId": "batch-xxx", "summary": { "drivers": 50, "totalNet": 75000 } }`,
    status: "unknown",
    connectionCode: `const res = await fetch(\`\${API_BASE}/salary/calculate\`, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ period: "2026-04" }),\n});`,
  },
  {
    id: "salary-stc",
    name: "Generate STC Excel",
    nameAr: "توليد ملف STC Bank",
    method: "POST",
    path: "/salary/generate-stc",
    fullUrl: `${API_BASE}/salary/generate-stc`,
    category: "finance",
    description: "Generate STC Bank CSV file (Reference, Phone 966+, Amount)",
    descriptionAr: "توليد ملف CSV بنموذج STC Bank — 3 أعمدة: المرجع، الجوال، المبلغ",
    requestBody: `{ "batchId": "batch-xxx", "payouts": [{ "name": "أحمد", "stc_phone": "966...", "netPayout": 2500 }] }`,
    status: "unknown",
    connectionCode: `const res = await fetch(\`\${API_BASE}/salary/generate-stc\`, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ batchId, payouts }),\n});`,
  },

  // ── Admin User Management ──
  {
    id: "admin-create-user",
    name: "Create Staff User",
    nameAr: "إنشاء حساب موظف",
    method: "POST",
    path: "/admin/create-user",
    fullUrl: `${API_BASE}/admin/create-user`,
    category: "auth",
    description: "Create Cognito user + DynamoDB staff record + permissions",
    descriptionAr: "إنشاء حساب Cognito + سجل موظف + صلاحيات بخطوة واحدة",
    requestBody: `{ "name": "أحمد", "email": "a@fll.sa", "password": "Pass@123", "role": "staff", "permissions": { "finance": true } }`,
    status: "unknown",
    connectionCode: `const res = await fetch(\`\${API_BASE}/admin/create-user\`, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ name, email, password, role, permissions }),\n});`,
  },

  // ── Auth extras ──
  {
    id: "auth-forgot",
    name: "Forgot Password",
    nameAr: "نسيت كلمة المرور",
    method: "POST",
    path: "/auth/forgot-password",
    fullUrl: `${API_BASE}/auth/forgot-password`,
    category: "auth",
    description: "Send password reset code via Cognito",
    descriptionAr: "إرسال رمز إعادة تعيين كلمة المرور عبر Cognito",
    requestBody: `{ "email": "user@fll.sa" }`,
    status: "unknown",
    connectionCode: `import { cognitoForgotPassword } from "@/lib/cognito";\nawait cognitoForgotPassword("user@fll.sa");`,
  },
  {
    id: "auth-reset",
    name: "Reset Password",
    nameAr: "إعادة تعيين كلمة المرور",
    method: "POST",
    path: "/auth/reset-password",
    fullUrl: `${API_BASE}/auth/reset-password`,
    category: "auth",
    description: "Reset password with verification code",
    descriptionAr: "إعادة تعيين كلمة المرور باستخدام رمز التحقق",
    requestBody: `{ "email": "user@fll.sa", "code": "123456", "new_password": "NewPass@123" }`,
    status: "unknown",
    connectionCode: `import { cognitoConfirmPassword } from "@/lib/cognito";\nawait cognitoConfirmPassword("user@fll.sa", "123456", "NewPass@123");`,
  },

  // ── Platform Stats ──
  {
    id: "sys-stats",
    name: "Platform Stats",
    nameAr: "إحصائيات المنصة",
    method: "GET",
    path: "/stats",
    fullUrl: `${API_BASE}/stats`,
    category: "system",
    description: "Aggregated counts from all DynamoDB tables",
    descriptionAr: "إحصائيات مجمعة من جميع جداول DynamoDB (سائقين، طلبات، شكاوى...)",
    responseExample: `{ "stats": { "drivers": { "count": 53 }, "orders": { "count": 200 } } }`,
    status: "unknown",
    dashboardWidget: "KPIOverview",
    connectionCode: `const res = await fetch(\`\${API_BASE}/stats\`);\nconst { stats } = await res.json();`,
  },

  // ── Accounting Rules ──
  {
    id: "fin-accounting-rules",
    name: "Accounting Rules CRUD",
    nameAr: "القواعد المحاسبية",
    method: "GET",
    path: "/accounting-rules",
    fullUrl: `${API_BASE}/accounting-rules`,
    category: "finance",
    description: "CRUD for payroll additions/deductions rules (fixed or percentage)",
    descriptionAr: "إدارة قواعد الإضافات والخصومات (مبلغ ثابت أو نسبة)",
    status: "unknown",
    connectionCode: `// Read rules\nconst res = await fetch(\`\${API_BASE}/accounting-rules\`);\n// Create rule\nawait fetch(\`\${API_BASE}/accounting-rules\`, {\n  method: "POST",\n  body: JSON.stringify({ name_ar: "بدل تشغيل", component_type: "addition", calc_method: "fixed", amount: 500 }),\n});`,
  },

  // ── Edge Functions ──
  {
    id: "ef-auto-payroll",
    name: "Auto Payroll",
    nameAr: "حساب الرواتب التلقائي (Edge)",
    method: "POST",
    path: "/functions/v1/auto-payroll",
    fullUrl: `${SUPABASE_URL}/functions/v1/auto-payroll`,
    category: "supabase",
    description: "Edge Function: auto-calculate salaries using DynamoDB rules",
    descriptionAr: "دالة Edge: حساب رواتب تلقائي باستخدام القواعد من DynamoDB",
    requestBody: `{ "period": "2026-04" }`,
    status: "unknown",
    connectionCode: `const res = await fetch(\`${SUPABASE_URL}/functions/v1/auto-payroll\`, {\n  method: "POST",\n  headers: { "Authorization": "Bearer " + KEY, "Content-Type": "application/json" },\n  body: JSON.stringify({ period: "2026-04" }),\n});`,
  },
  {
    id: "ef-license-alerts",
    name: "License Alerts",
    nameAr: "تنبيهات انتهاء الرخص",
    method: "POST",
    path: "/functions/v1/license-alerts",
    fullUrl: `${SUPABASE_URL}/functions/v1/license-alerts`,
    category: "supabase",
    description: "Edge Function: check driver license/ID expiry dates (runs daily 7AM)",
    descriptionAr: "دالة Edge: فحص تواريخ انتهاء رخص وهويات السائقين (تلقائي 7 صباحاً)",
    status: "unknown",
    connectionCode: `// Runs automatically via pg_cron at 7AM Saudi time\n// Manual trigger:\nconst res = await fetch(\`${SUPABASE_URL}/functions/v1/license-alerts\`, {\n  method: "POST",\n  headers: { "Authorization": "Bearer " + KEY },\n});`,
  },
  {
    id: "ef-daily-report",
    name: "Daily Report",
    nameAr: "التقرير اليومي التلقائي",
    method: "POST",
    path: "/functions/v1/daily-report",
    fullUrl: `${SUPABASE_URL}/functions/v1/daily-report`,
    category: "supabase",
    description: "Edge Function: daily operations summary (runs daily 8AM)",
    descriptionAr: "دالة Edge: ملخص عمليات يومي (تلقائي 8 صباحاً)",
    status: "unknown",
    connectionCode: `// Runs automatically via pg_cron at 8AM Saudi time`,
  },
  {
    id: "ef-vector-search",
    name: "Vector Search",
    nameAr: "البحث الذكي بالمعنى",
    method: "POST",
    path: "/functions/v1/vector-search",
    fullUrl: `${SUPABASE_URL}/functions/v1/vector-search`,
    category: "ai",
    description: "Semantic search across drivers, complaints, orders with relevance scoring",
    descriptionAr: "بحث ذكي بالمعنى عبر السائقين والشكاوى والطلبات مع ترتيب بالأهمية",
    requestBody: `{ "query": "تأخر توصيل جدة", "scope": "all", "limit": 20 }`,
    status: "unknown",
    connectionCode: `const res = await fetch(\`${SUPABASE_URL}/functions/v1/vector-search\`, {\n  method: "POST",\n  headers: { "Authorization": "Bearer " + KEY, "Content-Type": "application/json" },\n  body: JSON.stringify({ query: "تأخر توصيل", scope: "complaints" }),\n});`,
  },
];

// ─── Method colors ──────────────────────────────────────────────────────────
const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  GET: { bg: "rgba(34,197,94,0.12)", color: "var(--con-success)" },
  POST: { bg: "rgba(59,130,246,0.12)", color: "var(--con-info)" },
  PUT: { bg: "rgba(245,158,11,0.12)", color: "var(--con-warning)" },
  DELETE: { bg: "rgba(239,68,68,0.12)", color: "var(--con-danger)" },
  PATCH: { bg: "rgba(168,85,247,0.12)", color: "#A855F7" },
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function ApiManagement() {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>(ENDPOINTS);
  const [testing, setTesting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [_tab, _setTab] = useState("endpoints");
  const [testProgress, setTestProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  const onlineCount = endpoints.filter((e) => e.status === "online").length;
  const offlineCount = endpoints.filter((e) => e.status === "offline").length;

  const testEndpoint = useCallback(async (ep: APIEndpoint) => {
    setTesting(ep.id);
    const start = performance.now();
    try {
      const opts: RequestInit = { signal: AbortSignal.timeout(8000) };
      if (ep.method === "GET") {
        opts.method = "GET";
        opts.mode = "no-cors";
      } else {
        opts.method = "HEAD";
        opts.mode = "no-cors";
      }
      await fetch(ep.fullUrl, opts);
      const ms = Math.round(performance.now() - start);
      setEndpoints((prev) =>
        prev.map((e) =>
          e.id === ep.id ? { ...e, status: "online" as const, latency: ms } : e,
        ),
      );
      toast.success(`${ep.nameAr}: متصل (${ms}ms)`);
    } catch {
      const ms = Math.round(performance.now() - start);
      setEndpoints((prev) =>
        prev.map((e) =>
          e.id === ep.id
            ? { ...e, status: "offline" as const, latency: ms }
            : e,
        ),
      );
      toast.error(`${ep.nameAr}: غير متصل (${ms}ms)`);
    }
    setTesting(null);
  }, []);

  const testAll = useCallback(async () => {
    const total = endpoints.length;
    setTestProgress({ current: 0, total });
    for (let i = 0; i < total; i++) {
      setTestProgress({ current: i + 1, total });
      await testEndpoint(endpoints[i]);
    }
    setTestProgress(null);
    toast.success(`تم فحص ${total} endpoint`);
  }, [endpoints, testEndpoint]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const filtered =
    filter === "all"
      ? endpoints
      : endpoints.filter((e) => e.category === filter);

  const statusIcon = (s: string) => {
    if (s === "online")
      return <CheckCircle2 size={12} style={{ color: "var(--con-success)" }} />;
    if (s === "offline")
      return <XCircle size={12} style={{ color: "var(--con-danger)" }} />;
    return <Clock size={12} style={{ color: "var(--con-text-muted)" }} />;
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={Plug}
        title="إدارة API والربط"
        subtitle={`${ENDPOINTS.length} endpoint متاح · API Gateway: ${API_BASE}`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" icon={RefreshCw} onClick={testAll}>
              فحص الكل
            </Button>
            <Button
              icon={Copy}
              onClick={() => copyToClipboard(API_BASE, "API Base URL")}
            >
              نسخ Base URL
            </Button>
          </div>
        }
      />

      {/* API Guide Section */}
      <div
        style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: "var(--con-radius-lg)",
          overflow: "hidden",
          marginBottom: 0,
        }}
      >
        <div
          onClick={() => setShowGuide(!showGuide)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            cursor: "pointer",
            background: "var(--con-bg-surface-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={16} style={{ color: "var(--con-brand)" }} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--con-text-primary)",
              }}
            >
              دليل API والتكاملات
            </span>
          </div>
          {showGuide ? (
            <ChevronUp size={16} style={{ color: "var(--con-text-muted)" }} />
          ) : (
            <ChevronDown size={16} style={{ color: "var(--con-text-muted)" }} />
          )}
        </div>
        {showGuide && (
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Section A: أنواع الـ APIs */}
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plug size={14} style={{ color: "var(--con-brand)" }} /> أنواع
                الـ APIs
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 8,
                }}
              >
                {[
                  {
                    label: "Auth",
                    desc: "تسجيل الدخول، OTP، استعادة كلمة المرور",
                    icon: (
                      <Shield
                        size={14}
                        style={{ color: "var(--con-warning)" }}
                      />
                    ),
                    color: "var(--con-warning)",
                  },
                  {
                    label: "Operations",
                    desc: "الطلبات، المناديب، الشكاوى",
                    icon: (
                      <Zap size={14} style={{ color: "var(--con-brand)" }} />
                    ),
                    color: "var(--con-brand)",
                  },
                  {
                    label: "Finance",
                    desc: "الدفعات، الفواتير، المحافظ",
                    icon: (
                      <CreditCard
                        size={14}
                        style={{ color: "var(--con-success)" }}
                      />
                    ),
                    color: "var(--con-success)",
                  },
                  {
                    label: "Drivers",
                    desc: "التسجيل، KYC، التدريب",
                    icon: (
                      <Users size={14} style={{ color: "var(--con-info)" }} />
                    ),
                    color: "var(--con-info)",
                  },
                  {
                    label: "AI",
                    desc: "المحادثة الذكية، تحليل مالي",
                    icon: (
                      <MessageSquare size={14} style={{ color: "#8B5CF6" }} />
                    ),
                    color: "#8B5CF6",
                  },
                ].map((api) => (
                  <div
                    key={api.label}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--con-radius-sm)",
                      background: "var(--con-bg-surface-2)",
                      border: "1px solid var(--con-border-default)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    {api.icon}
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: api.color,
                        }}
                      >
                        {api.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--con-text-muted)",
                          marginTop: 2,
                          lineHeight: 1.5,
                        }}
                      >
                        {api.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section B: أمثلة API Calls */}
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Terminal size={14} style={{ color: "var(--con-brand)" }} />{" "}
                أمثلة API Calls
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  {
                    code: `POST /auth/send-otp\n{ "email": "user@fll.sa", "type": "login" }\n→ { "success": true, "message": "تم إرسال رمز التحقق" }`,
                  },
                  {
                    code: `GET /drivers?limit=10&status=active\n→ { "items": [...], "count": 10 }`,
                  },
                  {
                    code: `POST /driver/apply\n{ "full_name": "أحمد", "phone": "563636006", ... }\n→ { "success": true, "app_ref": "APP-XXXXXXX" }`,
                  },
                  {
                    code: `POST /ai/chat\n{ "message": "كم عدد الطلبات اليوم؟", "role": "admin" }\n→ { "reply": "عدد الطلبات اليوم 245 طلب..." }`,
                  },
                  {
                    code: `GET /ops/health\n→ { "status": "healthy", "uptime": "99.9%", "region": "us-east-1" }`,
                  },
                ].map((ex, i) => (
                  <pre
                    key={i}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--con-radius-sm)",
                      background: "#0C0E14",
                      border: "1px solid var(--con-border-default)",
                      fontFamily: "var(--con-font-mono)",
                      fontSize: 11,
                      color: "#A3ABBE",
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                      direction: "ltr",
                      textAlign: "left",
                    }}
                  >
                    {ex.code}
                  </pre>
                ))}
              </div>
            </div>

            {/* Section C: رموز الحالة */}
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FileText size={14} style={{ color: "var(--con-info)" }} /> رموز
                الحالة
              </h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  {
                    code: "200",
                    label: "نجاح",
                    emoji: "\u2705",
                    color: "var(--con-success)",
                  },
                  {
                    code: "400",
                    label: "خطأ في البيانات",
                    emoji: "\u26A0\uFE0F",
                    color: "var(--con-warning)",
                  },
                  {
                    code: "401",
                    label: "غير مصرح",
                    emoji: "\uD83D\uDD12",
                    color: "var(--con-danger)",
                  },
                  {
                    code: "404",
                    label: "غير موجود",
                    emoji: "\uD83D\uDD0D",
                    color: "var(--con-text-muted)",
                  },
                  {
                    code: "500",
                    label: "خطأ في الخادم",
                    emoji: "\u274C",
                    color: "var(--con-danger)",
                  },
                ].map((s) => (
                  <div
                    key={s.code}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "var(--con-radius-sm)",
                      background: "var(--con-bg-surface-2)",
                      border: "1px solid var(--con-border-default)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--con-font-mono)",
                        fontSize: 13,
                        fontWeight: 700,
                        color: s.color,
                      }}
                    >
                      {s.code}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--con-text-secondary)",
                      }}
                    >
                      {s.label}
                    </span>
                    <span style={{ fontSize: 14 }}>{s.emoji}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section D: نصائح */}
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <AlertTriangle
                  size={14}
                  style={{ color: "var(--con-warning)" }}
                />{" "}
                نصائح
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "استخدم Postman أو curl لاختبار الـ APIs",
                  "لا ترسل API keys في الرابط — استخدم Headers",
                  "Rate limit: 100 طلب/دقيقة",
                ].map((tip, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: "var(--con-radius-sm)",
                      background: "var(--con-bg-surface-2)",
                      border: "1px solid var(--con-border-default)",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--con-warning)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--con-text-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {tip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <KPIGrid cols="repeat(5, 1fr)">
        <KPICard
          label="إجمالي الـ Endpoints"
          value={ENDPOINTS.length}
          icon={Plug}
          accent="var(--con-brand)"
        />
        <KPICard
          label="متصل"
          value={onlineCount}
          icon={CheckCircle2}
          accent="var(--con-success)"
        />
        <KPICard
          label="غير متصل"
          value={offlineCount}
          icon={XCircle}
          accent="var(--con-danger)"
        />
        <KPICard
          label="غير مفحوص"
          value={ENDPOINTS.length - onlineCount - offlineCount}
          icon={Clock}
          accent="var(--con-text-muted)"
        />
        <KPICard
          label="مرتبط بالداشبورد"
          value={ENDPOINTS.filter((e) => e.dashboardWidget).length}
          icon={Zap}
          accent="var(--con-info)"
        />
      </KPIGrid>

      {/* Connection Info Card */}
      {/* Progress Bar */}
      {testProgress && (
        <div
          style={{
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-brand)",
            borderRadius: "var(--con-radius-lg)",
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: "var(--con-text-body)",
                fontWeight: 600,
                color: "var(--con-text-primary)",
              }}
            >
              جارٍ فحص الـ Endpoints...
            </span>
            <span
              style={{
                fontSize: "var(--con-text-caption)",
                fontFamily: "var(--con-font-mono)",
                color: "var(--con-brand)",
              }}
            >
              {testProgress.current}/{testProgress.total}
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: "var(--con-bg-elevated)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 3,
                background: "var(--con-brand)",
                transition: "width 0.3s",
                width: `${(testProgress.current / testProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Widget Connection Status */}
      <Card
        title="حالة ربط الويدجت"
        subtitle="أي ويدجت داشبورد مرتبط ببيانات حقيقية"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 8,
          }}
        >
          {[
            {
              name: "KPIOverview",
              nameAr: "المؤشرات الرئيسية",
              connected: true,
              source: "Supabase",
            },
            {
              name: "RecentActivity",
              nameAr: "آخر الطلبات",
              connected: true,
              source: "Supabase",
            },
            {
              name: "PendingApprovals",
              nameAr: "الاعتمادات",
              connected: true,
              source: "API + Supabase",
            },
            {
              name: "SystemHealth",
              nameAr: "صحة النظام",
              connected: true,
              source: "Ping",
            },
            {
              name: "AlertsPanel",
              nameAr: "التنبيهات",
              connected: true,
              source: "API + Supabase",
            },
            {
              name: "ChartsPanel",
              nameAr: "الرسوم البيانية",
              connected: true,
              source: "Supabase",
            },
            {
              name: "FinanceSnapshot",
              nameAr: "النظرة المالية",
              connected: true,
              source: "Supabase",
            },
            {
              name: "OperationsMap",
              nameAr: "التوزيع التشغيلي",
              connected: true,
              source: "Supabase",
            },
            {
              name: "ModuleStatusGrid",
              nameAr: "حالة الوحدات",
              connected: true,
              source: "Store",
            },
            {
              name: "QuickActions",
              nameAr: "إجراءات سريعة",
              connected: false,
              source: "تنقل فقط",
            },
            {
              name: "InfrastructurePanel",
              nameAr: "البنية التحتية",
              connected: true,
              source: "API + Supabase",
            },
          ].map((w) => (
            <div
              key={w.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: "var(--con-radius-sm)",
                background: w.connected
                  ? "rgba(34,197,94,0.06)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${w.connected ? "rgba(34,197,94,0.2)" : "var(--con-border-default)"}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "var(--con-text-body)",
                    fontWeight: 500,
                    color: "var(--con-text-primary)",
                  }}
                >
                  {w.nameAr}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--con-text-muted)",
                    fontFamily: "var(--con-font-mono)",
                  }}
                >
                  {w.source}
                </div>
              </div>
              {w.connected ? (
                <CheckCircle2
                  size={14}
                  style={{ color: "var(--con-success)" }}
                />
              ) : (
                <Clock
                  size={14}
                  style={{ color: "var(--con-text-disabled)" }}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="معلومات الاتصال"
        subtitle="استخدم هذه المعلومات لربط أي خدمة خارجية"
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div>
            <div
              style={{
                fontSize: "var(--con-text-caption)",
                color: "var(--con-text-muted)",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              API Gateway (AWS)
            </div>
            <div
              onClick={() => copyToClipboard(API_BASE, "API Base")}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--con-radius-sm)",
                background: "var(--con-bg-elevated)",
                border: "1px solid var(--con-border-default)",
                fontFamily: "var(--con-font-mono)",
                fontSize: 12,
                color: "var(--con-brand)",
                cursor: "pointer",
                wordBreak: "break-all",
              }}
            >
              {API_BASE}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--con-text-caption)",
                color: "var(--con-text-muted)",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Supabase REST
            </div>
            <div
              onClick={() => copyToClipboard(SUPABASE_URL, "Supabase URL")}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--con-radius-sm)",
                background: "var(--con-bg-elevated)",
                border: "1px solid var(--con-border-default)",
                fontFamily: "var(--con-font-mono)",
                fontSize: 12,
                color: "#3ECF8E",
                cursor: "pointer",
                wordBreak: "break-all",
              }}
            >
              {SUPABASE_URL}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--con-text-caption)",
                color: "var(--con-text-muted)",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              منطقة AWS
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "var(--con-radius-sm)",
                background: "var(--con-bg-elevated)",
                border: "1px solid var(--con-border-default)",
                fontFamily: "var(--con-font-mono)",
                fontSize: 12,
                color: "var(--con-text-secondary)",
              }}
            >
              us-east-1 (فرجينيا)
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--con-text-caption)",
                color: "var(--con-text-muted)",
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              البريد الإلكتروني (SES)
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "var(--con-radius-sm)",
                background: "var(--con-bg-elevated)",
                border: "1px solid var(--con-border-default)",
                fontFamily: "var(--con-font-mono)",
                fontSize: 12,
                color: "var(--con-warning)",
              }}
            >
              no-reply@fll.sa
            </div>
          </div>
        </div>
      </Card>

      {/* Filter */}
      <Toolbar>
        <Select
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "جميع الفئات" },
            ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({
              value: k,
              label: v.label,
            })),
          ]}
        />
      </Toolbar>

      {/* Endpoints List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((ep) => {
          const expanded = expandedId === ep.id;
          const mc = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;
          const cat = CATEGORY_LABELS[ep.category];

          return (
            <div
              key={ep.id}
              style={{
                background: "var(--con-bg-surface-1)",
                border: `1px solid ${expanded ? "var(--con-border-brand)" : "var(--con-border-default)"}`,
                borderRadius: "var(--con-radius-lg)",
                overflow: "hidden",
                transition: "border-color 0.15s",
              }}
            >
              {/* Header Row */}
              <div
                onClick={() => setExpandedId(expanded ? null : ep.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  cursor: "pointer",
                }}
              >
                {/* Method Badge */}
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "var(--con-font-mono)",
                    background: mc.bg,
                    color: mc.color,
                    border: `1px solid ${mc.color}30`,
                    flexShrink: 0,
                    minWidth: 40,
                    textAlign: "center",
                  }}
                >
                  {ep.method}
                </span>

                {/* Path */}
                <span
                  style={{
                    fontFamily: "var(--con-font-mono)",
                    fontSize: 12,
                    color: "var(--con-text-secondary)",
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ep.path}
                </span>

                {/* Name */}
                <span
                  style={{
                    fontSize: "var(--con-text-body)",
                    fontWeight: 500,
                    color: "var(--con-text-primary)",
                    flexShrink: 0,
                  }}
                >
                  {ep.nameAr}
                </span>

                {/* Status */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  {statusIcon(ep.status)}
                  {ep.latency !== undefined && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--con-font-mono)",
                        color: "var(--con-text-muted)",
                      }}
                    >
                      {ep.latency}ms
                    </span>
                  )}
                </div>

                {/* Dashboard link */}
                {ep.dashboardWidget && <Badge variant="brand">داشبورد</Badge>}

                {/* Test Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    testEndpoint(ep);
                  }}
                  disabled={testing === ep.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "var(--con-font-primary)",
                    background: "var(--con-brand-subtle)",
                    color: "var(--con-brand)",
                    border: "1px solid var(--con-border-brand)",
                    cursor: testing === ep.id ? "not-allowed" : "pointer",
                    opacity: testing === ep.id ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  {testing === ep.id ? (
                    <RefreshCw
                      size={10}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <Play size={10} />
                  )}
                  فحص
                </button>

                {/* Expand */}
                {expanded ? (
                  <ChevronUp
                    size={14}
                    style={{ color: "var(--con-text-muted)" }}
                  />
                ) : (
                  <ChevronDown
                    size={14}
                    style={{ color: "var(--con-text-muted)" }}
                  />
                )}
              </div>

              {/* Expanded Details */}
              {expanded && (
                <div
                  style={{
                    padding: "0 16px 16px",
                    borderTop: "1px solid var(--con-border-default)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                      marginTop: 14,
                    }}
                  >
                    {/* Left — Info */}
                    <div>
                      <p
                        style={{
                          fontSize: "var(--con-text-body)",
                          color: "var(--con-text-secondary)",
                          margin: "0 0 12px",
                          lineHeight: 1.7,
                        }}
                      >
                        {ep.descriptionAr}
                      </p>

                      <div
                        style={{
                          fontSize: "var(--con-text-caption)",
                          color: "var(--con-text-muted)",
                          marginBottom: 4,
                          fontWeight: 600,
                        }}
                      >
                        Full URL
                      </div>
                      <div
                        onClick={() => copyToClipboard(ep.fullUrl, "URL")}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "var(--con-radius-sm)",
                          background: "var(--con-bg-elevated)",
                          border: "1px solid var(--con-border-default)",
                          fontFamily: "var(--con-font-mono)",
                          fontSize: 11,
                          color: "var(--con-brand)",
                          cursor: "pointer",
                          marginBottom: 12,
                          wordBreak: "break-all",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{ep.fullUrl}</span>
                        <Copy
                          size={11}
                          style={{ flexShrink: 0, marginRight: 8 }}
                        />
                      </div>

                      {ep.requestBody && (
                        <>
                          <div
                            style={{
                              fontSize: "var(--con-text-caption)",
                              color: "var(--con-text-muted)",
                              marginBottom: 4,
                              fontWeight: 600,
                            }}
                          >
                            Request Body
                          </div>
                          <pre
                            style={{
                              padding: "8px 10px",
                              borderRadius: "var(--con-radius-sm)",
                              background: "var(--con-bg-elevated)",
                              border: "1px solid var(--con-border-default)",
                              fontFamily: "var(--con-font-mono)",
                              fontSize: 11,
                              color: "var(--con-text-secondary)",
                              margin: "0 0 12px",
                              whiteSpace: "pre-wrap",
                              lineHeight: 1.6,
                            }}
                          >
                            {ep.requestBody}
                          </pre>
                        </>
                      )}

                      {ep.responseExample && (
                        <>
                          <div
                            style={{
                              fontSize: "var(--con-text-caption)",
                              color: "var(--con-text-muted)",
                              marginBottom: 4,
                              fontWeight: 600,
                            }}
                          >
                            Response Example
                          </div>
                          <pre
                            style={{
                              padding: "8px 10px",
                              borderRadius: "var(--con-radius-sm)",
                              background: "var(--con-bg-elevated)",
                              border: "1px solid var(--con-border-default)",
                              fontFamily: "var(--con-font-mono)",
                              fontSize: 11,
                              color: "var(--con-success)",
                              margin: 0,
                              whiteSpace: "pre-wrap",
                              lineHeight: 1.6,
                            }}
                          >
                            {ep.responseExample}
                          </pre>
                        </>
                      )}
                    </div>

                    {/* Right — Connection Code */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "var(--con-text-caption)",
                            color: "var(--con-text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          <Terminal
                            size={11}
                            style={{ marginLeft: 4, verticalAlign: "middle" }}
                          />
                          كود الربط
                        </div>
                        {ep.connectionCode && (
                          <button
                            onClick={() =>
                              copyToClipboard(ep.connectionCode!, "كود الربط")
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              padding: "2px 6px",
                              borderRadius: 3,
                              fontSize: 10,
                              background: "var(--con-brand-subtle)",
                              color: "var(--con-brand)",
                              border: "1px solid var(--con-border-brand)",
                              cursor: "pointer",
                              fontFamily: "var(--con-font-primary)",
                            }}
                          >
                            <Copy size={10} /> نسخ
                          </button>
                        )}
                      </div>
                      {ep.connectionCode && (
                        <pre
                          style={{
                            padding: "12px 14px",
                            borderRadius: "var(--con-radius)",
                            background: "#0C0E14",
                            border: "1px solid var(--con-border-default)",
                            fontFamily: "var(--con-font-mono)",
                            fontSize: 11,
                            color: "#A3ABBE",
                            margin: 0,
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.8,
                            minHeight: 100,
                          }}
                        >
                          {ep.connectionCode}
                        </pre>
                      )}

                      {ep.dashboardWidget && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: "8px 12px",
                            borderRadius: "var(--con-radius-sm)",
                            background: "var(--con-brand-subtle)",
                            border: "1px solid var(--con-border-brand)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "var(--con-text-caption)",
                              color: "var(--con-brand)",
                              fontWeight: 600,
                            }}
                          >
                            مرتبط بـ: {ep.dashboardWidget}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Commands Card */}
      <Card title="أوامر الربط السريعة" subtitle="انسخ وألصق في مشروعك">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            {
              label: "تثبيت Supabase Client",
              cmd: "npm install @supabase/supabase-js",
            },
            {
              label: "إعداد متغيرات البيئة",
              cmd: `VITE_API_BASE=${API_BASE}\nVITE_SUPABASE_URL=${SUPABASE_URL}\nVITE_SUPABASE_ANON_KEY=your_anon_key`,
            },
            {
              label: "استيراد API",
              cmd: `import { API_BASE, CHAT_API_URL } from "@/lib/api";\nimport { supabase } from "@/lib/supabase";`,
            },
            {
              label: "جلب بيانات من Supabase",
              cmd: `const { data, error } = await supabase\n  .from("orders")\n  .select("*")\n  .order("created_at", { ascending: false })\n  .limit(10);`,
            },
            {
              label: "استدعاء Lambda API",
              cmd: `const res = await fetch(\`\${API_BASE}/api/orders\`);\nconst data = await res.json();`,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "var(--con-radius)",
                background: "var(--con-bg-surface-2)",
                border: "1px solid var(--con-border-default)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--con-text-body)",
                    fontWeight: 600,
                    color: "var(--con-text-primary)",
                    marginBottom: 6,
                  }}
                >
                  {item.label}
                </div>
                <pre
                  style={{
                    fontFamily: "var(--con-font-mono)",
                    fontSize: 11,
                    color: "var(--con-text-muted)",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {item.cmd}
                </pre>
              </div>
              <button
                onClick={() => copyToClipboard(item.cmd, item.label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "var(--con-brand-subtle)",
                  color: "var(--con-brand)",
                  border: "1px solid var(--con-border-brand)",
                  cursor: "pointer",
                  fontFamily: "var(--con-font-primary)",
                  flexShrink: 0,
                  marginRight: 8,
                }}
              >
                <Copy size={10} /> نسخ
              </button>
            </div>
          ))}
        </div>
      </Card>
    </PageWrapper>
  );
}
