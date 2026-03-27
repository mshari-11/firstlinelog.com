/**
 * Infrastructure Panel Widget — AWS, GitHub, Vercel status overview
 */
import { useNavigate } from "react-router-dom";
import { Server, GitBranch, Globe, Cloud, Database, Shield, Zap, HardDrive } from "lucide-react";
import { WidgetShell } from "../WidgetShell";

interface InfraService {
  name: string;
  nameAr: string;
  provider: "aws" | "github" | "vercel" | "supabase";
  icon: React.ElementType;
  status: "online" | "degraded" | "offline";
  detail: string;
}

const services: InfraService[] = [
  { name: "Lambda Functions",  nameAr: "دوال Lambda",        provider: "aws",      icon: Zap,       status: "online", detail: "13 دالة نشطة" },
  { name: "API Gateway",       nameAr: "بوابة API",          provider: "aws",      icon: Cloud,     status: "online", detail: "2 بوابات" },
  { name: "S3 Storage",        nameAr: "تخزين S3",           provider: "aws",      icon: HardDrive, status: "online", detail: "8 حاويات" },
  { name: "Cognito Auth",      nameAr: "توثيق Cognito",      provider: "aws",      icon: Shield,    status: "online", detail: "me-south-1" },
  { name: "DynamoDB",          nameAr: "قاعدة DynamoDB",      provider: "aws",      icon: Database,  status: "online", detail: "38 جدول" },
  { name: "Supabase DB",       nameAr: "قاعدة Supabase",     provider: "supabase", icon: Database,  status: "online", detail: "PostgreSQL" },
  { name: "GitHub Repo",       nameAr: "مستودع GitHub",      provider: "github",   icon: GitBranch, status: "online", detail: "main branch" },
  { name: "Vercel Deploy",     nameAr: "نشر Vercel",         provider: "vercel",   icon: Globe,     status: "online", detail: "Production" },
];

const providerColors: Record<string, string> = {
  aws: "#FF9900",
  github: "#8B5CF6",
  vercel: "#FFFFFF",
  supabase: "#3ECF8E",
};

const statusConfig = {
  online:   { color: "var(--con-success)", label: "متصل" },
  degraded: { color: "var(--con-warning)", label: "بطيء" },
  offline:  { color: "var(--con-danger)",  label: "متوقف" },
};

export function InfrastructurePanel() {
  const navigate = useNavigate();

  const byProvider = Object.groupBy
    ? Object.groupBy(services, (s) => s.provider)
    : services.reduce((acc, s) => {
        (acc[s.provider] = acc[s.provider] || []).push(s);
        return acc;
      }, {} as Record<string, InfraService[]>);

  const providerLabels: Record<string, string> = {
    aws: "Amazon Web Services",
    github: "GitHub",
    vercel: "Vercel",
    supabase: "Supabase",
  };

  return (
    <WidgetShell
      id="infrastructure-panel"
      title="البنية التحتية"
      subtitle="AWS · GitHub · Vercel · Supabase"
      icon={Server}
      iconColor="#FF9900"
      onDrilldown={() => navigate("/admin-panel/governance/infrastructure")}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Object.entries(byProvider).map(([provider, svcs]) => (
          <div key={provider}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 14,
                  borderRadius: 2,
                  background: providerColors[provider] || "var(--con-brand)",
                }}
              />
              <span
                style={{
                  fontSize: "var(--con-text-caption)",
                  fontWeight: 600,
                  color: "var(--con-text-secondary)",
                  letterSpacing: "0.02em",
                }}
              >
                {providerLabels[provider] || provider}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(svcs || []).map((svc) => {
                const st = statusConfig[svc.status];
                return (
                  <div
                    key={svc.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      borderRadius: "var(--con-radius-sm)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svc.icon size={12} style={{ color: "var(--con-text-muted)" }} />
                      <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>
                        {svc.nameAr}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)" }}>
                        {svc.detail}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.color }} />
                        <span style={{ fontSize: 10, color: st.color, fontWeight: 500 }}>{st.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
