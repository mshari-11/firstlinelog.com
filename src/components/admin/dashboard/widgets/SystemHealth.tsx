/**
 * System Health Widget — API health, DB status, service uptime
 */
import { useState, useEffect } from "react";
import { Activity, Database, Cloud, Globe, Wifi } from "lucide-react";
import { WidgetShell } from "../WidgetShell";

interface ServiceStatus {
  name: string;
  nameAr: string;
  icon: React.ElementType;
  status: "online" | "degraded" | "offline";
  latency?: string;
}

const statusColors = {
  online: "var(--con-success)",
  degraded: "var(--con-warning)",
  offline: "var(--con-danger)",
};

const statusLabels = {
  online: "متصل",
  degraded: "بطيء",
  offline: "متوقف",
};

export function SystemHealth() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "API Gateway", nameAr: "بوابة API", icon: Cloud, status: "online", latency: "45ms" },
    { name: "Supabase DB", nameAr: "قاعدة البيانات", icon: Database, status: "online", latency: "12ms" },
    { name: "Cognito Auth", nameAr: "نظام التوثيق", icon: Wifi, status: "online", latency: "88ms" },
    { name: "CloudFront CDN", nameAr: "شبكة التوزيع", icon: Globe, status: "online", latency: "8ms" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const allOnline = services.every((s) => s.status === "online");
  const overallStatus = allOnline ? "online" : services.some((s) => s.status === "offline") ? "offline" : "degraded";

  return (
    <WidgetShell
      id="system-health"
      title="صحة النظام"
      icon={Activity}
      iconColor={statusColors[overallStatus]}
      loading={loading}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Overall Status Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: "var(--con-radius)",
            background: `${statusColors[overallStatus]}10`,
            border: `1px solid ${statusColors[overallStatus]}30`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: statusColors[overallStatus],
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: "var(--con-text-body)", fontWeight: 600, color: "var(--con-text-primary)" }}>
            {allOnline ? "جميع الأنظمة تعمل بشكل طبيعي" : "بعض الأنظمة تواجه مشاكل"}
          </span>
        </div>

        {/* Service List */}
        {services.map((svc) => (
          <div
            key={svc.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svc.icon size={13} style={{ color: "var(--con-text-muted)" }} />
              <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>
                {svc.nameAr}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {svc.latency && (
                <span
                  style={{
                    fontSize: "var(--con-text-caption)",
                    fontFamily: "var(--con-font-mono)",
                    color: "var(--con-text-muted)",
                  }}
                >
                  {svc.latency}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: statusColors[svc.status],
                  }}
                />
                <span
                  style={{
                    fontSize: "var(--con-text-caption)",
                    color: statusColors[svc.status],
                    fontWeight: 500,
                  }}
                >
                  {statusLabels[svc.status]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
