import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, Search, RefreshCw, DollarSign, Users, FileText, Eye, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

type ApprovalStatus = "pending" | "approved" | "rejected";
interface Approval { id: string; type: string; requester: string; description: string; amount?: number; status: ApprovalStatus; createdAt: string; }

const STATUS: Record<ApprovalStatus, { label: string; cls: string; icon: JSX.Element }> = {
  pending: { label: "معلق", cls: "con-badge-warning", icon: <Clock size={12} /> },
  approved: { label: "معتمد", cls: "con-badge-success", icon: <CheckCircle2 size={12} /> },
  rejected: { label: "مرفوض", cls: "con-badge-danger", icon: <XCircle size={12} /> },
};

const MOCK: Approval[] = [
  { id: "APR-001", type: "مالي", requester: "أحمد المالية", description: "صرف رواتب أسبوع 12", amount: 45000, status: "pending", createdAt: "2026-03-20T10:00:00Z" },
  { id: "APR-002", type: "موظف", requester: "خالد HR", description: "طلب إجازة سنوية - محمد", status: "pending", createdAt: "2026-03-19T14:00:00Z" },
  { id: "APR-003", type: "مالي", requester: "سارة المالية", description: "فاتورة صيانة مركبات", amount: 12500, status: "approved", createdAt: "2026-03-18T09:00:00Z" },
  { id: "APR-004", type: "تشغيلي", requester: "عمر العمليات", description: "تعيين 5 مناديب جدد", status: "rejected", createdAt: "2026-03-17T11:00:00Z" },
];

export default function Approvals() {
  const navigate = useNavigate();
  const [data, setData] = useState<Approval[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ApprovalStatus | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/approvals`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  async function handleAction(id: string, action: "approved" | "rejected") {
    try {
      await fetch(`${API_BASE}/api/approvals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: action }) });
      toast.success(action === "approved" ? "تمت الموافقة بنجاح" : "تم الرفض");
    } catch {
      toast.error("فشل تحديث الاعتماد");
    }
    setData(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
  }

  const filtered = data.filter(a => {
    const matchSearch = a.description.includes(search) || a.requester.includes(search) || a.id.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = { total: data.length, pending: data.filter(a => a.status === "pending").length, approved: data.filter(a => a.status === "approved").length, rejected: data.filter(a => a.status === "rejected").length };

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>الاعتمادات</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>إدارة طلبات الاعتماد والموافقات</p>
        </div>
        <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "الإجمالي", value: stats.total, icon: FileText, accent: "var(--con-brand)", onClick: () => {} },
          { label: "معلقة", value: stats.pending, icon: Clock, accent: "var(--con-warning)", onClick: () => setFilter("pending") },
          { label: "معتمدة", value: stats.approved, icon: CheckCircle2, accent: "var(--con-success)", onClick: () => navigate("/admin-panel/finance") },
          { label: "مرفوضة", value: stats.rejected, icon: XCircle, accent: "var(--con-danger)", onClick: () => setFilter("rejected") },
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
          {(["all", "pending", "approved", "rejected"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : STATUS[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد اعتمادات مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>الرقم</th><th>النوع</th><th>الطالب</th><th>الوصف</th><th>المبلغ</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12, fontWeight: 600 }}>{a.id}</span></td>
                    <td><span className={`con-badge con-badge-sm ${a.type === "مالي" ? "con-badge-info" : "con-badge-warning"}`}>{a.type}</span></td>
                    <td style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/staff")}>{a.requester}</td>
                    <td>{a.description}</td>
                    <td>{a.amount ? <span style={{ fontFamily: "var(--con-font-mono)", cursor: "pointer" }} onClick={() => navigate("/admin-panel/finance")}>{a.amount.toLocaleString("ar-SA")} ر.س</span> : "—"}</td>
                    <td><span className={`con-badge con-badge-sm ${STATUS[a.status].cls}`}>{STATUS[a.status].icon} {STATUS[a.status].label}</span></td>
                    <td>
                      {a.status === "pending" ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="con-btn-primary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleAction(a.id, "approved")}><ThumbsUp size={12} /> اعتماد</button>
                          <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11, color: "var(--con-danger)" }} onClick={() => handleAction(a.id, "rejected")}><ThumbsDown size={12} /> رفض</button>
                        </div>
                      ) : <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => navigate("/admin-panel/audit-log")}><Eye size={12} /> سجل</button>}
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
