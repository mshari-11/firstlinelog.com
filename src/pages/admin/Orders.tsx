import { useEffect, useState, useMemo } from "react";
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
  TrendingDown,
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
  BarChart3,
  AlertTriangle,
  Star,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Target,
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
  "jahez",
  "hungerstation",
  "toyor",
  "marsool",
  "mrsool",
  "noon",
  "amazon",
];
const platformLabels: Record<string, string> = {
  الكل: "الكل",
  jahez: "جاهز",
  hungerstation: "هنقرستيشن",
  toyor: "طيور",
  marsool: "مرسول",
  mrsool: "مرسول برو",
  noon: "نون",
  amazon: "أمازون",
};

const platformColors: Record<string, string> = {
  jahez: "#e53e3e",
  hungerstation: "#ff6b00",
  toyor: "#38a169",
  marsool: "#805ad5",
  mrsool: "#6b46c1",
  noon: "#ecc94b",
  amazon: "#3182ce",
};

const CHART_COLORS = ["#e53e3e", "#ff6b00", "#38a169", "#805ad5", "#6b46c1", "#ecc94b", "#3182ce"];

const cities = ["الكل", "الرياض", "جدة", "الدمام", "مكة", "المدينة"];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const _TODAY = new Date().toISOString().slice(0, 10);
const _YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

const mockOrders: Order[] = [
  {
    id: "#10240",
    courier_name: "أحمد محمد",
    platform: "jahez",
    customer_name: "محمد علي",
    customer_phone: "0501234567",
    address: "الرياض، حي النزهة",
    status: "on_way",
    amount: 45,
    created_at: "14:23",
    created_date: _TODAY,
    city: "الرياض",
    delivery_time: 28,
    courier_rating: 4.8,
    profit: 12,
  },
  {
    id: "#10239",
    courier_name: "خالد العمري",
    platform: "marsool",
    customer_name: "فاطمة السالم",
    customer_phone: "0557654321",
    address: "جدة، حي الروضة",
    status: "delivered",
    amount: 30,
    created_at: "13:55",
    created_date: _TODAY,
    city: "جدة",
    delivery_time: 22,
    courier_rating: 4.5,
    profit: 8,
  },
  {
    id: "#10238",
    courier_name: "فهد الغامدي",
    platform: "noon",
    customer_name: "علي أحمد",
    customer_phone: "0509876543",
    address: "الرياض، حي الملقا",
    status: "picked_up",
    amount: 65,
    created_at: "13:40",
    created_date: _TODAY,
    city: "الرياض",
    delivery_time: 35,
    courier_rating: 4.2,
    profit: 18,
  },
  {
    id: "#10237",
    courier_name: "سعد الزهراني",
    platform: "marsool",
    customer_name: "هند محمد",
    customer_phone: "0551112233",
    address: "الدمام، حي الفيصلية",
    status: "pending",
    amount: 25,
    created_at: "13:10",
    created_date: _YESTERDAY,
    city: "الدمام",
    delivery_time: undefined,
    courier_rating: 4.0,
    profit: 7,
  },
  {
    id: "#10236",
    courier_name: "عمر الشمري",
    platform: "amazon",
    customer_name: "عبدالله خالد",
    customer_phone: "0503334455",
    address: "الرياض، حي العليا",
    status: "delivered",
    amount: 80,
    created_at: "12:45",
    created_date: _YESTERDAY,
    city: "الرياض",
    delivery_time: 19,
    courier_rating: 4.9,
    profit: 22,
  },
  {
    id: "#10235",
    courier_name: "محمد القحطاني",
    platform: "jahez",
    customer_name: "نورة العتيبي",
    customer_phone: "0556667788",
    address: "مكة، حي العزيزية",
    status: "failed",
    amount: 55,
    created_at: "12:20",
    created_date: _YESTERDAY,
    city: "مكة",
    delivery_time: undefined,
    courier_rating: 3.2,
    profit: 0,
  },
  {
    id: "#10234",
    courier_name: "أحمد محمد",
    platform: "marsool",
    customer_name: "سلمى الشريف",
    customer_phone: "0509998877",
    address: "الرياض، حي السلام",
    status: "returned",
    amount: 40,
    created_at: "11:55",
    created_date: _YESTERDAY,
    city: "الرياض",
    delivery_time: undefined,
    courier_rating: 4.8,
    profit: 0,
  },
  // ─── Additional mock orders (8 more → total 15) ────────────────────────────
  {
    id: "#10233",
    courier_name: "يوسف الدوسري",
    platform: "hungerstation",
    customer_name: "ريم الحربي",
    customer_phone: "0512345678",
    address: "جدة، حي الحمراء",
    status: "delivered",
    amount: 120,
    created_at: "11:30",
    created_date: _TODAY,
    city: "جدة",
    delivery_time: 18,
    courier_rating: 4.7,
    profit: 32,
  },
  {
    id: "#10232",
    courier_name: "عبدالرحمن السبيعي",
    platform: "jahez",
    customer_name: "سارة الفهد",
    customer_phone: "0559871234",
    address: "الرياض، حي الياسمين",
    status: "delivered",
    amount: 95,
    created_at: "11:10",
    created_date: _TODAY,
    city: "الرياض",
    delivery_time: 24,
    courier_rating: 4.6,
    profit: 25,
  },
  {
    id: "#10231",
    courier_name: "تركي المطيري",
    platform: "hungerstation",
    customer_name: "لمياء العنزي",
    customer_phone: "0501239876",
    address: "الدمام، حي الشاطئ",
    status: "failed",
    amount: 210,
    created_at: "10:45",
    created_date: _TODAY,
    city: "الدمام",
    delivery_time: undefined,
    courier_rating: 3.0,
    profit: 0,
  },
  {
    id: "#10230",
    courier_name: "ناصر الحازمي",
    platform: "toyor",
    customer_name: "خالد الشهري",
    customer_phone: "0554443322",
    address: "المدينة، حي العزيزية",
    status: "delivered",
    amount: 35,
    created_at: "10:20",
    created_date: _YESTERDAY,
    city: "المدينة",
    delivery_time: 30,
    courier_rating: 4.3,
    profit: 9,
  },
  {
    id: "#10229",
    courier_name: "بندر العتيبي",
    platform: "amazon",
    customer_name: "منى الغامدي",
    customer_phone: "0507776655",
    address: "الرياض، حي النخيل",
    status: "delivered",
    amount: 350,
    created_at: "09:50",
    created_date: _YESTERDAY,
    city: "الرياض",
    delivery_time: 15,
    courier_rating: 4.9,
    profit: 45,
  },
  {
    id: "#10228",
    courier_name: "محمد القحطاني",
    platform: "mrsool",
    customer_name: "عائشة البلوي",
    customer_phone: "0553216549",
    address: "جدة، حي السلامة",
    status: "returned",
    amount: 75,
    created_at: "09:30",
    created_date: _YESTERDAY,
    city: "جدة",
    delivery_time: undefined,
    courier_rating: 3.2,
    profit: 0,
  },
  {
    id: "#10227",
    courier_name: "يوسف الدوسري",
    platform: "hungerstation",
    customer_name: "فيصل المالكي",
    customer_phone: "0508887766",
    address: "الرياض، حي الربيع",
    status: "on_way",
    amount: 58,
    created_at: "09:15",
    created_date: _TODAY,
    city: "الرياض",
    delivery_time: undefined,
    courier_rating: 4.7,
    profit: 15,
  },
  {
    id: "#10226",
    courier_name: "خالد العمري",
    platform: "jahez",
    customer_name: "هدى الزهراني",
    customer_phone: "0551114477",
    address: "مكة، حي الشوقية",
    status: "delivered",
    amount: 42,
    created_at: "08:50",
    created_date: _YESTERDAY,
    city: "مكة",
    delivery_time: 26,
    courier_rating: 4.5,
    profit: 11,
  },
];

