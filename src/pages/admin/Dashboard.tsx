/**
 * مركز التحكم — Control Tower
 * لوحة إدارة فيرست لاين المركزية
 *
 * Zone-based modular dashboard:
 *   Zone A: Executive Overview (KPIs + System Health + Quick Actions)
 *   Zone B: Operational Control (Charts + Alerts + Activity + Approvals)
 *   Zone C: Finance Strip (collapsible, permission-gated)
 *   Zone D: Infrastructure + Module Status (admin only)
 */
import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import { useAuth } from "@/lib/admin/auth";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useModuleRegistry } from "@/stores/useModuleRegistry";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { PageWrapper, PageHeader } from "@/components/admin/ui";
import { WidgetZone } from "@/components/admin/dashboard/WidgetZone";
import {
  LayoutDashboard,
  RefreshCw,
  Timer,
  TimerOff,
  Maximize,
  Minimize,
} from "lucide-react";

// Eager widgets (above-the-fold)
import { KPIOverview } from "@/components/admin/dashboard/widgets/KPIOverview";
import { QuickActions } from "@/components/admin/dashboard/widgets/QuickActions";

// Lazy widgets (below-the-fold) — each becomes its own async chunk
const SystemHealth = lazy(() =>
  import("@/components/admin/dashboard/widgets/SystemHealth").then((m) => ({ default: m.SystemHealth })),
);
const ChartsPanel = lazy(() =>
  import("@/components/admin/dashboard/widgets/ChartsPanel").then((m) => ({ default: m.ChartsPanel })),
);
const AlertsPanel = lazy(() =>
  import("@/components/admin/dashboard/widgets/AlertsPanel").then((m) => ({ default: m.AlertsPanel })),
);
const RecentActivity = lazy(() =>
  import("@/components/admin/dashboard/widgets/RecentActivity").then((m) => ({ default: m.RecentActivity })),
);
const PendingApprovals = lazy(() =>
  import("@/components/admin/dashboard/widgets/PendingApprovals").then((m) => ({ default: m.PendingApprovals })),
);
const FinanceSnapshot = lazy(() =>
  import("@/components/admin/dashboard/widgets/FinanceSnapshot").then((m) => ({ default: m.FinanceSnapshot })),
);
const OperationsMap = lazy(() =>
  import("@/components/admin/dashboard/widgets/OperationsMap").then((m) => ({ default: m.OperationsMap })),
);
const ModuleStatusGrid = lazy(() =>
  import("@/components/admin/dashboard/widgets/ModuleStatusGrid").then((m) => ({ default: m.ModuleStatusGrid })),
);
const InfrastructurePanel = lazy(() =>
  import("@/components/admin/dashboard/widgets/InfrastructurePanel").then((m) => ({ default: m.InfrastructurePanel })),
);
const ActiveDrivers = lazy(() =>
  import("@/components/admin/dashboard/widgets/ActiveDrivers").then((m) => ({ default: m.ActiveDrivers })),
);

// Skeleton fallback while a lazy widget loads
function WidgetSkeleton({ height = 180 }: { height?: number }) {
  return (
    <div
      style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--con-text-muted)",
        fontSize: 12,
      }}
    >
      جاري التحميل...
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "مساء الخير";
  return "مساء النور";
}

// ─── Control Tower ──────────────────────────────────────────────────────────
// ─── Auto-refresh intervals ────────────────────────────────────────────────
const AUTO_REFRESH_OPTIONS = [
  { label: "إيقاف", value: 0 },
  { label: "30 ثانية", value: 30 },
  { label: "دقيقة", value: 60 },
  { label: "5 دقائق", value: 300 },
];

