import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, AlertCircle, Link2, Truck, Users, CheckCircle2, XCircle, Clock, Unlink } from "lucide-react";
import { API_BASE } from "@/lib/api";

type AssignmentStatus = "assigned" | "unassigned" | "pending";
interface Assignment { id: string; vehicle: string; vehicleId: string; driver: string; driverId: string; assignDate: string; status: AssignmentStatus; }

const STATUS_MAP: Record<AssignmentStatus, { label: string; cls: string }> = {
  assigned: { label: "معينة", cls: "con-badge-success" },
  unassigned: { label: "غير معينة", cls: "con-badge-danger" },
  pending: { label: "بانتظار", cls: "con-badge-warning" },
};

const MOCK: Assignment[] = [
  { id: "ASG-001", vehicle: "تويوتا هايلكس 2024", vehicleId: "VEH-001", driver: "فهد السبيعي", driverId: "DRV-010", assignDate: "2026-03-15", status: "assigned" },
  { id: "ASG-002", vehicle: "هيونداي H100 2023", vehicleId: "VEH-002", driver: "سعد الحربي", driverId: "DRV-015", assignDate: "2026-03-18", status: "assigned" },
  { id: "ASG-003", vehicle: "ميتسوبيشي كانتر 2024", vehicleId: "VEH-003", driver: "—", driverId: "", assignDate: "—", status: "unassigned" },
  { id: "ASG-004", vehicle: "إيسوزو NPR 2024", vehicleId: "VEH-005", driver: "عبدالله العتيبي", driverId: "DRV-020", assignDate: "2026-03-21", status: "assigned" },
  { id: "ASG-005", vehicle: "تويوتا هايس 2023", vehicleId: "VEH-004", driver: "—", driverId: "", assignDate: "—", status: "pending" },
];

export default function FleetAssignments() {
  const navigate = useNavigate();
  const [data, setData] = useState<Assignment[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AssignmentStatus | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/fleet/assignments`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  async function handleUnassign(id: string) {
    try { await fetch(`${API_BASE}/fleet/assignments/${id}/unassign`, { method: "POST", headers: { "Content-Type": "application/json" } }); } catch {}
    setData(prev => prev.map(a => a.id === id ? { ...a, status: "unassigned" as AssignmentStatus, driver: "—", driverId: "", assignDate: "—" } : a));
  }

  const filtered = data.filter(a => {
    const matchSearch = a.vehicle.includes(search) || a.driver.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    assigned: data.filter(a => a.status === "assigned").length,
    unassigned: data.filter(a => a.status === "unassigned").length,
    total: data.length,
    todayAssigns: data.filter(a => a.assignDate === today).length,
  };

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><Link2 size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>تعيينات الأسطول</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>إدارة تعيين المركبات للسائقين</p>
        </div>
        <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "معينة", value: stats.assigned, icon: CheckCircle2, accent: "var(--con-success)", onClick: () => setFilter("assigned") },
          { label: "غير معينة", value: stats.unassigned, icon: XCircle, accent: "var(--con-danger)", onClick: () => setFilter("unassigned") },
          { label: "الإجمالي", value: stats.total, icon: Truck, accent: "var(--con-brand)", onClick: () => navigate("/admin-panel/fleet") },
          { label: "تعيينات اليوم", value: stats.todayAssigns, icon: Clock, accent: "var(--con-warning)", onClick: () => {} },
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
          {(["all", "assigned", "unassigned", "pending"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد تعيينات مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>المركبة</th><th>السائق</th><th>تاريخ التعيين</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/fleet")}><Truck size={12} style={{ display: "inline", marginLeft: 4 }} />{a.vehicle}</td>
                    <td>{a.driver !== "—" ? <span style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/couriers")}>{a.driver}</span> : "—"}</td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12 }}>{a.assignDate}</span></td>
                    <td><span className={`con-badge con-badge-sm ${STATUS_MAP[a.status].cls}`}>{STATUS_MAP[a.status].label}</span></td>
                    <td>
                      {a.status === "assigned" ? (
                        <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11, color: "var(--con-danger)" }} onClick={() => handleUnassign(a.id)}><Unlink size={12} /> إلغاء التعيين</button>
                      ) : (
                        <button className="con-btn-primary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => navigate("/admin-panel/couriers")}><Link2 size={12} /> تعيين</button>
                      )}
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
