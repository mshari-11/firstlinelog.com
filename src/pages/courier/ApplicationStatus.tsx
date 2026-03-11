/**
 * ApplicationStatus — صفحة متابعة حالة طلب التسجيل
 *
 * Public page at /application-status?ref=APP-XXXXXXX
 * The applicant can check their registration status at any time.
 */
import { useState, useEffect } from "react";
import {
  Search, Clock, CheckCircle2, XCircle, AlertTriangle,
  FileText, User, Mail, Phone, MapPin, Loader2, RefreshCw,
  ChevronRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApplicationRecord {
  app_ref: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  status: "pending" | "under_review" | "approved" | "rejected" | "info_required";
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
  notes?: string;
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType; desc: string }
> = {
  pending: {
    label: "قيد الانتظار",
    color: "#fbbf24",
    bg: "#1c1008",
    border: "#78350f",
    icon: Clock,
    desc: "تم استلام طلبك بنجاح وهو في قائمة الانتظار للمراجعة.",
  },
  under_review: {
    label: "تحت المراجعة",
    color: "#60a5fa",
    bg: "#0c1829",
    border: "#1e3a5f",
    icon: FileText,
    desc: "فريق الإدارة يراجع طلبك حالياً. سيتم إخطارك بالنتيجة قريباً.",
  },
  approved: {
    label: "تمت الموافقة",
    color: "#4ade80",
    bg: "#052e16",
    border: "#15803d",
    icon: CheckCircle2,
    desc: "مبروك! تمت الموافقة على طلبك. تحقق من بريدك الإلكتروني للحصول على بيانات الدخول.",
  },
  rejected: {
    label: "مرفوض",
    color: "#f87171",
    bg: "#1c0a0a",
    border: "#7f1d1d",
    icon: XCircle,
    desc: "عذراً، لم يتم قبول طلبك في الوقت الحالي.",
  },
  info_required: {
    label: "معلومات مطلوبة",
    color: "#fb923c",
    bg: "#1c1008",
    border: "#7c2d12",
    icon: AlertTriangle,
    desc: "نحتاج معلومات إضافية منك. تحقق من بريدك الإلكتروني.",
  },
};

// ─── Timeline step ─────────────────────────────────────────────────────────────
const TIMELINE = [
  { status: "pending",      label: "تم استلام الطلب"    },
  { status: "under_review", label: "قيد المراجعة"       },
  { status: "approved",     label: "اتخاذ القرار"        },
];

function getTimelineIndex(status: string): number {
  if (status === "approved" || status === "rejected") return 2;
  if (status === "under_review" || status === "info_required") return 1;
  return 0;
}

// ─── Page styles ──────────────────────────────────────────────────────────────
const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "#060e1a",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "2rem 1rem 4rem",
  fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', sans-serif",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "580px",
  background: "#0b1724",
  borderRadius: "16px",
  border: "1px solid #1e3a5f",
  padding: "2rem",
  boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  background: "#0f2744",
  border: "1px solid #1e3a5f",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  letterSpacing: "0.05rem",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ApplicationStatus() {
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApplicationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Auto-populate ref from URL query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get("ref");
    if (urlRef) {
      setRef(urlRef.toUpperCase());
      checkStatus(urlRef.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkStatus(appRef?: string) {
    const query = (appRef ?? ref).trim().toUpperCase();
    if (!query) {
      setError("يرجى إدخال رقم الطلب");
      return;
    }
    if (!/^APP-[A-Z0-9]{4,}$/i.test(query)) {
      setError("صيغة رقم الطلب غير صحيحة — مثال: APP-1A2B3C");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `${API_BASE}/driver/application-status?ref=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "لم يتم العثور على طلب بهذا الرقم");
      } else {
        setResult(data as ApplicationRecord);
        setLastChecked(new Date());
        // Update URL without reload
        const url = new URL(window.location.href);
        url.searchParams.set("ref", query);
        window.history.replaceState(null, "", url.toString());
      }
    } catch {
      // Dev fallback — simulate a pending application
      const mock: ApplicationRecord = {
        app_ref: query,
        full_name: "—",
        email: "—",
        phone: "—",
        city: "—",
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setResult(mock);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? (STATUS_CONFIG[result.status] ?? STATUS_CONFIG.pending) : null;
  const timelineIdx = result ? getTimelineIndex(result.status) : -1;

  return (
    <div style={pageWrap} dir="rtl">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <img
            src="/images/first_line_professional_english_1.png"
            alt="FLL"
            style={{ height: "40px", objectFit: "contain" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.375rem" }}>
          متابعة حالة طلب التسجيل
        </h1>
        <p style={{ fontSize: "13px", color: "#64748b" }}>
          أدخل رقم الطلب الذي وصلك بعد التسجيل
        </p>
      </div>

      <div style={cardStyle}>
        {/* Search bar */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute", right: "0.75rem", top: "50%",
                transform: "translateY(-50%)", color: "#475569", pointerEvents: "none",
              }}
            />
            <input
              style={{ ...inputStyle, paddingRight: "2.25rem" }}
              placeholder="APP-1A2B3C"
              value={ref}
              onChange={(e) => {
                setRef(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") checkStatus(); }}
              dir="ltr"
            />
          </div>
          <button
            onClick={() => checkStatus()}
            disabled={loading}
            style={{
              background: loading ? "#1e3a5f" : "#1d4ed8",
              color: "#fff", border: "none", borderRadius: "8px",
              padding: "0.625rem 1.25rem", fontSize: "13px",
              fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "0.375rem",
              flexShrink: 0, transition: "background 0.15s",
            }}
          >
            {loading
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> جارٍ...</>
              : <><Search size={14} /> بحث</>
            }
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#1c0a0a", border: "1px solid #7f1d1d",
            borderRadius: "8px", padding: "0.75rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
            fontSize: "13px", color: "#fca5a5", marginBottom: "1rem",
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Result */}
        {result && cfg && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Status banner */}
            <div style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex", alignItems: "flex-start", gap: "1rem",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: `${cfg.bg}`,
                border: `2px solid ${cfg.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <cfg.icon size={22} style={{ color: cfg.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                  <span style={{
                    fontSize: "15px", fontWeight: 700, color: cfg.color,
                  }}>
                    {cfg.label}
                  </span>
                  <span style={{
                    fontFamily: "monospace", fontSize: "12px",
                    color: "#475569", background: "#0f2744",
                    padding: "0.125rem 0.5rem", borderRadius: "4px",
                  }}>
                    {result.app_ref}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
                  {cfg.desc}
                </p>
                {result.status === "rejected" && result.rejection_reason && (
                  <p style={{
                    fontSize: "12px", color: "#fca5a5",
                    marginTop: "0.5rem", background: "#3b0000",
                    padding: "0.5rem 0.75rem", borderRadius: "6px",
                  }}>
                    <strong>السبب: </strong>{result.rejection_reason}
                  </p>
                )}
                {result.notes && result.status !== "rejected" && (
                  <p style={{
                    fontSize: "12px", color: "#fcd34d",
                    marginTop: "0.5rem", background: "#1c1008",
                    padding: "0.5rem 0.75rem", borderRadius: "6px",
                  }}>
                    <AlertTriangle size={11} style={{ display: "inline", marginLeft: 4 }} />
                    {result.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div style={{
              background: "#081524", borderRadius: "10px",
              padding: "1rem 1.25rem", border: "1px solid #1e3a5f",
            }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#60a5fa", marginBottom: "0.875rem" }}>
                مراحل الطلب
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {TIMELINE.map((t, i) => {
                  const done = i < timelineIdx;
                  const active = i === timelineIdx;
                  const rejected = result.status === "rejected" && i === 2;
                  const color = rejected ? "#f87171" : done || active ? (done ? "#4ade80" : "#60a5fa") : "#334155";
                  return (
                    <div key={t.status} style={{ display: "flex", alignItems: "center", flex: i < TIMELINE.length - 1 ? 1 : undefined }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", minWidth: "70px" }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          border: `2px solid ${color}`,
                          background: done ? "#052e16" : active ? "#0c1829" : "#0b1724",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {done && !rejected ? (
                            <CheckCircle2 size={14} style={{ color: "#4ade80" }} />
                          ) : rejected ? (
                            <XCircle size={14} style={{ color: "#f87171" }} />
                          ) : (
                            <div style={{
                              width: "8px", height: "8px", borderRadius: "50%",
                              background: active ? "#60a5fa" : "#334155",
                            }} />
                          )}
                        </div>
                        <span style={{ fontSize: "10px", color, textAlign: "center", whiteSpace: "nowrap" }}>
                          {t.label}
                        </span>
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div style={{
                          flex: 1, height: "2px", marginBottom: "18px",
                          background: i < timelineIdx ? "#15803d" : "#1e3a5f",
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Applicant info (partial — privacy-safe) */}
            {result.full_name && result.full_name !== "—" && (
              <div style={{
                background: "#081524", borderRadius: "10px",
                padding: "1rem 1.25rem", border: "1px solid #1e3a5f",
              }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#60a5fa", marginBottom: "0.75rem" }}>
                  بيانات المتقدم
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[
                    { icon: User,  label: "الاسم",    value: result.full_name },
                    { icon: Mail,  label: "البريد",   value: maskEmail(result.email) },
                    { icon: Phone, label: "الجوال",   value: maskPhone(result.phone) },
                    { icon: MapPin, label: "المدينة", value: result.city },
                  ].filter((r) => r.value && r.value !== "—").map((row) => (
                    <div key={row.label} style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between", fontSize: "13px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#64748b" }}>
                        <row.icon size={12} />
                        {row.label}
                      </div>
                      <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: "11px", color: "#334155",
            }}>
              <span>تاريخ التقديم: {formatDate(result.created_at)}</span>
              <span>آخر تحديث: {formatDate(result.updated_at)}</span>
            </div>

            {/* Refresh */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => checkStatus(result.app_ref)}
                disabled={loading}
                style={{
                  background: "none", border: "1px solid #1e3a5f",
                  borderRadius: "8px", padding: "0.5rem 1rem",
                  color: "#475569", fontSize: "12px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.375rem",
                }}
              >
                <RefreshCw size={12} />
                تحديث الحالة
                {lastChecked && (
                  <span style={{ color: "#334155" }}>
                    · آخر فحص {lastChecked.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "#334155" }}>
            <FileText size={36} style={{ marginBottom: "0.75rem", opacity: 0.3 }} />
            <p style={{ fontSize: "13px" }}>أدخل رقم طلبك للاستعلام عن حالته</p>
            <p style={{ fontSize: "11px", marginTop: "0.375rem" }}>
              رقم الطلب يبدأ بـ <span style={{ fontFamily: "monospace", color: "#475569" }}>APP-</span>
            </p>
          </div>
        )}
      </div>

      {/* Footer link */}
      <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "12px", color: "#334155" }}>
        لم تقم بالتسجيل بعد؟{" "}
        <a href="/courier/register" style={{ color: "#60a5fa", textDecoration: "none" }}>
          <ChevronRight size={11} style={{ display: "inline" }} />
          سجّل الآن
        </a>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [user, domain] = email.split("@");
  const visible = user.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-2);
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return iso;
  }
}
