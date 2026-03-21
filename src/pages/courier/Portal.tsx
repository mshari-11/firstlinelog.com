/**
 * بوابة المندوب — Courier Portal
 *
 * The dashboard a courier sees after their application is approved.
 * Auth: Supabase session with role = "courier"
 * Route: /courier/portal
 * Design: .fll-console enterprise tokens (IBM Carbon / Cloudscape)
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  User, Wallet, Package, Clock, LogOut,
  TrendingUp, AlertCircle, CheckCircle2,
  FileText, Phone, Mail, MapPin,
  ChevronLeft, Truck, CreditCard, BarChart3,
  Bell, Settings, Shield, ArrowUpRight,
  ArrowDownRight, Calendar, Hash, Building2,
  LocateFixed, Radio,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CourierProfile {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  vehicle_type: string;
  status: string;
  created_at: string;
}

interface WalletData {
  id: string;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_paid_out: number;
  is_frozen: boolean;
  freeze_reason: string | null;
}

interface WalletTransaction {
  id: string;
  event_type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

type Tab = "overview" | "wallet" | "orders" | "profile";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSAR(n: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventLabel(t: string): string {
  const map: Record<string, string> = {
    order_payment: "إيراد طلب",
    bonus: "حافز",
    penalty: "خصم",
    vehicle_cost: "تكلفة مركبة",
    adjustment: "تعديل",
    payout: "تحويل بنكي",
  };
  return map[t] || t;
}

function eventColor(t: string): string {
  if (t === "order_payment" || t === "bonus") return "var(--con-success)";
  if (t === "penalty" || t === "vehicle_cost") return "var(--con-danger)";
  if (t === "payout") return "var(--con-info)";
  return "var(--con-text-muted)";
}

function vehicleLabel(v: string): string {
  const map: Record<string, string> = {
    دراجة: "دراجة نارية",
    سيارة: "سيارة",
    ون: "ون / فان",
    bike: "دراجة نارية",
    car: "سيارة",
    van: "ون / فان",
  };
  return map[v] || v;
}

import { API_BASE as PLATFORM_API_BASE } from "@/lib/api";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CourierPortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  const [profile, setProfile] = useState<CourierProfile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [trackingEnabled, setTrackingEnabled] = useState(localStorage.getItem("fll_tracking_enabled") === "1");
  const [trackingStatus, setTrackingStatus] = useState<"idle" | "sharing" | "error">("idle");
  const [trackingMessage, setTrackingMessage] = useState("");
  const [lastLocationAt, setLastLocationAt] = useState("");
  const watchIdRef = useRef<number | null>(null);

  // ── Auth check + data load ──
  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    if (!supabase) {
      setAuthError("النظام غير متصل");
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      setUserEmail(user.email || "");

      // Check role
      const { data: userData } = await supabase
        .from("users")
        .select("id, role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      const inferredFullName = userData?.full_name || (user.user_metadata as any)?.full_name || "";
      const isCourierAuth = userData?.role === "courier" || userData?.role === "driver";

      let courierData: any = null;

      if (user.email) {
        const { data } = await supabase
          .from("couriers")
          .select("*")
          .eq("email", user.email)
          .limit(1)
          .maybeSingle();
        courierData = data;
      }

      if (!courierData && user.phone) {
        const { data } = await supabase
          .from("couriers")
          .select("*")
          .eq("phone", user.phone)
          .limit(1)
          .maybeSingle();
        courierData = data;
      }

      if (!isCourierAuth && !courierData) {
        setAuthError("ليس لديك صلاحية الوصول لبوابة المناديب");
        setLoading(false);
        return;
      }

      if (courierData) {
        setProfile(courierData as CourierProfile);

        try {
          const { data: walletData } = await supabase
            .from("driver_wallets")
            .select("*")
            .eq("driver_id", courierData.id)
            .maybeSingle();

          if (walletData) {
            setWallet(walletData as WalletData);

            const { data: txns } = await supabase
              .from("wallet_transactions")
              .select("id, event_type, amount, balance_after, description, created_at")
              .eq("driver_id", courierData.id)
              .order("created_at", { ascending: false })
              .limit(50);

            if (txns) setTransactions(txns as WalletTransaction[]);
          } else {
            setWallet(null);
            setTransactions([]);
          }
        } catch {
          setWallet(null);
          setTransactions([]);
        }
      }
    } catch (err) {
      console.error("Portal load error:", err);
      setAuthError("حدث خطأ في تحميل البيانات");
    }

    setLoading(false);
  }

  async function handleLogout() {
    await markOffline();
    stopTracking();
    if (supabase) await supabase.auth.signOut();
    navigate("/login");
  }

  async function pushLocation(position: GeolocationPosition, online = true) {
    if (!profile) return;
    const coords = position.coords;
    const payload = {
      driver_id: profile.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy_meters: coords.accuracy,
      heading: Number.isFinite(coords.heading) ? coords.heading : null,
      speed_mps: Number.isFinite(coords.speed) ? coords.speed : null,
      is_online: online,
      source: "courier_portal",
      updated_at: new Date().toISOString(),
    };
    let saved = false;
    if (supabase) {
      const { error } = await supabase.from("driver_locations").upsert(payload, { onConflict: "driver_id" });
      saved = !error;
    }
    if (!saved) {
      try {
        const apiPayload = {
          id: profile.id,
          driverId: profile.id,
          fullName: profile.full_name,
          full_name: profile.full_name,
          phone: profile.phone,
          city: profile.city,
          vehicleType: profile.vehicle_type,
          status: online ? "available" : "offline",
          latitude: coords.latitude,
          longitude: coords.longitude,
          lat: coords.latitude,
          lng: coords.longitude,
          updatedAt: new Date().toISOString(),
        };
        const putRes = await fetch(`${PLATFORM_API_BASE}/api/drivers/${profile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        });
        if (!putRes.ok) {
          await fetch(`${PLATFORM_API_BASE}/api/drivers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiPayload),
          });
        }
        saved = true;
      } catch {
        saved = false;
      }
    }
    if (saved) {
      setLastLocationAt(new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
      setTrackingStatus("sharing");
      setTrackingMessage("يتم تحديث موقعك مباشرة للإدارة");
    }
  }

  async function markOffline() {
    if (!profile) return;
    try {
      if (supabase) {
        await supabase
          .from("driver_locations")
          .upsert({
            driver_id: profile.id,
            latitude: 0,
            longitude: 0,
            is_online: false,
            source: "courier_portal",
            updated_at: new Date().toISOString(),
          }, { onConflict: "driver_id" });
      }
      await fetch(`${PLATFORM_API_BASE}/api/drivers/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "offline", updatedAt: new Date().toISOString() }),
      }).catch(() => {});
    } catch {
      // best effort
    }
  }

  function stopTracking() {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingEnabled(false);
    localStorage.setItem("fll_tracking_enabled", "0");
    setTrackingStatus("idle");
    setTrackingMessage("تم إيقاف مشاركة الموقع");
  }

  function startTracking() {
    if (!navigator.geolocation) {
      setTrackingStatus("error");
      setTrackingMessage("المتصفح لا يدعم خدمة الموقع");
      return;
    }
    setTrackingEnabled(true);
    localStorage.setItem("fll_tracking_enabled", "1");
    setTrackingMessage("جاري طلب صلاحية الموقع...");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => { pushLocation(position, true); },
      () => {
        setTrackingStatus("error");
        setTrackingMessage("تعذر الوصول إلى الموقع. فعّل إذن الموقع من المتصفح.");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
  }

  useEffect(() => {
    if (!profile || !trackingEnabled) return;
    startTracking();
    return () => {
      if (watchIdRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [profile]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="fll-console" style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--con-bg-app)", fontFamily: "var(--con-font-primary)",
      }} dir="rtl">
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px", height: "40px", border: "3px solid var(--con-border-strong)",
            borderTopColor: "var(--con-brand)", borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 1rem",
          }} />
          <p style={{ fontSize: "13px", color: "var(--con-text-muted)" }}>جاري تحميل البوابة...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Auth Error ──
  if (authError) {
    return (
      <div className="fll-console" style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--con-bg-app)", fontFamily: "var(--con-font-primary)", padding: "1.5rem",
      }} dir="rtl">
        <div className="con-card" style={{ maxWidth: "400px", width: "100%", textAlign: "center", padding: "2rem" }}>
          <AlertCircle size={40} style={{ color: "var(--con-danger)", marginBottom: "1rem" }} />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.5rem" }}>
            خطأ في الوصول
          </h2>
          <p style={{ fontSize: "13px", color: "var(--con-text-muted)", marginBottom: "1.5rem" }}>{authError}</p>
          <button
            onClick={() => navigate("/admin/login")}
            className="con-btn-primary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <LogOut size={14} /> تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // ─── Tab Definitions ────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "overview", label: "الرئيسية", icon: BarChart3 },
    { key: "wallet", label: "المحفظة", icon: Wallet },
    { key: "orders", label: "الطلبات", icon: Package },
    { key: "profile", label: "الملف", icon: User },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fll-console" style={{
      minHeight: "100vh",
      background: "var(--con-bg-app)",
      fontFamily: "var(--con-font-primary)",
    }} dir="rtl">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Top Bar ── */}
      <header style={{
        background: "var(--con-bg-surface-1)",
        borderBottom: "1px solid var(--con-border-default)",
        padding: "0 1.5rem",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "var(--con-brand-subtle)",
            border: "1px solid var(--con-brand-border)",
            borderRadius: "var(--con-radius)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Truck size={16} style={{ color: "var(--con-brand)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "14px", fontWeight: 700, color: "var(--con-text-primary)", lineHeight: 1.2 }}>
              بوابة المندوب
            </h1>
            <p style={{ fontSize: "11px", color: "var(--con-text-muted)", lineHeight: 1 }}>
              First Line Logistics
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.375rem 0.75rem",
            background: "var(--con-bg-elevated)",
            borderRadius: "var(--con-radius)",
            border: "1px solid var(--con-border-default)",
          }}>
            <User size={13} style={{ color: "var(--con-text-muted)" }} />
            <span style={{ fontSize: "12px", color: "var(--con-text-secondary)" }}>
              {profile?.full_name || userEmail}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="تسجيل الخروج"
            style={{
              background: "var(--con-bg-elevated)",
              border: "1px solid var(--con-border-default)",
              borderRadius: "var(--con-radius)",
              padding: "0.375rem",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--con-text-muted)",
              transition: "all 0.15s",
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <nav style={{
        background: "var(--con-bg-surface-1)",
        borderBottom: "1px solid var(--con-border-default)",
        display: "flex",
        gap: 0,
        padding: "0 1.5rem",
        overflowX: "auto",
      }}>
        {tabs.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                padding: "0.75rem 1rem",
                fontSize: "13px",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--con-brand)" : "var(--con-text-muted)",
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid var(--con-brand)" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* ── Content ── */}
      <main style={{ padding: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
        <div className="con-card" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Radio size={14} style={{ color: trackingStatus === "sharing" ? "var(--con-success)" : trackingStatus === "error" ? "var(--con-danger)" : "var(--con-warning)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>التتبع الحي</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--con-text-muted)" }}>
              {trackingMessage || "فعّل مشاركة الموقع ليظهر موقعك في خريطة الإرسال"}
              {lastLocationAt ? ` · آخر تحديث ${lastLocationAt}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!trackingEnabled ? (
              <button className="con-btn-primary" onClick={startTracking}><LocateFixed size={14} /> تفعيل التتبع</button>
            ) : (
              <button className="con-btn-ghost" onClick={stopTracking}><LocateFixed size={14} /> إيقاف التتبع</button>
            )}
          </div>
        </div>
        {tab === "overview" && <OverviewTab profile={profile} wallet={wallet} transactions={transactions} />}
        {tab === "wallet" && <WalletTab wallet={wallet} transactions={transactions} />}
        {tab === "orders" && <OrdersTab />}
        {tab === "profile" && <ProfileTab profile={profile} email={userEmail} />}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        textAlign: "center",
        padding: "1.5rem",
        fontSize: "11px",
        color: "var(--con-text-muted)",
        borderTop: "1px solid var(--con-border-default)",
        marginTop: "2rem",
      }}>
        &copy; {new Date().getFullYear()} First Line Logistics — جميع الحقوق محفوظة
      </footer>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({
  profile,
  wallet,
  transactions,
}: {
  profile: CourierProfile | null;
  wallet: WalletData | null;
  transactions: WalletTransaction[];
}) {
  const recentTxns = transactions.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Welcome */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
          مرحبًا، {profile?.full_name || "مندوب"}
        </h2>
        <p style={{ fontSize: "13px", color: "var(--con-text-muted)" }}>
          ملخص حسابك وآخر المعاملات
        </p>
      </div>

      {/* Wallet Frozen Warning */}
      {wallet?.is_frozen && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.875rem 1rem",
          background: "var(--con-danger-subtle)",
          border: "1px solid var(--con-danger)",
          borderRadius: "var(--con-radius-md)",
          fontSize: "13px",
          color: "var(--con-danger)",
        }}>
          <AlertCircle size={16} />
          <span>محفظتك مجمّدة مؤقتًا{wallet.freeze_reason ? `: ${wallet.freeze_reason}` : ""}. تواصل مع الإدارة.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
      }}>
        <KPICard
          label="الرصيد الحالي"
          value={formatSAR(wallet?.balance || 0)}
          icon={<Wallet size={18} />}
          color="var(--con-brand)"
        />
        <KPICard
          label="إجمالي الإيرادات"
          value={formatSAR(wallet?.total_earned || 0)}
          icon={<TrendingUp size={18} />}
          color="var(--con-success)"
        />
        <KPICard
          label="إجمالي المدفوع"
          value={formatSAR(wallet?.total_paid_out || 0)}
          icon={<CreditCard size={18} />}
          color="var(--con-info)"
        />
        <KPICard
          label="رصيد معلّق"
          value={formatSAR(wallet?.pending_balance || 0)}
          icon={<Clock size={18} />}
          color="var(--con-warning)"
        />
      </div>

      {/* Recent Transactions */}
      <div className="con-card" style={{ padding: "1.25rem" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1rem",
        }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--con-text-primary)" }}>
            آخر المعاملات
          </h3>
          <span style={{ fontSize: "11px", color: "var(--con-text-muted)" }}>
            آخر {recentTxns.length} معاملات
          </span>
        </div>

        {recentTxns.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--con-text-muted)", textAlign: "center", padding: "2rem 0" }}>
            لا توجد معاملات بعد
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {recentTxns.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Wallet Tab ───────────────────────────────────────────────────────────────
function WalletTab({
  wallet,
  transactions,
}: {
  wallet: WalletData | null;
  transactions: WalletTransaction[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--con-text-primary)" }}>
        المحفظة
      </h2>

      {/* Balance Card */}
      <div className="con-card-elevated" style={{
        padding: "2rem",
        textAlign: "center",
        background: "linear-gradient(135deg, var(--con-bg-surface-2), var(--con-bg-elevated))",
      }}>
        <p style={{ fontSize: "12px", color: "var(--con-text-muted)", marginBottom: "0.5rem" }}>
          الرصيد المتاح
        </p>
        <p style={{
          fontFamily: "var(--con-font-mono)",
          fontSize: "2rem",
          fontWeight: 700,
          color: "var(--con-text-primary)",
          letterSpacing: "-0.02em",
          marginBottom: "0.5rem",
        }}>
          {formatSAR(wallet?.balance || 0)}
        </p>
        {wallet?.is_frozen && (
          <span style={{
            fontSize: "11px",
            background: "var(--con-danger-subtle)",
            color: "var(--con-danger)",
            padding: "0.25rem 0.75rem",
            borderRadius: "999px",
            fontWeight: 600,
          }}>
            مجمّدة
          </span>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        <MiniStat label="إجمالي الإيرادات" value={formatSAR(wallet?.total_earned || 0)} color="var(--con-success)" />
        <MiniStat label="إجمالي المدفوع" value={formatSAR(wallet?.total_paid_out || 0)} color="var(--con-info)" />
        <MiniStat label="معلّق" value={formatSAR(wallet?.pending_balance || 0)} color="var(--con-warning)" />
      </div>

      {/* All Transactions */}
      <div className="con-card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem" }}>
          سجل المعاملات ({transactions.length})
        </h3>

        {transactions.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--con-text-muted)", textAlign: "center", padding: "2rem 0" }}>
            لا توجد معاملات بعد
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {transactions.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} showBalance />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--con-text-primary)" }}>
        الطلبات
      </h2>
      <div className="con-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <Package size={40} style={{ color: "var(--con-text-muted)", marginBottom: "1rem" }} />
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "0.5rem" }}>
          قريبًا
        </h3>
        <p style={{ fontSize: "13px", color: "var(--con-text-muted)", maxWidth: "320px", margin: "0 auto", lineHeight: 1.6 }}>
          ستتمكن قريبًا من عرض طلباتك الحالية والسابقة وتتبع حالة التسليم من هنا
        </p>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({
  profile,
  email,
}: {
  profile: CourierProfile | null;
  email: string;
}) {
  if (!profile) {
    return (
      <div className="con-card" style={{ textAlign: "center", padding: "3rem" }}>
        <AlertCircle size={32} style={{ color: "var(--con-warning)", marginBottom: "1rem" }} />
        <p style={{ fontSize: "13px", color: "var(--con-text-muted)" }}>لم يتم العثور على بيانات الملف الشخصي</p>
      </div>
    );
  }

  const fields: { label: string; value: string; icon: typeof User }[] = [
    { label: "الاسم الكامل", value: profile.full_name, icon: User },
    { label: "البريد الإلكتروني", value: email, icon: Mail },
    { label: "رقم الجوال", value: profile.phone, icon: Phone },
    { label: "المدينة", value: profile.city, icon: MapPin },
    { label: "نوع المركبة", value: vehicleLabel(profile.vehicle_type), icon: Truck },
    { label: "تاريخ التسجيل", value: formatDate(profile.created_at), icon: Calendar },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--con-text-primary)" }}>
        الملف الشخصي
      </h2>

      {/* Status Badge */}
      <div className="con-card" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 1.25rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Shield size={16} style={{ color: "var(--con-brand)" }} />
          <span style={{ fontSize: "13px", color: "var(--con-text-secondary)" }}>الحالة</span>
        </div>
        <span style={{
          fontSize: "12px",
          fontWeight: 600,
          padding: "0.25rem 0.75rem",
          borderRadius: "999px",
          background: profile.status === "active" ? "var(--con-success-subtle)" : "var(--con-warning-subtle)",
          color: profile.status === "active" ? "var(--con-success)" : "var(--con-warning)",
        }}>
          {profile.status === "active" ? "نشط" : profile.status === "inactive" ? "غير نشط" : profile.status}
        </span>
      </div>

      {/* Profile Fields */}
      <div className="con-card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {fields.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.625rem 0",
                  borderBottom: "1px solid var(--con-border-default)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Icon size={14} style={{ color: "var(--con-text-muted)" }} />
                  <span style={{ fontSize: "13px", color: "var(--con-text-muted)" }}>{f.label}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--con-text-primary)" }}>
                  {f.value || "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Courier ID */}
      <div className="con-card" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 1.25rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Hash size={14} style={{ color: "var(--con-text-muted)" }} />
          <span style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>رقم المندوب</span>
        </div>
        <span style={{
          fontFamily: "var(--con-font-mono)",
          fontSize: "12px",
          color: "var(--con-text-secondary)",
          background: "var(--con-bg-elevated)",
          padding: "0.25rem 0.625rem",
          borderRadius: "var(--con-radius-sm)",
          border: "1px solid var(--con-border-default)",
        }}>
          {profile.id.slice(0, 8)}
        </span>
      </div>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="con-kpi-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>{label}</span>
        <div style={{
          width: "28px", height: "28px",
          borderRadius: "var(--con-radius-sm)",
          background: `${color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color,
        }}>
          {icon}
        </div>
      </div>
      <span style={{
        fontFamily: "var(--con-font-mono)",
        fontSize: "1.25rem",
        fontWeight: 700,
        color: "var(--con-text-primary)",
        letterSpacing: "-0.02em",
      }}>
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="con-card" style={{ textAlign: "center", padding: "1rem 0.75rem" }}>
      <p style={{ fontSize: "11px", color: "var(--con-text-muted)", marginBottom: "0.375rem" }}>{label}</p>
      <p style={{
        fontFamily: "var(--con-font-mono)",
        fontSize: "14px",
        fontWeight: 600,
        color,
      }}>
        {value}
      </p>
    </div>
  );
}

function TransactionRow({ txn, showBalance }: { txn: WalletTransaction; showBalance?: boolean }) {
  const isPositive = txn.amount >= 0;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.625rem 0.75rem",
      background: "var(--con-bg-elevated)",
      borderRadius: "var(--con-radius)",
      border: "1px solid var(--con-border-default)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div style={{
          width: "28px", height: "28px",
          borderRadius: "var(--con-radius-sm)",
          background: isPositive ? "var(--con-success-subtle)" : "var(--con-danger-subtle)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isPositive
            ? <ArrowDownRight size={14} style={{ color: "var(--con-success)" }} />
            : <ArrowUpRight size={14} style={{ color: "var(--con-danger)" }} />
          }
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--con-text-primary)" }}>
            {eventLabel(txn.event_type)}
          </p>
          <p style={{ fontSize: "11px", color: "var(--con-text-muted)" }}>
            {txn.description || formatDateTime(txn.created_at)}
          </p>
        </div>
      </div>
      <div style={{ textAlign: "left" }}>
        <p style={{
          fontFamily: "var(--con-font-mono)",
          fontSize: "13px",
          fontWeight: 600,
          color: isPositive ? "var(--con-success)" : "var(--con-danger)",
        }}>
          {isPositive ? "+" : ""}{formatSAR(txn.amount)}
        </p>
        {showBalance && (
          <p style={{
            fontFamily: "var(--con-font-mono)",
            fontSize: "10px",
            color: "var(--con-text-muted)",
          }}>
            الرصيد: {formatSAR(txn.balance_after)}
          </p>
        )}
      </div>
    </div>
  );
}
