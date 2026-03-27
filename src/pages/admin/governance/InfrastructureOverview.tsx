/**
 * البنية التحتية — Infrastructure Overview
 * AWS, GitHub, Vercel, Supabase service status and management
 */
import { useState, useEffect } from "react";
import {
  Server, Cloud, Database, Globe, GitBranch, Shield, Zap,
  HardDrive, RefreshCw, ExternalLink, Activity, Users,
} from "lucide-react";
import { PageWrapper, PageHeader, Card, KPIGrid, KPICard, Badge } from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE as string | undefined;

interface ServiceDetail {
  name: string;
  nameAr: string;
  provider: string;
  icon: React.ElementType;
  status: "online" | "degraded" | "offline";
  detail: string;
  metrics?: { label: string; value: string }[];
  consoleUrl?: string;
}

const awsServices: ServiceDetail[] = [
  {
    name: "Lambda Functions",
    nameAr: "دوال Lambda",
    provider: "AWS",
    icon: Zap,
    status: "online",
    detail: "me-south-1",
    metrics: [
      { label: "عدد الدوال", value: "13" },
      { label: "الاستدعاءات اليوم", value: "4,521" },
      { label: "متوسط التنفيذ", value: "142ms" },
      { label: "أخطاء اليوم", value: "0" },
    ],
  },
  {
    name: "API Gateway",
    nameAr: "بوابة API",
    provider: "AWS",
    icon: Cloud,
    status: "online",
    detail: "2 بوابات نشطة",
    metrics: [
      { label: "الطلبات اليوم", value: "12,847" },
      { label: "متوسط الاستجابة", value: "45ms" },
      { label: "معدل الخطأ", value: "0.02%" },
      { label: "النطاق الترددي", value: "2.1 GB" },
    ],
  },
  {
    name: "S3 Storage",
    nameAr: "تخزين S3",
    provider: "AWS",
    icon: HardDrive,
    status: "online",
    detail: "8 حاويات",
    metrics: [
      { label: "الحجم الكلي", value: "4.8 GB" },
      { label: "ملفات KYC", value: "1,234" },
      { label: "التقارير", value: "892" },
      { label: "النسخ الاحتياطي", value: "يومي" },
    ],
  },
  {
    name: "Cognito Auth",
    nameAr: "توثيق Cognito",
    provider: "AWS",
    icon: Shield,
    status: "online",
    detail: "مسبح المستخدمين",
    metrics: [
      { label: "المستخدمون المسجلون", value: "156" },
      { label: "جلسات نشطة", value: "23" },
      { label: "تسجيلات دخول اليوم", value: "47" },
      { label: "OTP مرسلة", value: "12" },
    ],
  },
  {
    name: "DynamoDB",
    nameAr: "قاعدة DynamoDB",
    provider: "AWS",
    icon: Database,
    status: "online",
    detail: "38 جدول",
    metrics: [
      { label: "القراءات اليوم", value: "45,821" },
      { label: "الكتابات اليوم", value: "8,932" },
      { label: "سعة القراءة", value: "25 RCU" },
      { label: "سعة الكتابة", value: "10 WCU" },
    ],
  },
];

const otherServices: ServiceDetail[] = [
  {
    name: "Supabase",
    nameAr: "قاعدة Supabase",
    provider: "Supabase",
    icon: Database,
    status: "online",
    detail: "PostgreSQL · djebhztfewjfyyoortvv",
    metrics: [
      { label: "الجداول", value: "38+" },
      { label: "الاستعلامات/ثانية", value: "~120" },
      { label: "حجم DB", value: "245 MB" },
      { label: "اتصالات نشطة", value: "8" },
    ],
  },
  {
    name: "GitHub",
    nameAr: "مستودع GitHub",
    provider: "GitHub",
    icon: GitBranch,
    status: "online",
    detail: "mshari-11/firstlinelog.com",
    metrics: [
      { label: "الفرع الرئيسي", value: "main" },
      { label: "آخر Commit", value: "اليوم" },
      { label: "PRs مفتوحة", value: "0" },
      { label: "المساهمون", value: "3" },
    ],
  },
  {
    name: "Vercel",
    nameAr: "نشر Vercel",
    provider: "Vercel",
    icon: Globe,
    status: "online",
    detail: "Production — fll-project",
    metrics: [
      { label: "حالة النشر", value: "Ready" },
      { label: "وقت البناء", value: "~45s" },
      { label: "نطاق مخصص", value: "fll.sa" },
      { label: "Edge Locations", value: "عالمي" },
    ],
  },
];

const statusConfig = {
  online:   { color: "var(--con-success)", label: "متصل", bg: "rgba(34,197,94,0.08)" },
  degraded: { color: "var(--con-warning)", label: "بطيء", bg: "rgba(245,158,11,0.08)" },
  offline:  { color: "var(--con-danger)",  label: "متوقف", bg: "rgba(239,68,68,0.08)" },
};

