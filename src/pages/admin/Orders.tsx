import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Package,
  CheckCircle2,
  XCircle,
  Bike,
  MapPin,
  RefreshCw,
  Clock,
  TrendingUp,
  Download,
  Printer,
  User,
  Phone,
  Hash,
  CalendarDays,
  DollarSign,
  Truck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Star,
  FileSpreadsheet,
  Users,
  Target,
  Zap,
  Loader2,
  Upload,
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  KPIGrid,
  KPICard,
  Toolbar,
  Card,
  Table,
  Badge,
  Button,
  Select,
  SkeletonRows,
  Modal,
  DetailField,
  DetailGrid,
  Section,
  IconButton,
} from "@/components/admin/ui";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  courier_name: string;
  platform: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  status:
    | "pending"
    | "picked_up"
    | "on_way"
    | "delivered"
    | "failed"
    | "returned";
  amount: number;
  created_at: string;
  created_date: string;
  city?: string;
  delivery_time?: number;
  courier_rating?: number;
  profit?: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "warning" | "info" | "brand" | "success" | "danger" | "muted";
  }
> = {
  pending: { label: "بانتظار الاستلام", variant: "warning" },
  picked_up: { label: "تم الاستلام", variant: "info" },
  on_way: { label: "في الطريق", variant: "brand" },
  delivered: { label: "تم التسليم", variant: "success" },
  failed: { label: "فشل التسليم", variant: "danger" },
  returned: { label: "مرتجع", variant: "muted" },
};

const platforms = [
  "الكل",
  "hungerstation",
  "jahez",
  "marsool",
  "keeta",
  "ninja",
  "keeta_mart",
  "wasfaty",
  "toyou",
  "the_chefs",
  "noon",
  "amazon",
];
const platformLabels: Record<string, string> = {
  الكل: "الكل",
  hungerstation: "هنقرستيشن",
  jahez: "جاهز",
  marsool: "مرسول",
  keeta: "كيتا",
  ninja: "نينجا",
  keeta_mart: "كيتا مارت",
  wasfaty: "وصفتي",
  toyou: "تويو",
  the_chefs: "ذا شيفز",
  noon: "نون",
  amazon: "أمازون",
};

const platformColors: Record<string, string> = {
  hungerstation: "#ff6b00",
  jahez: "#e53e3e",
  marsool: "#805ad5",
  keeta: "#00c853",
  ninja: "#e91e63",
  keeta_mart: "#00e676",
  wasfaty: "#ff9800",
  toyou: "#0abab5",
  the_chefs: "#8d6e63",
  noon: "#f6e05e",
  amazon: "#3182ce",
};

const CHART_COLORS = ["#ff6b00", "#e53e3e", "#805ad5", "#00c853", "#e91e63", "#00e676", "#ff9800", "#0abab5", "#8d6e63", "#f6e05e", "#3182ce"];

const cities = ["الكل", "الرياض", "جدة", "الدمام", "مكة", "المدينة"];

const PLATFORMS_STORAGE_KEY = "fll_sync_platforms";

interface SyncPlatform {
  key: string;
  label: string;
  color: string;
  enabled: boolean;
}

const DEFAULT_SYNC_PLATFORMS: SyncPlatform[] = [
  { key: "hungerstation", label: "هنقرستيشن", color: "#ff6b00", enabled: true },
  { key: "jahez", label: "جاهز", color: "#e53e3e", enabled: true },
  { key: "marsool", label: "مرسول", color: "#805ad5", enabled: true },
  { key: "keeta", label: "كيتا", color: "#00c853", enabled: true },
  { key: "ninja", label: "نينجا", color: "#e91e63", enabled: true },
  { key: "keeta_mart", label: "كيتا مارت", color: "#00e676", enabled: true },
  { key: "wasfaty", label: "وصفتي", color: "#ff9800", enabled: true },
  { key: "toyou", label: "تويو", color: "#0abab5", enabled: true },
  { key: "the_chefs", label: "ذا شيفز", color: "#8d6e63", enabled: true },
  { key: "noon", label: "نون", color: "#f6e05e", enabled: true },
  { key: "amazon", label: "أمازون", color: "#3182ce", enabled: true },
];

function loadSyncPlatforms(): SyncPlatform[] {
  try {
    const saved = localStorage.getItem(PLATFORMS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SYNC_PLATFORMS;
  } catch { return DEFAULT_SYNC_PLATFORMS; }
}

const _TODAY = new Date().toISOString().slice(0, 10);

// ─── Period Presets ──────────────────────────────────────────────────────────

type PeriodPreset = "today" | "yesterday" | "this_week" | "this_month" | "last_month" | "last_3m" | "last_6m" | "this_year" | "custom";

const periodPresets: { key: PeriodPreset; label: string }[] = [
  { key: "today", label: "اليوم" },
  { key: "yesterday", label: "أمس" },
  { key: "this_week", label: "هذا الأسبوع" },
  { key: "this_month", label: "هذا الشهر" },
  { key: "last_month", label: "الشهر الماضي" },
  { key: "last_3m", label: "آخر 3 أشهر" },
  { key: "last_6m", label: "آخر 6 أشهر" },
  { key: "this_year", label: "هذه السنة" },
  { key: "custom", label: "مخصص" },
];

function getDateRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  switch (preset) {
    case "today": return { from: today, to: today };
    case "yesterday": { const y = new Date(now); y.setDate(y.getDate() - 1); return { from: fmt(y), to: fmt(y) }; }
    case "this_week": { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); return { from: fmt(d), to: today }; }
    case "this_month": return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: today };
    case "last_month": { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); const lme = new Date(now.getFullYear(), now.getMonth(), 0); return { from: fmt(lm), to: fmt(lme) }; }
    case "last_3m": { const d = new Date(now); d.setMonth(d.getMonth() - 3); return { from: fmt(d), to: today }; }
    case "last_6m": { const d = new Date(now); d.setMonth(d.getMonth() - 6); return { from: fmt(d), to: today }; }
    case "this_year": return { from: `${now.getFullYear()}-01-01`, to: today };
    case "custom": return { from: "", to: "" };
  }
}

// ─── Month label helper ─────────────────────────────────────────────────────

