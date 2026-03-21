import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Search, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, Settings, Users, Filter } from "lucide-react";
import { API_BASE } from "@/lib/api";

type EmailStatus = "sent" | "failed";
type EmailType = "otp" | "notification" | "confirmation" | "report";
interface EmailLog { id: string; date: string; recipient: string; type: EmailType; subject: string; status: EmailStatus; }

const STATUS: Record<EmailStatus, { label: string; cls: string; icon: JSX.Element }> = {
  sent: { label: "مرسل", cls: "con-badge-success", icon: <CheckCircle2 size={12} /> },
  failed: { label: "فاشل", cls: "con-badge-danger", icon: <XCircle size={12} /> },
};

const TYPE_LABELS: Record<EmailType, string> = { otp: "OTP", notification: "إشعار", confirmation: "تأكيد", report: "تقرير" };

const MOCK: EmailLog[] = [
  { id: "EM-001", date: "2026-03-21T09:00:00Z", recipient: "ahmed@fll.sa", type: "otp", subject: "رمز التحقق الخاص بك", status: "sent" },
  { id: "EM-002", date: "2026-03-21T08:45:00Z", recipient: "sara@company.sa", type: "notification", subject: "تم اعتماد طلبك", status: "sent" },
  { id: "EM-003", date: "2026-03-21T08:30:00Z", recipient: "omar@fll.sa", type: "confirmation", subject: "تأكيد التسجيل", status: "sent" },
  { id: "EM-004", date: "2026-03-21T08:15:00Z", recipient: "invalid@test", type: "otp", subject: "رمز التحقق الخاص بك", status: "failed" },
  { id: "EM-005", date: "2026-03-20T18:00:00Z", recipient: "manager@fll.sa", type: "report", subject: "التقرير اليومي", status: "sent" },
  { id: "EM-006", date: "2026-03-20T17:30:00Z", recipient: "khaled@fll.sa", type: "notification", subject: "تحديث حالة الشحنة", status: "sent" },
  { id: "EM-007", date: "2026-03-20T16:00:00Z", recipient: "driver5@fll.sa", type: "confirmation", subject: "تأكيد تغيير كلمة المرور", status: "sent" },
  { id: "EM-008", date: "2026-03-20T15:00:00Z", recipient: "bounced@invalid.sa", type: "report", subject: "تقرير الأداء الأسبوعي", status: "failed" },
];

export default function EmailLogs() {
  const navigate = useNavigate();
  const [data, setData] = useState<EmailLog[]>(MOCK);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EmailType | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/email-logs`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  const filtered = data.filter(a => {
    const matchSearch = a.recipient.includes(search) || a.subject.includes(search) || a.id.includes(search);
    const matchFilter = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchFilter;
  });

  const today = data.filter(e => e.date.startsWith("2026-03-21")).length;
  const thisWeek = data.length;
  const failedCount = data.filter(e => e.status === "failed").length;
  const total = data.length;

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><Mail size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>سجل الإيميلات</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>متابعة حالة الرسائل الإلكترونية المرسلة</p>
        </div>
        <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "مرسلة اليوم", value: today, icon: Mail, accent: "var(--con-brand)", onClick: () => {} },
          { label: "هذا الأسبوع", value: thisWeek, icon: Clock, accent: "var(--con-success)", onClick: () => navigate("/admin-panel/settings") },
          { label: "فاشلة", value: failedCount, icon: XCircle, accent: "var(--con-danger)", onClick: () => navigate("/admin-panel/staff") },
          { label: "الإجمالي", value: total, icon: CheckCircle2, accent: "var(--con-warning)", onClick: () => {} },
        ].map(k => (
          <div key={k.label} className="con-kpi-card" onClick={k.onClick} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{k.label}</span>
              <k.icon size={14} style={{ color: k.accent }} />
            </div>
            <div className="con-kpi-value" style={{ fontSize: 26, color: k.accent }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="con-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالمستلم أو الموضوع..." className="con-input" style={{ paddingRight: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "otp", "notification", "confirmation", "report"] as const).map(s => (
            <button key={s} onClick={() => setTypeFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: typeFilter === s ? "var(--con-brand)" : "transparent", borderColor: typeFilter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: typeFilter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : TYPE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد رسائل مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>التاريخ</th><th>المستلم</th><th>النوع</th><th>الموضوع</th><th>الحالة</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12 }}>{new Date(a.date).toLocaleString("ar-SA")}</span></td>
                    <td><span style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/staff")}>{a.recipient}</span></td>
                    <td><span className={`con-badge con-badge-sm con-badge-info`}>{TYPE_LABELS[a.type]}</span></td>
                    <td>{a.subject}</td>
                    <td><span className={`con-badge con-badge-sm ${STATUS[a.status].cls}`}>{STATUS[a.status].icon} {STATUS[a.status].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