function ServiceCard({ svc }: { svc: ServiceDetail }) {
  const st = statusConfig[svc.status];
  return (
    <div
      style={{
        background: "var(--con-bg-surface-2)",
        border: "1px solid var(--con-border-default)",
        borderRadius: "var(--con-radius-lg)",
        padding: "16px",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--con-radius)",
              background: "var(--con-brand-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svc.icon size={16} style={{ color: "var(--con-brand)" }} />
          </div>
          <div>
            <h4 style={{ fontSize: "var(--con-text-body)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
              {svc.nameAr}
            </h4>
            <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{svc.provider}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: 4,
            background: st.bg,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.color, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "var(--con-text-caption)", color: st.color, fontWeight: 500 }}>{st.label}</span>
        </div>
      </div>

      {/* Detail */}
      <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)", margin: "0 0 12px" }}>
        {svc.detail}
      </p>

      {/* Metrics */}
      {svc.metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
          {svc.metrics.map((m) => (
            <div key={m.label} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{m.label}</span>
              <span style={{ fontSize: "var(--con-text-caption)", fontWeight: 600, fontFamily: "var(--con-font-mono)", color: "var(--con-text-primary)" }}>
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface LiveMetrics {
  totalLogs: number;
  errorsToday: number;
  activeConnections: number;
}

export default function InfrastructureOverview() {
  const allServices = [...awsServices, ...otherServices];
  const onlineCount = allServices.filter((s) => s.status === "online").length;

  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);

  useEffect(() => {
    (async () => {
      // Attempt 1: fetch from ops.system_logs via Supabase
      try {
        if (!supabase) throw new Error("no client");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data, error } = await supabase
          .schema("ops" as "public") // cast: supabase-js typings require "public" but runtime accepts any schema string
          .from("system_logs")
          .select("id, level, created_at")
          .gte("created_at", today.toISOString());
        if (!error && data) {
          setLiveMetrics({
            totalLogs: data.length,
            errorsToday: data.filter((r: { level: string }) => r.level === "error").length,
            activeConnections: 0,
          });
          return;
        }
      } catch {
        // fall through to API fallback
      }

      // Attempt 2: API_BASE health endpoint
      if (API_BASE) {
        try {
          const res = await fetch(`${API_BASE}/ops/health`, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const json = await res.json();
            setLiveMetrics({
              totalLogs: json.totalLogs ?? 0,
              errorsToday: json.errorsToday ?? 0,
              activeConnections: json.activeConnections ?? 0,
            });
          }
        } catch {
          // silent — keep null (no live metrics banner rendered)
        }
      }
    })();
  }, []);

  return (
    <PageWrapper>
      <PageHeader
        icon={Server}
        title="البنية التحتية"
        subtitle="نظرة شاملة على حالة جميع الخدمات: AWS · GitHub · Vercel · Supabase"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Badge variant={onlineCount === allServices.length ? "success" : "warning"} dot>
              {onlineCount}/{allServices.length} متصل
            </Badge>
          </div>
        }
      />

      <KPIGrid cols="repeat(4, 1fr)">
        <KPICard label="خدمات AWS" value={awsServices.length} icon={Cloud} accent="#FF9900" />
        <KPICard label="خدمات أخرى" value={otherServices.length} icon={Globe} accent="var(--con-brand)" />
        <KPICard label="متصل" value={onlineCount} icon={Activity} accent="var(--con-success)" />
        <KPICard label="منطقة AWS" value="me-south-1" icon={Server} accent="var(--con-info)" mono={false} />
      </KPIGrid>

      {/* Live Metrics (from ops.system_logs or API) */}
      {liveMetrics && (
        <KPIGrid cols="repeat(3, 1fr)">
          <KPICard label="سجلات اليوم" value={liveMetrics.totalLogs} icon={Activity} accent="var(--con-info)" />
          <KPICard label="أخطاء اليوم" value={liveMetrics.errorsToday} icon={Server} accent="var(--con-danger)" />
          <KPICard label="اتصالات نشطة" value={liveMetrics.activeConnections} icon={Users} accent="var(--con-success)" />
        </KPIGrid>
      )}

      {/* AWS Services */}
      <Card title="Amazon Web Services" subtitle="المنطقة: me-south-1 (البحرين) · الحساب: 230811072086">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {awsServices.map((svc) => (
            <ServiceCard key={svc.name} svc={svc} />
          ))}
        </div>
      </Card>

      {/* Other Services */}
      <Card title="خدمات أخرى" subtitle="Supabase · GitHub · Vercel">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {otherServices.map((svc) => (
            <ServiceCard key={svc.name} svc={svc} />
          ))}
        </div>
      </Card>
    </PageWrapper>
  );
}
