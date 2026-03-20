import { useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import {
  Eye,
  EyeOff,
  Key,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Settings2,
  User,
  Server,
  ExternalLink,
} from "lucide-react";
import { PageWrapper, PageHeader, Card, Badge, Button, DetailField, DetailGrid, EmptyState } from "@/components/admin/ui";

export default function AdminSettings() {
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const canViewApiKey = user?.role === "admin" || user?.role === "owner";
  const rawKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const maskedKey = rawKey ? `sk-${"•".repeat(24)}${rawKey.slice(-4)}` : "غير مضبوط — أضف VITE_OPENAI_API_KEY في Vercel";

  const handleCopy = async () => {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
          <AlertTriangle size={14} style={{ color: "var(--con-warning)", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-warning)", margin: 0, lineHeight: 1.5 }}>
            لا تشارك هذا المفتاح مع أي شخص. يتيح الوصول الكامل لحسابك في OpenAI.
          </p>
        </div>

        <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", display: "block", marginBottom: 6, fontWeight: 500 }}>المفتاح الحالي</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--con-bg-surface-2)", border: "1px solid var(--con-border-strong)", borderRadius: 8, padding: "10px 12px" }}>
          <code style={{ flex: 1, fontSize: 12, fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)", direction: "ltr", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: showKey ? "0.02em" : "0.1em" }}>
            {showKey ? rawKey ?? "غير مضبوط" : maskedKey}
          </code>
          {rawKey && showKey && (
            <Button variant="ghost" onClick={handleCopy} style={{ padding: "4px 8px" }}>
              {copied ? <Check size={13} style={{ color: "var(--con-success)" }} /> : <Copy size={13} />}
            </Button>
          )}
          <Button variant="ghost" onClick={() => setShowKey(!showKey)} style={{ padding: "4px 8px" }}>
            {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
          </Button>
        </div>
        <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 6 }}>
          لتغيير المفتاح عدّل `VITE_OPENAI_API_KEY` في Vercel Dashboard ثم أعد النشر.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: rawKey ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${rawKey ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: 7, padding: "8px 12px", marginTop: 12 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: rawKey ? "var(--con-success)" : "var(--con-danger)" }} />
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
            {rawKey ? "المفتاح مضبوط ويعمل" : "المفتاح غير مضبوط — أضفه في Vercel"}
          </span>
          {!rawKey && (
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, marginInlineStart: "auto", fontSize: "var(--con-text-caption)", color: "var(--con-brand)", textDecoration: "none" }}>
              فتح Vercel <ExternalLink size={11} />
            </a>
          )}
        </div>
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
