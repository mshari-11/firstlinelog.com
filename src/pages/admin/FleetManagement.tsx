import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, AlertCircle, Truck, CheckCircle2, Wrench, ParkingCircle, Users, Link2, Car, MapPin, Plus, Download, Printer, X } from "lucide-react";

function downloadCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename + ".csv"; a.click();
}
import { API_BASE } from "@/lib/api";

type VehicleStatus = "active" | "maintenance" | "available" | "inactive";
interface Vehicle { id: string; name: string; type: string; driver: string; status: VehicleStatus; lastMaintenance: string; location: string; }

const STATUS_MAP: Record<VehicleStatus, { label: string; cls: string }> = {
  active: { label: "نشطة", cls: "con-badge-success" },
  maintenance: { label: "صيانة", cls: "con-badge-warning" },
  available: { label: "متاحة", cls: "con-badge-info" },
  inactive: { label: "غير نشطة", cls: "con-badge-danger" },
};

const MOCK: Vehicle[] = [
  { id: "VEH-001", name: "تويوتا هايلكس 2024", type: "بيك أب", driver: "فهد السبيعي", status: "active", lastMaintenance: "2026-03-10", location: "الرياض - حي العليا" },
  { id: "VEH-002", name: "هيونداي H100 2023", type: "فان", driver: "سعد الحربي", status: "active", lastMaintenance: "2026-03-05", location: "الرياض - حي النخيل" },
  { id: "VEH-003", name: "ميتسوبيشي كانتر 2024", type: "شاحنة صغيرة", driver: "—", status: "maintenance", lastMaintenance: "2026-03-18", location: "ورشة الصيانة" },
  { id: "VEH-004", name: "تويوتا هايس 2023", type: "فان", driver: "—", status: "available", lastMaintenance: "2026-02-28", location: "المستودع الرئيسي" },
  { id: "VEH-005", name: "إيسوزو NPR 2024", type: "شاحنة", driver: "عبدالله العتيبي", status: "active", lastMaintenance: "2026-03-12", location: "جدة - حي الصفا" },
  { id: "VEH-006", name: "نيسان أورفان 2023", type: "فان", driver: "—", status: "available", lastMaintenance: "2026-03-01", location: "المستودع الرئيسي" },
];

export default function FleetManagement() {
  const navigate = useNavigate();
  const [data, setData] = useState<Vehicle[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VehicleStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: "", type: "فان", driver: "", location: "" });

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/fleet/vehicles`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  async function handleMaintenance(id: string) {
    try { await fetch(`${API_BASE}/fleet/vehicles/${id}/maintenance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: new Date().toISOString() }) }); } catch {}
    setData(prev => prev.map(v => v.id === id ? { ...v, status: "maintenance" as VehicleStatus, lastMaintenance: new Date().toISOString().slice(0, 10) } : v));
  }

  const filtered = data.filter(a => {
    const matchSearch = a.name.includes(search) || a.driver.includes(search) || a.location.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: data.length,
    active: data.filter(v => v.status === "active").length,
    maintenance: data.filter(v => v.status === "maintenance").length,
    available: data.filter(v => v.status === "available").length,
  };

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><Truck size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>إدارة الأسطول المتقدمة</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>إدارة المركبات والصيانة والتتبع</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button className="con-btn-ghost" onClick={() => { window.print(); }}><Printer size={14} /> طباعة</button>
          <button className="con-btn-ghost" onClick={() => {
            const rows = data.map(v => ({
              المعرف: v.id, المركبة: v.name, النوع: v.type, السائق: v.driver,
              الحالة: STATUS_MAP[v.status].label, آخر_صيانة: v.lastMaintenance, الموقع: v.location,
            }));
            downloadCSV(rows, "fleet_export");
          }}><Download size={14} /> تصدير CSV</button>
          <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
          <button className="con-btn-primary" onClick={() => setShowAddModal(true)}><Plus size={14} /> إضافة مركبة</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "إجمالي", value: stats.total, icon: Truck, accent: "var(--con-brand)", onClick: () => navigate("/admin-panel/vehicles") },
          { label: "نشطة", value: stats.active, icon: CheckCircle2, accent: "var(--con-success)", onClick: () => setFilter("active") },
          { label: "صيانة", value: stats.maintenance, icon: Wrench, accent: "var(--con-warning)", onClick: () => setFilter("maintenance") },
          { label: "متاحة", value: stats.available, icon: ParkingCircle, accent: "var(--con-brand)", onClick: () => setFilter("available") },
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
          {(["all", "active", "maintenance", "available", "inactive"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد مركبات مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>المركبة</th><th>النوع</th><th>السائق</th><th>الحالة</th><th>آخر صيانة</th><th>الموقع</th><th>إجراء</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontWeight: 600 }}>{a.name}</span><br /><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 11, color: "var(--con-text-muted)" }}>{a.id}</span></td>
                    <td><span className="con-badge con-badge-sm con-badge-info">{a.type}</span></td>
                    <td>{a.driver !== "—" ? <span style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/couriers")}>{a.driver}</span> : "—"}</td>
                    <td><span className={`con-badge con-badge-sm ${STATUS_MAP[a.status].cls}`}>{STATUS_MAP[a.status].label}</span></td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12 }}>{a.lastMaintenance}</span></td>
                    <td><MapPin size={12} style={{ display: "inline", marginLeft: 4, color: "var(--con-text-muted)" }} />{a.location}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleMaintenance(a.id)}><Wrench size={12} /> صيانة</button>
                        <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => navigate("/admin-panel/fleet-assignments")}><Link2 size={12} /> تعيين</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div dir="rtl" style={{ background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-strong)", borderRadius: 12, width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--con-border-default)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>إضافة مركبة جديدة</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", color: "var(--con-text-muted)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "اسم المركبة *", value: newVehicle.name, key: "name", placeholder: "تويوتا هايلكس 2024" },
                { label: "النوع", value: newVehicle.type, key: "type", placeholder: "فان" },
                { label: "السائق", value: newVehicle.driver, key: "driver", placeholder: "—" },
                { label: "الموقع", value: newVehicle.location, key: "location", placeholder: "الرياض" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 4, display: "block" }}>{f.label}</label>
                  <input className="con-input" value={f.value} placeholder={f.placeholder} onChange={(e) => setNewVehicle((prev) => ({ ...prev, [f.key]: e.target.value }))} style={{ width: "100%" }} />
                </div>
              ))}
              <button className="con-btn-primary" disabled={!newVehicle.name} onClick={() => {
                const next: Vehicle = { id: `VEH-${Date.now()}`, name: newVehicle.name, type: newVehicle.type || "فان", driver: newVehicle.driver || "—", status: "available", lastMaintenance: new Date().toISOString().slice(0, 10), location: newVehicle.location || "—" };
                setData(prev => [next, ...prev]);
                setShowAddModal(false);
                setNewVehicle({ name: "", type: "فان", driver: "", location: "" });
              }} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
                <Plus size={14} /> إضافة المركبة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
