/**
 * إعدادات النظام - تعرض مفتاح AI للمديرين فقط
 * src/pages/admin/Settings.tsx
 */
import { useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import { Eye, EyeOff, Key, ShieldCheck, AlertTriangle, Copy, Check } from "lucide-react";

const C = {
  bg: "oklch(0.10 0.06 220)",
  card: "oklch(0.15 0.06 220)",
  cardBorder: "oklch(0.22 0.05 210 / 0.5)",
  cyan: "oklch(0.65 0.18 200)",
  cyanSoft: "oklch(0.60 0.18 200 / 0.12)",
  textPrimary: "oklch(0.92 0.02 220)",
  textMuted: "oklch(0.55 0.06 210)",
};

export default function AdminSettings() {
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

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

  if (!canViewApiKey) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]" dir="rtl">
        <div className="rounded-2xl p-8 flex flex-col items-center gap-4"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
          <ShieldCheck size={48} style={{ color: C.textMuted }} />
          <p className="text-lg font-semibold" style={{ color: C.textPrimary }}>وصول مقيّد</p>
          <p className="text-sm text-center" style={{ color: C.textMuted }}>
            ليس لديك صلاحية لعرض إعدادات النظام.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.textPrimary }}>إعدادات النظام</h1>
        <p className="text-sm mt-1" style={{ color: C.textMuted }}>مرئية للمديرين والملاك فقط</p>
      </div>

      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
        <div className="flex items-center gap-2">
          <Key size={18} style={{ color: C.cyan }} />
          <h2 className="font-semibold" style={{ color: C.textPrimary }}>مفتاح OpenAI API</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: C.cyanSoft, color: C.cyan }}>للمديرين فقط</span>
        </div>

        <div className="flex items-start gap-2 rounded-xl p-3"
          style={{ background: "oklch(0.65 0.20 25 / 0.10)", border: "1px solid oklch(0.55 0.20 25 / 0.30)" }}>
          <AlertTriangle size={16} style={{ color: "oklch(0.65 0.20 25)" }} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs" style={{ color: "oklch(0.65 0.20 25)" }}>
            لا تشارك هذا المفتاح مع أي شخص. يتيح الوصول الكامل لحسابك في OpenAI.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm" style={{ color: C.textMuted }}>المفتاح الحالي</label>
          <div className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: "oklch(0.10 0.06 220)", border: `1px solid ${C.cardBorder}` }}>
            <code className="flex-1 text-sm font-mono tracking-wider overflow-hidden text-ellipsis"
              style={{ color: C.textPrimary, direction: "ltr" }}>
              {showKey ? rawKey ?? "غير مضبوط" : maskedKey}
            </code>
            {rawKey && showKey && (
              <button onClick={handleCopy}
                className="p-1.5 rounded-lg transition-colors hover:opacity-80 flex-shrink-0"
                style={{ color: copied ? "oklch(0.72 0.13 150)" : C.textMuted }}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            )}
            <button onClick={() => setShowKey(!showKey)}
              className="p-1.5 rounded-lg transition-colors hover:opacity-80 flex-shrink-0"
              style={{ color: C.textMuted }}>
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs" style={{ color: C.textMuted }}>
            لتغيير المفتاح عدّل VITE_OPENAI_API_KEY في Vercel Dashboard ثم أعد النشر.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{
            background: rawKey ? "oklch(0.60 0.15 150 / 0.08)" : "oklch(0.55 0.20 25 / 0.08)",
            border: rawKey ? "1px solid oklch(0.60 0.15 150 / 0.25)" : "1px solid oklch(0.55 0.20 25 / 0.25)",
          }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: rawKey ? "oklch(0.72 0.13 150)" : "oklch(0.65 0.20 25)" }} />
          <span className="text-sm" style={{ color: C.textMuted }}>
            {rawKey ? "المفتاح مضبوط ويعمل" : "المفتاح غير مضبوط — أضفه في Vercel"}
          </span>
        </div>
      </div>

      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
        <h2 className="font-semibold" style={{ color: C.textPrimary }}>معلومات الحساب</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "الاسم", value: user?.full_name ?? "—" },
            { label: "البريد الإلكتروني", value: user?.email ?? "—" },
            { label: "الدور", value: user?.role ?? "—" },
            { label: "المعرّف", value: user?.id ? user.id.slice(0, 8) + "..." : "—" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl px-4 py-3"
              style={{ background: "oklch(0.10 0.06 220)" }}>
              <p className="text-xs mb-1" style={{ color: C.textMuted }}>{item.label}</p>
              <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
