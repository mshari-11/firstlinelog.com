import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw,
  Search,
  Download,
  Users,
  UserCheck,
  UserX,
  Wifi,
  WifiOff,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Link2,
  Unlink2,
  Percent,
  Clock,
  Truck,
  DatabaseZap,
  Key,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ─── Constants ───────────────────────────────────────────────────────────────

const SANED_BASE = "https://gateway.saned.io/api/v1/drivers-management-portal";
const PROVIDER_ID = "20524";
const PAGE_SIZE = 100;
const LS_LAST_SYNC = "fll_jahez_last_sync";

// ─── Jahez branding ─────────────────────────────────────────────────────────

const JAHEZ_RED = "#e53e3e";
const JAHEZ_DARK = "#2d3748";
const JAHEZ_RED_LIGHT = "#fff5f5";
const JAHEZ_RED_HOVER = "#c53030";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SanedDriver {
  driverId: number;
  driverUniqueId?: string;
  residenceNumber?: string;
  firstName?: string;
  lastName?: string;
  firstNameAr?: string;
  lastNameAr?: string;
  phoneNumber?: string;
  email?: string;
  status?: string;
  availability?: string;
  vehicleType?: string;
  city?: string;
  nationalId?: string;
  createdDate?: string;
  lastLoginDate?: string;
  [key: string]: unknown;
}

interface ActiveInactiveStats {
  totalDrivers: number;
  activeDrivers: number;
  inactiveDrivers: number;
  onlineDrivers: number;
  offlineDrivers: number;
}

interface ProviderDetails {
  id: number;
  name?: string;
  nameAr?: string;
  status?: string;
  [key: string]: unknown;
}

// ─── Fallback mock data ──────────────────────────────────────────────────────

const MOCK_DRIVERS: SanedDriver[] = [
  { driverId: 10001, residenceNumber: "2456789012", firstNameAr: "مسعد", lastNameAr: "عقله", phoneNumber: "0551234567", status: "Active", availability: "Online" },
  { driverId: 10002, residenceNumber: "2456789013", firstNameAr: "حافظ", lastNameAr: "محمد", phoneNumber: "0559876543", status: "Active", availability: "Offline" },
  { driverId: 10003, residenceNumber: "2456789014", firstNameAr: "محمد", lastNameAr: "شعبان", phoneNumber: "0553456789", status: "Active", availability: "Online" },
  { driverId: 10004, residenceNumber: "2456789015", firstNameAr: "حمدي", lastNameAr: "محيوب", phoneNumber: "0557654321", status: "Inactive", availability: "Offline" },
  { driverId: 10005, residenceNumber: "2456789016", firstNameAr: "وليد", lastNameAr: "توفيق", phoneNumber: "0552345678", status: "Active", availability: "Online" },
  { driverId: 10006, residenceNumber: "2456789017", firstNameAr: "عبدالله", lastNameAr: "الحربي", phoneNumber: "0558765432", status: "Suspended", availability: "Offline" },
  { driverId: 10007, residenceNumber: "2456789018", firstNameAr: "فهد", lastNameAr: "السالم", phoneNumber: "0554567890", status: "Active", availability: "Online" },
  { driverId: 10008, residenceNumber: "2456789019", firstNameAr: "سعود", lastNameAr: "المطيري", phoneNumber: "0556543210", status: "Active", availability: "Offline" },
  { driverId: 10009, residenceNumber: "2456789020", firstNameAr: "ياسر", lastNameAr: "العمري", phoneNumber: "0551122334", status: "Inactive", availability: "Offline" },
  { driverId: 10010, residenceNumber: "2456789021", firstNameAr: "طارق", lastNameAr: "الزهراني", phoneNumber: "0559988776", status: "Active", availability: "Online" },
];

