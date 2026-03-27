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
import { useEffect } from "react";
import { useAuth } from "@/lib/admin/auth";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useModuleRegistry } from "@/stores/useModuleRegistry";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { PageWrapper, PageHeader } from "@/components/admin/ui";
import { WidgetZone } from "@/components/admin/dashboard/WidgetZone";
import { LayoutDashboard, RefreshCw } from "lucide-react";

// Widgets
import { KPIOverview } from "@/components/admin/dashboard/widgets/KPIOverview";
import { SystemHealth } from "@/components/admin/dashboard/widgets/SystemHealth";
import { QuickActions } from "@/components/admin/dashboard/widgets/QuickActions";
import { ChartsPanel } from "@/components/admin/dashboard/widgets/ChartsPanel";
import { AlertsPanel } from "@/components/admin/dashboard/widgets/AlertsPanel";
import { RecentActivity } from "@/components/admin/dashboard/widgets/RecentActivity";
import { PendingApprovals } from "@/components/admin/dashboard/widgets/PendingApprovals";
import { FinanceSnapshot } from "@/components/admin/dashboard/widgets/FinanceSnapshot";
import { OperationsMap } from "@/components/admin/dashboard/widgets/OperationsMap";
import { ModuleStatusGrid } from "@/components/admin/dashboard/widgets/ModuleStatusGrid";
import { InfrastructurePanel } from "@/components/admin/dashboard/widgets/InfrastructurePanel";

// ─── Helpers ────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "مساء الخير";
  return "مساء النور";
}

// ─── Control Tower ──────────────────────────────────────────────────────────
export default function ControlTower() {
  const { user, hasPermission } = useAuth();
  const { fetchStats, lastRefresh } = useDashboardStore();
  const { initialize } = useModuleRegistry();
  const { loadNotifications } = useNotificationStore();

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const canViewFinance = hasPermission("finance");
  const canViewOrders = hasPermission("orders");

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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastRefresh && (
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)" }}>
                آخر تحديث: {new Date(lastRefresh).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={() => fetchStats()}
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
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>
                النظام يعمل
              </span>
            </div>
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════════════════
         ZONE A: Executive Overview — KPIs + Quick Actions
         ═══════════════════════════════════════════════════════════════════════ */}
      <WidgetZone zone="executive" gap={14}>
        <KPIOverview />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <SystemHealth />
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
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
        {/* Left Column — Main operational data */}
        <WidgetZone zone="main" gap={14}>
          <ChartsPanel />
          <RecentActivity />
          {canViewOrders && <OperationsMap />}
        </WidgetZone>

        {/* Right Column — Alerts, approvals, module status */}
        <WidgetZone zone="sidebar" gap={14}>
          <AlertsPanel />
          <PendingApprovals />
          {isAdmin && <ModuleStatusGrid />}
        </WidgetZone>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
         ZONE C: Finance Strip — Collapsible, permission-gated
         ═══════════════════════════════════════════════════════════════════════ */}
      {canViewFinance && (
        <WidgetZone zone="finance" title="نظرة مالية" collapsible>
          <FinanceSnapshot />
        </WidgetZone>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
         ZONE D: Infrastructure — Admin only
         ═══════════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <WidgetZone zone="infrastructure" title="البنية التحتية" collapsible>
          <InfrastructurePanel />
        </WidgetZone>
      )}
    </PageWrapper>
  );
}
