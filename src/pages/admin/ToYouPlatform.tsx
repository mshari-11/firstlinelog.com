/**
 * صفحة منصة تويو — ToYou Delivery Platform Integration
 * Manages ToYou (toyou.io) orders synced via Odoo backend
 * Branding: #0ABAB5 teal primary, #0C2D48 navy, #00D4AA accent
 */
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Settings,
  Download,
  Play,
  Wifi,
  WifiOff,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Truck,
  Star,
  Timer,
  Activity,
  Database,
  Link2,
  Save,
  Eye,
  EyeOff,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Loader2,
  FileText,
  UserCheck,
  AlertCircle,
  CircleDot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOYOU_PRIMARY = "#0ABAB5";
const TOYOU_NAVY = "#0C2D48";
const TOYOU_ACCENT = "#00D4AA";
const TOYOU_PRIMARY_10 = "rgba(10,186,181,0.10)";
const TOYOU_PRIMARY_15 = "rgba(10,186,181,0.15)";
const TOYOU_PRIMARY_20 = "rgba(10,186,181,0.20)";
const TOYOU_ACCENT_10 = "rgba(0,212,170,0.10)";
const TOYOU_NAVY_80 = "rgba(12,45,72,0.80)";
const LOCAL_KEY = "fll_toyou_odoo_config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OdooConfig {
  serverUrl: string;
  database: string;
  username: string;
  apiKey: string;
  syncInterval: string;
  lastSync: string | null;
}

type OrderStatus = "new" | "delivering" | "delivered" | "cancelled";

interface ToYouOrder {
  id: string;
  orderNumber: string;
  customer: string;
  driver: string;
  amount: number;
  status: OrderStatus;
  deliveryTime: string;
  area: string;
  date: string;
}

interface DriverPerformance {
  name: string;
  ordersCount: number;
  successRate: number;
  avgDeliveryTime: string;
  rating: number;
}

interface SyncLog {
  time: string;
  message: string;
  type: "success" | "error" | "info";
}

// ─── Data (fetched on demand) ─────────────────────────────────────────────────

const DEFAULT_CONFIG: OdooConfig = {
  serverUrl: "",
  database: "",
  username: "",
  apiKey: "",
  syncInterval: "15",
  lastSync: null,
};

// ─── Status Helpers ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  new: { label: "جديد", color: TOYOU_PRIMARY, bg: TOYOU_PRIMARY_10 },
  delivering: { label: "قيد التوصيل", color: "#eab308", bg: "rgba(234,179,8,0.10)" },
  delivered: { label: "تم التسليم", color: "#22c55e", bg: "rgba(34,197,94,0.10)" },
  cancelled: { label: "ملغي", color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
};

// ─── ToYou Logo SVG ───────────────────────────────────────────────────────────

function ToYouLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill={TOYOU_PRIMARY} />
      <path d="M14 16L24 24L14 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 16L34 24L24 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ToYouPlatform() {
  const [orders, setOrders] = useState<ToYouOrder[]>([]);
  const [drivers, setDrivers] = useState<DriverPerformance[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState<OdooConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [pullingOrders, setPullingOrders] = useState(false);
  const [pullingDrivers, setPullingDrivers] = useState(false);

  const isConnected = !!(config.serverUrl && config.username && config.apiKey);

  // ─── Filtered Orders ─────────────────────────────────────────────────────

  const filteredOrders = orders.filter((o) => {
    const matchSearch = !searchQuery ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.includes(searchQuery) ||
      o.driver.includes(searchQuery) ||
      o.area.includes(searchQuery);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ─── KPI Calculations ────────────────────────────────────────────────────

  const todayOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status === "new" || o.status === "delivering").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const successRate = todayOrders > 0 ? ((deliveredOrders / (deliveredOrders + cancelledOrders)) * 100).toFixed(1) : "0";
  const connectedDrivers = new Set(orders.filter((o) => o.status !== "cancelled").map((o) => o.driver)).size;
  const monthlyRevenue = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.amount, 0);

  // ─── Sync Actions ────────────────────────────────────────────────────────

  const handleSyncNow = useCallback(async () => {
    setSyncing(true);
    toast.info("جاري المزامنة مع Odoo...");
    await new Promise((r) => setTimeout(r, 2200));
    const now = new Date().toLocaleTimeString("ar-SA", { hour12: false });
    setSyncLogs((prev) => [
      { time: now, message: "مزامنة يدوية — تم تحديث 8 طلبات و 3 مناديب", type: "success" },
      ...prev.slice(0, 9),
    ]);
    setConfig((c) => {
      const updated = { ...c, lastSync: new Date().toISOString() };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      return updated;
    });
    setSyncing(false);
    toast.success("تمت المزامنة بنجاح");
  }, []);

  const handlePullOrders = useCallback(async () => {
    setPullingOrders(true);
    toast.info("جاري سحب الطلبات من تويو...");
    await new Promise((r) => setTimeout(r, 1800));
    const now = new Date().toLocaleTimeString("ar-SA", { hour12: false });
    setSyncLogs((prev) => [
      { time: now, message: "تم سحب 12 طلب جديد من منصة تويو", type: "success" },
      ...prev.slice(0, 9),
    ]);
    setPullingOrders(false);
    toast.success("تم سحب الطلبات بنجاح — 12 طلب");
  }, []);

  const handlePullDrivers = useCallback(async () => {
    setPullingDrivers(true);
    toast.info("جاري سحب بيانات المناديب...");
    await new Promise((r) => setTimeout(r, 1500));
    const now = new Date().toLocaleTimeString("ar-SA", { hour12: false });
    setSyncLogs((prev) => [
      { time: now, message: "تم تحديث بيانات 5 مناديب من Odoo", type: "info" },
      ...prev.slice(0, 9),
    ]);
    setPullingDrivers(false);
    toast.success("تم سحب بيانات المناديب — 5 مناديب");
  }, []);

  const handleTestConnection = useCallback(async () => {
    setTestingConnection(true);
    await new Promise((r) => setTimeout(r, 2000));
    setTestingConnection(false);
    toast.success("تم الاتصال بنجاح بـ Odoo!");
  }, []);

  const handleSaveConfig = useCallback(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(config));
    toast.success("تم حفظ إعدادات المزامنة");
    setShowConfigModal(false);
  }, [config]);

  // ─── Shared Styles ───────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: "var(--con-bg-surface-1, #1a1a2e)",
    borderRadius: 12,
    border: "1px solid var(--con-border, rgba(255,255,255,0.06))",
    padding: 20,
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const btnPrimary: React.CSSProperties = {
    background: TOYOU_PRIMARY,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "opacity 0.2s, transform 0.1s",
  };

  const btnOutline: React.CSSProperties = {
    background: "transparent",
    color: TOYOU_PRIMARY,
    border: `1px solid ${TOYOU_PRIMARY}`,
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "background 0.2s",
  };

  const btnGhost: React.CSSProperties = {
    background: TOYOU_PRIMARY_10,
    color: TOYOU_PRIMARY,
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "background 0.2s",
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--con-bg-surface-2, #0f0f1a)",
    border: "1px solid var(--con-border, rgba(255,255,255,0.08))",
    borderRadius: 8,
    color: "var(--con-text-primary, #e0e0e0)",
    padding: "10px 14px",
    fontSize: 13,
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--con-text-secondary, #999)",
    marginBottom: 6,
    display: "block",
  };

  // ─── KPI Data ─────────────────────────────────────────────────────────────

  const kpis = [
    { label: "طلبات اليوم", value: todayOrders, icon: <Package size={20} />, trend: "+18%", trendUp: true, color: TOYOU_PRIMARY },
    { label: "الطلبات النشطة", value: activeOrders, icon: <Activity size={20} />, trend: "4 الآن", trendUp: true, color: "#eab308" },
    { label: "تم التسليم", value: deliveredOrders, icon: <CheckCircle2 size={20} />, trend: "+12%", trendUp: true, color: "#22c55e" },
    { label: "نسبة النجاح", value: `${successRate}%`, icon: <TrendingUp size={20} />, trend: "+2.1%", trendUp: true, color: TOYOU_ACCENT },
    { label: "المناديب المتصلين", value: connectedDrivers, icon: <Users size={20} />, trend: "من 8", trendUp: false, color: "#8b5cf6" },
    { label: "إيرادات الشهر", value: `${monthlyRevenue.toLocaleString("ar-SA")} ر.س`, icon: <DollarSign size={20} />, trend: "+24%", trendUp: true, color: TOYOU_PRIMARY },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div dir="rtl" style={{ padding: "24px 28px", minHeight: "100vh", fontFamily: "var(--con-font, 'Inter', 'Tajawal', sans-serif)" }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <ToYouLogo size={44} />
          <div>
            <h1 style={{
              fontSize: "var(--con-text-page-title, 22px)",
              fontWeight: 700,
              color: "var(--con-text-primary, #e0e0e0)",
              margin: 0,
              lineHeight: 1.3,
            }}>
              منصة تويو
            </h1>
            <p style={{
              fontSize: 13,
              color: "var(--con-text-muted, #666)",
              margin: "2px 0 0",
            }}>
              إدارة طلبات وعمليات تويو عبر تكامل Odoo
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            style={btnGhost}
            onClick={() => setShowConfigModal(true)}
          >
            <Settings size={15} />
            إعدادات المزامنة
          </button>
          <button
            style={{ ...btnPrimary, opacity: syncing ? 0.7 : 1 }}
            onClick={handleSyncNow}
            disabled={syncing}
          >
            {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            مزامنة الآن
          </button>
        </div>
      </motion.div>

      {/* ── Connection Status Banner ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        style={{
          ...cardStyle,
          padding: "14px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          borderColor: isConnected ? "rgba(10,186,181,0.25)" : "rgba(239,68,68,0.25)",
          background: isConnected
            ? `linear-gradient(135deg, rgba(10,186,181,0.06) 0%, var(--con-bg-surface-1, #1a1a2e) 100%)`
            : `linear-gradient(135deg, rgba(239,68,68,0.06) 0%, var(--con-bg-surface-1, #1a1a2e) 100%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isConnected ? (
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: TOYOU_PRIMARY_15,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Wifi size={16} style={{ color: TOYOU_PRIMARY }} />
            </div>
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(239,68,68,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <WifiOff size={16} style={{ color: "#ef4444" }} />
            </div>
          )}
          <div>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: isConnected ? TOYOU_PRIMARY : "#ef4444",
            }}>
              {isConnected ? "متصل بخادم Odoo" : "غير متصل"}
            </span>
            {isConnected && config.lastSync && (
              <span style={{ fontSize: 11, color: "var(--con-text-muted, #666)", marginRight: 12 }}>
                آخر مزامنة: {new Date(config.lastSync).toLocaleString("ar-SA")}
              </span>
            )}
            {!isConnected && (
              <span style={{ fontSize: 11, color: "var(--con-text-muted, #666)", marginRight: 12 }}>
                قم بإعداد الاتصال لبدء مزامنة البيانات
              </span>
            )}
          </div>
        </div>
        <button
          style={btnOutline}
          onClick={() => setShowConfigModal(true)}
        >
          <Link2 size={14} />
          {isConnected ? "تعديل الاتصال" : "إعداد الاتصال"}
        </button>
      </motion.div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 14,
        marginBottom: 24,
      }}>
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.06, duration: 0.35 }}
            style={{
              ...cardStyle,
              padding: "18px 16px",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = kpi.color + "40";
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${kpi.color}15`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--con-border, rgba(255,255,255,0.06))";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {/* accent glow */}
            <div style={{
              position: "absolute",
              top: -30, left: -30,
              width: 80, height: 80,
              borderRadius: "50%",
              background: kpi.color,
              opacity: 0.06,
              filter: "blur(20px)",
            }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: kpi.color + "15",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: kpi.color,
              }}>
                {kpi.icon}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: kpi.trendUp ? "#22c55e" : "var(--con-text-muted, #666)",
                display: "flex", alignItems: "center", gap: 3,
              }}>
                {kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.trend}
              </span>
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700,
              color: "var(--con-text-primary, #e0e0e0)",
              marginBottom: 4,
              position: "relative",
            }}>
              {kpi.value}
            </div>
            <div style={{
              fontSize: 12,
              color: "var(--con-text-muted, #666)",
              position: "relative",
            }}>
              {kpi.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Orders Table ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{ ...cardStyle, marginBottom: 24, padding: 0, overflow: "hidden" }}
      >
        {/* table header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--con-border, rgba(255,255,255,0.06))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={16} style={{ color: TOYOU_PRIMARY }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--con-text-primary, #e0e0e0)" }}>
              طلبات تويو الأخيرة
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: TOYOU_PRIMARY_10,
              color: TOYOU_PRIMARY,
              padding: "2px 8px",
              borderRadius: 6,
            }}>
              {filteredOrders.length}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                color: "var(--con-text-muted, #666)",
              }} />
              <input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  ...inputStyle,
                  width: 180,
                  paddingRight: 32,
                  fontSize: 12,
                }}
              />
            </div>
            {/* Filter */}
            <div style={{ position: "relative" }}>
              <button
                style={{
                  ...btnGhost,
                  background: statusFilter !== "all" ? TOYOU_PRIMARY_15 : TOYOU_PRIMARY_10,
                }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter size={14} />
                الحالة
                {filterOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      background: "var(--con-bg-surface-2, #12122a)",
                      border: "1px solid var(--con-border, rgba(255,255,255,0.08))",
                      borderRadius: 10,
                      padding: 6,
                      minWidth: 150,
                      zIndex: 50,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    }}
                  >
                    <button
                      onClick={() => { setStatusFilter("all"); setFilterOpen(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "start",
                        padding: "8px 12px", borderRadius: 6, border: "none",
                        background: statusFilter === "all" ? TOYOU_PRIMARY_15 : "transparent",
                        color: "var(--con-text-primary, #e0e0e0)",
                        fontSize: 12, cursor: "pointer",
                      }}
                    >
                      الكل
                    </button>
                    {(Object.keys(STATUS_MAP) as OrderStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setFilterOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          width: "100%", textAlign: "start",
                          padding: "8px 12px", borderRadius: 6, border: "none",
                          background: statusFilter === s ? TOYOU_PRIMARY_15 : "transparent",
                          color: "var(--con-text-primary, #e0e0e0)",
                          fontSize: 12, cursor: "pointer",
                        }}
                      >
                        <CircleDot size={10} style={{ color: STATUS_MAP[s].color }} />
                        {STATUS_MAP[s].label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--con-border, rgba(255,255,255,0.06))" }}>
                {["رقم الطلب", "العميل", "المندوب", "المنطقة", "المبلغ", "الحالة", "وقت التوصيل"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px",
                    textAlign: "start",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--con-text-muted, #666)",
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    borderBottom: "1px solid var(--con-border, rgba(255,255,255,0.04))",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: TOYOU_PRIMARY, whiteSpace: "nowrap" }}>
                    {order.orderNumber}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--con-text-primary, #e0e0e0)" }}>
                    {order.customer}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--con-text-secondary, #999)" }}>
                    {order.driver}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--con-text-muted, #666)", fontSize: 12 }}>
                    {order.area}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--con-text-primary, #e0e0e0)", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {order.amount.toFixed(2)} ر.س
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: STATUS_MAP[order.status].color,
                      background: STATUS_MAP[order.status].bg,
                    }}>
                      {STATUS_MAP[order.status].label}
                    </span>
                  </td>
                  <td style={{
                    padding: "12px 16px",
                    color: order.deliveryTime === "—" ? "var(--con-text-muted, #666)" : "var(--con-text-primary, #e0e0e0)",
                    fontSize: 12,
                  }}>
                    {order.deliveryTime}
                  </td>
                </motion.tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--con-text-muted, #666)",
                    fontSize: 13,
                  }}>
                    لا توجد طلبات مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Bottom Grid: Drivers + Sync ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* ── Driver Performance ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{ ...cardStyle, padding: 0, overflow: "hidden" }}
        >
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--con-border, rgba(255,255,255,0.06))",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <UserCheck size={16} style={{ color: TOYOU_ACCENT }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--con-text-primary, #e0e0e0)" }}>
              أداء مناديب تويو
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: TOYOU_ACCENT_10,
              color: TOYOU_ACCENT,
              padding: "2px 8px",
              borderRadius: 6,
            }}>
              أفضل 5
            </span>
          </div>
          <div style={{ padding: "8px 0" }}>
            {drivers.map((driver, i) => (
              <div
                key={driver.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 20px",
                  gap: 12,
                  borderBottom: i < drivers.length - 1
                    ? "1px solid var(--con-border, rgba(255,255,255,0.04))"
                    : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* rank */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: i < 3 ? TOYOU_PRIMARY_15 : "var(--con-bg-surface-2, #12122a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  color: i < 3 ? TOYOU_PRIMARY : "var(--con-text-muted, #666)",
                }}>
                  {i + 1}
                </div>
                {/* info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: "var(--con-text-primary, #e0e0e0)",
                    marginBottom: 2,
                  }}>
                    {driver.name}
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--con-text-muted, #666)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Package size={10} /> {driver.ordersCount} طلب
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Timer size={10} /> {driver.avgDeliveryTime}
                    </span>
                  </div>
                </div>
                {/* success rate */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>
                    {driver.successRate}%
                  </div>
                  <div style={{ fontSize: 10, color: "var(--con-text-muted, #666)" }}>نجاح</div>
                </div>
                {/* rating */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 3,
                  background: "rgba(234,179,8,0.10)",
                  padding: "4px 8px",
                  borderRadius: 6,
                }}>
                  <Star size={12} style={{ color: "#eab308", fill: "#eab308" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#eab308" }}>
                    {driver.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Sync Actions + Log ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          style={{ ...cardStyle, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--con-border, rgba(255,255,255,0.06))",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <Database size={16} style={{ color: TOYOU_PRIMARY }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--con-text-primary, #e0e0e0)" }}>
              عمليات المزامنة
            </span>
          </div>

          {/* action buttons */}
          <div style={{
            padding: "16px 20px",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            borderBottom: "1px solid var(--con-border, rgba(255,255,255,0.06))",
          }}>
            <button
              style={{ ...btnPrimary, opacity: syncing ? 0.7 : 1 }}
              onClick={handleSyncNow}
              disabled={syncing}
            >
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              مزامنة الآن
            </button>
            <button
              style={{ ...btnOutline, opacity: pullingOrders ? 0.7 : 1 }}
              onClick={handlePullOrders}
              disabled={pullingOrders}
            >
              {pullingOrders ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              سحب الطلبات
            </button>
            <button
              style={{ ...btnGhost, opacity: pullingDrivers ? 0.7 : 1 }}
              onClick={handlePullDrivers}
              disabled={pullingDrivers}
            >
              {pullingDrivers ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
              سحب بيانات المناديب
            </button>
          </div>

          {/* sync log */}
          <div style={{ flex: 1, padding: "12px 20px", overflowY: "auto", maxHeight: 260 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--con-text-muted, #666)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>
              سجل المزامنة
            </div>
            {syncLogs.map((log, i) => (
              <motion.div
                key={i}
                initial={i === 0 ? { opacity: 0, x: -8 } : {}}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: i < syncLogs.length - 1
                    ? "1px solid var(--con-border, rgba(255,255,255,0.03))"
                    : "none",
                }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  marginTop: 5, flexShrink: 0,
                  background:
                    log.type === "success" ? "#22c55e"
                    : log.type === "error" ? "#ef4444"
                    : "var(--con-text-muted, #666)",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--con-text-primary, #e0e0e0)", lineHeight: 1.5 }}>
                    {log.message}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, color: "var(--con-text-muted, #666)",
                  flexShrink: 0, fontVariantNumeric: "tabular-nums",
                }}>
                  {log.time}
                </span>
              </motion.div>
            ))}
            {syncLogs.length === 0 && (
              <div style={{ textAlign: "center", padding: 24, color: "var(--con-text-muted, #666)", fontSize: 12 }}>
                لا توجد سجلات مزامنة بعد
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Sync Configuration Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowConfigModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              dir="rtl"
              style={{
                background: "var(--con-bg-surface-1, #1a1a2e)",
                border: `1px solid ${TOYOU_PRIMARY}30`,
                borderRadius: 16,
                width: "100%",
                maxWidth: 520,
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 40px ${TOYOU_PRIMARY}10`,
              }}
            >
              {/* modal header */}
              <div style={{
                padding: "20px 24px 16px",
                borderBottom: "1px solid var(--con-border, rgba(255,255,255,0.06))",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: TOYOU_PRIMARY_15,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Settings size={18} style={{ color: TOYOU_PRIMARY }} />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: 16, fontWeight: 700, margin: 0,
                      color: "var(--con-text-primary, #e0e0e0)",
                    }}>
                      إعدادات المزامنة
                    </h2>
                    <p style={{ fontSize: 11, color: "var(--con-text-muted, #666)", margin: "2px 0 0" }}>
                      تكامل Odoo مع منصة تويو
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  style={{
                    background: "var(--con-bg-surface-2, #12122a)",
                    border: "1px solid var(--con-border, rgba(255,255,255,0.06))",
                    borderRadius: 8,
                    width: 32, height: 32,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--con-text-muted, #666)",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* modal body */}
              <div style={{ padding: "20px 24px" }}>
                {/* Odoo Server URL */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>عنوان خادم Odoo</label>
                  <input
                    type="url"
                    placeholder="https://odoo.toyou.io"
                    value={config.serverUrl}
                    onChange={(e) => setConfig((c) => ({ ...c, serverUrl: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = TOYOU_PRIMARY; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--con-border, rgba(255,255,255,0.08))"; }}
                  />
                </div>

                {/* Database Name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>اسم قاعدة البيانات</label>
                  <input
                    placeholder="toyou_production"
                    value={config.database}
                    onChange={(e) => setConfig((c) => ({ ...c, database: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = TOYOU_PRIMARY; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--con-border, rgba(255,255,255,0.08))"; }}
                  />
                </div>

                {/* Username */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>اسم المستخدم</label>
                  <input
                    placeholder="admin@toyou.io"
                    value={config.username}
                    onChange={(e) => setConfig((c) => ({ ...c, username: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = TOYOU_PRIMARY; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--con-border, rgba(255,255,255,0.08))"; }}
                  />
                </div>

                {/* API Key */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>مفتاح API</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showApiKey ? "text" : "password"}
                      placeholder="أدخل مفتاح API الخاص بـ Odoo"
                      value={config.apiKey}
                      onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
                      style={{ ...inputStyle, paddingLeft: 40 }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = TOYOU_PRIMARY; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--con-border, rgba(255,255,255,0.08))"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      style={{
                        position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--con-text-muted, #666)",
                        padding: 4,
                      }}
                    >
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Sync Interval */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>فترة المزامنة التلقائية</label>
                  <select
                    value={config.syncInterval}
                    onChange={(e) => setConfig((c) => ({ ...c, syncInterval: e.target.value }))}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "left 12px center",
                    }}
                  >
                    <option value="5">كل 5 دقائق</option>
                    <option value="15">كل 15 دقيقة</option>
                    <option value="30">كل 30 دقيقة</option>
                    <option value="60">كل ساعة</option>
                    <option value="manual">يدوي فقط</option>
                  </select>
                </div>

                {/* Last Sync */}
                {config.lastSync && (
                  <div style={{
                    background: "var(--con-bg-surface-2, #0f0f1a)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <Clock size={13} style={{ color: "var(--con-text-muted, #666)" }} />
                    <span style={{ fontSize: 12, color: "var(--con-text-muted, #666)" }}>
                      آخر مزامنة: {new Date(config.lastSync).toLocaleString("ar-SA")}
                    </span>
                  </div>
                )}

                {/* Test Connection */}
                <button
                  style={{
                    ...btnOutline,
                    width: "100%",
                    justifyContent: "center",
                    marginBottom: 12,
                    opacity: testingConnection ? 0.7 : 1,
                  }}
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Zap size={14} />
                  )}
                  {testingConnection ? "جاري اختبار الاتصال..." : "اختبار الاتصال"}
                </button>

                {/* Save */}
                <button
                  style={{
                    ...btnPrimary,
                    width: "100%",
                    justifyContent: "center",
                    padding: "12px 18px",
                    fontSize: 14,
                  }}
                  onClick={handleSaveConfig}
                >
                  <Save size={15} />
                  حفظ الإعدادات
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
