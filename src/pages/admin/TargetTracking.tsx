/**
 * متابعة التارقت — Target Tracking
 * تتبع تحقيق أهداف المنصات وأداء المناديب يوميًا وأسبوعيًا وشهريًا
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { exportToExcel } from "@/lib/exportUtils";
import { motion } from "framer-motion";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Download,
  RefreshCw,
  Printer,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface PlatformTarget {
  id: string;
  name: string;
  color: string;
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  achievedToday: number;
  achievedWeek: number;
  achievedMonth: number;
}

type PerformanceRating = "A" | "B" | "C";
type DriverStatus = "on_target" | "at_risk" | "below_target" | "absent";

interface DriverPerformance {
  id: string;
  name: string;
  phone: string;
  platform: string;
  platformColor: string;
  todayCompleted: number;
  todayTarget: number;
  weekTotal: number;
  monthTotal: number;
  rating: PerformanceRating;
  status: DriverStatus;
}

interface Alert {
  id: string;
  type: "driver_low" | "platform_risk" | "driver_absent";
  severity: "high" | "medium" | "low";
  message: string;
  timestamp: string;
}

/* ── Constants ─────────────────────────────────────────────────────────── */
const PLATFORMS_CONFIG = [
  { id: "jahez", name: "جاهز", color: "#FF5722", dailyTarget: 120, weeklyTarget: 840, monthlyTarget: 3600 },
  { id: "hungerstation", name: "هنقرستيشن", color: "#E91E63", dailyTarget: 95, weeklyTarget: 665, monthlyTarget: 2850 },
  { id: "marsool", name: "مرسول", color: "#9C27B0", dailyTarget: 80, weeklyTarget: 560, monthlyTarget: 2400 },
  { id: "noon", name: "نون فود", color: "#FFEB3B", dailyTarget: 60, weeklyTarget: 420, monthlyTarget: 1800 },
  { id: "talabat", name: "طلبات", color: "#FF9800", dailyTarget: 45, weeklyTarget: 315, monthlyTarget: 1350 },
  { id: "careem", name: "كريم", color: "#00BCD4", dailyTarget: 30, weeklyTarget: 210, monthlyTarget: 900 },
];

function mockPlatformData(): PlatformTarget[] {
  return PLATFORMS_CONFIG.map((p) => {
    const dailyPct = 0.4 + Math.random() * 0.55;
    const weeklyPct = 0.5 + Math.random() * 0.45;
    const monthlyPct = 0.55 + Math.random() * 0.4;
    return {
      ...p,
      achievedToday: Math.round(p.dailyTarget * dailyPct),
      achievedWeek: Math.round(p.weeklyTarget * weeklyPct),
      achievedMonth: Math.round(p.monthlyTarget * monthlyPct),
    };
  });
}

function mockDriverData(): DriverPerformance[] {
  const drivers = [
    { name: "عبدالله الغامدي", phone: "0501234567", platform: "jahez" },
    { name: "محمد العتيبي", phone: "0559876543", platform: "jahez" },
    { name: "فهد الدوسري", phone: "0541112233", platform: "hungerstation" },
    { name: "سعد القحطاني", phone: "0533445566", platform: "hungerstation" },
    { name: "خالد الشمري", phone: "0567788990", platform: "marsool" },
    { name: "أحمد الحربي", phone: "0522334455", platform: "marsool" },
    { name: "يوسف المطيري", phone: "0588776655", platform: "noon" },
    { name: "عمر الزهراني", phone: "0511223344", platform: "talabat" },
    { name: "بدر السبيعي", phone: "0544556677", platform: "careem" },
    { name: "ناصر العنزي", phone: "0577889900", platform: "noon" },
  ];

  const platformMap = Object.fromEntries(PLATFORMS_CONFIG.map((p) => [p.id, p]));

  return drivers.map((d, i) => {
    const pConfig = platformMap[d.platform];
    const driverDailyTarget = Math.round(pConfig.dailyTarget / 3);
    const pcts = [0.95, 0.88, 0.75, 0.82, 0.45, 0.92, 0.68, 0.55, 0.90, 0.0];
    const pct = pcts[i];
    const todayCompleted = Math.round(driverDailyTarget * pct);
    const rating: PerformanceRating = pct >= 0.9 ? "A" : pct >= 0.7 ? "B" : "C";
    let status: DriverStatus = "on_target";
    if (pct === 0) status = "absent";
    else if (pct < 0.7) status = "below_target";
    else if (pct < 0.9) status = "at_risk";

    return {
      id: `drv-${i + 1}`,
      name: d.name,
      phone: d.phone,
      platform: pConfig.name,
      platformColor: pConfig.color,
      todayCompleted,
      todayTarget: driverDailyTarget,
      weekTotal: Math.round(driverDailyTarget * 7 * (0.6 + Math.random() * 0.35)),
      monthTotal: Math.round(driverDailyTarget * 30 * (0.55 + Math.random() * 0.4)),
      rating,
      status,
    };
  });
}