export default function ControlTower() {
  const { user, hasPermission } = useAuth();
  const { fetchStats, lastRefresh } = useDashboardStore();
  const { initialize } = useModuleRegistry();
  const { loadNotifications } = useNotificationStore();

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const canViewFinance = hasPermission("finance");
  const canViewOrders = hasPermission("orders");

  // ─── Auto-refresh state ───────────────────────────────────────────────
  const [autoRefreshSec, setAutoRefreshSec] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [compactMode, setCompactMode] = useState(false);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshAll = useCallback(() => {
    fetchStats();
    loadNotifications();
  }, [fetchStats, loadNotifications]);

  // Auto-refresh logic
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (autoRefreshSec > 0) {
      setCountdown(autoRefreshSec);
      intervalRef.current = setInterval(() => {
        refreshAll();
        setCountdown(autoRefreshSec);
      }, autoRefreshSec * 1000);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : autoRefreshSec));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefreshSec, refreshAll]);

  useEffect(() => {
    initialize();
    fetchStats();
    loadNotifications();
  }, [initialize, fetchStats, loadNotifications]);

  const todayDate = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageWrapper>
      {/* ── Page Header ── */}
      <PageHeader
        icon={LayoutDashboard}
        title="مركز التحكم"
        subtitle={`${getGreeting()} ${user?.full_name || ""} · ${todayDate}`}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {/* Last refresh time */}
            {lastRefresh && (
              <span
                style={{
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-muted)",
                  fontFamily: "var(--con-font-mono)",
                }}
              >
                آخر تحديث:{" "}
                {new Date(lastRefresh).toLocaleTimeString("ar-SA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}

            {/* Auto-refresh selector */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowRefreshMenu(!showRefreshMenu)}
                title={autoRefreshSec > 0 ? `تحديث تلقائي كل ${autoRefreshSec} ثانية` : "تحديث تلقائي"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 10px",
                  borderRadius: "var(--con-radius)",
                  background: autoRefreshSec > 0 ? "var(--con-success)14" : "var(--con-bg-surface-1)",
                  border: `1px solid ${autoRefreshSec > 0 ? "var(--con-success)40" : "var(--con-border-default)"}`,
                  color: autoRefreshSec > 0 ? "var(--con-success)" : "var(--con-text-secondary)",
                  fontSize: "var(--con-text-caption)",
                  cursor: "pointer",
                  fontFamily: "var(--con-font-primary)",
                  transition: "all 0.15s",
                }}
              >
                {autoRefreshSec > 0 ? <Timer size={13} /> : <TimerOff size={13} />}
                {autoRefreshSec > 0 && (
                  <span style={{ fontFamily: "var(--con-font-mono)", fontSize: 11, minWidth: 18, textAlign: "center" }}>
                    {countdown}s
                  </span>
                )}
              </button>
              {showRefreshMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 4,
                    background: "var(--con-bg-surface-2)",
                    border: "1px solid var(--con-border-default)",
                    borderRadius: "var(--con-radius)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                    zIndex: 100,
                    minWidth: 130,
                    overflow: "hidden",
                  }}
                  onMouseLeave={() => setShowRefreshMenu(false)}
                >
                  {AUTO_REFRESH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setAutoRefreshSec(opt.value); setShowRefreshMenu(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "7px 12px",
                        background: autoRefreshSec === opt.value ? "var(--con-brand)14" : "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: autoRefreshSec === opt.value ? "var(--con-brand)" : "var(--con-text-secondary)",
                        fontSize: "var(--con-text-caption)",
                        fontFamily: "var(--con-font-primary)",
                        fontWeight: autoRefreshSec === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.label}
                      {autoRefreshSec === opt.value && (
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--con-brand)" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manual refresh */}
            <button
              onClick={() => refreshAll()}
              title="تحديث البيانات"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: "var(--con-radius)",
                background: "var(--con-bg-surface-1)",
                border: "1px solid var(--con-border-default)",
                color: "var(--con-text-secondary)",
                fontSize: "var(--con-text-caption)",
                cursor: "pointer",
                fontFamily: "var(--con-font-primary)",
              }}
            >
              <RefreshCw size={13} />
              تحديث
            </button>

            {/* Compact mode toggle */}
            <button
              onClick={() => setCompactMode(!compactMode)}
              title={compactMode ? "عرض موسع" : "عرض مدمج"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 10px",
                borderRadius: "var(--con-radius)",
                background: compactMode ? "var(--con-brand)14" : "var(--con-bg-surface-1)",
                border: `1px solid ${compactMode ? "var(--con-brand)40" : "var(--con-border-default)"}`,
                color: compactMode ? "var(--con-brand)" : "var(--con-text-secondary)",
                fontSize: "var(--con-text-caption)",
                cursor: "pointer",
                fontFamily: "var(--con-font-primary)",
                transition: "all 0.15s",
              }}
            >
              {compactMode ? <Maximize size={13} /> : <Minimize size={13} />}
            </button>

            {/* System status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: "var(--con-radius)",
                background: "var(--con-bg-surface-1)",
                border: "1px solid var(--con-border-default)",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--con-success)",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                style={{
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-secondary)",
                }}
              >
                النظام يعمل
              </span>
            </div>
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════════════════
         ZONE A: Executive Overview — KPIs + Quick Actions (eager)
         ═══════════════════════════════════════════════════════════════════════ */}
      <WidgetZone zone="executive" gap={compactMode ? 8 : 14}>
        <KPIOverview />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Suspense fallback={<WidgetSkeleton height={220} />}>
            <SystemHealth />
          </Suspense>
          <div
            style={{
              background: "var(--con-bg-surface-1)",
              border: "1px solid var(--con-border-default)",
              borderRadius: "var(--con-radius-lg)",
              padding: "14px 16px",
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
              إجراءات سريعة
            </h3>
            <QuickActions />
          </div>
        </div>
      </WidgetZone>

      {/* ═══════════════════════════════════════════════════════════════════════
         ZONE B: Operational Control — Charts, Alerts, Activity, Approvals
         ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: compactMode ? 8 : 14 }}
      >
        {/* Left Column — Main operational data */}
        <WidgetZone zone="main" gap={compactMode ? 8 : 14}>
          <Suspense fallback={<WidgetSkeleton height={320} />}>
            <ChartsPanel />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton height={280} />}>
            <RecentActivity />
          </Suspense>
          {canViewOrders && (
            <Suspense fallback={<WidgetSkeleton height={300} />}>
              <OperationsMap />
            </Suspense>
          )}
        </WidgetZone>

        {/* Right Column — Alerts, approvals, module status */}
        <WidgetZone zone="sidebar" gap={compactMode ? 8 : 14}>
          <Suspense fallback={<WidgetSkeleton height={400} />}>
            <ActiveDrivers />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton height={220} />}>
            <AlertsPanel />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton height={260} />}>
            <PendingApprovals />
          </Suspense>
          {isAdmin && (
            <Suspense fallback={<WidgetSkeleton height={200} />}>
              <ModuleStatusGrid />
            </Suspense>
          )}
        </WidgetZone>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
         ZONE C: Finance Strip — Collapsible, permission-gated
         ═══════════════════════════════════════════════════════════════════════ */}
      {canViewFinance && (
        <WidgetZone zone="finance" title="نظرة مالية" collapsible>
          <Suspense fallback={<WidgetSkeleton height={200} />}>
            <FinanceSnapshot />
          </Suspense>
        </WidgetZone>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
         ZONE D: Infrastructure — Admin only
         ═══════════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <WidgetZone zone="infrastructure" title="البنية التحتية" collapsible>
          <Suspense fallback={<WidgetSkeleton height={200} />}>
            <InfrastructurePanel />
          </Suspense>
        </WidgetZone>
      )}
    </PageWrapper>
  );
}
