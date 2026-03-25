import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, AlertCircle, Bell, Mail, MailOpen, ShoppingCart, DollarSign, AlertTriangle, Settings, Clock } from "lucide-react";
import { API_BASE } from "@/lib/api";

type NotifType = "complaint" | "order" | "finance" | "system";
interface Notification { id: string; type: NotifType; title: string; message: string; read: boolean; date: string; link: string; }

const TYPE_MAP: Record<NotifType, { label: string; cls: string; icon: JSX.Element; route: string }> = {
  complaint: { label: "شكوى", cls: "con-badge-danger", icon: <AlertTriangle size={12} />, route: "/admin-panel/complaints" },
  order: { label: "طلب", cls: "con-badge-info", icon: <ShoppingCart size={12} />, route: "/admin-panel/orders" },
  finance: { label: "مالي", cls: "con-badge-warning", icon: <DollarSign size={12} />, route: "/admin-panel/finance" },
  system: { label: "نظام", cls: "con-badge-success", icon: <Settings size={12} />, route: "/admin-panel/settings" },
};

const MOCK: Notification[] = [
  { id: "NTF-001", type: "complaint", title: "شكوى جديدة من عميل", message: "العميل محمد أحمد قدم شكوى بخصوص تأخر التوصيل", read: false, date: "2026-03-21T10:00:00Z", link: "/admin-panel/complaints" },
  { id: "NTF-002", type: "order", title: "طلب جديد بانتظار التعيين", message: "طلب #ORD-450 بحاجة لتعيين سائق", read: false, date: "2026-03-21T09:30:00Z", link: "/admin-panel/orders" },
  { id: "NTF-003", type: "finance", title: "فاتورة بحاجة اعتماد", message: "فاتورة صيانة بمبلغ 8,500 ر.س بانتظار الاعتماد", read: false, date: "2026-03-21T09:00:00Z", link: "/admin-panel/finance" },
  { id: "NTF-004", type: "system", title: "تحديث النظام مكتمل", message: "تم تحديث النظام إلى الإصدار 2.5.0 بنجاح", read: true, date: "2026-03-21T08:00:00Z", link: "/admin-panel/settings" },
  { id: "NTF-005", type: "order", title: "طلب تم تسليمه", message: "الطلب #ORD-448 تم تسليمه بنجاح", read: true, date: "2026-03-20T16:00:00Z", link: "/admin-panel/orders" },
  { id: "NTF-006", type: "complaint", title: "شكوى عاجلة", message: "شكوى بخصوص منتج تالف - أولوية عالية", read: false, date: "2026-03-20T14:00:00Z", link: "/admin-panel/complaints" },
  { id: "NTF-007", type: "finance", title: "تقرير مالي جاهز", message: "التقرير المالي الأسبوعي جاهز للمراجعة", read: true, date: "2026-03-20T12:00:00Z", link: "/admin-panel/finance" },
  { id: "NTF-008", type: "system", title: "صيانة مجدولة", message: "صيانة مجدولة للنظام يوم الجمعة 2:00 صباحا", read: true, date: "2026-03-19T10:00:00Z", link: "/admin-panel/settings" },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [data, setData] = useState<Notification[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<NotifType | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  async function markRead(id: string) {
    try { await fetch(`${API_BASE}/api/notifications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, read: true }) }); } catch {}
    setData(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const filtered = data.filter(a => {
    const matchSearch = a.title.includes(search) || a.message.includes(search);
    const matchFilter = filter === "all" || a.type === filter;
    return matchSearch && matchFilter;
  });

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const stats = {
    unread: data.filter(n => !n.read).length,
    today: data.filter(n => n.date.slice(0, 10) === today).length,
    week: data.filter(n => n.date.slice(0, 10) >= weekAgo).length,
    total: data.length,
  };

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><Bell size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>الإشعارات</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>عرض وإدارة جميع الإشعارات</p>
        </div>
        <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "غير مقروءة", value: stats.unread, icon: Mail, accent: "var(--con-danger)", onClick: () => {} },
          { label: "اليوم", value: stats.today, icon: Clock, accent: "var(--con-brand)", onClick: () => {} },
          { label: "الأسبوع", value: stats.week, icon: Bell, accent: "var(--con-warning)", onClick: () => {} },
          { label: "الإجمالي", value: stats.total, icon: MailOpen, accent: "var(--con-success)", onClick: () => {} },
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
          <Search size={14} style={{ position: "absolute", insetInlineEnd: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="con-input" style={{ paddingInlineEnd: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "complaint", "order", "finance", "system"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : TYPE_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد إشعارات مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>الحالة</th><th>النوع</th><th>العنوان</th><th>الرسالة</th><th>التاريخ</th><th>إجراء</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} style={{ background: !a.read ? "rgba(59,130,246,0.04)" : undefined }}>
                    <td>{a.read ? <MailOpen size={14} style={{ color: "var(--con-text-muted)" }} /> : <Mail size={14} style={{ color: "var(--con-brand)" }} />}</td>
                    <td><span className={`con-badge con-badge-sm ${TYPE_MAP[a.type].cls}`}>{TYPE_MAP[a.type].icon} {TYPE_MAP[a.type].label}</span></td>
                    <td style={{ fontWeight: a.read ? 400 : 600 }}>{a.title}</td>
                    <td>{a.message}</td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12 }}>{new Date(a.date).toLocaleString("ar-SA")}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="con-btn-primary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => { markRead(a.id); navigate(TYPE_MAP[a.type].route); }}>فتح</button>
                        {!a.read && <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => markRead(a.id)}>قراءة</button>}
                      </div>
                    </td>
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
