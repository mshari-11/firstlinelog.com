import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import {
  Truck, Search, Download, Users, UserCheck, UserX, Wifi, WifiOff,
  Activity, CheckCircle2, XCircle, AlertTriangle, Loader2,
  ChevronLeft, ChevronRight, Filter, Link2, Unlink2, Percent,
  Clock, DatabaseZap, Key, RefreshCw, Eye, X, Bike, Car, Phone,
  IdCard, Hash,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

/* ═══════════════════════════════════════════════════════════════════
   Constants & Types
   ═══════════════════════════════════════════════════════════════════ */

const PROXY_URL =
  "https://djebhztfewjfyyoortvv.supabase.co/functions/v1/jahez-proxy";
const SANED_TOKEN_KEY = "fll_saned_token";
const PAGE_SIZE = 100;

const JAHEZ_RED = "#e53e3e";
const ACCENT_GREEN = "#38a169";
const ACCENT_GRAY = "#718096";
const SANED_DARK_BLUE = "#1a365d";

/* ─── Types ──────────────────────────────────────────────────── */

interface SanedStats {
  activeDrivers: number;
  inactiveDrivers: number;
  onlineDrivers: number;
  offlineDrivers: number;
  activePercentage: number;
  inactivePercentage: number;
  onlinePercentage: number;
  offlinePercentage: number;
}

interface RawDriver {
  driverID?: number;
  driverId?: number;
  idNumber?: string;
  driverName?: string;
  phoneNumber?: string;
  driverStatus?: boolean;
  availability?: boolean;
  vehicleType?: number;
}

interface MappedDriver {
  driverId: number;
  iqamaNumber: string;
  driverName: string;
  phoneNumber: string;
  driverStatus: "Active" | "Inactive";
  availability: "Online" | "Offline";
  vehicleType: number;
}

interface ProfileInfo {
  providerName?: string;
  providerId?: number;
  providerStatus?: string;
  [key: string]: unknown;
}

type SyncTarget = "drivers" | "stats" | "all";

/* ═══════════════════════════════════════════════════════════════════
   Token Helpers
   ═══════════════════════════════════════════════════════════════════ */

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return payload.exp * 1000 < Date.now();
}

function getSanedToken(): string | null {
  const token = localStorage.getItem(SANED_TOKEN_KEY);
  if (!token) return null;
  if (isTokenExpired(token)) {
    localStorage.removeItem(SANED_TOKEN_KEY);
    return null;
  }
  return token;
}

async function saveSanedToken(token: string) {
  localStorage.setItem(SANED_TOKEN_KEY, token);
  // Also save to Supabase for Lambda auto-sync
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiresAt = payload.exp ? new Date(payload.exp * 1000).toISOString() : null;
    const { error } = await supabase?.rpc("save_saned_token", { p_token: token, p_expires_at: expiresAt }) ?? {};
    if (error) console.error("[saveSanedToken] Supabase error:", error.message);
  } catch (err) {
    console.error("[saveSanedToken] Failed:", err);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Proxy Fetch — single gateway to Supabase Edge Function
   ═══════════════════════════════════════════════════════════════════ */

async function proxyFetch(
  action: string,
  token: string,
  extra: Record<string, unknown> = {},
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, token, ...extra }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[jahez-proxy] ${action} HTTP ${res.status}:`, text);
      return null;
    }
    const json = await res.json();
    if (json.statusCode && json.statusCode !== 200) {
      console.error(`[jahez-proxy] ${action} statusCode ${json.statusCode}:`, json);
      return null;
    }
    return json;
  } catch (err) {
    console.error(`[jahez-proxy] ${action} exception:`, err);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Vehicle Helpers
   ═══════════════════════════════════════════════════════════════════ */

function vehicleLabel(type: number): string {
  switch (type) {
    case 1:
      return "شاحنة";
    case 2:
      return "دراجة";
    case 3:
      return "سيارة";
    default:
      return "غير محدد";
  }
}

function VehicleIcon({ type, size = 16 }: { type: number; size?: number }) {
  switch (type) {
    case 1:
      return <Truck size={size} />;
    case 2:
      return <Bike size={size} />;
    case 3:
      return <Car size={size} />;
    default:
      return <Truck size={size} />;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Style Constants (inline, CSS‑variable themed, dark, RTL)
   ═══════════════════════════════════════════════════════════════════ */

const colors = {
  bg: "var(--con-bg, #0f1117)",
  card: "var(--con-card, #1a1d27)",
  cardHover: "var(--con-card-hover, #22263a)",
  border: "var(--con-border, #2d3148)",
  text: "var(--con-text, #e2e8f0)",
  textMuted: "var(--con-text-muted, #94a3b8)",
};

const S = {
  /* ── Page ── */
  page: {
    direction: "rtl" as const,
    minHeight: "100vh",
    background: colors.bg,
    color: colors.text,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "24px 28px",
  },

  /* ── Header ── */
  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "6px",
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: "12px",
    background: `linear-gradient(135deg, ${JAHEZ_RED}, #fc8181)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "26px",
    fontWeight: 700 as const,
    color: colors.text,
    margin: 0,
  },
  headerSub: {
    fontSize: "13px",
    color: colors.textMuted,
    margin: "0 0 22px 0",
    lineHeight: 1.6,
  },

  /* ── Banner ── */
  banner: (connected: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 20px",
    borderRadius: "10px",
    marginBottom: "20px",
    background: connected
      ? "linear-gradient(135deg, rgba(56,161,105,0.15), rgba(56,161,105,0.05))"
      : "linear-gradient(135deg, rgba(229,62,62,0.15), rgba(229,62,62,0.05))",
    border: `1px solid ${
      connected ? "rgba(56,161,105,0.35)" : "rgba(229,62,62,0.35)"
    }`,
  }),
  bannerText: { fontSize: "14px", fontWeight: 600 as const, color: colors.text },
  bannerDetail: { fontSize: "12px", color: colors.textMuted, marginTop: "2px" },

  /* ── Token paste ── */
  tokenBox: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "22px",
  },
  tokenInput: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.text,
    fontSize: "13px",
    outline: "none",
    direction: "ltr" as const,
    fontFamily: "monospace",
  },

  /* ── Buttons ── */
  btn: (bg: string, small = false) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: small ? "7px 14px" : "10px 20px",
      borderRadius: "8px",
      border: "none",
      background: bg,
      color: "#fff",
      fontSize: small ? "12px" : "13px",
      fontWeight: 600 as const,
      cursor: "pointer",
      transition: "opacity 0.2s",
      whiteSpace: "nowrap" as const,
    }) as React.CSSProperties,

  /* ── Sync bar ── */
  syncBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "22px",
    flexWrap: "wrap" as const,
  },
  progressBar: {
    height: "6px",
    borderRadius: "3px",
    background: colors.border,
    overflow: "hidden" as const,
    marginTop: "6px",
    width: "100%",
  },
  progressFill: (pct: number) => ({
    height: "100%",
    width: `${pct}%`,
    background: `linear-gradient(90deg, ${JAHEZ_RED}, #fc8181)`,
    borderRadius: "3px",
    transition: "width 0.3s ease",
  }),

  /* ── KPI grid ── */
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  kpiCard: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    transition: "border-color 0.2s, transform 0.15s",
  },
  kpiLabel: { fontSize: "12px", color: colors.textMuted, fontWeight: 500 as const },
  kpiValue: (c: string) =>
    ({ fontSize: "28px", fontWeight: 700 as const, color: c, margin: 0, lineHeight: 1.2 }),

  /* ── Charts ── */
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  chartCard: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    padding: "20px",
  },
  chartTitle: {
    fontSize: "14px",
    fontWeight: 600 as const,
    color: colors.text,
    marginBottom: "10px",
  },

  /* ── Table ── */
  tableWrap: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    overflow: "hidden" as const,
    marginBottom: "24px",
  },
  tableToolbar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 20px",
    flexWrap: "wrap" as const,
    borderBottom: `1px solid ${colors.border}`,
  },
  searchInput: {
    flex: 1,
    minWidth: "200px",
    padding: "9px 14px 9px 14px",
    paddingRight: "36px",
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.text,
    fontSize: "13px",
    outline: "none",
  },
  select: {
    padding: "9px 12px",
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.text,
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "13px",
  },
  th: {
    padding: "12px 16px",
    textAlign: "right" as const,
    fontSize: "12px",
    fontWeight: 600 as const,
    color: colors.textMuted,
    borderBottom: `1px solid ${colors.border}`,
    background: "rgba(0,0,0,0.2)",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "11px 16px",
    textAlign: "right" as const,
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: "nowrap" as const,
  },
  trHover: { cursor: "pointer", transition: "background 0.15s" },

  /* ── Badges ── */
  badge: (bg: string, fg: string) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 600 as const,
      background: bg,
      color: fg,
    }) as React.CSSProperties,

  /* ── Pagination ── */
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "16px 20px",
    borderTop: `1px solid ${colors.border}`,
    flexWrap: "wrap" as const,
  },
  pageBtn: (active: boolean) => ({
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    border: active ? `2px solid ${JAHEZ_RED}` : `1px solid ${colors.border}`,
    background: active ? "rgba(229,62,62,0.15)" : "transparent",
    color: active ? JAHEZ_RED : colors.textMuted,
    fontSize: "13px",
    fontWeight: active ? (700 as const) : (500 as const),
    cursor: "pointer",
  }),

  /* ── Side panel ── */
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 999,
  },
  sidePanel: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "430px",
    maxWidth: "92vw",
    height: "100vh",
    background: colors.card,
    borderRight: `1px solid ${colors.border}`,
    zIndex: 1000,
    overflowY: "auto" as const,
    padding: "24px",
    direction: "rtl" as const,
  },

  /* ── Detail rows ── */
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "13px 0",
    borderBottom: `1px solid ${colors.border}`,
  },
  detailLabel: { fontSize: "12px", color: colors.textMuted, fontWeight: 500 as const },
  detailValue: { fontSize: "14px", fontWeight: 600 as const, color: colors.text },
};