// ─── Comparison mock data ─────────────────────────────────────────────────────

const periodComparison = {
  current: { orders: 15, revenue: 1325, successRate: 53.3 },
  previous: { orders: 13, revenue: 1210, successRate: 51.0 },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminOrders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("الكل");
  const [cityFilter, setCityFilter] = useState("الكل");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Collapsible sections
  const [showPlatformAnalytics, setShowPlatformAnalytics] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [showFailureAnalysis, setShowFailureAnalysis] = useState(true);
  const [showPeriodComparison, setShowPeriodComparison] = useState(false);
  const [showCourierPerformance, setShowCourierPerformance] = useState(true);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, couriers(full_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
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
      }
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

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

  // ─── Period Comparison helpers ────────────────────────────────────────────

  const compOrdersChange = periodComparison.previous.orders > 0
    ? (((periodComparison.current.orders - periodComparison.previous.orders) / periodComparison.previous.orders) * 100).toFixed(1)
    : "0";
  const compRevenueChange = periodComparison.previous.revenue > 0
    ? (((periodComparison.current.revenue - periodComparison.previous.revenue) / periodComparison.previous.revenue) * 100).toFixed(1)
    : "0";
  const compSuccessChange = (periodComparison.current.successRate - periodComparison.previous.successRate).toFixed(1);

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
              variant="ghost"
              icon={RefreshCw}
              onClick={() => fetchOrders()}
            >
              تحديث
            </Button>
          </>
        }
      />

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

      {/* ── Period Comparison Toggle ───────────────────────────────────────── */}

      <SectionToggle label="مقارنة الفترات" open={showPeriodComparison} onToggle={() => setShowPeriodComparison(!showPeriodComparison)} />
      {showPeriodComparison && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}>
          {[
            { label: "الطلبات", current: periodComparison.current.orders, previous: periodComparison.previous.orders, change: Number(compOrdersChange), unit: "" },
            { label: "الإيرادات", current: periodComparison.current.revenue, previous: periodComparison.previous.revenue, change: Number(compRevenueChange), unit: "ر.س" },
            { label: "نسبة النجاح", current: periodComparison.current.successRate, previous: periodComparison.previous.successRate, change: Number(compSuccessChange), unit: "%" },
          ].map((item) => {
            const isUp = item.change >= 0;
            return (
              <Card key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--con-text-primary)", fontFamily: "var(--con-font-mono)" }}>
                      {item.current.toLocaleString("ar-SA")} {item.unit}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--con-text-muted)", marginTop: 4 }}>
                      الفترة السابقة: {item.previous.toLocaleString("ar-SA")} {item.unit}
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: isUp ? "rgba(56,161,105,0.12)" : "rgba(229,62,62,0.12)",
                    color: isUp ? "#38a169" : "#e53e3e",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "var(--con-font-mono)",
                  }}>
                    {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {isUp ? "+" : ""}{item.change}%
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
          <label style={{ fontSize: 12, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>من</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              background: "var(--con-bg, #07111d)",
              border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "var(--con-text, #e2e8f0)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
          <label style={{ fontSize: 12, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>إلى</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              background: "var(--con-bg, #07111d)",
              border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "var(--con-text, #e2e8f0)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
        </div>
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