const MOCK_STATS: ActiveInactiveStats = {
  totalDrivers: 3132,
  activeDrivers: 2410,
  inactiveDrivers: 722,
  onlineDrivers: 1587,
  offlineDrivers: 1545,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem("authIam");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || null;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    if (!exp) return true; // no exp claim — assume valid
    return Date.now() < exp * 1000;
  } catch {
    return false;
  }
}

const SANED_TOKEN_KEY = "fll_saned_token";

function getSanedToken(): string | null {
  // Check local stored token first
  const stored = localStorage.getItem(SANED_TOKEN_KEY);
  if (stored) {
    try {
      const payload = JSON.parse(atob(stored.split(".")[1]));
      if (payload.exp && Date.now() < payload.exp * 1000) return stored;
      localStorage.removeItem(SANED_TOKEN_KEY); // expired
    } catch { /* invalid */ }
  }
  // Also try authIam (if somehow on same domain)
  return getAuthToken();
}

function saveSanedToken(token: string) {
  localStorage.setItem(SANED_TOKEN_KEY, token);
  localStorage.setItem("fll_jahez_last_sync", new Date().toISOString());
}

async function proxyFetch<T = unknown>(action: string, extra?: Record<string, unknown>): Promise<T> {
  const token = getSanedToken();
  if (!token) throw new Error("TOKEN_MISSING");

  // Direct call to Saned API (works when token is valid — browser makes the request)
  let url = `${SANED_BASE}/${action === "profile" ? `delivery-providers/${PROVIDER_ID}/details`
    : action === "stats" ? "delivery-providers/active-inactive"
    : action === "drivers" ? "delivery-providers/driver-list"
    : action === "vehicle-types" ? "lookups/vehicle-types"
    : action === "cities" ? "lookups/cities-by-country-codes"
    : action}`;

  const params: Record<string, string> = {};
  if (action === "drivers") {
    params.page = String((extra as any)?.page ?? 0);
    params.size = String((extra as any)?.size ?? 100);
  }
  if (action === "cities") params.countryCodes = "SA";

  if (Object.keys(params).length) url += "?" + new URLSearchParams(params).toString();

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem(SANED_TOKEN_KEY);
      throw new Error("TOKEN_EXPIRED");
    }
    throw new Error(`خطأ API: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Keep old sanedFetch as fallback (direct call if user has Saned token)
async function sanedFetch<T = unknown>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error("لم يتم تسجيل الدخول في Saned");
  if (!isTokenValid(token)) throw new Error("انتهت صلاحية الجلسة — أعد تسجيل الدخول في Saned");

  let url = `${SANED_BASE}/${endpoint}`;
  if (params) url += "?" + new URLSearchParams(params).toString();

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("غير مصرح — تأكد من تسجيل الدخول في Saned");
    }
    throw new Error(`خطأ API: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d));
  } catch {
    return d;
  }
}

function getDriverName(d: SanedDriver): string {
  if (d.firstNameAr || d.lastNameAr) {
    return `${d.firstNameAr || ""} ${d.lastNameAr || ""}`.trim();
  }
  if (d.firstName || d.lastName) {
    return `${d.firstName || ""} ${d.lastName || ""}`.trim();
  }
  return `سائق ${d.driverId}`;
}

// ─── Status badge helper ─────────────────────────────────────────────────────

