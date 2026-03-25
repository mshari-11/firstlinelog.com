import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Search, RefreshCw, Clock, CheckCircle2, FileText, AlertCircle, DollarSign, Users, Eye, ArrowRightLeft } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

type PayoutStatus = "draft" | "approved" | "paid";
interface PayoutRun { id: string; period: string; driverCount: number; amount: number; status: PayoutStatus; }

const STATUS: Record<PayoutStatus, { label: string; cls: string; icon: JSX.Element }> = {
  draft: { label: "مسودة", cls: "con-badge-warning", icon: <Clock size={12} /> },
  approved: { label: "معتمد", cls: "con-badge-info", icon: <CheckCircle2 size={12} /> },
  paid: { label: "مدفوع", cls: "con-badge-success", icon: <DollarSign size={12} /> },
};

const MOCK: PayoutRun[] = [
  { id: "PAY-001", period: "1-7 مارس 2026", driverCount: 45, amount: 67500, status: "paid" },
  { id: "PAY-002", period: "8-14 مارس 2026", driverCount: 48, amount: 72000, status: "paid" },
  { id: "PAY-003", period: "15-21 مارس 2026", driverCount: 50, amount: 75000, status: "approved" },
  { id: "PAY-004", period: "22-28 مارس 2026", driverCount: 47, amount: 70500, status: "draft" },
];

export default function PayoutManagement() {
  const navigate = useNavigate();
  const [data, setData] = useState<PayoutRun[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PayoutStatus | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/payout-runs`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { toast.error("فشل تحميل بيانات الرواتب"); }
    setLoading(false);
  }

  const filtered = data.filter(a => {
    const matchSearch = a.period.includes(search) || a.id.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPaid = data.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const thisWeek = data.length > 0 ? data[data.length - 1].amount : 0;
  const totalDrivers = data.reduce((s, i) => s + i.driverCount, 0);
  const avgPayout = data.length > 0 ? Math.round(data.reduce((s, i) => s + i.amount, 0) / data.length) : 0;

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><Wallet size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>إدارة الدفعات</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>دورات الدفع والتحويلات للسائقين</p>
        </div>
        <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "إجمالي المدفوع", value: totalPaid.toLocaleString("ar-SA") + " ر.س", icon: DollarSign, accent: "var(--con-success)", onClick: () => navigate("/admin-panel/wallet") },
          { label: "هذا الأسبوع", value: thisWeek.toLocaleString("ar-SA") + " ر.س", icon: Wallet, accent: "var(--con-brand)", onClick: () => navigate("/admin-panel/reconciliation") },
          { label: "السائقين", value: totalDrivers, icon: Users, accent: "var(--con-warning)", onClick: () => navigate("/admin-panel/couriers") },
          { label: "متوسط الدفعة", value: avgPayout.toLocaleString("ar-SA") + " ر.س", icon: ArrowRightLeft, accent: "var(--con-info, #3b82f6)", onClick: () => {} },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالفترة أو الرقم..." className="con-input" style={{ paddingInlineEnd: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "draft", "approved", "paid"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : STATUS[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد دورات دفع مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>رقم الدورة</th><th>الفترة</th><th>عدد السائقين</th><th>المبلغ</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12, fontWeight: 600 }}>{a.id}</span></td>
                    <td>{a.period}</td>
                    <td><span style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/couriers")}>{a.driverCount}</span></td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", cursor: "pointer" }} onClick={() => navigate("/admin-panel/wallet")}>{a.amount.toLocaleString("ar-SA")} ر.س</span></td>
                    <td><span className={`con-badge con-badge-sm ${STATUS[a.status].cls}`}>{STATUS[a.status].icon} {STATUS[a.status].label}</span></td>
                    <td>
                      <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => navigate("/admin-panel/reconciliation")}><Eye size={12} /> تفاصيل</button>
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
