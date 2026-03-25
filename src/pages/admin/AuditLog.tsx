import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, AlertCircle, Shield, Users, ShoppingCart, DollarSign, Clock, Activity, UserCheck, FileText } from "lucide-react";
import { API_BASE } from "@/lib/api";

type ActionType = "login" | "approve" | "reject" | "update" | "delete" | "create";
interface AuditEntry { id: string; date: string; user: string; action: ActionType; resource: string; details: string; }

const ACTION_MAP: Record<ActionType, { label: string; cls: string }> = {
  login: { label: "تسجيل دخول", cls: "con-badge-info" },
  approve: { label: "اعتماد", cls: "con-badge-success" },
  reject: { label: "رفض", cls: "con-badge-danger" },
  update: { label: "تحديث", cls: "con-badge-warning" },
  delete: { label: "حذف", cls: "con-badge-danger" },
  create: { label: "إنشاء", cls: "con-badge-success" },
};

const MOCK: AuditEntry[] = [
  { id: "AUD-001", date: "2026-03-21T08:30:00Z", user: "مشاري الإدارة", action: "login", resource: "لوحة التحكم", details: "تسجيل دخول ناجح من IP 192.168.1.10" },
  { id: "AUD-002", date: "2026-03-21T09:15:00Z", user: "أحمد المالية", action: "approve", resource: "طلب مالي #APR-003", details: "اعتماد فاتورة صيانة مركبات بمبلغ 12,500 ر.س" },
  { id: "AUD-003", date: "2026-03-21T10:00:00Z", user: "خالد HR", action: "reject", resource: "طلب إجازة #LEV-045", details: "رفض طلب إجازة بسبب نقص الموظفين" },
  { id: "AUD-004", date: "2026-03-20T14:20:00Z", user: "سارة العمليات", action: "update", resource: "شحنة #SHP-120", details: "تحديث حالة الشحنة إلى تم التسليم" },
  { id: "AUD-005", date: "2026-03-20T11:00:00Z", user: "عمر التقنية", action: "delete", resource: "مستخدم #USR-089", details: "حذف حساب مستخدم غير نشط" },
  { id: "AUD-006", date: "2026-03-19T16:45:00Z", user: "نورة الموارد", action: "create", resource: "موظف جديد #EMP-200", details: "إنشاء ملف موظف جديد - قسم التوصيل" },
];

export default function AuditLog() {
  const navigate = useNavigate();
  const [data, setData] = useState<AuditEntry[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActionType | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/audit-log`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  const filtered = data.filter(a => {
    const matchSearch = a.user.includes(search) || a.resource.includes(search) || a.details.includes(search);
    const matchFilter = filter === "all" || a.action === filter;
    return matchSearch && matchFilter;
  });

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const stats = {
    today: data.filter(a => a.date.slice(0, 10) === today).length,
    week: data.filter(a => a.date.slice(0, 10) >= weekAgo).length,
    activeUsers: new Set(data.map(a => a.user)).size,
    topAction: Object.entries(data.reduce((acc, a) => { acc[a.action] = (acc[a.action] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0] || "—",
  };

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><Shield size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>سجل التدقيق</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>تتبع جميع الإجراءات والعمليات في النظام</p>
        </div>
        <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "اليوم", value: stats.today, icon: Clock, accent: "var(--con-brand)", onClick: () => {} },
          { label: "الأسبوع", value: stats.week, icon: Activity, accent: "var(--con-success)", onClick: () => {} },
          { label: "المستخدمين النشطين", value: stats.activeUsers, icon: UserCheck, accent: "var(--con-warning)", onClick: () => navigate("/admin-panel/staff") },
          { label: "أهم إجراء", value: ACTION_MAP[stats.topAction as ActionType]?.label || stats.topAction, icon: FileText, accent: "var(--con-danger)", onClick: () => {} },
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
          {(["all", "login", "approve", "reject", "update", "delete", "create"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : ACTION_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد سجلات مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>التاريخ</th><th>المستخدم</th><th>الإجراء</th><th>المورد</th><th>التفاصيل</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12 }}>{new Date(a.date).toLocaleString("ar-SA")}</span></td>
                    <td style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/staff")}>{a.user}</td>
                    <td><span className={`con-badge con-badge-sm ${ACTION_MAP[a.action].cls}`}>{ACTION_MAP[a.action].label}</span></td>
                    <td style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/orders")}>{a.resource}</td>
                    <td>{a.details}</td>
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
