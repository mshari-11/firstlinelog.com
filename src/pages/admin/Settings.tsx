/**
 * إعدادات النظام — Admin Control Center
 * Enterprise settings: API keys, account info, system status
 */
import { useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import {
  Eye, EyeOff, Key, ShieldCheck, AlertTriangle, Copy, Check,
  Settings2, User, Server, Info, ExternalLink,
} from "lucide-react";

// ─── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      padding: "9px 0",
      borderBottom: "1px solid var(--con-border-default)",
    }}>
      <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 500 }}>
        {label}
      </span>
      <span style={{
        fontSize: "var(--con-text-table)",
        color: "var(--con-text-secondary)",
        fontFamily: mono ? "var(--con-font-mono)" : "inherit",
        fontWeight: mono ? 500 : 400,
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, badge, children }: {
  icon: React.ElementType;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: "1px solid var(--con-border-default)",
      borderRadius: 10, overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 20px",
        borderBottom: "1px solid var(--con-border-default)",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(59,130,246,0.12)",
        }}>
          <Icon size={15} style={{ color: "var(--con-brand)" }} />
        </div>
        <span style={{
          fontSize: "var(--con-text-card-title)", fontWeight: 600,
          color: "var(--con-text-primary)", flex: 1,
        }}>
          {title}
        </span>
        {badge}
      </div>
      <div style={{ padding: "16px 20px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const { user } = useAuth();
  const [showKey, setShowKey]   = useState(false);
  const [copied, setCopied]     = useState(false);

  const canViewApiKey = user?.role === "admin" || user?.role === "owner";
  const rawKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const maskedKey = rawKey
    ? `sk-${"•".repeat(24)}${rawKey.slice(-4)}`
    : "غير مضبوط — أضف VITE_OPENAI_API_KEY في Vercel";

  const handleCopy = async () => {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Access denied ─────────────────────────────────────────────────────────
  if (!canViewApiKey) {
    return (
      <div dir="rtl" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: 400,
      }}>
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 12, padding: "48px 40px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          textAlign: "center", maxWidth: 340,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "var(--con-bg-surface-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={28} style={{ color: "var(--con-text-muted)" }} />
          </div>
          <div style={{ fontSize: "var(--con-text-section-title)", fontWeight: 600, color: "var(--con-text-primary)" }}>
            وصول مقيّد
          </div>
          <div style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)" }}>
            ليس لديك صلاحية لعرض إعدادات النظام.
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>

      {/* Page Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: "7px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Settings2 size={18} style={{ color: "var(--con-brand)" }} />
          </div>
          <h1 style={{
            fontSize: "var(--con-text-page-title)", fontWeight: 700,
            color: "var(--con-text-primary)", margin: 0,
            fontFamily: "var(--con-font-primary)",
          }}>
            إعدادات النظام
          </h1>
        </div>
        <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>
          مرئية للمديرين والملاك فقط
        </p>
      </div>

      {/* Account Info */}
      <SectionCard icon={User} title="معلومات الحساب">
        <div>
          <InfoRow label="الاسم"              value={user?.full_name ?? "—"} />
          <InfoRow label="البريد الإلكتروني" value={user?.email     ?? "—"} mono />
          <InfoRow label="الدور"             value={user?.role      ?? "—"} />
          <InfoRow
            label="المعرّف"
            value={user?.id ? user.id.slice(0, 8) + "…" : "—"}
            mono
          />
        </div>
      </SectionCard>

      {/* OpenAI API Key */}
      <SectionCard
        icon={Key}
        title="مفتاح OpenAI API"
        badge={
          <span className="con-badge con-badge-sm con-badge-info">للمديرين فقط</span>
        }
      >
        {/* Warning banner */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "rgba(217,119,6,0.08)",
          border: "1px solid rgba(217,119,6,0.25)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 14,
        }}>
          <AlertTriangle size={14} style={{ color: "var(--con-warning)", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-warning)", margin: 0, lineHeight: 1.5 }}>
            لا تشارك هذا المفتاح مع أي شخص. يتيح الوصول الكامل لحسابك في OpenAI.
          </p>
        </div>

        {/* Key display */}
        <div style={{ marginBottom: 10 }}>
          <label style={{
            fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
            display: "block", marginBottom: 6, fontWeight: 500,
          }}>
            المفتاح الحالي
          </label>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--con-bg-surface-2)",
            border: "1px solid var(--con-border-strong)",
            borderRadius: 8, padding: "10px 12px",
          }}>
            <code style={{
              flex: 1, fontSize: 12,
              fontFamily: "var(--con-font-mono)",
              color: "var(--con-text-secondary)",
              direction: "ltr", overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", letterSpacing: showKey ? "0.02em" : "0.1em",
            }}>
              {showKey ? (rawKey ?? "غير مضبوط") : maskedKey}
            </code>
            {rawKey && showKey && (
              <button
                onClick={handleCopy}
                className="con-btn-ghost"
                style={{ padding: "4px 8px" }}
                title="نسخ المفتاح"
              >
                {copied ? <Check size={13} style={{ color: "var(--con-success)" }} /> : <Copy size={13} />}
              </button>
            )}
            <button
              onClick={() => setShowKey(!showKey)}
              className="con-btn-ghost"
              style={{ padding: "4px 8px" }}
              title={showKey ? "إخفاء" : "إظهار"}
            >
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 6 }}>
            لتغيير المفتاح عدّل VITE_OPENAI_API_KEY في Vercel Dashboard ثم أعد النشر.
          </p>
        </div>

        {/* Status indicator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: rawKey ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)",
          border: `1px solid ${rawKey ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
          borderRadius: 7, padding: "8px 12px",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: rawKey ? "var(--con-success)" : "var(--con-danger)",
          }} />
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
            {rawKey ? "المفتاح مضبوط ويعمل" : "المفتاح غير مضبوط — أضفه في Vercel"}
          </span>
          {!rawKey && (
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 4,
                marginInlineStart: "auto",
                fontSize: "var(--con-text-caption)", color: "var(--con-brand)",
                textDecoration: "none",
              }}
            >
              فتح Vercel <ExternalLink size={11} />
            </a>
          )}
        </div>
      </SectionCard>

      {/* System Info */}
      <SectionCard icon={Server} title="معلومات النظام">
        <div>
          <InfoRow label="المنطقة"       value="me-south-1 (البحرين)" />
          <InfoRow label="الإصدار"       value="1.0.0"  mono />
          <InfoRow label="البيئة"        value={import.meta.env.MODE ?? "production"} mono />
          <InfoRow label="قاعدة البيانات" value="Supabase (PostgreSQL)" />
        </div>
      </SectionCard>

    </div>
  );
}