function generateAlerts(
  platforms: PlatformTarget[],
  drivers: DriverPerformance[],
): Alert[] {
  const alerts: Alert[] = [];
  let id = 1;

  // Drivers below 50% of daily target (simulating "by 2pm")
  drivers.forEach((d) => {
    if (d.status === "absent") {
      alerts.push({
        id: `alert-${id++}`,
        type: "driver_absent",
        severity: "high",
        message: `${d.name} (${d.platform}) — غائب اليوم، لم يسجل أي طلبات`,
        timestamp: new Date().toISOString(),
      });
    } else if (d.todayCompleted / d.todayTarget < 0.5) {
      alerts.push({
        id: `alert-${id++}`,
        type: "driver_low",
        severity: "medium",
        message: `${d.name} (${d.platform}) — أقل من 50% من التارقت اليومي (${d.todayCompleted}/${d.todayTarget})`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Platforms at risk of missing weekly target
  platforms.forEach((p) => {
    const weekPct = p.achievedWeek / p.weeklyTarget;
    if (weekPct < 0.7) {
      alerts.push({
        id: `alert-${id++}`,
        type: "platform_risk",
        severity: "high",
        message: `${p.name} — خطر عدم تحقيق التارقت الأسبوعي (${Math.round(weekPct * 100)}% فقط)`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return alerts;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function pctColor(pct: number): string {
  if (pct >= 90) return "#22c55e";
  if (pct >= 70) return "#f59e0b";
  return "#ef4444";
}

function statusLabel(s: DriverStatus): { text: string; bg: string; fg: string } {
  switch (s) {
    case "on_target":
      return { text: "على التارقت", bg: "rgba(34,197,94,0.15)", fg: "#22c55e" };
    case "at_risk":
      return { text: "معرّض", bg: "rgba(245,158,11,0.15)", fg: "#f59e0b" };
    case "below_target":
      return { text: "أقل من التارقت", bg: "rgba(239,68,68,0.15)", fg: "#ef4444" };
    case "absent":
      return { text: "غائب", bg: "rgba(99,109,131,0.15)", fg: "#636D83" };
  }
}

function ratingBadge(r: PerformanceRating): { bg: string; fg: string } {
  switch (r) {
    case "A":
      return { bg: "rgba(34,197,94,0.15)", fg: "#22c55e" };
    case "B":
      return { bg: "rgba(59,130,246,0.15)", fg: "#3b82f6" };
    case "C":
      return { bg: "rgba(239,68,68,0.15)", fg: "#ef4444" };
  }
}

const anim = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" },
  }),
};

/* ── Component ─────────────────────────────────────────────────────────── */
export default function TargetTracking() {
  const [platforms, setPlatforms] = useState<PlatformTarget[]>([]);
  const [drivers, setDrivers] = useState<DriverPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase) {
        // Try to fetch real data grouped by platform
        const today = new Date().toISOString().slice(0, 10);
        const { data: orderData } = await supabase
          .from("orders")
          .select("platform, driver_id, status, created_at")
          .gte("created_at", today);

        if (orderData?.length) {
          // Build platform stats from real data
          const platformStats: Record<string, number> = {};
          orderData.forEach((o: any) => {
            const key = o.platform || "other";
            platformStats[key] = (platformStats[key] || 0) + 1;
          });

          const realPlatforms = PLATFORMS_CONFIG.map((p) => ({
            ...p,
            achievedToday: platformStats[p.id] || 0,
            achievedWeek: Math.round((platformStats[p.id] || 0) * 5.5),
            achievedMonth: Math.round((platformStats[p.id] || 0) * 24),
          }));
          setPlatforms(realPlatforms);
          // Build driver stats from real data
          // For now, fall through to mock if not enough data
          if (Object.keys(platformStats).length >= 2) {
            setDrivers([]);
            setLoading(false);
            return;
          }
        }
      }
    } catch {
      /* fall through to mock */
    }

    // No data available
    setPlatforms([]);
    setDrivers([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const alerts = useMemo(
    () => generateAlerts(platforms, drivers),
    [platforms, drivers],
  );

  const filteredDrivers = useMemo(() => {
    if (!filterPlatform) return drivers;
    return drivers.filter((d) => d.platform === filterPlatform);
  }, [drivers, filterPlatform]);

  /* KPI calculations */
  const totalDailyTarget = platforms.reduce((s, p) => s + p.dailyTarget, 0);
  const totalAchievedToday = platforms.reduce((s, p) => s + p.achievedToday, 0);
  const overallPct = totalDailyTarget > 0 ? Math.round((totalAchievedToday / totalDailyTarget) * 100) : 0;
  const activeDrivers = drivers.filter((d) => d.status !== "absent").length;

  const handleExport = () => {
    const rows = drivers.map((d) => ({
      "اسم المندوب": d.name,
      "الجوال": d.phone,
      "المنصة": d.platform,
      "المنجز اليوم": d.todayCompleted,
      "التارقت اليومي": d.todayTarget,
      "إجمالي الأسبوع": d.weekTotal,
      "إجمالي الشهر": d.monthTotal,
      "التصنيف": d.rating,
      "الحالة": statusLabel(d.status).text,
    }));
    exportToExcel(rows, "target-tracking", "متابعة التارقت");
  };

  const handleCSVExport = () => {
    const rows = drivers.map((d) => ({
      "اسم المندوب": d.name,
      "الجوال": d.phone,
      "المنصة": d.platform,
      "المنجز اليوم": d.todayCompleted,
      "التارقت اليومي": d.todayTarget,
      "إجمالي الأسبوع": d.weekTotal,
      "إجمالي الشهر": d.monthTotal,
      "التصنيف": d.rating,
      "الحالة": statusLabel(d.status).text,
    }));
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${(r as any)[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "target-tracking.csv";
    a.click();
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div
      dir="rtl"
      style={{
        padding: "24px",
        fontFamily: "inherit",
        color: "var(--con-text-primary)",
        minHeight: "100vh",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "var(--con-text-page-title)",
              fontWeight: 700,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Target size={28} style={{ color: "#0ED4C5" }} />
            متابعة التارقت
          </h1>
          <p
            style={{
              fontSize: "var(--con-text-body)",
              color: "var(--con-text-secondary)",
              margin: "6px 0 0",
            }}
          >
            تتبع تحقيق أهداف المنصات وأداء المناديب
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--con-border-default)",
              background: "var(--con-bg-surface-2)",
              color: "var(--con-text-primary)",
              cursor: "pointer",
              fontSize: "var(--con-text-body)",
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            تحديث
          </button>
          <button
            onClick={handleExport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--con-border-brand)",
              background: "rgba(14,212,197,0.10)",
              color: "#0ED4C5",
              cursor: "pointer",
              fontSize: "var(--con-text-body)",
            }}
          >
            <Download size={15} />
            تصدير Excel
          </button>
          <button
            onClick={handleCSVExport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--con-border-default)",
              background: "var(--con-bg-surface-2)",
              color: "var(--con-text-primary)",
              cursor: "pointer",
              fontSize: "var(--con-text-body)",
            }}
          >
            <Download size={15} />
            تصدير CSV
          </button>
          <button
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--con-border-default)",
              background: "var(--con-bg-surface-2)",
              color: "var(--con-text-primary)",
              cursor: "pointer",
              fontSize: "var(--con-text-body)",
            }}
          >
            <Printer size={15} />
            طباعة
          </button>
        </div>
      </div>

      {/* ── KPI Summary ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "إجمالي التارقت اليومي",
            value: totalDailyTarget,
            icon: <Target size={20} />,
            color: "#3b82f6",
          },
          {
            label: "المحقق اليوم",
            value: totalAchievedToday,
            icon: <CheckCircle2 size={20} />,
            color: "#22c55e",
          },
          {
            label: "النسبة",
            value: `${overallPct}%`,
            icon: overallPct >= 70 ? <TrendingUp size={20} /> : <TrendingDown size={20} />,
            color: pctColor(overallPct),
          },
          {
            label: "المناديب النشطين",
            value: `${activeDrivers} / ${drivers.length}`,
            icon: <Users size={20} />,
            color: "#a855f7",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            variants={anim}
            initial="hidden"
            animate="show"
            custom={i}
            style={{
              background: "var(--con-bg-surface-1)",
              border: "1px solid var(--con-border-default)",
              borderRadius: 12,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `${kpi.color}18`,
                color: kpi.color,
                flexShrink: 0,
              }}
            >
              {kpi.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-secondary)",
                }}
              >
                {kpi.label}
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700 }}>{kpi.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Platform Target Cards ───────────────────────────────────────── */}
      <h2
        style={{
          fontSize: "var(--con-text-section-title)",
          fontWeight: 600,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Package size={20} style={{ color: "#0ED4C5" }} />
        أهداف المنصات
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 36,
        }}
      >
        {platforms.map((p, i) => {
          const dailyPct = Math.round((p.achievedToday / p.dailyTarget) * 100);
          const weekPct = Math.round((p.achievedWeek / p.weeklyTarget) * 100);
          const monthPct = Math.round((p.achievedMonth / p.monthlyTarget) * 100);
          const statusColor = pctColor(dailyPct);
          const statusText =
            dailyPct >= 90
              ? "على المسار"
              : dailyPct >= 70
                ? "معرّض للخطر"
                : "متأخر";

          return (
            <motion.div
              key={p.id}
              variants={anim}
              initial="hidden"
              animate="show"
              custom={i}
              style={{
                background: "var(--con-bg-surface-1)",
                border: "1px solid var(--con-border-default)",
                borderRadius: 14,
                padding: 20,
                borderTop: `3px solid ${p.color}`,
              }}
            >
              {/* Platform name + status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: `${p.color}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                      color: p.color,
                    }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "var(--con-text-card-title)" }}>
                    {p.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "var(--con-text-caption)",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: `${statusColor}18`,
                    color: statusColor,
                  }}
                >
                  {statusText}
                </span>
              </div>

              {/* Daily progress */}
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "var(--con-text-caption)",
                    color: "var(--con-text-secondary)",
                    marginBottom: 6,
                  }}
                >
                  <span>اليوم</span>
                  <span>
                    {p.achievedToday} / {p.dailyTarget} ({dailyPct}%)
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: "var(--con-bg-overlay)",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(dailyPct, 100)}%` }}
                    transition={{ duration: 0.7, delay: i * 0.08 }}
                    style={{
                      height: "100%",
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${p.color}, ${statusColor})`,
                    }}
                  />
                </div>
              </div>

              {/* Weekly + Monthly */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  fontSize: "var(--con-text-caption)",
                }}
              >
                <div
                  style={{
                    background: "var(--con-bg-surface-2)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ color: "var(--con-text-muted)", marginBottom: 2 }}>
                    أسبوعي
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {p.achievedWeek}{" "}
                    <span style={{ color: "var(--con-text-muted)" }}>/ {p.weeklyTarget}</span>
                  </div>
                  <div style={{ color: pctColor(weekPct), fontWeight: 600 }}>{weekPct}%</div>
                </div>
                <div
                  style={{
                    background: "var(--con-bg-surface-2)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ color: "var(--con-text-muted)", marginBottom: 2 }}>
                    شهري
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {p.achievedMonth}{" "}
                    <span style={{ color: "var(--con-text-muted)" }}>/ {p.monthlyTarget}</span>
                  </div>
                  <div style={{ color: pctColor(monthPct), fontWeight: 600 }}>{monthPct}%</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Driver Performance Table ────────────────────────────────────── */}
      <h2
        style={{
          fontSize: "var(--con-text-section-title)",
          fontWeight: 600,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Users size={20} style={{ color: "#0ED4C5" }} />
        أداء المناديب
      </h2>

      {/* Platform filter */}
      <div style={{ marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setFilterPlatform("")}
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            border: "1px solid var(--con-border-default)",
            background: !filterPlatform ? "rgba(14,212,197,0.15)" : "var(--con-bg-surface-2)",
            color: !filterPlatform ? "#0ED4C5" : "var(--con-text-secondary)",
            cursor: "pointer",
            fontSize: "var(--con-text-caption)",
            fontWeight: 600,
          }}
        >
          الكل
        </button>
        {PLATFORMS_CONFIG.map((p) => (
          <button
            key={p.id}
            onClick={() => setFilterPlatform(p.name)}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: `1px solid ${filterPlatform === p.name ? p.color : "var(--con-border-default)"}`,
              background: filterPlatform === p.name ? `${p.color}22` : "var(--con-bg-surface-2)",
              color: filterPlatform === p.name ? p.color : "var(--con-text-secondary)",
              cursor: "pointer",
              fontSize: "var(--con-text-caption)",
              fontWeight: 600,
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <motion.div
        variants={anim}
        initial="hidden"
        animate="show"
        custom={0}
        style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 36,
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "var(--con-text-table)",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--con-bg-surface-2)",
                  borderBottom: "1px solid var(--con-border-default)",
                }}
              >
                {[
                  "المندوب",
                  "الجوال",
                  "المنصة",
                  "اليوم (منجز/تارقت)",
                  "الأسبوع",
                  "الشهر",
                  "التصنيف",
                  "الحالة",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 14px",
                      textAlign: "start",
                      fontWeight: 600,
                      color: "var(--con-text-secondary)",
                      whiteSpace: "nowrap",
                      fontSize: "var(--con-text-caption)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((d, i) => {
                const todayPct =
                  d.todayTarget > 0
                    ? Math.round((d.todayCompleted / d.todayTarget) * 100)
                    : 0;
                const st = statusLabel(d.status);
                const rb = ratingBadge(d.rating);

                return (
                  <motion.tr
                    key={d.id}
                    variants={anim}
                    initial="hidden"
                    animate="show"
                    custom={i}
                    style={{
                      borderBottom: "1px solid var(--con-border-default)",
                    }}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>{d.name}</td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--con-text-secondary)",
                        direction: "ltr",
                        textAlign: "start",
                      }}
                    >
                      {d.phone}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: 12,
                          background: `${d.platformColor}18`,
                          color: d.platformColor,
                          fontWeight: 600,
                          fontSize: "var(--con-text-caption)",
                        }}
                      >
                        {d.platform}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>
                          {d.todayCompleted}/{d.todayTarget}
                        </span>
                        <span
                          style={{
                            fontSize: "var(--con-text-caption)",
                            color: pctColor(todayPct),
                            fontWeight: 600,
                          }}
                        >
                          ({todayPct}%)
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>{d.weekTotal}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>{d.monthTotal}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 10px",
                          borderRadius: 12,
                          background: rb.bg,
                          color: rb.fg,
                          fontWeight: 700,
                          fontSize: "var(--con-text-caption)",
                        }}
                      >
                        <Star size={12} />
                        {d.rating}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          padding: "3px 12px",
                          borderRadius: 12,
                          background: st.bg,
                          color: st.fg,
                          fontWeight: 600,
                          fontSize: "var(--con-text-caption)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {st.text}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredDrivers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: "var(--con-text-muted)",
                    }}
                  >
                    لا يوجد مناديب
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Alerts Section ──────────────────────────────────────────────── */}
      <h2
        style={{
          fontSize: "var(--con-text-section-title)",
          fontWeight: 600,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <AlertTriangle size={20} style={{ color: "#f59e0b" }} />
        التنبيهات
        {alerts.length > 0 && (
          <span
            style={{
              fontSize: "var(--con-text-caption)",
              background: "rgba(239,68,68,0.15)",
              color: "#ef4444",
              padding: "2px 10px",
              borderRadius: 20,
              fontWeight: 700,
            }}
          >
            {alerts.length}
          </span>
        )}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {alerts.length === 0 && (
          <div
            style={{
              background: "var(--con-bg-surface-1)",
              border: "1px solid var(--con-border-default)",
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              color: "var(--con-text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
            لا توجد تنبيهات حاليًا
          </div>
        )}
        {alerts.map((a, i) => {
          const severityColor =
            a.severity === "high"
              ? "#ef4444"
              : a.severity === "medium"
                ? "#f59e0b"
                : "#3b82f6";
          const icon =
            a.type === "driver_absent" ? (
              <XCircle size={16} />
            ) : a.type === "platform_risk" ? (
              <TrendingDown size={16} />
            ) : (
              <Clock size={16} />
            );

          return (
            <motion.div
              key={a.id}
              variants={anim}
              initial="hidden"
              animate="show"
              custom={i}
              style={{
                background: "var(--con-bg-surface-1)",
                border: `1px solid ${severityColor}33`,
                borderInlineStart: `4px solid ${severityColor}`,
                borderRadius: 10,
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: "var(--con-text-body)",
              }}
            >
              <div style={{ color: severityColor, flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1 }}>{a.message}</div>
              <span
                style={{
                  fontSize: "var(--con-text-caption)",
                  padding: "2px 8px",
                  borderRadius: 8,
                  background: `${severityColor}15`,
                  color: severityColor,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {a.severity === "high" ? "عالي" : a.severity === "medium" ? "متوسط" : "منخفض"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