/* ═══════════════════════════════════════════════════════════════════
   Detail Row Sub-component
   ═══════════════════════════════════════════════════════════════════ */

function DetailRow({
  icon,
  label,
  value,
  valueColor,
  ltr,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  ltr?: boolean;
}) {
  return (
    <div style={S.detailRow}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {icon}
        <span style={S.detailLabel}>{label}</span>
      </div>
      <span
        style={{
          ...S.detailValue,
          ...(valueColor ? { color: valueColor } : {}),
          ...(ltr ? { direction: "ltr" as const, fontFamily: "monospace" } : {}),
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Donut Center Label
   ═══════════════════════════════════════════════════════════════════ */

function DonutCenterLabel({ total, label }: { total: number; label: string }) {
  return (
    <g>
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: "22px", fontWeight: 700, fill: colors.text }}
      >
        {total.toLocaleString("ar-SA")}
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: "11px", fill: colors.textMuted }}
      >
        {label}
      </text>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Chart Legend
   ═══════════════════════════════════════════════════════════════════ */

function ChartLegend({
  items,
}: {
  items: { name: string; value: number; color: string }[];
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "24px",
        marginTop: "10px",
      }}
    >
      {items.map((item) => (
        <div
          key={item.name}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: item.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "12px", color: colors.textMuted }}>
            {item.name}: {item.value.toLocaleString("ar-SA")}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function JahezPlatform() {
  /* ─── State ─── */
  const [token, setToken] = useState<string | null>(getSanedToken);
  const [tokenInput, setTokenInput] = useState("");
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [stats, setStats] = useState<SanedStats | null>(null);
  const [drivers, setDrivers] = useState<MappedDriver[]>([]);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [syncing, setSyncing] = useState<SyncTarget | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "Active" | "Inactive">(
    "",
  );
  const [filterAvail, setFilterAvail] = useState<"" | "Online" | "Offline">(
    "",
  );
  const [selectedDriver, setSelectedDriver] = useState<MappedDriver | null>(
    null,
  );
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  // Extra info sections
  const [insights, setInsights] = useState<Record<string, unknown> | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<Record<string, unknown> | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<Array<{ id: number; name: string }>>([]);
  // Per-driver payment report (loaded on driver detail open)
  const [driverPayments, setDriverPayments] = useState<Record<string, unknown> | null>(null);
  const [driverPaymentsLoading, setDriverPaymentsLoading] = useState(false);
  // Accountant report with date filter
  const [accountantReport, setAccountantReport] = useState<Record<string, unknown> | null>(null);
  const [accountantLoading, setAccountantLoading] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // first day of current month
    return d.toISOString().slice(0, 10);
  });
  const [reportEndDate, setReportEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const hasToken = !!token;

  /* ─── Auto-capture token from URL hash ─── */
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("saned_token=")) return;
    const parts = hash.replace("#", "").split("&");
    for (const part of parts) {
      const [key, val] = part.split("=");
      if (key === "saned_token" && val) {
        saveSanedToken(val);
        setToken(val);
        window.location.hash = "";
        toast.success("تم ربط توكن Saned بنجاح");
        break;
      }
    }
  }, []);

  /* ─── Map raw drivers ─── */
  const mapDrivers = useCallback(
    (rawDrivers: RawDriver[]): MappedDriver[] =>
      rawDrivers.map((d) => ({
        driverId: d.driverID || d.driverId || 0,
        iqamaNumber: d.idNumber || "",
        driverName: d.driverName || "",
        phoneNumber: d.phoneNumber || "",
        driverStatus: d.driverStatus === true ? "Active" : "Inactive",
        availability: d.availability === true ? "Online" : "Offline",
        vehicleType: d.vehicleType || 1,
      })),
    [],
  );

  /* ─── Load Profile ─── */
  const loadProfile = useCallback(async () => {
    if (!token) return;
    const raw = await proxyFetch("profile", token);
    if (!raw) return;
    const data = (raw.data as ProfileInfo) || (raw as unknown as ProfileInfo);
    setProfile(data);
  }, [token]);

  /* ─── Load Stats ─── */
  const loadStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const raw = await proxyFetch("stats", token);
      if (raw) {
        const data = (raw.data || raw) as unknown as SanedStats;
        setStats(data);
      } else {
        toast.error("فشل تحميل الإحصائيات");
      }
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  /* ─── Load Drivers (paginated) ─── */
  const loadDrivers = useCallback(
    async (page: number) => {
      if (!token) return;
      setLoading(true);
      try {
        const raw = await proxyFetch("drivers", token, {
          page,
          size: PAGE_SIZE,
        });
        if (!raw) {
          toast.error("فشل تحميل بيانات المناديب");
          return;
        }
        const data = raw.data as
          | { currentPage?: number; rowsCount?: number; result?: RawDriver[] }
          | undefined;
        const envelope =
          data ||
          (raw as unknown as {
            currentPage?: number;
            rowsCount?: number;
            result?: RawDriver[];
          });
        const rawDrivers: RawDriver[] = envelope?.result || [];
        const mapped = mapDrivers(rawDrivers);
        setDrivers(mapped);
        setTotalDrivers(envelope?.rowsCount || mapped.length);
        setCurrentPage(envelope?.currentPage || page);
      } finally {
        setLoading(false);
      }
    },
    [token, mapDrivers],
  );

  /* ─── Load Delivery Insights ─── */
  const loadInsights = useCallback(async () => {
    if (!token) return;
    setInsightsLoading(true);
    try {
      const raw = await proxyFetch("delivery-insights", token);
      if (raw) {
        const data = ((raw as any).data || raw) as Record<string, unknown>;
        setInsights(data);
      }
    } catch (e) {
      console.error("[insights]", e);
    } finally {
      setInsightsLoading(false);
    }
  }, [token]);

  /* ─── Load Payment Summary ─── */
  const loadPaymentSummary = useCallback(async () => {
    if (!token) return;
    setPaymentLoading(true);
    try {
      const raw = await proxyFetch("payment-summary", token);
      if (raw) {
        const data = ((raw as any).data || raw) as Record<string, unknown>;
        setPaymentSummary(data);
      }
    } catch (e) {
      console.error("[payment-summary]", e);
    } finally {
      setPaymentLoading(false);
    }
  }, [token]);

  /* ─── Load Accountant Report (date range) ─── */
  const loadAccountantReport = useCallback(async () => {
    if (!token) return;
    setAccountantLoading(true);
    try {
      const raw = await proxyFetch("accountant-report-v2", token, {
        startDate: reportStartDate,
        endDate: reportEndDate,
        page: 1,
        size: 100,
      });
      if (raw) {
        setAccountantReport(raw as Record<string, unknown>);
      } else {
        toast.error("فشل جلب التقرير المحاسبي");
      }
    } catch (e) {
      console.error("[accountant-report]", e);
      toast.error("خطأ في جلب التقرير المحاسبي");
    } finally {
      setAccountantLoading(false);
    }
  }, [token, reportStartDate, reportEndDate]);

  /* ─── Load per-driver payment report ─── */
  const loadDriverPayments = useCallback(
    async (driverId: string) => {
      if (!token || !driverId) return;
      setDriverPaymentsLoading(true);
      setDriverPayments(null);
      try {
        const raw = await proxyFetch("sdp-payment-report", token, {
          driverId,
          page: 1,
          size: 50,
        });
        if (raw) {
          setDriverPayments(raw as Record<string, unknown>);
        }
      } catch (e) {
        console.error("[driver-payments]", e);
      } finally {
        setDriverPaymentsLoading(false);
      }
    },
    [token],
  );

  /* ─── Load Vehicle Types lookup ─── */
  const loadVehicleTypes = useCallback(async () => {
    if (!token) return;
    try {
      const raw = await proxyFetch("vehicle-types", token);
      if (raw) {
        const data = ((raw as any).data || raw) as any;
        const list = data?.result || data?.items || (Array.isArray(data) ? data : []);
        if (Array.isArray(list)) setVehicleTypes(list);
      }
    } catch (e) {
      console.error("[vehicle-types]", e);
    }
  }, [token]);

  /* ─── Initial load on token change ─── */
  useEffect(() => {
    if (!token) return;
    loadProfile();
    loadStats();
    loadInsights();
    loadPaymentSummary();
    loadVehicleTypes();
    loadDrivers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ─── Sync drivers → Supabase (client-side pagination + streaming upsert) ─── */
  const syncDriversToSupabase = useCallback(async () => {
    if (!token) return;
    if (!supabase) { toast.error("Supabase غير متصل"); return; }
    setSyncing("drivers");
    setSyncProgress(0);
    try {
      toast.info("جاري جلب المناديب من Saned صفحة تلو الأخرى...");

      const PAGE_SIZE = 100;
      const MAX_PAGES = 100; // 10,000 drivers cap
      let totalSynced = 0;
      let totalExpected = 0;
      let page = 1;

      while (page <= MAX_PAGES) {
        const raw = await proxyFetch("drivers", token, {
          page,
          size: PAGE_SIZE,
        });

        if (!raw) {
          toast.error(`فشل جلب الصفحة ${page}`);
          break;
        }

        const rawAny = raw as any;
        const inner = rawAny.data || rawAny;
        const drivers: RawDriver[] =
          inner.result || inner.content || inner.drivers ||
          (Array.isArray(inner) ? inner : []);

        if (page === 1) {
          totalExpected =
            inner.rowsCount || inner.totalElements || inner.total || 0;
        }

        if (!Array.isArray(drivers) || drivers.length === 0) break;

        const batch = drivers.map((d) => ({
          platform: "jahez",
          external_id: String(d.driverID || d.driverId || ""),
          iqama_number: d.idNumber || "",
          name: d.driverName || "",
          phone: d.phoneNumber || "",
          status: d.driverStatus === true ? "Active" : "Inactive",
          availability: d.availability === true ? "Online" : "Offline",
          vehicle_type: String(d.vehicleType || 1),
          synced_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("jahez_drivers")
          .upsert(batch, { onConflict: "external_id" });

        if (error) {
          console.error("Supabase upsert batch error:", error);
          toast.error(`خطأ في حفظ الصفحة ${page}`);
          break;
        }

        totalSynced += batch.length;
        if (totalExpected > 0) {
          setSyncProgress(Math.min(100, Math.round((totalSynced / totalExpected) * 100)));
        } else {
          setSyncProgress(Math.min(95, page * 3));
        }

        if (drivers.length < PAGE_SIZE) break;
        page++;
      }

      setSyncProgress(100);
      toast.success(
        `تمت المزامنة: ${totalSynced.toLocaleString("ar-SA")} سائق${
          totalExpected ? ` من أصل ${totalExpected.toLocaleString("ar-SA")}` : ""
        }`,
      );
    } catch (err) {
      console.error("Sync exception:", err);
      toast.error("حدث خطأ أثناء المزامنة");
    } finally {
      setSyncing(null);
      setSyncProgress(0);
    }
  }, [token]);

  /* ─── Sync All ─── */
  const syncAll = useCallback(async () => {
    setSyncing("all");
    setSyncProgress(0);
    try {
      await loadStats();
      setSyncProgress(25);
      await syncDriversToSupabase();
      setSyncProgress(90);
      await loadDrivers(1);
      setSyncProgress(100);
      toast.success("اكتملت المزامنة الشاملة");
    } catch {
      toast.error("خطأ في المزامنة الشاملة");
    } finally {
      setSyncing(null);
      setSyncProgress(0);
    }
  }, [loadStats, syncDriversToSupabase, loadDrivers]);

  /* ─── Token paste submit ─── */
  const handleTokenSubmit = useCallback(() => {
    const cleaned = tokenInput.trim();
    if (!cleaned) {
      toast.error("الرجاء لصق التوكن أولاً");
      return;
    }
    if (isTokenExpired(cleaned)) {
      toast.error("التوكن منتهي الصلاحية — أعد تسجيل الدخول إلى Saned");
      return;
    }
    saveSanedToken(cleaned);
    setToken(cleaned);
    setTokenInput("");
    toast.success("تم ربط توكن Saned بنجاح");
  }, [tokenInput]);

  /* ─── Disconnect ─── */
  const handleDisconnect = useCallback(() => {
    localStorage.removeItem(SANED_TOKEN_KEY);
    setToken(null);
    setProfile(null);
    setStats(null);
    setDrivers([]);
    setTotalDrivers(0);
    setCurrentPage(1);
    toast.info("تم فصل اتصال Saned");
  }, []);

  /* ─── Filtered drivers (client-side search/filter on current page) ─── */
  const filteredDrivers = useMemo(() => {
    let result = drivers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.driverName.toLowerCase().includes(q) ||
          d.phoneNumber.includes(q) ||
          String(d.driverId).includes(q) ||
          d.iqamaNumber.includes(q),
      );
    }
    if (filterStatus) {
      result = result.filter((d) => d.driverStatus === filterStatus);
    }
    if (filterAvail) {
      result = result.filter((d) => d.availability === filterAvail);
    }
    return result;
  }, [drivers, searchQuery, filterStatus, filterAvail]);

  /* ─── Pagination helpers ─── */
  const totalPages = Math.max(1, Math.ceil(totalDrivers / PAGE_SIZE));

  const pageNumbers = useMemo(() => {
    const MAX_VISIBLE = 7;
    const pages: number[] = [];
    let start = Math.max(1, currentPage - Math.floor(MAX_VISIBLE / 2));
    let end = start + MAX_VISIBLE - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - MAX_VISIBLE + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) return;
      loadDrivers(page);
    },
    [loadDrivers, totalPages, currentPage],
  );

  /* ─── Excel export ─── */
  const exportExcel = useCallback(() => {
    if (filteredDrivers.length === 0) {
      toast.warning("لا يوجد بيانات للتصدير");
      return;
    }
    const rows = filteredDrivers.map((d) => ({
      "هوية السائق": d.driverId,
      "رقم الإقامة": d.iqamaNumber,
      "اسم السائق": d.driverName,
      "رقم التليفون": d.phoneNumber,
      "حالة السائق": d.driverStatus === "Active" ? "نشط" : "غير نشط",
      التوافر: d.availability === "Online" ? "متصل" : "غير متصل",
      "نوع المركبة": vehicleLabel(d.vehicleType),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المناديب");
    XLSX.writeFile(
      wb,
      `jahez_drivers_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    toast.success("تم تصدير الملف بنجاح");
  }, [filteredDrivers]);

  /* ─── Chart data ─── */
  const onlineOfflineData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "متصل", value: stats.onlineDrivers, color: SANED_DARK_BLUE },
      { name: "غير متصل", value: stats.offlineDrivers, color: "#cbd5e0" },
    ];
  }, [stats]);

  const activeInactiveData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "نشط", value: stats.activeDrivers, color: ACCENT_GREEN },
      { name: "غير نشط", value: stats.inactiveDrivers, color: JAHEZ_RED },
    ];
  }, [stats]);

  /* ─── Token expiry for display ─── */
  const tokenExpiry = useMemo(() => {
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== "number") return null;
    const d = new Date(payload.exp * 1000);
    return d.toLocaleString("ar-SA", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }, [token]);

  /* ─── Provider display values ─── */
  const providerName = profile?.providerName || "الخطابول بدوام كامل";
  const providerId = profile?.providerId || 20524;
  const providerStatus = profile?.providerStatus || "Active";

  /* ═══════════════════════════ RENDER ═══════════════════════════ */

  return (
    <div style={S.page}>
      {/* ══════════════════ Header ══════════════════ */}
      <div style={S.header}>
        <div style={S.headerIcon}>
          <Truck size={22} color="#fff" />
        </div>
        <div>
          <h1 style={S.headerTitle}>منصة جاهز — Saned</h1>
        </div>
      </div>
      <p style={S.headerSub}>
        إدارة ومزامنة بيانات المناديب من منصة Saned التابعة لجاهز مع نظام الخط
        الأول اللوجستي
      </p>

      {/* ══════════════════ Connection Banner ══════════════════ */}
      <div style={S.banner(hasToken)}>
        {hasToken ? (
          <CheckCircle2 size={20} color={ACCENT_GREEN} />
        ) : (
          <XCircle size={20} color={JAHEZ_RED} />
        )}
        <div style={{ flex: 1 }}>
          <div style={S.bannerText}>
            {hasToken ? "متصل بمنصة Saned" : "غير متصل بمنصة Saned"}
          </div>
          {hasToken && (
            <div style={S.bannerDetail}>
              {providerName} — ID: {providerId} —{" "}
              {providerStatus === "Active" ? "نشط" : providerStatus}
              {tokenExpiry && (
                <span style={{ marginRight: "14px" }}>
                  <Clock
                    size={11}
                    style={{ verticalAlign: "middle", marginLeft: "4px" }}
                  />
                  صلاحية التوكن: {tokenExpiry}
                </span>
              )}
            </div>
          )}
        </div>
        {hasToken && (
          <button
            style={{
              ...S.btn("rgba(229,62,62,0.2)", true),
              color: JAHEZ_RED,
            }}
            onClick={handleDisconnect}
            title="فصل الاتصال"
          >
            <Unlink2 size={14} />
            فصل
          </button>
        )}
      </div>

      {/* ══════════════════ Token Paste UI ══════════════════ */}
      {(
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          style={S.tokenBox}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <Key size={20} color={JAHEZ_RED} />
            <span style={{ fontSize: "16px", fontWeight: 600 }}>
              ربط حساب Saned
            </span>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: colors.textMuted,
              margin: "0 0 12px 0",
              lineHeight: 1.75,
            }}
          >
            1. افتح بوابة Saned في تبويب آخر وسجّل الدخول
            <br />
            2. من أدوات المطوّر (F12) &rarr; Application &rarr; Local Storage
            &rarr; انسخ التوكن
            <br />
            3. أو سيُلتقط تلقائياً عبر الرابط{" "}
            <code
              style={{
                color: JAHEZ_RED,
                background: "rgba(229,62,62,0.08)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              #saned_token=xxx
            </code>
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
            <input
              style={S.tokenInput}
              placeholder="الصق توكن Saned هنا..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTokenSubmit()}
            />
            <button style={S.btn(JAHEZ_RED)} onClick={handleTokenSubmit}>
              <Link2 size={16} />
              ربط
            </button>
          </div>
        </motion.div>
      )}

      {/* ══════════════════ Sync Bar ══════════════════ */}
      {(
        <div style={S.syncBar}>
          <button
            style={S.btn(JAHEZ_RED)}
            disabled={!!syncing}
            onClick={syncDriversToSupabase}
          >
            {syncing === "drivers" ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <DatabaseZap size={16} />
            )}
            مزامنة المناديب
          </button>

          <button
            style={S.btn("#2d3748")}
            disabled={!!syncing}
            onClick={() => {
              setSyncing("stats");
              loadStats().finally(() => setSyncing(null));
            }}
          >
            {syncing === "stats" || statsLoading ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <RefreshCw size={16} />
            )}
            تحديث الإحصائيات
          </button>

          <button
            style={S.btn("#2b6cb0")}
            disabled={!!syncing}
            onClick={syncAll}
          >
            {syncing === "all" ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Activity size={16} />
            )}
            مزامنة الكل
          </button>

          {syncing && (
            <div style={{ flex: 1, minWidth: "160px" }}>
              <div style={{ fontSize: "11px", color: colors.textMuted }}>
                {syncing === "drivers" && "مزامنة المناديب..."}
                {syncing === "stats" && "تحديث الإحصائيات..."}
                {syncing === "all" && "مزامنة شاملة..."}
                <span style={{ float: "left", direction: "ltr" as const }}>
                  {syncProgress}%
                </span>
              </div>
              <div style={S.progressBar}>
                <div style={S.progressFill(syncProgress)} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ KPI Cards ══════════════════ */}
      {hasToken && (
        <div style={S.kpiGrid}>
          {/* Total Drivers */}
          <motion.div
            style={S.kpiCard}
            whileHover={{
              borderColor: colors.textMuted,
              transform: "translateY(-2px)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Users size={18} color={colors.textMuted} />
              <span style={S.kpiLabel}>إجمالي المناديب</span>
            </div>
            <p style={S.kpiValue(colors.text)}>
              {stats
                ? (
                    stats.activeDrivers + stats.inactiveDrivers
                  ).toLocaleString("ar-SA")
                : "—"}
            </p>
          </motion.div>

          {/* Active */}
          <motion.div
            style={S.kpiCard}
            whileHover={{
              borderColor: ACCENT_GREEN,
              transform: "translateY(-2px)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <UserCheck size={18} color={ACCENT_GREEN} />
              <span style={S.kpiLabel}>نشط</span>
            </div>
            <p style={S.kpiValue(ACCENT_GREEN)}>
              {stats ? stats.activeDrivers.toLocaleString("ar-SA") : "—"}
            </p>
            {stats && (
              <span style={{ fontSize: "11px", color: colors.textMuted }}>
                {stats.activePercentage}%
              </span>
            )}
          </motion.div>

          {/* Inactive */}
          <motion.div
            style={S.kpiCard}
            whileHover={{
              borderColor: JAHEZ_RED,
              transform: "translateY(-2px)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <UserX size={18} color={JAHEZ_RED} />
              <span style={S.kpiLabel}>غير نشط</span>
            </div>
            <p style={S.kpiValue(JAHEZ_RED)}>
              {stats ? stats.inactiveDrivers.toLocaleString("ar-SA") : "—"}
            </p>
            {stats && (
              <span style={{ fontSize: "11px", color: colors.textMuted }}>
                {stats.inactivePercentage}%
              </span>
            )}
          </motion.div>

          {/* Online */}
          <motion.div
            style={S.kpiCard}
            whileHover={{
              borderColor: ACCENT_GREEN,
              transform: "translateY(-2px)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Wifi size={18} color={ACCENT_GREEN} />
              <span style={S.kpiLabel}>متصل</span>
            </div>
            <p style={S.kpiValue(ACCENT_GREEN)}>
              {stats ? stats.onlineDrivers.toLocaleString("ar-SA") : "—"}
            </p>
            {stats && (
              <span style={{ fontSize: "11px", color: colors.textMuted }}>
                {stats.onlinePercentage}%
              </span>
            )}
          </motion.div>

          {/* Offline */}
          <motion.div
            style={S.kpiCard}
            whileHover={{
              borderColor: ACCENT_GRAY,
              transform: "translateY(-2px)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <WifiOff size={18} color={ACCENT_GRAY} />
              <span style={S.kpiLabel}>غير متصل</span>
            </div>
            <p style={S.kpiValue(ACCENT_GRAY)}>
              {stats ? stats.offlineDrivers.toLocaleString("ar-SA") : "—"}
            </p>
            {stats && (
              <span style={{ fontSize: "11px", color: colors.textMuted }}>
                {stats.offlinePercentage}%
              </span>
            )}
          </motion.div>

          {/* Online % */}
          <motion.div
            style={S.kpiCard}
            whileHover={{
              borderColor: "#2b6cb0",
              transform: "translateY(-2px)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Percent size={18} color="#2b6cb0" />
              <span style={S.kpiLabel}>نسبة الاتصال</span>
            </div>
            <p style={S.kpiValue("#2b6cb0")}>
              {stats ? `${stats.onlinePercentage}%` : "—"}
            </p>
          </motion.div>
        </div>
      )}

      {/* ══════════════════ Insight Charts ══════════════════ */}
      {hasToken && stats && (
        <div style={S.chartsRow}>
          {/* Donut: Online vs Offline */}
          <div style={S.chartCard}>
            <div style={S.chartTitle}>المناديب — متصل / غير متصل</div>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={onlineOfflineData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {onlineOfflineData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                    fontSize: "12px",
                    direction: "rtl",
                  }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString("ar-SA"),
                    name,
                  ]}
                />
                <DonutCenterLabel
                  total={stats.onlineDrivers + stats.offlineDrivers}
                  label="إجمالي"
                />
              </PieChart>
            </ResponsiveContainer>
            <ChartLegend items={onlineOfflineData} />
          </div>

          {/* Donut: Active vs Inactive */}
          <div style={S.chartCard}>
            <div style={S.chartTitle}>المناديب — نشط / غير نشط</div>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={activeInactiveData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {activeInactiveData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.text,
                    fontSize: "12px",
                    direction: "rtl",
                  }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString("ar-SA"),
                    name,
                  ]}
                />
                <DonutCenterLabel
                  total={stats.activeDrivers + stats.inactiveDrivers}
                  label="إجمالي"
                />
              </PieChart>
            </ResponsiveContainer>
            <ChartLegend items={activeInactiveData} />
          </div>
        </div>
      )}

      {/* ══════════════════ Extra Info: Insights + Payments + Profile ══════════════════ */}
      {hasToken && (insights || paymentSummary || profile) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Delivery Insights */}
          <div
            style={{
              background: "var(--con-bg-surface-1)",
              border: "1px solid var(--con-border-default)",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  fontSize: "var(--con-text-card-title)",
                  fontWeight: 600,
                  color: "var(--con-text-primary)",
                  margin: 0,
                }}
              >
                تحليلات التسليم
              </h3>
              <button
                style={S.btn("#2d3748", false)}
                onClick={loadInsights}
                disabled={insightsLoading}
              >
                <RefreshCw size={12} />
              </button>
            </div>
            {insights ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                {Object.entries(insights)
                  .filter(([, v]) => typeof v === "number" || typeof v === "string")
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid var(--con-border-default)",
                      }}
                    >
                      <span style={{ color: "var(--con-text-muted)" }}>{k}</span>
                      <span style={{ color: "var(--con-text-primary)", fontWeight: 600 }}>
                        {typeof v === "number" ? v.toLocaleString("ar-SA") : String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ color: "var(--con-text-muted)", fontSize: 12, padding: 20, textAlign: "center" }}>
                {insightsLoading ? "جاري التحميل..." : "لا توجد بيانات"}
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div
            style={{
              background: "var(--con-bg-surface-1)",
              border: "1px solid var(--con-border-default)",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  fontSize: "var(--con-text-card-title)",
                  fontWeight: 600,
                  color: "var(--con-text-primary)",
                  margin: 0,
                }}
              >
                ملخص المدفوعات
              </h3>
              <button
                style={S.btn("#2d3748", false)}
                onClick={loadPaymentSummary}
                disabled={paymentLoading}
              >
                <RefreshCw size={12} />
              </button>
            </div>
            {paymentSummary ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                {Object.entries(paymentSummary)
                  .filter(([, v]) => typeof v === "number" || typeof v === "string")
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid var(--con-border-default)",
                      }}
                    >
                      <span style={{ color: "var(--con-text-muted)" }}>{k}</span>
                      <span
                        style={{
                          color: typeof v === "number" && v > 0 ? ACCENT_GREEN : "var(--con-text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        {typeof v === "number"
                          ? v.toLocaleString("ar-SA") + (k.toLowerCase().includes("amount") || k.toLowerCase().includes("total") ? " ر.س" : "")
                          : String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ color: "var(--con-text-muted)", fontSize: 12, padding: 20, textAlign: "center" }}>
                {paymentLoading ? "جاري التحميل..." : "لا توجد بيانات"}
              </div>
            )}
          </div>

          {/* Provider Profile Details */}
          {profile && (
            <div
              style={{
                background: "var(--con-bg-surface-1)",
                border: "1px solid var(--con-border-default)",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <h3
                style={{
                  fontSize: "var(--con-text-card-title)",
                  fontWeight: 600,
                  color: "var(--con-text-primary)",
                  margin: "0 0 12px",
                }}
              >
                بيانات المزوّد
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                {Object.entries(profile as Record<string, unknown>)
                  .filter(([, v]) => typeof v === "number" || typeof v === "string" || typeof v === "boolean")
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid var(--con-border-default)",
                      }}
                    >
                      <span style={{ color: "var(--con-text-muted)" }}>{k}</span>
                      <span
                        style={{
                          color: "var(--con-text-primary)",
                          fontWeight: 600,
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ Accountant Report (date-filtered) ══════════════════ */}
      {hasToken && (
        <div
          style={{
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-default)",
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <h3
              style={{
                fontSize: "var(--con-text-card-title)",
                fontWeight: 600,
                color: "var(--con-text-primary)",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Receipt size={16} color={JAHEZ_RED} />
              التقرير المحاسبي
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "var(--con-text-muted)" }}>من:</span>
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="con-input"
                style={{ fontSize: 12, padding: "6px 10px" }}
              />
              <span style={{ fontSize: 11, color: "var(--con-text-muted)" }}>إلى:</span>
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="con-input"
                style={{ fontSize: 12, padding: "6px 10px" }}
              />
              <button
                style={S.btn(JAHEZ_RED, true)}
                onClick={loadAccountantReport}
                disabled={accountantLoading}
              >
                <RefreshCw
                  size={12}
                  style={{
                    animation: accountantLoading ? "spin 1s linear infinite" : "none",
                  }}
                />
                {accountantLoading ? "جاري..." : "جلب التقرير"}
              </button>
              {accountantReport && (
                <button
                  style={S.btn("#2d3748", false)}
                  onClick={() => {
                    const json = JSON.stringify(accountantReport, null, 2);
                    const blob = new Blob([json], { type: "application/json" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `accountant-report-${reportStartDate}-to-${reportEndDate}.json`;
                    a.click();
                  }}
                  title="تصدير JSON"
                >
                  <Download size={12} />
                  تصدير
                </button>
              )}
            </div>
          </div>

          {accountantReport ? (
            <div>
              {/* Summary scalar fields */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {Object.entries(accountantReport)
                  .filter(([, v]) => typeof v === "number" || typeof v === "string" || typeof v === "boolean")
                  .map(([k, v]) => {
                    const isMoney =
                      typeof v === "number" &&
                      (k.toLowerCase().includes("amount") ||
                        k.toLowerCase().includes("total") ||
                        k.toLowerCase().includes("paid") ||
                        k.toLowerCase().includes("due") ||
                        k.toLowerCase().includes("revenue"));
                    return (
                      <div
                        key={k}
                        style={{
                          background: "var(--con-bg-surface-2)",
                          border: "1px solid var(--con-border-default)",
                          borderRadius: 6,
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--con-text-muted)",
                            marginBottom: 4,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {k}
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: isMoney ? ACCENT_GREEN : "var(--con-text-primary)",
                            fontFamily: "var(--con-font-mono)",
                          }}
                        >
                          {typeof v === "number"
                            ? v.toLocaleString("ar-SA") + (isMoney ? " ر.س" : "")
                            : String(v)}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Array result table if present */}
              {(() => {
                const rowsField = (accountantReport as any).result ||
                  (accountantReport as any).rows ||
                  (accountantReport as any).items ||
                  (accountantReport as any).data;
                if (!Array.isArray(rowsField) || rowsField.length === 0) return null;
                const headers = Object.keys(rowsField[0]).slice(0, 8);
                return (
                  <div
                    style={{
                      background: "var(--con-bg-surface-2)",
                      border: "1px solid var(--con-border-default)",
                      borderRadius: 6,
                      maxHeight: 340,
                      overflow: "auto",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 11,
                      }}
                    >
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          background: "var(--con-bg-surface-1)",
                        }}
                      >
                        <tr>
                          {headers.map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "8px 10px",
                                textAlign: "start",
                                fontWeight: 600,
                                color: "var(--con-text-muted)",
                                borderBottom: "1px solid var(--con-border-default)",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rowsField.slice(0, 100).map((row: any, idx: number) => (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: "1px solid var(--con-border-default)",
                            }}
                          >
                            {headers.map((h) => (
                              <td
                                key={h}
                                style={{
                                  padding: "7px 10px",
                                  color: "var(--con-text-primary)",
                                }}
                              >
                                {typeof row[h] === "number"
                                  ? row[h].toLocaleString("ar-SA")
                                  : String(row[h] ?? "—")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rowsField.length > 100 && (
                      <div
                        style={{
                          padding: 8,
                          textAlign: "center",
                          fontSize: 10,
                          color: "var(--con-text-muted)",
                        }}
                      >
                        + {rowsField.length - 100} صف آخر (قم بالتصدير للاطلاع)
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: "var(--con-text-muted)",
                fontSize: 13,
              }}
            >
              حدّد التواريخ واضغط "جلب التقرير" لعرض البيانات المحاسبية
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ Driver Table ══════════════════ */}
      {hasToken && (
        <div style={S.tableWrap}>
          {/* Toolbar */}
          <div style={S.tableToolbar}>
            {/* Search */}
            <div
              style={{ position: "relative", flex: 1, minWidth: "200px" }}
            >
              <Search
                size={16}
                color={colors.textMuted}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "12px",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                ref={searchRef}
                style={S.searchInput}
                placeholder="بحث بالاسم، الهاتف، الهوية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Filter size={14} color={colors.textMuted} />

            <select
              style={S.select}
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "" | "Active" | "Inactive",
                )
              }
            >
              <option value="">كل الحالات</option>
              <option value="Active">نشط</option>
              <option value="Inactive">غير نشط</option>
            </select>

            <select
              style={S.select}
              value={filterAvail}
              onChange={(e) =>
                setFilterAvail(
                  e.target.value as "" | "Online" | "Offline",
                )
              }
            >
              <option value="">كل التوافر</option>
              <option value="Online">متصل</option>
              <option value="Offline">غير متصل</option>
            </select>

            <button style={S.btn("#2d3748", true)} onClick={exportExcel}>
              <Download size={14} />
              تصدير Excel
            </button>

            <div
              style={{
                fontSize: "12px",
                color: colors.textMuted,
                whiteSpace: "nowrap",
              }}
            >
              {totalDrivers.toLocaleString("ar-SA")} سائق
            </div>
          </div>

          {/* Table body */}
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Hash size={12} /> هوية السائق
                    </span>
                  </th>
                  <th style={S.th}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <IdCard size={12} /> رقم الإقامة
                    </span>
                  </th>
                  <th style={S.th}>اسم السائق</th>
                  <th style={S.th}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Phone size={12} /> رقم التليفون
                    </span>
                  </th>
                  <th style={S.th}>حالة السائق</th>
                  <th style={S.th}>التوافر</th>
                  <th style={S.th}>المركبة</th>
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        ...S.td,
                        textAlign: "center",
                        padding: "52px 16px",
                      }}
                    >
                      <Loader2
                        size={28}
                        color={JAHEZ_RED}
                        style={{
                          animation: "spin 1s linear infinite",
                          display: "block",
                          margin: "0 auto 10px",
                        }}
                      />
                      <div
                        style={{ color: colors.textMuted, fontSize: "13px" }}
                      >
                        جاري تحميل المناديب...
                      </div>
                    </td>
                  </tr>
                ) : filteredDrivers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        ...S.td,
                        textAlign: "center",
                        padding: "52px 16px",
                      }}
                    >
                      <AlertTriangle
                        size={24}
                        color={colors.textMuted}
                        style={{ display: "block", margin: "0 auto 10px" }}
                      />
                      <div
                        style={{ color: colors.textMuted, fontSize: "13px" }}
                      >
                        {searchQuery || filterStatus || filterAvail
                          ? "لا يوجد نتائج مطابقة للبحث"
                          : "لا يوجد مناديب"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((d) => (
                    <tr
                      key={d.driverId}
                      style={{
                        ...S.trHover,
                        background:
                          hoveredRow === d.driverId
                            ? colors.cardHover
                            : "transparent",
                      }}
                      onMouseEnter={() => setHoveredRow(d.driverId)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => setSelectedDriver(d)}
                    >
                      <td style={S.td}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 600,
                          }}
                        >
                          {d.driverId}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                        >
                          {d.iqamaNumber || "—"}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{ fontWeight: 600 }}>
                          {d.driverName || "—"}
                        </span>
                      </td>
                      <td
                        style={{
                          ...S.td,
                          direction: "ltr",
                          textAlign: "right",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                        >
                          {d.phoneNumber || "—"}
                        </span>
                      </td>
                      <td style={S.td}>
                        {d.driverStatus === "Active" ? (
                          <span
                            style={S.badge(
                              "rgba(56,161,105,0.15)",
                              ACCENT_GREEN,
                            )}
                          >
                            <CheckCircle2 size={12} /> نشط
                          </span>
                        ) : (
                          <span
                            style={S.badge(
                              "rgba(229,62,62,0.15)",
                              JAHEZ_RED,
                            )}
                          >
                            <XCircle size={12} /> غير نشط
                          </span>
                        )}
                      </td>
                      <td style={S.td}>
                        {d.availability === "Online" ? (
                          <span
                            style={S.badge(
                              "rgba(56,161,105,0.15)",
                              ACCENT_GREEN,
                            )}
                          >
                            <Wifi size={12} /> متصل
                          </span>
                        ) : (
                          <span
                            style={S.badge(
                              "rgba(113,128,150,0.15)",
                              ACCENT_GRAY,
                            )}
                          >
                            <WifiOff size={12} /> غير متصل
                          </span>
                        )}
                      </td>
                      <td style={S.td}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12px",
                            color: colors.textMuted,
                          }}
                        >
                          <VehicleIcon type={d.vehicleType} size={14} />
                          {vehicleLabel(d.vehicleType)}
                        </span>
                      </td>
                      <td style={S.td}>
                        <button
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: colors.textMuted,
                            padding: "4px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDriver(d);
                          }}
                          title="عرض التفاصيل"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={S.pagination}>
              {/* Prev (RTL: ChevronRight = prev) */}
              <button
                style={{
                  ...S.pageBtn(false),
                  opacity: currentPage <= 1 ? 0.35 : 1,
                  cursor: currentPage <= 1 ? "default" : "pointer",
                }}
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <ChevronRight size={16} />
              </button>

              {/* First page shortcut */}
              {pageNumbers[0] > 1 && (
                <>
                  <button
                    style={S.pageBtn(currentPage === 1)}
                    onClick={() => goToPage(1)}
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && (
                    <span
                      style={{
                        color: colors.textMuted,
                        fontSize: "12px",
                        padding: "0 2px",
                      }}
                    >
                      ...
                    </span>
                  )}
                </>
              )}

              {/* Visible pages */}
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  style={S.pageBtn(p === currentPage)}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ))}

              {/* Last page shortcut */}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span
                      style={{
                        color: colors.textMuted,
                        fontSize: "12px",
                        padding: "0 2px",
                      }}
                    >
                      ...
                    </span>
                  )}
                  <button
                    style={S.pageBtn(currentPage === totalPages)}
                    onClick={() => goToPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next (RTL: ChevronLeft = next) */}
              <button
                style={{
                  ...S.pageBtn(false),
                  opacity: currentPage >= totalPages ? 0.35 : 1,
                  cursor: currentPage >= totalPages ? "default" : "pointer",
                }}
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                <ChevronLeft size={16} />
              </button>

              <span
                style={{
                  fontSize: "12px",
                  color: colors.textMuted,
                  marginRight: "14px",
                }}
              >
                صفحة {currentPage} من {totalPages}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ Driver Detail Side Panel ══════════════════ */}
      <AnimatePresence>
        {selectedDriver && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={S.overlay}
              onClick={() => setSelectedDriver(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: -440 }}
              animate={{ x: 0 }}
              exit={{ x: -440 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={S.sidePanel}
            >
              {/* Close / Title */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}
                >
                  تفاصيل السائق
                </h2>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: colors.textMuted,
                    padding: "4px",
                  }}
                  onClick={() => setSelectedDriver(null)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Avatar + Name */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "24px",
                  paddingBottom: "22px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${JAHEZ_RED}, #fc8181)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {selectedDriver.driverName
                    ? selectedDriver.driverName.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "17px", fontWeight: 700 }}>
                    {selectedDriver.driverName || "غير معروف"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.textMuted,
                      marginTop: "4px",
                    }}
                  >
                    ID: {selectedDriver.driverId}
                  </div>
                </div>

                {/* Status badges */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {selectedDriver.driverStatus === "Active" ? (
                    <span
                      style={S.badge(
                        "rgba(56,161,105,0.15)",
                        ACCENT_GREEN,
                      )}
                    >
                      <CheckCircle2 size={12} /> نشط
                    </span>
                  ) : (
                    <span
                      style={S.badge("rgba(229,62,62,0.15)", JAHEZ_RED)}
                    >
                      <XCircle size={12} /> غير نشط
                    </span>
                  )}
                  {selectedDriver.availability === "Online" ? (
                    <span
                      style={S.badge(
                        "rgba(56,161,105,0.15)",
                        ACCENT_GREEN,
                      )}
                    >
                      <Wifi size={12} /> متصل
                    </span>
                  ) : (
                    <span
                      style={S.badge(
                        "rgba(113,128,150,0.15)",
                        ACCENT_GRAY,
                      )}
                    >
                      <WifiOff size={12} /> غير متصل
                    </span>
                  )}
                </div>
              </div>

              {/* Info rows */}
              <div>
                <DetailRow
                  icon={<Hash size={16} color={colors.textMuted} />}
                  label="هوية السائق"
                  value={String(selectedDriver.driverId)}
                />
                <DetailRow
                  icon={<IdCard size={16} color={colors.textMuted} />}
                  label="رقم الإقامة"
                  value={selectedDriver.iqamaNumber || "—"}
                />
                <DetailRow
                  icon={<Users size={16} color={colors.textMuted} />}
                  label="اسم السائق"
                  value={selectedDriver.driverName || "—"}
                />
                <DetailRow
                  icon={<Phone size={16} color={colors.textMuted} />}
                  label="رقم التليفون"
                  value={selectedDriver.phoneNumber || "—"}
                  ltr
                />
                <DetailRow
                  icon={
                    <UserCheck size={16} color={colors.textMuted} />
                  }
                  label="حالة السائق"
                  value={
                    selectedDriver.driverStatus === "Active"
                      ? "نشط"
                      : "غير نشط"
                  }
                  valueColor={
                    selectedDriver.driverStatus === "Active"
                      ? ACCENT_GREEN
                      : JAHEZ_RED
                  }
                />
                <DetailRow
                  icon={<Wifi size={16} color={colors.textMuted} />}
                  label="التوافر"
                  value={
                    selectedDriver.availability === "Online"
                      ? "متصل"
                      : "غير متصل"
                  }
                  valueColor={
                    selectedDriver.availability === "Online"
                      ? ACCENT_GREEN
                      : ACCENT_GRAY
                  }
                />
                <DetailRow
                  icon={
                    <VehicleIcon
                      type={selectedDriver.vehicleType}
                      size={16}
                    />
                  }
                  label="نوع المركبة"
                  value={vehicleLabel(selectedDriver.vehicleType)}
                />
              </div>

              {/* Payment Report Section */}
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: colors.textPrimary }}>
                    تقرير المدفوعات
                  </h4>
                  <button
                    style={S.btn("#2d3748", false)}
                    onClick={() => loadDriverPayments(selectedDriver.driverId)}
                    disabled={driverPaymentsLoading}
                  >
                    <RefreshCw size={11} />
                    {driverPaymentsLoading ? "جاري..." : "جلب"}
                  </button>
                </div>
                {driverPayments ? (
                  <div
                    style={{
                      background: "var(--con-bg-surface-2)",
                      border: "1px solid var(--con-border-default)",
                      borderRadius: 6,
                      padding: 10,
                      fontSize: 11,
                      maxHeight: 220,
                      overflowY: "auto",
                    }}
                  >
                    {Object.entries(driverPayments)
                      .filter(([, v]) => typeof v === "number" || typeof v === "string")
                      .map(([k, v]) => (
                        <div
                          key={k}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "4px 0",
                            borderBottom: "1px solid var(--con-border-default)",
                          }}
                        >
                          <span style={{ color: colors.textMuted }}>{k}</span>
                          <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
                            {typeof v === "number" ? v.toLocaleString("ar-SA") : String(v)}
                          </span>
                        </div>
                      ))}
                    {(driverPayments as any).result && Array.isArray((driverPayments as any).result) && (
                      <div style={{ marginTop: 8, color: colors.textMuted }}>
                        {(driverPayments as any).result.length} سجل دفعات
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 11,
                      color: colors.textMuted,
                      padding: 10,
                      textAlign: "center",
                    }}
                  >
                    اضغط "جلب" لعرض تقرير دفعات هذا السائق
                  </div>
                )}
              </div>

              {/* Actions */}
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  style={{
                    ...S.btn(JAHEZ_RED, true),
                    flex: 1,
                    justifyContent: "center",
                  }}
                  onClick={() => {
                    if (selectedDriver.phoneNumber) {
                      navigator.clipboard.writeText(
                        selectedDriver.phoneNumber,
                      );
                      toast.success("تم نسخ رقم الهاتف");
                    }
                  }}
                >
                  <Phone size={14} />
                  نسخ الهاتف
                </button>
                <button
                  style={{
                    ...S.btn("#2d3748", true),
                    flex: 1,
                    justifyContent: "center",
                  }}
                  onClick={() => setSelectedDriver(null)}
                >
                  <X size={14} />
                  إغلاق
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════ Keyframe for spinner ══════════════════ */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
