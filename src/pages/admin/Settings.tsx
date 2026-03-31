import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/admin/auth";
import { API_BASE } from "@/lib/api";
import {
  Settings2, User, Server, Shield, Bell, Globe, Database, Palette,
  Mail, Clock, Save, RefreshCw, ToggleLeft, ToggleRight, ChevronDown,
  ChevronUp, Lock, Key, Zap, AlertTriangle, CheckCircle2, Trash2,
  Monitor, Moon, Sun, Languages, Megaphone, Wifi, WifiOff, Eye, EyeOff,
  HardDrive, ShieldCheck, ExternalLink, Users, Building2, FileText,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────── */
type Tab = "general" | "security" | "notifications" | "system" | "advanced";

interface SystemSetting {
  key: string;
  value: string | boolean | number;
  label: string;
  description: string;
  type: "toggle" | "text" | "number" | "select";
  options?: { value: string; label: string }[];
  group: Tab;
  icon: React.ElementType;
}

/* ── Defaults ──────────────────────────────────────────────────────────── */
const STORAGE_KEY = "fll_system_settings_v1";

function loadSettings(): Record<string, string | boolean | number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function persistSettings(s: Record<string, string | boolean | number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const ALL_SETTINGS: SystemSetting[] = [
  // ── General ──
  { key: "company_name",     value: "شركة الخط الأول للخدمات اللوجستية", label: "اسم الشركة",         description: "يظهر في الإيميلات والفواتير",                type: "text",   group: "general", icon: Building2 },
  { key: "company_email",    value: "support@fll.sa",                      label: "البريد الرسمي",       description: "بريد الدعم الفني والتواصل",                   type: "text",   group: "general", icon: Mail },
  { key: "company_phone",    value: "920014948",                           label: "رقم التواصل",         description: "يظهر في الإيميلات وصفحة التواصل",             type: "text",   group: "general", icon: Megaphone },
  { key: "default_city",     value: "الرياض",                              label: "المدينة الافتراضية", description: "المدينة الافتراضية للطلبات الجديدة",           type: "text",   group: "general", icon: Globe },
  { key: "timezone",         value: "Asia/Riyadh",                         label: "المنطقة الزمنية",    description: "تؤثر على التقارير والجدولة",                   type: "select", group: "general", icon: Clock, options: [{ value: "Asia/Riyadh", label: "الرياض (UTC+3)" }, { value: "Asia/Dubai", label: "دبي (UTC+4)" }, { value: "UTC", label: "UTC" }] },
  { key: "language",         value: "ar",                                  label: "لغة النظام",          description: "اللغة الافتراضية للوحة التحكم",               type: "select", group: "general", icon: Languages, options: [{ value: "ar", label: "العربية" }, { value: "en", label: "English" }] },

  // ── Security ──
  { key: "2fa_enabled",      value: true,  label: "المصادقة الثنائية (2FA)", description: "طلب رمز تحقق بعد كلمة المرور",              type: "toggle", group: "security", icon: Shield },
  { key: "session_timeout",  value: 60,    label: "مهلة الجلسة (دقيقة)",    description: "تسجيل خروج تلقائي بعد عدم النشاط",           type: "number", group: "security", icon: Clock },
  { key: "max_login_attempts", value: 5,   label: "محاولات الدخول القصوى",  description: "قفل الحساب بعد تجاوز العدد",                  type: "number", group: "security", icon: Lock },
  { key: "ip_whitelist",     value: "",    label: "قائمة IP المسموح",       description: "IPs مسموحة فقط (فارغ = الكل مسموح)",         type: "text",   group: "security", icon: Wifi },
  { key: "password_min_length", value: 8,  label: "الحد الأدنى لكلمة المرور", description: "عدد الأحرف الأدنى المطلوب",                type: "number", group: "security", icon: Key },
  { key: "audit_logging",    value: true,  label: "تسجيل التدقيق",          description: "تسجيل كل العمليات الحساسة",                   type: "toggle", group: "security", icon: FileText },

  // ── Notifications ──
  { key: "email_notifications",  value: true,  label: "إشعارات البريد",         description: "إرسال إشعارات عبر البريد الإلكتروني",        type: "toggle", group: "notifications", icon: Mail },
  { key: "new_order_alert",      value: true,  label: "تنبيه طلب جديد",         description: "إشعار عند وصول طلب جديد",                     type: "toggle", group: "notifications", icon: Bell },
  { key: "complaint_alert",      value: true,  label: "تنبيه شكوى جديدة",       description: "إشعار عند تسجيل شكوى",                        type: "toggle", group: "notifications", icon: AlertTriangle },
  { key: "driver_register_alert", value: true, label: "تنبيه تسجيل مندوب",      description: "إشعار عند تقديم طلب تسجيل جديد",              type: "toggle", group: "notifications", icon: Users },
  { key: "payout_alert",         value: true,  label: "تنبيه دفعة مالية",       description: "إشعار عند إنشاء أو اعتماد دفعة",              type: "toggle", group: "notifications", icon: Zap },
  { key: "admin_emails",         value: "m_shaikhi@yahoo.com,A.ALZAMIL@FLL.SA", label: "إيميلات المدراء", description: "إيميلات تستقبل التنبيهات (مفصولة بفاصلة)", type: "text", group: "notifications", icon: Mail },

  // ── System ──
  { key: "maintenance_mode",   value: false, label: "وضع الصيانة",            description: "إيقاف الموقع مؤقتاً وعرض صفحة صيانة",         type: "toggle", group: "system", icon: AlertTriangle },
  { key: "api_rate_limit",     value: 100,   label: "حد الطلبات (لكل دقيقة)", description: "الحد الأقصى للطلبات لكل مستخدم",               type: "number", group: "system", icon: Zap },
  { key: "file_upload_max_mb", value: 10,    label: "حد رفع الملفات (MB)",    description: "الحجم الأقصى لرفع الملفات",                    type: "number", group: "system", icon: HardDrive },
  { key: "cache_ttl_minutes",  value: 15,    label: "مدة التخزين المؤقت",     description: "مدة تخزين البيانات مؤقتاً (بالدقائق)",          type: "number", group: "system", icon: Database },
  { key: "chat_enabled",       value: true,  label: "المحادثة الذكية (AI)",   description: "تفعيل مساعد FLL السحابي",                      type: "toggle", group: "system", icon: Megaphone },
  { key: "debug_mode",         value: false, label: "وضع التصحيح",            description: "عرض معلومات تقنية إضافية (للمطورين)",            type: "toggle", group: "system", icon: Monitor },

  // ── Advanced ──
  { key: "api_region",        value: "us-east-1",  label: "منطقة API",            description: "المنطقة الجغرافية لخدمات AWS",                 type: "select", group: "advanced", icon: Server, options: [{ value: "us-east-1", label: "فرجينيا (us-east-1)" }, { value: "me-south-1", label: "البحرين (me-south-1)" }] },
  { key: "cognito_pool",      value: "us-east-1_qHMox2NTB", label: "Cognito Pool", description: "معرّف مجموعة المصادقة",                  type: "text",   group: "advanced", icon: Shield },
  { key: "supabase_project",  value: "djebhztfewjfyyoortvv", label: "Supabase Project", description: "معرّف مشروع Supabase",              type: "text",   group: "advanced", icon: Database },
  { key: "ses_sender",        value: "no-reply@fll.sa",      label: "بريد الإرسال (SES)", description: "العنوان المستخدم لإرسال الإيميلات", type: "text",   group: "advanced", icon: Mail },
  { key: "otp_ttl_minutes",   value: 10,   label: "صلاحية رمز التحقق (دقيقة)", description: "مدة صلاحية رمز OTP",                       type: "number", group: "advanced", icon: Clock },
  { key: "auto_backup",       value: true, label: "النسخ الاحتياطي التلقائي",   description: "نسخ احتياطي يومي للبيانات",                  type: "toggle", group: "advanced", icon: HardDrive },
];

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general",       label: "عام",         icon: Settings2 },
  { id: "security",      label: "الأمان",       icon: Shield },
  { id: "notifications", label: "الإشعارات",    icon: Bell },
  { id: "system",        label: "النظام",       icon: Server },
  { id: "advanced",      label: "متقدم",        icon: Zap },
];

/* ── Component ─────────────────────────────────────────────────────────── */
export default function AdminSettings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("general");
  const [values, setValues] = useState<Record<string, string | boolean | number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);

  const canAccess = user?.role === "admin" || user?.role === "owner";

  useEffect(() => {
    const stored = loadSettings();
    const defaults: Record<string, string | boolean | number> = {};
    ALL_SETTINGS.forEach(s => { defaults[s.key] = s.value; });
    setValues({ ...defaults, ...stored });
  }, []);

  function updateValue(key: string, val: string | boolean | number) {
    setValues(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    persistSettings(values);
    try {
      await fetch(`${API_BASE}/system-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "global", ...values, updatedAt: new Date().toISOString() }),
      });
    } catch { /* saved locally */ }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    const defaults: Record<string, string | boolean | number> = {};
    ALL_SETTINGS.filter(s => s.group === tab).forEach(s => { defaults[s.key] = s.value; });
    setValues(prev => ({ ...prev, ...defaults }));
    setSaved(false);
  }

  if (!canAccess) {
    return (
      <div dir="rtl" style={{ padding: "3rem", textAlign: "center" }}>
        <ShieldCheck size={48} style={{ color: "var(--con-text-muted)", margin: "0 auto 1rem" }} />
        <h2 style={{ fontSize: 18, color: "var(--con-text-primary)", marginBottom: 8 }}>وصول مقيّد</h2>
        <p style={{ fontSize: 13, color: "var(--con-text-muted)" }}>ليس لديك صلاحية لعرض إعدادات النظام.</p>
      </div>
    );
  }

  const currentSettings = ALL_SETTINGS.filter(s => s.group === tab);

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Settings2 size={18} style={{ color: "var(--con-accent)" }} /> إعدادات النظام
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>تحكّم كامل في إعدادات المنصة والخدمات</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={handleReset} className="con-btn con-btn-ghost" style={{ gap: 6, fontSize: 12 }}>
            <RefreshCw size={13} /> استعادة الافتراضي
          </button>
          <button onClick={handleSave} disabled={saving} className="con-btn-primary" style={{ gap: 6, fontSize: 12, opacity: saving ? 0.6 : 1 }}>
            {saving ? <RefreshCw size={13} className="animate-spin" /> : saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {saving ? "جارٍ الحفظ..." : saved ? "تم الحفظ" : "حفظ الإعدادات"}
          </button>
        </div>
      </div>

      {/* User Info Bar */}
      <div className="con-card" style={{ padding: "0.75rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--con-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
          {(user?.full_name || "A").charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>{user?.full_name || "—"}</div>
          <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{user?.email} — {user?.role === "admin" ? "مدير النظام" : user?.role}</div>
        </div>
        <div style={{ fontSize: 11, color: "var(--con-success)", display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--con-success)" }} /> متصل
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: 4 }}>
        {TAB_CONFIG.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="con-btn" style={{
              background: isActive ? "var(--con-accent)" : "transparent",
              color: isActive ? "#fff" : "var(--con-text-muted)",
              border: isActive ? "none" : "1px solid var(--con-border-default)",
              fontSize: 12, gap: 6, whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Settings List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {currentSettings.map(setting => {
          const Icon = setting.icon;
          const val = values[setting.key] ?? setting.value;
          const isExpanded = expandedInfo === setting.key;
          return (
            <div key={setting.key} className="con-card" style={{ padding: "1rem 1.25rem", transition: "border-color 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: setting.type === "toggle" && val === true ? "rgba(34,197,94,0.1)" : "var(--con-bg-elevated)",
                  border: `1px solid ${setting.type === "toggle" && val === true ? "rgba(34,197,94,0.3)" : "var(--con-border-default)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={16} style={{ color: setting.type === "toggle" && val === true ? "var(--con-success)" : "var(--con-text-muted)" }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>{setting.label}</span>
                    <button onClick={() => setExpandedInfo(isExpanded ? null : setting.key)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--con-text-muted)" }}>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                  {isExpanded && (
                    <p style={{ fontSize: 11, color: "var(--con-text-muted)", margin: "4px 0 0" }}>{setting.description}</p>
                  )}
                </div>

                {/* Control */}
                <div style={{ flexShrink: 0 }}>
                  {setting.type === "toggle" && (
                    <button
                      onClick={() => updateValue(setting.key, !val)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      {val ? <ToggleRight size={32} style={{ color: "var(--con-success)" }} /> : <ToggleLeft size={32} style={{ color: "var(--con-text-muted)" }} />}
                    </button>
                  )}
                  {setting.type === "text" && (
                    <input
                      className="con-input"
                      dir={/^[a-zA-Z0-9@._\-:/]/.test(String(val)) ? "ltr" : "rtl"}
                      value={String(val)}
                      onChange={e => updateValue(setting.key, e.target.value)}
                      style={{ width: 220, fontSize: 12, fontFamily: /^[a-zA-Z0-9@._\-:/]/.test(String(val)) ? "monospace" : "inherit" }}
                    />
                  )}
                  {setting.type === "number" && (
                    <input
                      className="con-input"
                      type="number"
                      dir="ltr"
                      value={Number(val)}
                      onChange={e => updateValue(setting.key, parseInt(e.target.value) || 0)}
                      style={{ width: 80, fontSize: 12, textAlign: "center" }}
                    />
                  )}
                  {setting.type === "select" && (
                    <select
                      className="con-input"
                      value={String(val)}
                      onChange={e => updateValue(setting.key, e.target.value)}
                      style={{ width: 180, fontSize: 12 }}
                    >
                      {setting.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Info Footer */}
      {tab === "advanced" && (
        <div className="con-card" style={{ marginTop: "1rem", padding: "1rem 1.25rem" }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Monitor size={14} /> معلومات النظام
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
            {[
              { l: "الإصدار",           v: "1.1.0" },
              { l: "البيئة",            v: import.meta.env.MODE || "production" },
              { l: "المنطقة",           v: "us-east-1 (فرجينيا)" },
              { l: "قاعدة البيانات",    v: "Supabase (PostgreSQL)" },
              { l: "المصادقة",          v: "AWS Cognito" },
              { l: "الاستضافة",         v: "Vercel" },
              { l: "البريد",            v: "AWS SES" },
              { l: "التخزين",           v: "AWS S3 + DynamoDB" },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderRadius: 6, background: "var(--con-bg-elevated)", fontSize: 11 }}>
                <span style={{ color: "var(--con-text-muted)" }}>{r.l}</span>
                <span style={{ color: "var(--con-text-secondary)", fontWeight: 500, fontFamily: "monospace" }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: "0.5rem" }}>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="con-btn con-btn-ghost" style={{ fontSize: 11, gap: 4, textDecoration: "none" }}>
              <ExternalLink size={12} /> Vercel
            </a>
            <a href="https://console.aws.amazon.com" target="_blank" rel="noopener noreferrer" className="con-btn con-btn-ghost" style={{ fontSize: 11, gap: 4, textDecoration: "none" }}>
              <ExternalLink size={12} /> AWS Console
            </a>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="con-btn con-btn-ghost" style={{ fontSize: 11, gap: 4, textDecoration: "none" }}>
              <ExternalLink size={12} /> Supabase
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
