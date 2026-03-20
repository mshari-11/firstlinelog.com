import { useAuth } from "@/lib/admin/auth";
import {
  ShieldCheck,
  Settings2,
  User,
  Server,
  ExternalLink,
} from "lucide-react";
import { PageWrapper, PageHeader, Card, Badge, DetailField, DetailGrid, EmptyState } from "@/components/admin/ui";

export default function AdminSettings() {
  const { user } = useAuth();

  const canViewApiKey = user?.role === "admin" || user?.role === "owner";
  // API keys are managed via Vercel Dashboard only — never exposed in frontend
  const keyConfigured = !!import.meta.env.VITE_OPENAI_API_KEY;

  if (!canViewApiKey) {
    return (
      <PageWrapper>
        <EmptyState icon={ShieldCheck} title="وصول مقيّد" description="ليس لديك صلاحية لعرض إعدادات النظام." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader icon={Settings2} title="إعدادات النظام" subtitle="مرئية للمديرين والملاك فقط" />

      <Card title="معلومات الحساب">
        <DetailGrid>
          <DetailField label="الاسم" value={user?.full_name ?? "—"} icon={User} />
          <DetailField label="البريد الإلكتروني" value={user?.email ?? "—"} icon={User} mono />
          <DetailField label="الدور" value={user?.role ?? "—"} icon={ShieldCheck} />
          <DetailField label="المعرّف" value={user?.id ? user.id.slice(0, 8) + "…" : "—"} icon={User} mono />
        </DetailGrid>
      </Card>

      <Card
        title="مفتاح OpenAI API"
        actions={<Badge variant="info">للمديرين فقط</Badge>}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: keyConfigured ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${keyConfigured ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: 7, padding: "8px 12px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: keyConfigured ? "var(--con-success)" : "var(--con-danger)" }} />
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
            {keyConfigured ? "المفتاح مضبوط ويعمل" : "المفتاح غير مضبوط — أضفه في Vercel"}
          </span>
          {!keyConfigured && (
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, marginInlineStart: "auto", fontSize: "var(--con-text-caption)", color: "var(--con-brand)", textDecoration: "none" }}>
              فتح Vercel <ExternalLink size={11} />
            </a>
          )}
        </div>
        <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 8 }}>
          لإدارة المفتاح، استخدم Vercel Dashboard &rarr; Environment Variables. المفاتيح لا تُعرض في الواجهة لأسباب أمنية.
        </p>
      </Card>

      <Card title="معلومات النظام">
        <DetailGrid>
          <DetailField label="المنطقة" value="me-south-1 (البحرين)" icon={Server} />
          <DetailField label="الإصدار" value="1.0.0" icon={Server} mono />
          <DetailField label="البيئة" value={import.meta.env.MODE ?? "production"} icon={Server} mono />
          <DetailField label="قاعدة البيانات" value="Supabase (PostgreSQL)" icon={Server} />
        </DetailGrid>
      </Card>
    </PageWrapper>
  );
}
