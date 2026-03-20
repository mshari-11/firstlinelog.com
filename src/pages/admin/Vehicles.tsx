/**
 * صفحة إدارة المركبات
 * Enterprise Fleet Panel — vehicle registry, status tracking, service history
 */
import { useState, useEffect } from "react";
import { Truck, Plus, Search, Car, Bike, Package, Wrench, MapPin, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

type VehicleStatus = "active" | "maintenance" | "inactive";

interface Vehicle {
  id: number | string;
  plate: string;
  type: string;
  brand: string;
  year: number;
  courier: string;
  city: string;
  status: VehicleStatus;
  lastService: string;
}

const mockVehicles: Vehicle[] = [
  { id: 1, plate: "ABC-1234", type: "دراجة نارية",  brand: "هوندا",   year: 2022, courier: "أحمد محمد",   city: "الرياض",  status: "active",      lastService: "2025-12-01" },
  { id: 2, plate: "XYZ-5678", type: "سيارة",        brand: "تويوتا",  year: 2021, courier: "محمد علي",    city: "جدة",     status: "maintenance", lastService: "2025-11-15" },
  { id: 3, plate: "DEF-9012", type: "دراجة هوائية", brand: "جاينت",   year: 2023, courier: "خالد سعد",   city: "الدمام",  status: "active",      lastService: "2026-01-10" },
  { id: 4, plate: "GHI-3456", type: "دراجة نارية",  brand: "ياماها",  year: 2020, courier: "عمر حسن",    city: "الرياض",  status: "inactive",    lastService: "2025-10-20" },
  { id: 5, plate: "JKL-7890", type: "سيارة",        brand: "هيونداي", year: 2022, courier: "يوسف أحمد",  city: "مكة",     status: "active",      lastService: "2026-01-20" },
];

const STATUS_META: Record<VehicleStatus, { label: string; badgeClass: string }> = {
  active:      { label: "نشط",       badgeClass: "con-badge-success" },
  maintenance: { label: "صيانة",     badgeClass: "con-badge-warning" },
  inactive:    { label: "غير نشط",   badgeClass: "con-badge-danger"  },
};

function VehicleTypeIcon({ type }: { type: string }) {
  if (type === "سيارة")        return <Car   size={15} style={{ color: "var(--con-brand)" }} />;
  if (type === "دراجة هوائية") return <Bike  size={15} style={{ color: "var(--con-success)" }} />;
  return                              <Truck size={15} style={{ color: "var(--con-warning)" }} />;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Vehicles() {
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
  const [vehicles, setVehicles]         = useState<Vehicle[]>(mockVehicles);

  function addVehicle() {
    const plate = window.prompt("رقم اللوحة:");
    if (!plate) return;
    const type = window.prompt("نوع المركبة:", "سيارة") || "سيارة";
    const brand = window.prompt("الماركة:", "تويوتا") || "تويوتا";
    const courier = window.prompt("اسم المندوب:", "غير محدد") || "غير محدد";
    const city = window.prompt("المدينة:", "الرياض") || "الرياض";
    const year = Number(window.prompt("السنة:", "2024") || "2024");
    const next: Vehicle = {
      id: `local-${Date.now()}`,
      plate,
      type,
      brand,
      year,
      courier,
      city,
      status: "active",
      lastService: new Date().toISOString(),
    };
    setVehicles((prev) => [next, ...prev]);
  }

  useEffect(() => {
    async function fetchVehicles() {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, couriers(full_name, city)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Vehicle[] = data.map((v: any) => ({
          id:          v.id,
          plate:       v.plate_number  || "",
          type:        v.vehicle_type  || "دراجة نارية",
          brand:       v.brand         || "",
          year:        v.year          || 2022,
          courier:     v.couriers?.full_name || "غير محدد",
          city:        v.couriers?.city      || "",
          status:      v.status        || "active",
          lastService: v.last_service_date   || "",
        }));
        setVehicles(mapped);
      }
    }
    fetchVehicles();
  }, []);

  const filtered = vehicles.filter(v => {
    const matchSearch = v.plate.includes(search) || v.courier.includes(search) || v.brand.includes(search);
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:       vehicles.length,
    active:      vehicles.filter(v => v.status === "active").length,
    maintenance: vehicles.filter(v => v.status === "maintenance").length,
    inactive:    vehicles.filter(v => v.status === "inactive").length,
  };

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: "7px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Truck size={18} style={{ color: "var(--con-brand)" }} />
            </div>
            <h1 style={{
              fontSize: "var(--con-text-page-title)", fontWeight: 700,
              color: "var(--con-text-primary)", margin: 0,
              fontFamily: "var(--con-font-primary)",
            }}>
              الأسطول والمركبات
            </h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>
            إدارة مركبات المناديب وتاريخ الصيانة
          </p>
        </div>
        <button className="con-btn-primary" onClick={addVehicle}>
          <Plus size={14} />
          إضافة مركبة
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "إجمالي المركبات", value: stats.total,       icon: Truck,    accent: "var(--con-brand)"   },
          { label: "نشطة",            value: stats.active,      icon: Car,      accent: "var(--con-success)" },
          { label: "في الصيانة",      value: stats.maintenance, icon: Wrench,   accent: "var(--con-warning)" },
          { label: "غير نشطة",        value: stats.inactive,    icon: Bike,     accent: "var(--con-danger)"  },
        ].map(k => (
          <div key={k.label} className="con-kpi-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 500 }}>
                {k.label}
              </span>
              <k.icon size={14} style={{ color: k.accent }} />
            </div>
            <div className="con-kpi-value" style={{ fontSize: 26, color: k.accent }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="con-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={14} style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--con-text-muted)", pointerEvents: "none",
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالرقم، الماركة، أو المندوب..."
            className="con-input"
            style={{ paddingRight: 32, width: "100%" }}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {(["all", "active", "maintenance", "inactive"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "4px 12px", borderRadius: 6,
                fontSize: "var(--con-text-caption)", fontWeight: 500,
                border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                background: statusFilter === s ? "var(--con-brand)" : "transparent",
                borderColor: statusFilter === s ? "var(--con-brand)" : "var(--con-border-strong)",
                color: statusFilter === s ? "#fff" : "var(--con-text-muted)",
              }}
            >
              {s === "all" ? "الكل" : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Fleet Table */}
      <div style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10, overflow: "hidden",
      }}>
        {filtered.length === 0 ? (
          <div className="con-empty">
            <Truck size={32} style={{ opacity: 0.25, marginBottom: 10 }} />
            <div>لا توجد مركبات مطابقة</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>رقم اللوحة</th>
                  <th>الماركة / السنة</th>
                  <th>المندوب</th>
                  <th>المدينة</th>
                  <th>آخر صيانة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    {/* Type */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "var(--con-bg-surface-2)",
                        }}>
                          <VehicleTypeIcon type={v.type} />
                        </div>
                        <span style={{ color: "var(--con-text-secondary)", fontSize: "var(--con-text-table)" }}>
                          {v.type}
                        </span>
                      </div>
                    </td>

                    {/* Plate */}
                    <td>
                      <span style={{
                        fontFamily: "var(--con-font-mono)", fontSize: 13, fontWeight: 600,
                        color: "var(--con-text-primary)",
                        background: "var(--con-bg-surface-2)",
                        padding: "2px 8px", borderRadius: 5,
                        border: "1px solid var(--con-border-default)",
                      }}>
                        {v.plate}
                      </span>
                    </td>

                    {/* Brand / Year */}
                    <td>
                      <span style={{ color: "var(--con-text-primary)", fontWeight: 500 }}>{v.brand}</span>
                      <span style={{
                        fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
                        marginInlineStart: 5,
                      }}>
                        ({v.year})
                      </span>
                    </td>

                    {/* Courier */}
                    <td style={{ color: "var(--con-text-secondary)" }}>{v.courier}</td>

                    {/* City */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={11} style={{ color: "var(--con-text-muted)" }} />
                        <span style={{ color: "var(--con-text-muted)" }}>{v.city || "—"}</span>
                      </div>
                    </td>

                    {/* Last service */}
                    <td>
                      <span style={{
                        fontFamily: "var(--con-font-mono)", fontSize: 12,
                        color: "var(--con-text-muted)",
                      }}>
                        {formatDate(v.lastService)}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`con-badge con-badge-sm ${STATUS_META[v.status]?.badgeClass ?? ""}`}>
                        {STATUS_META[v.status]?.label ?? v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table footer */}
            <div style={{
              padding: "9px 16px",
              borderTop: "1px solid var(--con-border-default)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                {filtered.length} مركبة
                {statusFilter !== "all" && ` — تصفية: ${STATUS_META[statusFilter].label}`}
              </span>
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                نشط:{" "}
                <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-success)", fontWeight: 600 }}>
                  {filtered.filter(v => v.status === "active").length}
                </span>
                {" · "}صيانة:{" "}
                <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-warning)", fontWeight: 600 }}>
                  {filtered.filter(v => v.status === "maintenance").length}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
