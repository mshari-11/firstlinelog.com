import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, AlertCircle, Package, CheckCircle2, XCircle, Truck, ShoppingCart, Users, Radio } from "lucide-react";
import { API_BASE } from "@/lib/api";

type ShipmentStatus = "active" | "delivered" | "cancelled" | "in_transit";
interface Shipment { id: string; trackingNumber: string; platform: string; customer: string; driver: string; status: ShipmentStatus; amount: number; }

const STATUS_MAP: Record<ShipmentStatus, { label: string; cls: string }> = {
  active: { label: "نشطة", cls: "con-badge-info" },
  in_transit: { label: "قيد التوصيل", cls: "con-badge-warning" },
  delivered: { label: "تم التسليم", cls: "con-badge-success" },
  cancelled: { label: "ملغاة", cls: "con-badge-danger" },
};

const MOCK: Shipment[] = [
  { id: "SHP-001", trackingNumber: "FLL-2026032101", platform: "هنقرستيشن", customer: "محمد العلي", driver: "فهد السبيعي", status: "active", amount: 85 },
  { id: "SHP-002", trackingNumber: "FLL-2026032102", platform: "مرسول", customer: "سارة الخالد", driver: "سعد الحربي", status: "in_transit", amount: 120 },
  { id: "SHP-003", trackingNumber: "FLL-2026032003", platform: "جاهز", customer: "أحمد الراشد", driver: "عبدالله العتيبي", status: "delivered", amount: 65 },
  { id: "SHP-004", trackingNumber: "FLL-2026031904", platform: "هنقرستيشن", customer: "نورة المطيري", driver: "خالد الشمري", status: "delivered", amount: 95 },
  { id: "SHP-005", trackingNumber: "FLL-2026031905", platform: "تو يو", customer: "عمر القحطاني", driver: "—", status: "cancelled", amount: 45 },
  { id: "SHP-006", trackingNumber: "FLL-2026032106", platform: "مرسول", customer: "ريم الحربي", driver: "فهد السبيعي", status: "active", amount: 150 },
];

export default function Shipments() {
  const navigate = useNavigate();
  const [data, setData] = useState<Shipment[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ShipmentStatus | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/shipments`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  const filtered = data.filter(a => {
    const matchSearch = a.trackingNumber.includes(search) || a.customer.includes(search) || a.driver.includes(search) || a.platform.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    active: data.filter(s => s.status === "active" || s.status === "in_transit").length,
    delivered: data.filter(s => s.status === "delivered").length,
    cancelled: data.filter(s => s.status === "cancelled").length,
    total: data.length,
  };

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>الشحنات</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>تتبع وإدارة جميع الشحنات</p>
        </div>
        <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "نشطة", value: stats.active, icon: Truck, accent: "var(--con-brand)", onClick: () => setFilter("active") },
          { label: "تم التسليم", value: stats.delivered, icon: CheckCircle2, accent: "var(--con-success)", onClick: () => setFilter("delivered") },
          { label: "ملغاة", value: stats.cancelled, icon: XCircle, accent: "var(--con-danger)", onClick: () => setFilter("cancelled") },
          { label: "الإجمالي", value: stats.total, icon: Package, accent: "var(--con-warning)", onClick: () => {} },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="con-input" style={{ paddingRight: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "active", "in_transit", "delivered", "cancelled"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد شحنات مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>رقم الشحنة</th><th>المنصة</th><th>العميل</th><th>السائق</th><th>الحالة</th><th>المبلغ</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/orders")}>{a.trackingNumber}</span></td>
                    <td><span className="con-badge con-badge-sm con-badge-info" style={{ cursor: "pointer" }} onClick={() => navigate("/admin-panel/dispatch")}><Radio size={10} style={{ display: "inline", marginLeft: 3 }} />{a.platform}</span></td>
                    <td>{a.customer}</td>
                    <td>{a.driver !== "—" ? <span style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/couriers")}>{a.driver}</span> : "—"}</td>
                    <td><span className={`con-badge con-badge-sm ${STATUS_MAP[a.status].cls}`}>{STATUS_MAP[a.status].label}</span></td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)" }}>{a.amount.toLocaleString("ar-SA")} ر.س</span></td>
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
