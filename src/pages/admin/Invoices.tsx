import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle, DollarSign, Send, BarChart3, Eye } from "lucide-react";
import { API_BASE } from "@/lib/api";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
interface Invoice { id: string; customer: string; amount: number; issueDate: string; dueDate: string; status: InvoiceStatus; }

const STATUS: Record<InvoiceStatus, { label: string; cls: string; icon: JSX.Element }> = {
  draft: { label: "مسودة", cls: "con-badge-warning", icon: <Clock size={12} /> },
  sent: { label: "مرسلة", cls: "con-badge-info", icon: <Send size={12} /> },
  paid: { label: "مدفوعة", cls: "con-badge-success", icon: <CheckCircle2 size={12} /> },
  overdue: { label: "متأخرة", cls: "con-badge-danger", icon: <XCircle size={12} /> },
};

const MOCK: Invoice[] = [
  { id: "INV-001", customer: "شركة النقل السريع", amount: 25000, issueDate: "2026-03-01", dueDate: "2026-03-15", status: "paid" },
  { id: "INV-002", customer: "مؤسسة التوصيل المتميز", amount: 18500, issueDate: "2026-03-05", dueDate: "2026-03-20", status: "sent" },
  { id: "INV-003", customer: "شركة الخليج للخدمات", amount: 32000, issueDate: "2026-03-10", dueDate: "2026-03-25", status: "draft" },
  { id: "INV-004", customer: "مجموعة الرياض اللوجستية", amount: 15000, issueDate: "2026-02-15", dueDate: "2026-03-01", status: "overdue" },
  { id: "INV-005", customer: "شركة الأمانة للشحن", amount: 42000, issueDate: "2026-03-12", dueDate: "2026-03-27", status: "sent" },
];

export default function Invoices() {
  const navigate = useNavigate();
  const [data, setData] = useState<Invoice[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/invoices`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  const filtered = data.filter(a => {
    const matchSearch = a.customer.includes(search) || a.id.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const totalAmount = data.reduce((s, i) => s + i.amount, 0);
  const paidAmount = data.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const pendingAmount = data.filter(i => i.status === "sent" || i.status === "draft").reduce((s, i) => s + i.amount, 0);
  const overdueAmount = data.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>الفواتير</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>إدارة الفواتير والمدفوعات</p>
        </div>
        <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "إجمالي المبلغ", value: totalAmount.toLocaleString("ar-SA") + " ر.س", icon: DollarSign, accent: "var(--con-brand)", onClick: () => navigate("/admin-panel/finance") },
          { label: "مدفوع", value: paidAmount.toLocaleString("ar-SA") + " ر.س", icon: CheckCircle2, accent: "var(--con-success)", onClick: () => setFilter("paid") },
          { label: "معلق", value: pendingAmount.toLocaleString("ar-SA") + " ر.س", icon: Clock, accent: "var(--con-warning)", onClick: () => setFilter("sent") },
          { label: "متأخر", value: overdueAmount.toLocaleString("ar-SA") + " ر.س", icon: XCircle, accent: "var(--con-danger)", onClick: () => navigate("/admin-panel/financial-reports") },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالعميل أو رقم الفاتورة..." className="con-input" style={{ paddingRight: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "draft", "sent", "paid", "overdue"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : STATUS[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد فواتير مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>المبلغ</th><th>تاريخ الإصدار</th><th>الاستحقاق</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12, fontWeight: 600 }}>{a.id}</span></td>
                    <td>{a.customer}</td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", cursor: "pointer" }} onClick={() => navigate("/admin-panel/finance")}>{a.amount.toLocaleString("ar-SA")} ر.س</span></td>
                    <td>{a.issueDate}</td>
                    <td>{a.dueDate}</td>
                    <td><span className={`con-badge con-badge-sm ${STATUS[a.status].cls}`}>{STATUS[a.status].icon} {STATUS[a.status].label}</span></td>
                    <td>
                      <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => navigate("/admin-panel/financial-reports")}><Eye size={12} /> عرض</button>
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