function StatusBadge({ value, type }: { value: string; type: "status" | "availability" }) {
  const statusMap: Record<string, { bg: string; color: string; label: string }> = {
    Active: { bg: "#c6f6d5", color: "#276749", label: "نشط" },
    Inactive: { bg: "#feebc8", color: "#c05621", label: "غير نشط" },
    Suspended: { bg: "#fed7d7", color: "#c53030", label: "معلق" },
    Online: { bg: "#c6f6d5", color: "#276749", label: "متصل" },
    Offline: { bg: "#e2e8f0", color: "#4a5568", label: "غير متصل" },
  };
  const info = statusMap[value] || { bg: "#e2e8f0", color: "#4a5568", label: value || "—" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        background: info.bg,
        color: info.color,
      }}
    >
      {type === "availability" ? (
        value === "Online" ? <Wifi size={11} /> : <WifiOff size={11} />
      ) : value === "Active" ? (
        <CheckCircle2 size={11} />
      ) : value === "Suspended" ? (
        <AlertTriangle size={11} />
      ) : (
        <XCircle size={11} />
      )}
      {info.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function JahezPlatform() {
  // ─── State ───────────────────────────────────────────────────────────────

  const [drivers, setDrivers] = useState<SanedDriver[]>([]);
  const [stats, setStats] = useState<ActiveInactiveStats | null>(null);
  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<"drivers" | "stats" | "all" | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [corsBlocked, setCorsBlocked] = useState(false);
  const [usingMock, setUsingMock] = useState(false);

  // Table state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAvail, setFilterAvail] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDriverCount, setTotalDriverCount] = useState(0);

  // Supabase sync progress
  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number } | null>(null);

  const mountedRef = useRef(true);

  // ─── Init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    // Auto-capture token from URL hash (sent from Saned tab)
    const hash = window.location.hash;
    if (hash.includes("saned_token=")) {
      const tokenFromUrl = decodeURIComponent(hash.split("saned_token=")[1]?.split("&")[0] || "");
      if (tokenFromUrl && tokenFromUrl.length > 100) {
        try {
          const payload = JSON.parse(atob(tokenFromUrl.split(".")[1]));
          if (payload.exp && Date.now() < payload.exp * 1000) {
            saveSanedToken(tokenFromUrl);
            toast.success("تم ربط حساب Saned تلقائياً!");
            // Clean URL hash
            window.history.replaceState(null, "", window.location.pathname);
          }
        } catch { /* invalid token */ }
      }
    }

    const token = getSanedToken() || getAuthToken();
    const connected = !!token;
    setIsConnected(connected);
    setTokenValid(connected && isTokenValid(token!));
    setLastSync(localStorage.getItem(LS_LAST_SYNC));

    if (connected && isTokenValid(token!)) {
      loadProviderDetails();
      loadDrivers(0);
      loadStats();
    } else {
      // use mock data
      setUsingMock(true);
      setDrivers(MOCK_DRIVERS);
      setStats(MOCK_STATS);
      setTotalDriverCount(MOCK_DRIVERS.length);
      setTotalPages(1);
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ─── API calls ───────────────────────────────────────────────────────────

  const loadProviderDetails = useCallback(async () => {
    try {
      const data = await proxyFetch<ProviderDetails>("profile");
      if (mountedRef.current) { setProvider(data); setCorsBlocked(false); }
    } catch (err: unknown) {
      console.warn("Provider details error:", err);
      // Fallback to direct fetch
      try {
        const data = await sanedFetch<ProviderDetails>(`delivery-providers/${PROVIDER_ID}/details`);
        if (mountedRef.current) setProvider(data);
      } catch {
        setCorsBlocked(true);
      }
    }
  }, []);

  const loadDrivers = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await proxyFetch<{
        content?: SanedDriver[];
        drivers?: SanedDriver[];
        totalElements?: number;
        total?: number;
        totalPages?: number;
      }>("drivers", { page: pageNum, size: PAGE_SIZE });

      if (!mountedRef.current) return;

      const driverList = data?.content || data?.drivers || [];
      if (driverList.length === 0 && pageNum === 0) {
        setUsingMock(true);
        setDrivers(MOCK_DRIVERS);
        setTotalDriverCount(MOCK_DRIVERS.length);
        setTotalPages(1);
      } else {
        setUsingMock(false);
        setCorsBlocked(false);
        setDrivers(driverList);
        setTotalDriverCount(data?.totalElements || data?.total || driverList.length);
        setTotalPages(data?.totalPages || Math.ceil((data?.totalElements || data?.total || driverList.length) / PAGE_SIZE));
      }
      setPage(pageNum);
    } catch (err: unknown) {
      console.warn("Driver list error:", err);
      if (mountedRef.current) {
        setUsingMock(true);
        setDrivers(MOCK_DRIVERS);
        setTotalDriverCount(MOCK_DRIVERS.length);
        setTotalPages(1);
        toast.error("تعذر تحميل المناديب — يتم عرض بيانات تجريبية");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await proxyFetch<ActiveInactiveStats>("stats");
      if (!mountedRef.current) return;
      setStats(data);
      setCorsBlocked(false);
    } catch (err: unknown) {
      console.warn("Stats error:", err);
      if (mountedRef.current) {
        setStats(MOCK_STATS);
      }
    }
  }, []);

  // ─── Sync actions ────────────────────────────────────────────────────────

  const handleSyncDrivers = useCallback(async () => {
    setSyncing("drivers");
    try {
      // Use proxy to fetch ALL drivers in one call
      toast.info("جاري سحب جميع المناديب من Saned...");
      const data = await proxyFetch<{
        drivers?: SanedDriver[];
        total?: number;
        pages?: number;
      }>("drivers-all");

      const allDrivers = data?.drivers || [];
      setSyncProgress({ done: allDrivers.length, total: data?.total || allDrivers.length });
      toast.info(`تم تحميل ${allDrivers.length} مندوب`);

      // Save to Supabase
      if (supabase && allDrivers.length > 0) {
        toast.info("جاري الحفظ في قاعدة البيانات...");
        const batchSize = 50;
        for (let i = 0; i < allDrivers.length; i += batchSize) {
          const batch = allDrivers.slice(i, i + batchSize).map((d) => ({
            saned_driver_id: d.driverId,
            driver_unique_id: d.driverUniqueId || null,
            residence_number: d.residenceNumber || null,
            first_name_ar: d.firstNameAr || null,
            last_name_ar: d.lastNameAr || null,
            first_name: d.firstName || null,
            last_name: d.lastName || null,
            phone_number: d.phoneNumber || null,
            email: d.email || null,
            status: d.status || null,
            availability: d.availability || null,
            vehicle_type: d.vehicleType || null,
            city: d.city || null,
            national_id: d.nationalId || null,
            raw_data: d,
            synced_at: new Date().toISOString(),
          }));

          const { error } = await supabase
            .from("jahez_drivers")
            .upsert(batch, { onConflict: "saned_driver_id" });

          if (error) {
            console.warn("Supabase upsert error:", error);
            // Don't break — continue with remaining batches
          }

          setSyncProgress({ done: Math.min(i + batchSize, allDrivers.length), total: allDrivers.length });
        }
        toast.success(`تم مزامنة ${allDrivers.length} مندوب بنجاح`);
      } else if (!supabase) {
        toast.warning("Supabase غير متصل — تم التحميل بدون حفظ");
      }

      // Update last sync
      const now = new Date().toISOString();
      localStorage.setItem(LS_LAST_SYNC, now);
      setLastSync(now);

      // Refresh table
      await loadDrivers(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      toast.error(`فشلت مزامنة المناديب: ${msg}`);
    } finally {
      setSyncing(null);
      setSyncProgress(null);
    }
  }, [loadDrivers]);

  const handleSyncStats = useCallback(async () => {
    setSyncing("stats");
    try {
      await loadStats();
      const now = new Date().toISOString();
      localStorage.setItem(LS_LAST_SYNC, now);
      setLastSync(now);
      toast.success("تم تحديث الإحصائيات");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      toast.error(`فشل تحديث الإحصائيات: ${msg}`);
    } finally {
      setSyncing(null);
    }
  }, [loadStats]);

  const handleSyncAll = useCallback(async () => {
    setSyncing("all");
    try {
      await Promise.all([handleSyncDrivers(), handleSyncStats()]);
    } finally {
      setSyncing(null);
    }
  }, [handleSyncDrivers, handleSyncStats]);

  // ─── Export ──────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const rows = filteredDrivers.map((d) => ({
      "هوية السائق": d.driverId,
      "رقم الإقامة": d.residenceNumber || "—",
      "اسم السائق": getDriverName(d),
      "رقم التليفون": d.phoneNumber || "—",
      "حالة السائق": d.status || "—",
      "التوافر": d.availability || "—",
      "المدينة": d.city || "—",
      "نوع المركبة": d.vehicleType || "—",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jahez Drivers");
    XLSX.writeFile(wb, `jahez_drivers_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("تم تصدير الملف بنجاح");
  }, [drivers, search, filterStatus, filterAvail]);

  // ─── Filtering ───────────────────────────────────────────────────────────

  const filteredDrivers = drivers.filter((d) => {
    const nameMatch =
      !search ||
      getDriverName(d).includes(search) ||
      d.phoneNumber?.includes(search) ||
      String(d.driverId).includes(search) ||
      d.residenceNumber?.includes(search);
    const statusMatch = filterStatus === "all" || d.status === filterStatus;
    const availMatch = filterAvail === "all" || d.availability === filterAvail;
    return nameMatch && statusMatch && availMatch;
  });

  // ─── KPI computed ────────────────────────────────────────────────────────

  const kpiData = stats || MOCK_STATS;
  const onlinePercent =
    kpiData.totalDrivers > 0
      ? ((kpiData.onlineDrivers / kpiData.totalDrivers) * 100).toFixed(1)
      : "0";

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div
      dir="rtl"
      style={{
        padding: "24px",
        fontFamily: "var(--con-font, 'Tajawal', sans-serif)",
        color: "var(--con-text-primary, #1a202c)",
        minHeight: "100vh",
      }}
    >
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${JAHEZ_RED}, ${JAHEZ_DARK})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 14px ${JAHEZ_RED}44`,
            }}
          >
            <Truck size={26} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--con-text-page-title, 22px)",
                fontWeight: 700,
                color: "var(--con-text-primary, #1a202c)",
              }}
            >
              منصة جاهز — Saned
            </h1>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "var(--con-text-body, 14px)",
                color: "var(--con-text-muted, #718096)",
              }}
            >
              مزامنة بيانات المناديب والتحليلات
            </p>
          </div>
        </div>
        {usingMock && (
          <span
            style={{
              background: "#fefcbf",
              color: "#975a16",
              padding: "4px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <AlertTriangle size={13} />
            بيانات تجريبية — API غير متصل
          </span>
        )}
      </motion.div>

      {/* ─── Connection Banner ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          background: isConnected && tokenValid
            ? "linear-gradient(135deg, #f0fff4, #c6f6d5)"
            : corsBlocked
            ? "linear-gradient(135deg, #fffaf0, #feebc8)"
            : "linear-gradient(135deg, #fff5f5, #fed7d7)",
          border: `1px solid ${
            isConnected && tokenValid
              ? "#9ae6b4"
              : corsBlocked
              ? "#fbd38d"
              : "#feb2b2"
          }`,
          borderRadius: 12,
          padding: "14px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isConnected && tokenValid ? (
            <Link2 size={18} color="#38a169" />
          ) : (
            <Unlink2 size={18} color={corsBlocked ? "#dd6b20" : "#e53e3e"} />
          )}
          <div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: isConnected && tokenValid
                  ? "#276749"
                  : corsBlocked
                  ? "#c05621"
                  : "#c53030",
              }}
            >
              {isConnected && tokenValid
                ? "متصل بـ Saned"
                : corsBlocked
                ? "CORS محظور — مطلوب تسجيل الدخول في Saned"
                : "غير متصل — سجّل الدخول في Saned أولاً"}
            </span>
            {isConnected && tokenValid && provider && (
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "#4a5568",
                }}
              >
                {provider.nameAr || provider.name || "الخطابول بدوام كامل"} — ID:{" "}
                {PROVIDER_ID} — {provider.status || "Active"}
              </p>
            )}
            {isConnected && tokenValid && !provider && (
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#4a5568" }}>
                الخطابول بدوام كامل — ID: {PROVIDER_ID} — Active
              </p>
            )}
            {corsBlocked && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#975a16" }}>
                يجب أن تكون مسجلاً في بوابة Saned في نافذة أخرى. إذا كنت مسجلاً بالفعل، قد يكون CORS
                يمنع الطلبات المباشرة من هذا الموقع.
              </p>
            )}
          </div>
        </div>
        {lastSync && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--con-text-muted, #718096)",
            }}
          >
            <Clock size={13} />
            آخر مزامنة: {formatDate(lastSync)}
          </div>
        )}
      </motion.div>

      {/* ─── Token Link Section ──────────────────────────────────────────── */}
      {!getSanedToken() && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          style={{
            background: "var(--con-bg-surface-1, #0d1926)", border: "1px solid var(--con-border-default, #1a3a52)",
            borderRadius: 12, padding: "16px 20px", marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--con-text-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Key size={15} color="#e53e3e" /> ربط حساب Saned — الصق التوكن
          </p>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 10, lineHeight: 1.6 }}>
            1. افتح <a href="https://sdp-portal.saned.io" target="_blank" rel="noreferrer" style={{ color: "#38bdf8" }}>بوابة Saned</a> وسجل دخول
            <br />
            2. افتح DevTools (F12) → Console → الصق: <code style={{ background: "var(--con-bg-elevated)", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>JSON.parse(localStorage.getItem('authIam')).state.accessToken</code>
            <br />
            3. انسخ التوكن والصقه هنا
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="saned-token-input"
              type="password"
              placeholder="الصق التوكن هنا..."
              style={{
                flex: 1, background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default)",
                borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary)", fontSize: 12,
                fontFamily: "var(--con-font-mono)", direction: "ltr",
              }}
            />
            <button
              onClick={() => {
                const input = document.getElementById("saned-token-input") as HTMLInputElement;
                const val = input?.value?.trim();
                if (!val || val.length < 100) { toast.error("التوكن غير صحيح"); return; }
                try {
                  const payload = JSON.parse(atob(val.split(".")[1]));
                  if (!payload.exp || Date.now() > payload.exp * 1000) { toast.error("التوكن منتهي الصلاحية"); return; }
                  saveSanedToken(val);
                  toast.success("تم ربط حساب Saned بنجاح!");
                  setCorsBlocked(false);
                  setUsingMock(false);
                  loadProviderDetails();
                  loadStats();
                  loadDrivers(0);
                } catch { toast.error("التوكن غير صالح — تأكد من نسخه كاملاً"); }
              }}
              style={{
                background: "#e53e3e", color: "#fff", border: "none", borderRadius: 8,
                padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Link2 size={14} /> ربط
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── Sync Actions Bar ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <SyncButton
          label="مزامنة المناديب"
          icon={<Users size={15} />}
          loading={syncing === "drivers" || syncing === "all"}
          onClick={handleSyncDrivers}
          disabled={!!syncing}
          primary
        />
        <SyncButton
          label="تحديث الإحصائيات"
          icon={<Activity size={15} />}
          loading={syncing === "stats" || syncing === "all"}
          onClick={handleSyncStats}
          disabled={!!syncing}
        />
        <SyncButton
          label="مزامنة الكل"
          icon={<DatabaseZap size={15} />}
          loading={syncing === "all"}
          onClick={handleSyncAll}
          disabled={!!syncing}
        />

        {syncProgress && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: JAHEZ_RED,
              fontWeight: 600,
            }}
          >
            <Loader2 size={14} className="animate-spin" />
            تم مزامنة {syncProgress.done}/{syncProgress.total}...
          </div>
        )}
      </motion.div>

      {/* ─── KPI Cards ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <KPICard
          index={0}
          label="إجمالي المناديب"
          value={kpiData.totalDrivers}
          icon={<Users size={20} />}
          color={JAHEZ_DARK}
        />
        <KPICard
          index={1}
          label="نشط"
          value={kpiData.activeDrivers}
          icon={<UserCheck size={20} />}
          color="#38a169"
        />
        <KPICard
          index={2}
          label="غير نشط"
          value={kpiData.inactiveDrivers}
          icon={<UserX size={20} />}
          color="#dd6b20"
        />
        <KPICard
          index={3}
          label="متصل"
          value={kpiData.onlineDrivers}
          icon={<Wifi size={20} />}
          color="#3182ce"
        />
        <KPICard
          index={4}
          label="غير متصل"
          value={kpiData.offlineDrivers}
          icon={<WifiOff size={20} />}
          color="#a0aec0"
        />
        <KPICard
          index={5}
          label="نسبة الاتصال"
          value={`${onlinePercent}%`}
          icon={<Percent size={20} />}
          color={JAHEZ_RED}
        />
      </div>

      {/* ─── Drivers Table Section ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        style={{
          background: "var(--con-bg-surface-1, #fff)",
          borderRadius: 14,
          border: "1px solid var(--con-border, #e2e8f0)",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--con-border, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} color={JAHEZ_RED} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              قائمة المناديب
            </span>
            <span
              style={{
                background: JAHEZ_RED_LIGHT,
                color: JAHEZ_RED,
                padding: "2px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {totalDriverCount.toLocaleString("ar-SA")}
            </span>
          </div>

          <button
            onClick={handleExport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 8,
              border: `1px solid ${JAHEZ_RED}`,
              background: "transparent",
              color: JAHEZ_RED,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = JAHEZ_RED;
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = JAHEZ_RED;
            }}
          >
            <Download size={14} />
            تصدير Excel
          </button>
        </div>

        {/* Filters bar */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--con-border, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--con-bg-surface-2, #f7fafc)",
              border: "1px solid var(--con-border, #e2e8f0)",
              borderRadius: 8,
              padding: "6px 12px",
              flex: "1 1 220px",
              maxWidth: 340,
            }}
          >
            <Search size={14} color="var(--con-text-muted, #a0aec0)" />
            <input
              type="text"
              placeholder="بحث بالاسم، الهاتف، الهوية..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                width: "100%",
                fontSize: 13,
                color: "var(--con-text-primary, #1a202c)",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Filter size={13} color="var(--con-text-muted, #a0aec0)" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
              style={{
                border: "1px solid var(--con-border, #e2e8f0)",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 13,
                background: "var(--con-bg-surface-2, #f7fafc)",
                color: "var(--con-text-primary, #1a202c)",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <option value="all">كل الحالات</option>
              <option value="Active">نشط</option>
              <option value="Inactive">غير نشط</option>
              <option value="Suspended">معلق</option>
            </select>
          </div>

          {/* Availability filter */}
          <select
            value={filterAvail}
            onChange={(e) => {
              setFilterAvail(e.target.value);
              setPage(0);
            }}
            style={{
              border: "1px solid var(--con-border, #e2e8f0)",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 13,
              background: "var(--con-bg-surface-2, #f7fafc)",
              color: "var(--con-text-primary, #1a202c)",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="all">كل التوافر</option>
            <option value="Online">متصل</option>
            <option value="Offline">غير متصل</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => loadDrivers(page)}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--con-border, #e2e8f0)",
              background: "var(--con-bg-surface-2, #f7fafc)",
              color: "var(--con-text-muted, #718096)",
              fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            تحديث
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--con-bg-surface-2, #f7fafc)",
                  borderBottom: "1px solid var(--con-border, #e2e8f0)",
                }}
              >
                {[
                  "هوية السائق",
                  "رقم الإقامة",
                  "اسم السائق",
                  "رقم التليفون",
                  "حالة السائق",
                  "التوافر",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "start",
                      fontWeight: 700,
                      color: "var(--con-text-muted, #718096)",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {loading ? (
                  <tr key="loading">
                    <td colSpan={6} style={{ textAlign: "center", padding: 48 }}>
                      <Loader2
                        size={28}
                        color={JAHEZ_RED}
                        className="animate-spin"
                        style={{ margin: "0 auto" }}
                      />
                      <p
                        style={{
                          marginTop: 8,
                          color: "var(--con-text-muted, #718096)",
                          fontSize: 13,
                        }}
                      >
                        جاري تحميل المناديب...
                      </p>
                    </td>
                  </tr>
                ) : filteredDrivers.length === 0 ? (
                  <tr key="empty">
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 48,
                        color: "var(--con-text-muted, #718096)",
                      }}
                    >
                      لا توجد نتائج مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((d, idx) => (
                    <motion.tr
                      key={d.driverId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                      style={{
                        borderBottom: "1px solid var(--con-border, #edf2f7)",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          "var(--con-bg-hover, #f7fafc)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          "transparent";
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 14px",
                          fontWeight: 600,
                          color: JAHEZ_RED,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.driverId}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          whiteSpace: "nowrap",
                          fontFamily: "monospace",
                          fontSize: 12,
                        }}
                      >
                        {d.residenceNumber || "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getDriverName(d)}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          direction: "ltr",
                          textAlign: "start",
                          fontFamily: "monospace",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.phoneNumber || "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <StatusBadge value={d.status || "—"} type="status" />
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <StatusBadge
                          value={d.availability || "—"}
                          type="availability"
                        />
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--con-border, #e2e8f0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--con-text-muted, #718096)",
              }}
            >
              صفحة {(page + 1).toLocaleString("ar-SA")} من{" "}
              {totalPages.toLocaleString("ar-SA")} — إجمالي{" "}
              {totalDriverCount.toLocaleString("ar-SA")} مندوب
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <PaginationButton
                disabled={page === 0 || loading}
                onClick={() => loadDrivers(page - 1)}
              >
                <ChevronRight size={14} />
                السابق
              </PaginationButton>
              <PaginationButton
                disabled={page >= totalPages - 1 || loading}
                onClick={() => loadDrivers(page + 1)}
              >
                التالي
                <ChevronLeft size={14} />
              </PaginationButton>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function SyncButton({
  label,
  icon,
  loading,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 18px",
        borderRadius: 10,
        border: primary ? "none" : `1px solid var(--con-border, #e2e8f0)`,
        background: primary
          ? hover
            ? JAHEZ_RED_HOVER
            : JAHEZ_RED
          : hover
          ? "var(--con-bg-surface-2, #f7fafc)"
          : "var(--con-bg-surface-1, #fff)",
        color: primary ? "#fff" : "var(--con-text-primary, #1a202c)",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled && !loading ? 0.6 : 1,
        transition: "all 0.2s",
        fontFamily: "inherit",
        boxShadow: primary ? `0 2px 8px ${JAHEZ_RED}33` : "none",
      }}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

function KPICard({
  label,
  value,
  icon,
  color,
  index,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
      style={{
        background: "var(--con-bg-surface-1, #fff)",
        border: "1px solid var(--con-border, #e2e8f0)",
        borderRadius: 14,
        padding: "18px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "default",
      }}
      whileHover={{
        boxShadow: `0 4px 20px ${color}22`,
        scale: 1.02,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--con-text-primary, #1a202c)",
            lineHeight: 1.2,
          }}
        >
          {typeof value === "number" ? value.toLocaleString("ar-SA") : value}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--con-text-muted, #718096)",
            marginTop: 2,
          }}
        >
          {label}
        </div>
      </div>
    </motion.div>
  );
}

function PaginationButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 12px",
        borderRadius: 8,
        border: "1px solid var(--con-border, #e2e8f0)",
        background: "var(--con-bg-surface-1, #fff)",
        color: disabled
          ? "var(--con-text-muted, #a0aec0)"
          : "var(--con-text-primary, #1a202c)",
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}