const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminOrders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("الكل");
  const [cityFilter, setCityFilter] = useState("الكل");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("last_3m");
  const [dateFrom, setDateFrom] = useState(() => getDateRange("last_3m").from);
  const [dateTo, setDateTo] = useState(() => getDateRange("last_3m").to);
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastPulled, setLastPulled] = useState<string | null>(null);
  const [syncPlatforms, setSyncPlatforms] = useState<SyncPlatform[]>(loadSyncPlatforms);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformColor, setNewPlatformColor] = useState("#6366f1");
  const [uploadingPlatform, setUploadingPlatform] = useState<string | null>(null);
  const [showUploadFor, setShowUploadFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Collapsible sections
  const [showPlatformAnalytics, setShowPlatformAnalytics] = useState(true);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [showFailureAnalysis, setShowFailureAnalysis] = useState(true);
  const [showCourierPerformance, setShowCourierPerformance] = useState(true);

  // ─── Per-Platform Sync ──────────────────────────────────────────────────
  async function syncPlatform(platformKey: string) {
    if (!supabase) { toast.error("Supabase غير متصل"); return; }
    setSyncingPlatform(platformKey);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, couriers(full_name)")
        .eq("platform", platformKey)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) { toast.error(`خطأ في سحب ${platformLabels[platformKey] || platformKey}: ${error.message}`); return; }
      if (!data || data.length === 0) {
        toast.info(`لا توجد طلبات لـ ${platformLabels[platformKey] || platformKey}`);
        return;
      }
      const mapped = data.map((o: any) => ({
        id: `#${o.id}`,
        courier_name: o.couriers?.full_name || "غير محدد",
        platform: o.platform,
        customer_name: o.customer_name || "غير محدد",
        customer_phone: o.customer_phone || "",
        address: o.delivery_address || "",
        status: o.status,
        amount: o.amount || 0,
        created_at: new Date(o.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        created_date: o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : _TODAY,
        city: o.city,
        delivery_time: o.delivery_time,
        courier_rating: o.courier_rating,
        profit: o.profit,
      }));
      // Merge: remove old orders for this platform, add new ones
      setOrders(prev => [...prev.filter(o => o.platform !== platformKey), ...mapped]);
      toast.success(`تم سحب ${mapped.length} طلب من ${platformLabels[platformKey] || platformKey}`);
    } catch { toast.error("فشل الاتصال"); } finally { setSyncingPlatform(null); }
  }

  function addPlatform() {
    if (!newPlatformName.trim()) return;
    const key = newPlatformName.trim().toLowerCase().replace(/\s+/g, "_");
    if (syncPlatforms.find(p => p.key === key)) { toast.error("المنصة موجودة مسبقاً"); return; }
    const updated = [...syncPlatforms, { key, label: newPlatformName.trim(), color: newPlatformColor, enabled: true }];
    setSyncPlatforms(updated);
    localStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(updated));
    // Add to platform filters
    if (!platforms.includes(key)) platforms.push(key);
    if (!platformLabels[key]) platformLabels[key] = newPlatformName.trim();
    if (!platformColors[key]) platformColors[key] = newPlatformColor;
    setNewPlatformName("");
    setShowAddPlatform(false);
    toast.success(`تمت إضافة منصة "${newPlatformName.trim()}"`);
  }

  function removePlatform(key: string) {
    const updated = syncPlatforms.filter(p => p.key !== key);
    setSyncPlatforms(updated);
    localStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(updated));
    toast.success("تم حذف المنصة");
  }

  // ─── Excel Import ──────────────────────────────────────────────────────
  async function handleExcelUpload(file: File, platformKey: string) {
    setUploadingPlatform(platformKey);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) {
        toast.error("الملف فارغ — لا توجد بيانات");
        return;
      }

      // Map Excel columns to order fields (flexible column matching)
      const mapped: Order[] = rows.map((row, i) => {
        const id = row["رقم الطلب"] || row["order_id"] || row["orderId"] || row["id"] || `#IMP-${Date.now()}-${i}`;
        const courier = row["المندوب"] || row["courier"] || row["driver"] || row["courier_name"] || "غير محدد";
        const customer = row["العميل"] || row["customer"] || row["customer_name"] || "غير محدد";
        const phone = row["الهاتف"] || row["phone"] || row["customer_phone"] || "";
        const address = row["العنوان"] || row["address"] || row["delivery_address"] || "";
        const status = row["الحالة"] || row["status"] || "pending";
        const amount = Number(row["المبلغ"] || row["amount"] || row["total"] || 0);
        const date = row["التاريخ"] || row["date"] || row["created_at"] || new Date().toISOString();
        const city = row["المدينة"] || row["city"] || "";

        // Normalize status
        const statusMap: Record<string, Order["status"]> = {
          "تم التسليم": "delivered", "delivered": "delivered", "مكتمل": "delivered",
          "قيد التوصيل": "on_way", "on_way": "on_way", "في الطريق": "on_way",
          "تم الاستلام": "picked_up", "picked_up": "picked_up",
          "بانتظار": "pending", "pending": "pending", "جديد": "pending", "new": "pending",
          "فشل": "failed", "failed": "failed", "ملغي": "failed", "cancelled": "failed",
          "مرتجع": "returned", "returned": "returned",
        };

        const parsedDate = new Date(date);
        const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

        return {
          id: String(id).startsWith("#") ? String(id) : `#${id}`,
          courier_name: String(courier),
          platform: platformKey,
          customer_name: String(customer),
          customer_phone: String(phone),
          address: String(address),
          status: statusMap[String(status).trim()] || "pending",
          amount,
          created_at: validDate.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
          created_date: validDate.toISOString().slice(0, 10),
          city: String(city),
          delivery_time: undefined,
          courier_rating: undefined,
          profit: undefined,
        };
      });

      // Save to Supabase if connected
      if (supabase) {
        const toInsert = mapped.map(o => ({
          platform: platformKey,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          delivery_address: o.address,
          status: o.status,
          amount: o.amount,
          city: o.city,
          created_at: new Date(o.created_date + "T00:00:00").toISOString(),
        }));

        const { error } = await supabase.from("orders").insert(toInsert);
        if (error) {
          console.error("Supabase insert error:", error);
          toast.error("تم تحميل الملف لكن فشل الحفظ في قاعدة البيانات: " + error.message);
        } else {
          toast.success(`تم حفظ ${mapped.length} طلب في قاعدة البيانات`);
        }
      }

      // Add to local state
      setOrders(prev => [...prev.filter(o => o.platform !== platformKey), ...mapped]);
      setLastPulled(new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
      setShowUploadFor(null);
      toast.success(`تم استيراد ${mapped.length} طلب من ${platformLabels[platformKey] || platformKey} عبر Excel`);
    } catch (err) {
      console.error("Excel parse error:", err);
      toast.error("خطأ في قراءة ملف Excel — تأكد من صيغة الملف");
    } finally {
      setUploadingPlatform(null);
    }
  }

  function triggerFileUpload(platformKey: string) {
    setShowUploadFor(platformKey);
    setTimeout(() => fileInputRef.current?.click(), 100);
  }

  async function fetchOrders() {
    if (!supabase) {
      toast.error("Supabase غير متصل");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, couriers(full_name)")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) {
        toast.error("خطأ في سحب الطلبات: " + error.message);
        return;
      }
      if (!data || data.length === 0) {
        setOrders([]);
        toast.info("لا توجد طلبات في قاعدة البيانات");
        return;
      }
      const mapped = data.map((o: any) => ({
        id: `#${o.id}`,
        courier_name: o.couriers?.full_name || "غير محدد",
        platform: o.platform,
        customer_name: o.customer_name || "غير محدد",
        customer_phone: o.customer_phone || "",
        address: o.delivery_address || "",
        status: o.status,
        amount: o.amount || 0,
        created_at: new Date(o.created_at).toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        created_date: o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : _TODAY,
        city: o.city,
        delivery_time: o.delivery_time,
        courier_rating: o.courier_rating,
        profit: o.profit,
      }));
      setOrders(mapped);
      setLastPulled(new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
      toast.success(`تم سحب ${mapped.length} طلب بنجاح`);
    } catch {
      toast.error("فشل الاتصال بقاعدة البيانات");
    } finally {
      setLoading(false);
    }
  }

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id.includes(search) ||
      o.courier_name.includes(search) ||
      o.customer_name.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchPlatform =
      platformFilter === "الكل" || o.platform === platformFilter;
    const matchCity = cityFilter === "الكل" || o.city === cityFilter;
    if (dateFrom && o.created_date < dateFrom) return false;
    if (dateTo && o.created_date > dateTo) return false;
    if (amountFrom && o.amount < Number(amountFrom)) return false;
    if (amountTo && o.amount > Number(amountTo)) return false;
    return matchSearch && matchStatus && matchPlatform && matchCity;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, statusFilter, platformFilter, cityFilter, dateFrom, dateTo, amountFrom, amountTo]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Analytics KPIs ───────────────────────────────────────────────────────

  const totalAmount = filtered.reduce((s, o) => s + o.amount, 0);
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const successRate = orders.length > 0 ? ((deliveredCount / orders.length) * 100).toFixed(1) : "0";
  const avgOrderValue = orders.length > 0 ? (totalAmount / orders.length).toFixed(0) : "0";

  // ─── Platform Stats ───────────────────────────────────────────────────────

  const platformStats = useMemo(() => {
    const stats: Record<string, { total: number; delivered: number; failed: number; amount: number; totalTime: number; timeCount: number }> = {};
    orders.forEach((o) => {
      if (!stats[o.platform]) stats[o.platform] = { total: 0, delivered: 0, failed: 0, amount: 0, totalTime: 0, timeCount: 0 };
      stats[o.platform].total++;
      if (o.status === "delivered") stats[o.platform].delivered++;
      if (o.status === "failed" || o.status === "returned") stats[o.platform].failed++;
      stats[o.platform].amount += o.amount;
      if (o.delivery_time) {
        stats[o.platform].totalTime += o.delivery_time;
        stats[o.platform].timeCount++;
      }
    });
    return stats;
  }, [orders]);

  // ─── Monthly Breakdown per Platform ────────────────────────────────────

  const monthlyPlatformData = useMemo(() => {
    const map: Record<string, Record<string, { orders: number; amount: number; delivered: number; failed: number }>> = {};
    filtered.forEach((o) => {
      const monthKey = o.created_date.slice(0, 7); // "YYYY-MM"
      if (!map[monthKey]) map[monthKey] = {};
      if (!map[monthKey][o.platform]) map[monthKey][o.platform] = { orders: 0, amount: 0, delivered: 0, failed: 0 };
      map[monthKey][o.platform].orders++;
      map[monthKey][o.platform].amount += o.amount;
      if (o.status === "delivered") map[monthKey][o.platform].delivered++;
      if (o.status === "failed" || o.status === "returned") map[monthKey][o.platform].failed++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, platforms]) => ({ month, platforms }));
  }, [filtered]);

  const monthlyChartData = useMemo(() =>
    monthlyPlatformData.map(({ month, platforms }) => {
      const [y, m] = month.split("-");
      const row: Record<string, string | number> = { name: `${monthNames[Number(m) - 1]} ${y}` };
      Object.entries(platforms).forEach(([p, v]) => {
        row[platformLabels[p] ?? p] = v.orders;
      });
      return row;
    }), [monthlyPlatformData]);

  // Per-platform monthly totals for the summary table
  const platformMonthlyTotals = useMemo(() => {
    const totals: Record<string, { orders: number; amount: number; delivered: number; failed: number }> = {};
    monthlyPlatformData.forEach(({ platforms }) => {
      Object.entries(platforms).forEach(([p, v]) => {
        if (!totals[p]) totals[p] = { orders: 0, amount: 0, delivered: 0, failed: 0 };
        totals[p].orders += v.orders;
        totals[p].amount += v.amount;
        totals[p].delivered += v.delivered;
        totals[p].failed += v.failed;
      });
    });
    return totals;
  }, [monthlyPlatformData]);

  // ─── Chart Data ───────────────────────────────────────────────────────────

  const pieData = useMemo(() =>
    Object.entries(platformStats).map(([key, val]) => ({
      name: platformLabels[key] ?? key,
      value: val.total,
      color: platformColors[key] || "#8884d8",
    })), [platformStats]);

  const revenueBarData = useMemo(() =>
    Object.entries(platformStats).map(([key, val]) => ({
      name: platformLabels[key] ?? key,
      revenue: val.amount,
      fill: platformColors[key] || "#8884d8",
    })), [platformStats]);

  const successFailData = useMemo(() =>
    Object.entries(platformStats).map(([key, val]) => ({
      name: platformLabels[key] ?? key,
      delivered: val.delivered,
      failed: val.failed,
    })), [platformStats]);

  // ─── Failure Analysis ─────────────────────────────────────────────────────

  const failedOrders = useMemo(() =>
    orders.filter((o) => o.status === "failed" || o.status === "returned"), [orders]);

  const totalFailRate = orders.length > 0 ? ((failedOrders.length / orders.length) * 100).toFixed(1) : "0";
  const returnedCount = orders.filter((o) => o.status === "returned").length;

  const worstPlatform = useMemo(() => {
    let worst = "";
    let maxFail = 0;
    Object.entries(platformStats).forEach(([key, val]) => {
      if (val.failed > maxFail) { maxFail = val.failed; worst = key; }
    });
    return platformLabels[worst] ?? worst;
  }, [platformStats]);

  // ─── Courier Performance ──────────────────────────────────────────────────

  const courierStats = useMemo(() => {
    const stats: Record<string, { total: number; delivered: number; failed: number; rating: number; ratingCount: number }> = {};
    orders.forEach((o) => {
      if (!stats[o.courier_name]) stats[o.courier_name] = { total: 0, delivered: 0, failed: 0, rating: 0, ratingCount: 0 };
      stats[o.courier_name].total++;
      if (o.status === "delivered") stats[o.courier_name].delivered++;
      if (o.status === "failed" || o.status === "returned") stats[o.courier_name].failed++;
      if (o.courier_rating) {
        stats[o.courier_name].rating += o.courier_rating;
        stats[o.courier_name].ratingCount++;
      }
    });
    return stats;
  }, [orders]);

  const topCouriers = useMemo(() =>
    Object.entries(courierStats)
      .map(([name, s]) => ({ name, total: s.total, successRate: s.total > 0 ? (s.delivered / s.total) * 100 : 0, avgRating: s.ratingCount > 0 ? s.rating / s.ratingCount : 0 }))
      .sort((a, b) => b.total - a.total || b.successRate - a.successRate)
      .slice(0, 5), [courierStats]);

  const worstCouriers = useMemo(() =>
    Object.entries(courierStats)
      .map(([name, s]) => ({ name, total: s.total, failRate: s.total > 0 ? (s.failed / s.total) * 100 : 0, failCount: s.failed }))
      .filter((c) => c.failCount > 0)
      .sort((a, b) => b.failRate - a.failRate || b.failCount - a.failCount)
      .slice(0, 5), [courierStats]);

  // ─── CSV Export ───────────────────────────────────────────────────────────

  function downloadCSV() {
    const headers = ["orderId", "customerName", "courierName", "platform", "amount", "status", "createdAt"];
    const rows = filtered.map((o) => [
      o.id,
      o.customer_name,
      o.courier_name,
      platformLabels[o.platform] ?? o.platform,
      o.amount.toString(),
      statusConfig[o.status]?.label ?? o.status,
      o.created_at,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ─── Excel Export ─────────────────────────────────────────────────────────

  function downloadExcel() {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Platform Summary
    const summaryData = Object.entries(platformStats).map(([key, val]) => ({
      "المنصة": platformLabels[key] ?? key,
      "عدد الطلبات": val.total,
      "تم التسليم": val.delivered,
      "فشل / مرتجع": val.failed,
      "نسبة النجاح %": val.total > 0 ? ((val.delivered / val.total) * 100).toFixed(1) : "0",
      "إجمالي المبالغ (ر.س)": val.amount,
      "متوسط وقت التوصيل (دقيقة)": val.timeCount > 0 ? Math.round(val.totalTime / val.timeCount) : "-",
    }));
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    ws1["!cols"] = [
      { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 24 },
    ];
    if (!ws1["!opts"]) ws1["!opts"] = {};
    XLSX.utils.book_append_sheet(wb, ws1, "ملخص المنصات");

    // Sheet 2: Orders Detail
    const ordersData = filtered.map((o) => ({
      "رقم الطلب": o.id,
      "المندوب": o.courier_name,
      "المنصة": platformLabels[o.platform] ?? o.platform,
      "العميل": o.customer_name,
      "الجوال": o.customer_phone,
      "المدينة": o.city || "-",
      "العنوان": o.address,
      "المبلغ (ر.س)": o.amount,
      "الربح (ر.س)": o.profit ?? "-",
      "الحالة": statusConfig[o.status]?.label ?? o.status,
      "وقت التوصيل (دقيقة)": o.delivery_time ?? "-",
      "تقييم المندوب": o.courier_rating ?? "-",
      "الوقت": o.created_at,
      "التاريخ": o.created_date,
    }));
    const ws2 = XLSX.utils.json_to_sheet(ordersData);
    ws2["!cols"] = [
      { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
      { wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
      { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "تفاصيل الطلبات");

    XLSX.writeFile(wb, `orders_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ─── Section Toggle Button ────────────────────────────────────────────────

  function SectionToggle({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--con-bg-surface-1, #0d1926)",
          border: "1px solid var(--con-border-default, #1a3a52)",
          borderRadius: 10,
          padding: "10px 18px",
          cursor: "pointer",
          color: "var(--con-text-primary, #e2e8f0)",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "inherit",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <span>{label}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    );
  }

  // ─── Recharts custom tooltip ──────────────────────────────────────────────

  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "var(--con-bg-surface-1, #0d1926)",
        border: "1px solid var(--con-border-default, #1a3a52)",
        borderRadius: 8,
        padding: "8px 12px",
        direction: "rtl",
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--con-text-primary, #e2e8f0)" }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ margin: "2px 0 0", fontSize: 11, color: p.color || "#94a3b8" }}>
            {p.name}: {typeof p.value === "number" ? p.value.toLocaleString("ar-SA") : p.value}
          </p>
        ))}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      <PageHeader
        icon={Package}
        title="تحليل الطلبات"
        subtitle="لوحة تحليل ومتابعة أداء طلبات التوصيل عبر المنصات"
        actions={
          <>
            <IconButton icon={Download} onClick={downloadCSV} title="تصدير CSV" />
            <IconButton icon={FileSpreadsheet} onClick={downloadExcel} title="تصدير Excel" />
            <IconButton icon={Printer} onClick={() => window.print()} title="طباعة" />
            <Button
              variant="brand"
              icon={RefreshCw}
              onClick={() => fetchOrders()}
              disabled={loading}
            >
              {loading ? "جاري السحب..." : "سحب البيانات"}
            </Button>
          </>
        }
      />

      {/* ── Pull Status Banner ────────────────────────────────────────────── */}
      {orders.length === 0 && !loading && (
        <Card style={{ padding: "2rem", textAlign: "center" }}>
          <Package size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>لا توجد بيانات طلبات</h3>
          <p style={{ color: "#718096", marginBottom: "1rem" }}>اضغط "سحب البيانات" لتحميل الطلبات من قاعدة البيانات</p>
          <Button variant="brand" icon={RefreshCw} onClick={() => fetchOrders()}>سحب البيانات</Button>
        </Card>
      )}

      {lastPulled && (
        <div style={{ fontSize: "0.85rem", color: "#718096", textAlign: "center", padding: "0.5rem" }}>
          آخر سحب: {lastPulled} — {orders.length} طلب
        </div>
      )}

      {/* ── Platform Sync Buttons ─────────────────────────────────────────── */}
      <Card style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Zap size={16} /> مزامنة المنصات
          </h3>
          <button
            onClick={() => setShowAddPlatform(!showAddPlatform)}
            style={{ fontSize: "0.8rem", color: "var(--con-brand)", background: "none", border: "1px solid var(--con-brand)", borderRadius: "6px", padding: "4px 12px", cursor: "pointer" }}
          >
            + إضافة منصة
          </button>
        </div>
        {/* Hidden file input for Excel upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file && showUploadFor) handleExcelUpload(file, showUploadFor);
            e.target.value = "";
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {syncPlatforms.filter(p => p.enabled).map(p => (
            <div key={p.key} style={{ display: "flex", borderRadius: "8px", border: "1px solid " + p.color + "40", overflow: "hidden" }}>
              {/* API Sync Button */}
              <button
                onClick={() => syncPlatform(p.key)}
                disabled={syncingPlatform === p.key}
                title="مزامنة من API"
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 12px", border: "none", borderInlineEnd: "1px solid " + p.color + "30",
                  background: syncingPlatform === p.key ? p.color + "20" : "transparent",
                  color: p.color, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                  opacity: syncingPlatform === p.key ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                {syncingPlatform === p.key ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {p.label}
              </button>
              {/* Excel Upload Button */}
              <button
                onClick={() => triggerFileUpload(p.key)}
                disabled={uploadingPlatform === p.key}
                title="استيراد من Excel"
                style={{
                  display: "flex", alignItems: "center", padding: "8px 10px",
                  background: uploadingPlatform === p.key ? p.color + "20" : "transparent",
                  border: "none", color: p.color, cursor: "pointer",
                  opacity: uploadingPlatform === p.key ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                {uploadingPlatform === p.key ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              </button>
            </div>
          ))}
        </div>

        {showAddPlatform && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={newPlatformName}
              onChange={e => setNewPlatformName(e.target.value)}
              placeholder="اسم المنصة"
              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem", width: "160px" }}
            />
            <input
              type="color"
              value={newPlatformColor}
              onChange={e => setNewPlatformColor(e.target.value)}
              style={{ width: "36px", height: "32px", border: "none", cursor: "pointer" }}
            />
            <button onClick={addPlatform} style={{ padding: "6px 16px", borderRadius: "6px", background: "var(--con-brand)", color: "#fff", border: "none", fontSize: "0.85rem", cursor: "pointer" }}>
              إضافة
            </button>
            <button onClick={() => setShowAddPlatform(false)} style={{ padding: "6px 12px", borderRadius: "6px", background: "#f1f5f9", border: "none", fontSize: "0.85rem", cursor: "pointer" }}>
              إلغاء
            </button>
          </div>
        )}
      </Card>

      {/* ── Analytics KPIs ─────────────────────────────────────────────────── */}

      <KPIGrid>
        <KPICard
          label="إجمالي الطلبات"
          value={orders.length}
          icon={Package}
          accent="var(--con-brand)"
          loading={loading}
        />
        <KPICard
          label="الإيرادات (ر.س)"
          value={totalAmount.toLocaleString("ar-SA")}
          icon={DollarSign}
          accent="var(--con-success)"
          loading={loading}
          mono
        />
        <KPICard
          label="نسبة النجاح"
          value={`${successRate}%`}
          icon={CheckCircle2}
          accent="var(--con-info)"
          loading={loading}
        />
        <KPICard
          label="متوسط قيمة الطلب (ر.س)"
          value={Number(avgOrderValue).toLocaleString("ar-SA")}
          icon={TrendingUp}
          accent="var(--con-warning)"
          loading={loading}
          mono
        />
      </KPIGrid>

      {/* ── Quick Period Filters ──────────────────────────────────────────── */}

      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6, padding: "12px 0",
      }}>
        {periodPresets.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              setPeriodPreset(p.key);
              if (p.key !== "custom") {
                const range = getDateRange(p.key);
                setDateFrom(range.from);
                setDateTo(range.to);
              }
            }}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              border: periodPreset === p.key ? "1px solid var(--con-brand, #38bdf8)" : "1px solid var(--con-border-default, #1a3a52)",
              background: periodPreset === p.key ? "rgba(56, 189, 248, 0.12)" : "transparent",
              color: periodPreset === p.key ? "var(--con-brand, #38bdf8)" : "var(--con-text-secondary, #94a3b8)",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {p.label}
          </button>
        ))}
        {periodPreset === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginInlineStart: 8 }}>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              style={{ background: "var(--con-bg, #07111d)", border: "1px solid var(--con-border, #1a3a52)", borderRadius: 8, padding: "5px 10px", color: "var(--con-text, #e2e8f0)", fontSize: 12, fontFamily: "inherit" }} />
            <span style={{ color: "var(--con-text-muted)", fontSize: 12 }}>—</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              style={{ background: "var(--con-bg, #07111d)", border: "1px solid var(--con-border, #1a3a52)", borderRadius: 8, padding: "5px 10px", color: "var(--con-text, #e2e8f0)", fontSize: 12, fontFamily: "inherit" }} />
          </div>
        )}
      </div>

      {/* ── Platform Analytics ─────────────────────────────────────────────── */}

      <SectionToggle label="تحليل المنصات" open={showPlatformAnalytics} onToggle={() => setShowPlatformAnalytics(!showPlatformAnalytics)} />
      {showPlatformAnalytics && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}>
          {Object.entries(platformStats).map(([key, val]) => {
            const pColor = platformColors[key] || "#8884d8";
            const sRate = val.total > 0 ? ((val.delivered / val.total) * 100).toFixed(0) : "0";
            const avgTime = val.timeCount > 0 ? Math.round(val.totalTime / val.timeCount) : null;
            return (
              <Card key={key}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: pColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--con-text-primary)" }}>{platformLabels[key] ?? key}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>عدد الطلبات</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: pColor, fontFamily: "var(--con-font-mono)" }}>{val.total}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>نسبة النجاح</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: Number(sRate) >= 70 ? "#38a169" : "#e53e3e", fontFamily: "var(--con-font-mono)" }}>{sRate}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>إجمالي المبالغ</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--con-text-primary)", fontFamily: "var(--con-font-mono)" }}>{val.amount.toLocaleString("ar-SA")} ر.س</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>متوسط التوصيل</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--con-text-primary)", fontFamily: "var(--con-font-mono)" }}>{avgTime ? `${avgTime} د` : "—"}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Monthly Breakdown per Platform ─────────────────────────────────── */}

      <SectionToggle label="التحليل الشهري لكل تطبيق" open={showMonthlyBreakdown} onToggle={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)} />
      {showMonthlyBreakdown && (
        <>
          {/* Monthly Stacked Bar Chart */}
          {monthlyChartData.length > 1 && (
            <Card title="الطلبات الشهرية حسب التطبيق">
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ right: 10, left: 10, top: 10 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(value: string) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{value}</span>} />
                    {Object.keys(platformLabels).filter((k) => k !== "الكل").map((key) => (
                      <Bar key={key} dataKey={platformLabels[key]} stackId="a" fill={platformColors[key] || "#8884d8"} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Platform Summary Table */}
          <Card title="ملخص إجمالي لكل تطبيق في الفترة المحددة" noPadding>
            <Table
              headers={["التطبيق", "إجمالي الطلبات", "تم التسليم", "فشل / مرتجع", "نسبة النجاح", "الإيرادات (ر.س)", "متوسط الطلب (ر.س)"]}
              isEmpty={Object.keys(platformMonthlyTotals).length === 0}
              emptyIcon={Package}
              emptyText="لا توجد بيانات"
            >
              {Object.entries(platformMonthlyTotals)
                .sort(([, a], [, b]) => b.orders - a.orders)
                .map(([key, v]) => {
                  const sRate = v.orders > 0 ? ((v.delivered / v.orders) * 100).toFixed(1) : "0";
                  const avgOrd = v.orders > 0 ? Math.round(v.amount / v.orders) : 0;
                  return (
                    <tr key={key}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: platformColors[key] || "#8884d8", flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>{platformLabels[key] ?? key}</span>
                        </div>
                      </td>
                      <td className="con-td-mono" style={{ fontWeight: 700 }}>{v.orders}</td>
                      <td className="con-td-mono" style={{ color: "var(--con-success)" }}>{v.delivered}</td>
                      <td className="con-td-mono" style={{ color: "var(--con-danger)" }}>{v.failed}</td>
                      <td>
                        <span style={{ color: Number(sRate) >= 70 ? "#38a169" : Number(sRate) >= 50 ? "#ecc94b" : "#e53e3e", fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>
                          {sRate}%
                        </span>
                      </td>
                      <td className="con-td-mono">{v.amount.toLocaleString("ar-SA")}</td>
                      <td className="con-td-mono">{avgOrd.toLocaleString("ar-SA")}</td>
                    </tr>
                  );
                })}
              {/* Totals row */}
              {Object.keys(platformMonthlyTotals).length > 0 && (
                <tr style={{ background: "rgba(56, 189, 248, 0.05)", fontWeight: 700 }}>
                  <td style={{ color: "var(--con-brand)", fontWeight: 700 }}>الإجمالي</td>
                  <td className="con-td-mono" style={{ fontWeight: 700 }}>
                    {Object.values(platformMonthlyTotals).reduce((s, v) => s + v.orders, 0)}
                  </td>
                  <td className="con-td-mono" style={{ color: "var(--con-success)", fontWeight: 700 }}>
                    {Object.values(platformMonthlyTotals).reduce((s, v) => s + v.delivered, 0)}
                  </td>
                  <td className="con-td-mono" style={{ color: "var(--con-danger)", fontWeight: 700 }}>
                    {Object.values(platformMonthlyTotals).reduce((s, v) => s + v.failed, 0)}
                  </td>
                  <td>
                    {(() => {
                      const totalO = Object.values(platformMonthlyTotals).reduce((s, v) => s + v.orders, 0);
                      const totalD = Object.values(platformMonthlyTotals).reduce((s, v) => s + v.delivered, 0);
                      const r = totalO > 0 ? ((totalD / totalO) * 100).toFixed(1) : "0";
                      return <span style={{ color: Number(r) >= 70 ? "#38a169" : "#ecc94b", fontWeight: 700, fontFamily: "var(--con-font-mono)" }}>{r}%</span>;
                    })()}
                  </td>
                  <td className="con-td-mono" style={{ fontWeight: 700 }}>
                    {Object.values(platformMonthlyTotals).reduce((s, v) => s + v.amount, 0).toLocaleString("ar-SA")}
                  </td>
                  <td className="con-td-mono">—</td>
                </tr>
              )}
            </Table>
          </Card>

          {/* Per-Month Detail Table */}
          {monthlyPlatformData.length > 0 && (
            <Card title="تفصيل شهري" noPadding>
              <Table
                headers={["الشهر", ...Object.keys(platformLabels).filter((k) => k !== "الكل" && platformMonthlyTotals[k]).map((k) => platformLabels[k]), "الإجمالي"]}
                isEmpty={false}
                emptyIcon={Package}
                emptyText=""
              >
                {monthlyPlatformData.map(({ month, platforms }) => {
                  const [y, m] = month.split("-");
                  const total = Object.values(platforms).reduce((s, v) => s + v.orders, 0);
                  return (
                    <tr key={month}>
                      <td style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>{monthNames[Number(m) - 1]} {y}</td>
                      {Object.keys(platformLabels).filter((k) => k !== "الكل" && platformMonthlyTotals[k]).map((k) => (
                        <td key={k} className="con-td-mono">{platforms[k]?.orders ?? 0}</td>
                      ))}
                      <td className="con-td-mono" style={{ fontWeight: 700, color: "var(--con-brand)" }}>{total}</td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          )}
        </>
      )}

      {/* ── Charts ─────────────────────────────────────────────────────────── */}

      <SectionToggle label="الرسوم البيانية" open={showCharts} onToggle={() => setShowCharts(!showCharts)} />
      {showCharts && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: 12,
        }}>
          {/* Chart 1: Orders by Platform (Donut) */}
          <Card title="توزيع الطلبات حسب المنصة">
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value: string) => <span style={{ color: "var(--con-text-secondary, #94a3b8)", fontSize: 11 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Revenue by Platform (Bar) */}
          <Card title="الإيرادات حسب المنصة">
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBarData} layout="vertical" margin={{ right: 10, left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="الإيرادات (ر.س)" radius={[0, 4, 4, 0]}>
                    {revenueBarData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 3: Success vs Failure (Stacked Bar) */}
          <Card title="نسبة النجاح vs الفشل" style={{ gridColumn: "1 / -1" }}>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={successFailData} margin={{ right: 10, left: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value: string) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{value}</span>}
                  />
                  <Bar dataKey="delivered" name="تم التسليم" stackId="a" fill="#38a169" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="failed" name="فشل / مرتجع" stackId="a" fill="#e53e3e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ── Failure Analysis ───────────────────────────────────────────────── */}

      <SectionToggle label="تحليل الفشل والمرتجعات" open={showFailureAnalysis} onToggle={() => setShowFailureAnalysis(!showFailureAnalysis)} />
      {showFailureAnalysis && (
        <>
          <KPIGrid cols="repeat(auto-fit, minmax(180px, 1fr))">
            <KPICard
              label="نسبة الفشل الكلية"
              value={`${totalFailRate}%`}
              icon={XCircle}
              accent="var(--con-danger)"
            />
            <KPICard
              label="عدد المرتجعات"
              value={returnedCount}
              icon={AlertTriangle}
              accent="var(--con-warning)"
            />
            <KPICard
              label="أعلى منصة فشلاً"
              value={worstPlatform || "—"}
              icon={Target}
              accent="var(--con-danger)"
              mono={false}
            />
          </KPIGrid>
          {failedOrders.length > 0 && (
            <Card noPadding>
              <Table
                headers={["رقم الطلب", "المنصة", "المندوب", "المبلغ", "الحالة"]}
                isEmpty={failedOrders.length === 0}
                emptyIcon={CheckCircle2}
                emptyText="لا توجد طلبات فاشلة"
              >
                {failedOrders.map((o) => {
                  const sc = statusConfig[o.status];
                  return (
                    <tr key={o.id}>
                      <td className="con-td-mono" style={{ color: "var(--con-brand)" }}>{o.id}</td>
                      <td><Badge variant="muted">{platformLabels[o.platform] ?? o.platform}</Badge></td>
                      <td className="con-td-primary">{o.courier_name}</td>
                      <td className="con-td-mono">{o.amount.toFixed(0)} ر.س</td>
                      <td><Badge variant={sc?.variant ?? "muted"}>{sc?.label ?? o.status}</Badge></td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          )}
        </>
      )}

      {/* ── Courier Performance ────────────────────────────────────────────── */}

      <SectionToggle label="أداء المناديب" open={showCourierPerformance} onToggle={() => setShowCourierPerformance(!showCourierPerformance)} />
      {showCourierPerformance && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 12,
        }}>
          {/* Top Couriers */}
          <Card title="أفضل المناديب" noPadding>
            <Table
              headers={["المندوب", "الطلبات", "نسبة النجاح", "التقييم"]}
              isEmpty={topCouriers.length === 0}
              emptyIcon={Users}
              emptyText="لا توجد بيانات"
            >
              {topCouriers.map((c, i) => (
                <tr key={c.name}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: i === 0 ? "#ecc94b" : i === 1 ? "#a0aec0" : i === 2 ? "#c77b30" : "var(--con-bg-surface-1, #0d1926)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: i < 3 ? "#1a202c" : "var(--con-text-muted)",
                        border: i >= 3 ? "1px solid var(--con-border-default, #1a3a52)" : "none",
                      }}>
                        {i + 1}
                      </span>
                      <button
                        onClick={() => navigate("/admin-panel/couriers")}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--con-brand)", fontWeight: 500, fontFamily: "inherit",
                          fontSize: "inherit", padding: 0, textDecoration: "underline",
                          textDecorationColor: "transparent",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.textDecorationColor = "var(--con-brand)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.textDecorationColor = "transparent"; }}
                      >
                        {c.name}
                      </button>
                    </div>
                  </td>
                  <td className="con-td-mono">{c.total}</td>
                  <td>
                    <span style={{ color: c.successRate >= 70 ? "#38a169" : "#e53e3e", fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>
                      {c.successRate.toFixed(0)}%
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={12} style={{ color: "#ecc94b", fill: "#ecc94b" }} />
                      <span className="con-mono" style={{ fontSize: 12, color: "var(--con-text-primary)" }}>{c.avgRating.toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>

          {/* Worst Couriers */}
          <Card title="أسوأ المناديب (نسبة الفشل)" noPadding>
            <Table
              headers={["المندوب", "الطلبات", "نسبة الفشل", "عدد الفشل"]}
              isEmpty={worstCouriers.length === 0}
              emptyIcon={Users}
              emptyText="لا توجد بيانات"
            >
              {worstCouriers.map((c) => (
                <tr key={c.name}>
                  <td>
                    <button
                      onClick={() => navigate("/admin-panel/couriers")}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--con-brand)", fontWeight: 500, fontFamily: "inherit",
                        fontSize: "inherit", padding: 0, textDecoration: "underline",
                        textDecorationColor: "transparent",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecorationColor = "var(--con-brand)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecorationColor = "transparent"; }}
                    >
                      {c.name}
                    </button>
                  </td>
                  <td className="con-td-mono">{c.total}</td>
                  <td>
                    <span style={{ color: "#e53e3e", fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>
                      {c.failRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="con-td-mono" style={{ color: "var(--con-danger)" }}>{c.failCount}</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {/* ── Toolbar (Search + Filters) ─────────────────────────────────────── */}

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="ابحث برقم الطلب، المندوب، أو العميل..."
      >
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "كل الحالات" },
            { value: "pending", label: "بانتظار الاستلام" },
            { value: "on_way", label: "في الطريق" },
            { value: "delivered", label: "تم التسليم" },
            { value: "failed", label: "فشل" },
            { value: "returned", label: "مرتجع" },
          ]}
          style={{ minWidth: 170 }}
        />
        <Select
          value={platformFilter}
          onChange={setPlatformFilter}
          options={platforms.map((p) => ({
            value: p,
            label: platformLabels[p] ?? p,
          }))}
          style={{ minWidth: 150 }}
        />
        <Select
          value={cityFilter}
          onChange={setCityFilter}
          options={cities.map((c) => ({ value: c, label: c }))}
          style={{ minWidth: 130 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>مبلغ من</label>
          <input
            type="number"
            value={amountFrom}
            onChange={(e) => setAmountFrom(e.target.value)}
            placeholder="0"
            style={{
              background: "var(--con-bg, #07111d)",
              border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "var(--con-text, #e2e8f0)",
              fontSize: 13,
              fontFamily: "inherit",
              width: 80,
            }}
          />
          <label style={{ fontSize: 12, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>إلى</label>
          <input
            type="number"
            value={amountTo}
            onChange={(e) => setAmountTo(e.target.value)}
            placeholder="999"
            style={{
              background: "var(--con-bg, #07111d)",
              border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "var(--con-text, #e2e8f0)",
              fontSize: 13,
              fontFamily: "inherit",
              width: 80,
            }}
          />
        </div>
      </Toolbar>

      {/* ── Orders Table ───────────────────────────────────────────────────── */}

      <Card noPadding>
        <Table
          headers={[
            "رقم الطلب",
            "المندوب",
            "المنصة",
            "العميل",
            "المدينة",
            "المبلغ",
            "الحالة",
            "الوقت",
          ]}
          isEmpty={!loading && filtered.length === 0}
          emptyIcon={Package}
          emptyText="لا توجد طلبات تطابق المعايير المحددة"
        >
          {loading ? (
            <SkeletonRows rows={5} cols={8} />
          ) : (
            paginated.map((order) => {
              const sc = statusConfig[order.status];
              return (
                <tr key={order.id} onClick={() => setSelectedOrder(order)} style={{ cursor: "pointer" }}>
                  <td
                    className="con-td-mono"
                    style={{ color: "var(--con-brand)" }}
                  >
                    {order.id}
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/admin-panel/couriers");
                      }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--con-brand)", fontWeight: 500, fontFamily: "inherit",
                        fontSize: "inherit", padding: 0, textDecoration: "underline",
                        textDecorationColor: "transparent",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecorationColor = "var(--con-brand)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecorationColor = "transparent"; }}
                    >
                      {order.courier_name}
                    </button>
                  </td>
                  <td>
                    <Badge variant="muted">
                      {platformLabels[order.platform] ?? order.platform}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ lineHeight: 1.4 }}>
                      <div
                        style={{
                          color: "var(--con-text-primary)",
                          fontWeight: 500,
                        }}
                      >
                        {order.customer_name}
                      </div>
                      <div
                        className="con-mono"
                        style={{
                          fontSize: "var(--con-text-caption)",
                          color: "var(--con-text-muted)",
                        }}
                      >
                        {order.customer_phone}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--con-text-secondary)" }}>{order.city || "—"}</td>
                  <td className="con-td-mono">{order.amount.toFixed(0)} ر.س</td>
                  <td>
                    <Badge variant={sc?.variant ?? "muted"}>
                      {sc?.label ?? order.status}
                    </Badge>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <Clock
                        size={11}
                        style={{ color: "var(--con-text-muted)" }}
                      />
                      <span
                        className="con-mono"
                        style={{
                          color: "var(--con-text-muted)",
                          fontSize: "var(--con-text-caption)",
                        }}
                      >
                        {order.created_at}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </Table>
        {!loading && filtered.length > 0 && (
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
            <span>{filtered.length} طلب معروض</span>
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              <TrendingUp size={12} style={{ color: "var(--con-success)" }} />
              الإجمالي:{" "}
              <span
                className="con-mono"
                style={{ color: "var(--con-text-primary)" }}
              >
                {totalAmount.toLocaleString("ar-SA")} ر.س
              </span>
            </span>
          </div>
        )}
        {!loading && filtered.length > 0 && totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderTop: "1px solid var(--con-border, #1a3a52)",
          }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              صفحة {page} من {totalPages} — إجمالي {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--con-border, #1a3a52)",
                  background: "var(--con-card, #0d1926)", color: page === 1 ? "#475569" : "var(--con-text, #e2e8f0)",
                  cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 12 }}>
                السابق
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--con-border, #1a3a52)",
                  background: "var(--con-card, #0d1926)", color: page === totalPages ? "#475569" : "var(--con-text, #e2e8f0)",
                  cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 12 }}>
                التالي
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Order Detail Modal ─────────────────────────────────────────────── */}

      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`تفاصيل الطلب ${selectedOrder?.id ?? ""}`}
        width={600}
        actions={
          <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
            إغلاق
          </Button>
        }
      >
        {selectedOrder && (() => {
          const sc = statusConfig[selectedOrder.status];
          return (
            <>
              <Section title="معلومات الطلب" style={{ marginTop: 0 }}>
                <DetailGrid cols={2}>
                  <DetailField label="رقم الطلب" value={selectedOrder.id} icon={Hash} mono />
                  <DetailField
                    label="الحالة"
                    value={<Badge variant={sc?.variant ?? "muted"}>{sc?.label ?? selectedOrder.status}</Badge>}
                  />
                  <DetailField label="المنصة" value={platformLabels[selectedOrder.platform] ?? selectedOrder.platform} icon={Truck} />
                  <DetailField label="المبلغ" value={`${selectedOrder.amount.toFixed(0)} ر.س`} icon={DollarSign} mono />
                  <DetailField label="المدينة" value={selectedOrder.city || "—"} icon={MapPin} />
                  <DetailField label="الربح" value={selectedOrder.profit != null ? `${selectedOrder.profit} ر.س` : "—"} icon={TrendingUp} mono />
                  <DetailField label="وقت التوصيل" value={selectedOrder.delivery_time ? `${selectedOrder.delivery_time} دقيقة` : "—"} icon={Clock} mono />
                  <DetailField label="تقييم المندوب" value={selectedOrder.courier_rating ? `${selectedOrder.courier_rating} / 5` : "—"} icon={Star} mono />
                </DetailGrid>
              </Section>

              <Section title="معلومات العميل">
                <DetailGrid cols={2}>
                  <DetailField label="اسم العميل" value={selectedOrder.customer_name} icon={User} />
                  <DetailField label="رقم الجوال" value={selectedOrder.customer_phone} icon={Phone} mono />
                  <DetailField label="العنوان" value={selectedOrder.address} icon={MapPin} />
                </DetailGrid>
              </Section>

              <Section title="معلومات المندوب والتوقيت">
                <DetailGrid cols={2}>
                  <DetailField label="المندوب" value={selectedOrder.courier_name} icon={Bike} />
                  <DetailField label="الوقت" value={selectedOrder.created_at} icon={CalendarDays} mono />
                </DetailGrid>
              </Section>
            </>
          );
        })()}
      </Modal>
    </PageWrapper>
  );
}
