/**
 * صفحة إدارة المناديب — Enterprise Courier Management Console
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users, Plus, Search, MoreVertical,
  CheckCircle2, XCircle, Clock, MapPin,
  Star, Package, Bike, Truck,
} from "lucide-react";

interface Courier {
  id: string;
  full_name: string;
  phone: string;
  status: "active" | "inactive" | "on_delivery" | "pending";
  city?: string;
  rating?: number;
  total_orders?: number;
  vehicle_type?: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  active:      { label: "نشط",          cls: "con-badge con-badge-success" },
  inactive:    { label: "غير نشط",      cls: "con-badge con-badge-muted"   },
  on_delivery: { label: "في التوصيل",   cls: "con-badge con-badge-info"    },
  pending:     { label: "قيد المراجعة", cls: "con-badge con-badge-warning"  },
};

const kpiConfig = [
  { key: "total",      label: "إجمالي المناديب",    icon: Users,        variant: "brand"   },
  { key: "active",     label: "نشطون الآن",          icon: CheckCircle2, variant: "success" },
  { key: "onDelivery", label: "في التوصيل",          icon: Bike,         variant: "info"    },
  { key: "pending",    label: "قيد المراجعة",        icon: Clock,        variant: "warning" },
] as const;

const mockCouriers: Courier[] = [
  { id: "1", full_name: "أحمد محمد السالم",  phone: "0501234567", status: "active",      city: "الرياض", rating: 4.8, total_orders: 312, vehicle_type: "دراجة", created_at: "2024-01-15" },
  { id: "2", full_name: "خالد العمري",       phone: "0557654321", status: "on_delivery", city: "جدة",    rating: 4.5, total_orders: 198, vehicle_type: "سيارة", created_at: "2024-02-20" },
  { id: "3", full_name: "فهد الغامدي",       phone: "0509876543", status: "active",      city: "الرياض", rating: 4.9, total_orders: 445, vehicle_type: "دراجة", created_at: "2023-11-10" },
  { id: "4", full_name: "سعد الزهراني",      phone: "0551112233", status: "inactive",    city: "الدمام", rating: 3.9, total_orders: 87,  vehicle_type: "دراجة", created_at: "2024-03-05" },
  { id: "5", full_name: "عمر الشمري",        phone: "0503334455", status: "pending",     city: "الرياض", rating: undefined, total_orders: 0, vehicle_type: "سيارة", created_at: "2025-02-01" },
  { id: "6", full_name: "محمد القحطاني",     phone: "0556667788", status: "active",      city: "مكة",   rating: 4.7, total_orders: 234, vehicle_type: "دراجة", created_at: "2024-04-18" },
];

function initials(name: string) {
  return name.trim().charAt(0);
}

export default function AdminCouriers() {
  const [couriers, setCouriers]         = useState<Courier[]>(mockCouriers);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => { fetchCouriers(); }, []);

  async function fetchCouriers() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("couriers")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setCouriers(data as Courier[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = couriers.filter((c) => {
    const matchSearch = c.full_name.includes(search) || c.phone.includes(search);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:      couriers.length,
    active:     couriers.filter((c) => c.status === "active").length,
    onDelivery: couriers.filter((c) => c.status === "on_delivery").length,
    pending:    couriers.filter((c) => c.status === "pending").length,
  };

  const variantStyle = (v: string): React.CSSProperties => {
    const map: Record<string, { icon: string; bg: string }> = {
      brand:   { icon: "var(--con-brand)",   bg: "var(--con-brand-subtle)"   },
      success: { icon: "var(--con-success)", bg: "var(--con-success-subtle)" },
      info:    { icon: "var(--con-info)",    bg: "var(--con-info-subtle)"    },
      warning: { icon: "var(--con-warning)", bg: "var(--con-warning-subtle)" },
    };
    return map[v] ?? map.brand;
  };

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }} dir="rtl">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", lineHeight: 1.2 }}>
            المناديب
          </h1>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>
            إدارة جميع مناديب التوصيل
          </p>
        </div>
        <button className="con-btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={15} />
          إضافة مندوب
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {kpiConfig.map((k) => {
          const s = variantStyle(k.variant);
          const value = stats[k.key as keyof typeof stats];
          return (
            <div key={k.key} className="con-kpi-card">
              <div className="con-icon-wrap" style={{ background: s.bg, color: s.icon, marginBottom: "0.75rem" }}>
                <k.icon size={18} />
              </div>
              <div className="con-kpi-value">{loading ? "—" : value}</div>
              <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>
                {k.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className="con-toolbar">
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={14}
            style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }}
          />
          <input
            className="con-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الجوال..."
            style={{ paddingRight: "2.25rem", width: "100%" }}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {[
            { value: "all",         label: "الكل" },
            { value: "active",      label: "نشط" },
            { value: "on_delivery", label: "في التوصيل" },
            { value: "inactive",    label: "غير نشط" },
            { value: "pending",     label: "قيد المراجعة" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`con-tab${statusFilter === opt.value ? " con-tab-active" : ""}`}
              style={{ fontSize: "var(--con-text-caption)" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Couriers Table ── */}
      <div className="con-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="con-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>المندوب</th>
                <th>رقم الجوال</th>
                <th>المدينة</th>
                <th>المركبة</th>
                <th>التقييم</th>
                <th>إجمالي الطلبات</th>
                <th>الحالة</th>
                <th style={{ width: "2.5rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j}><div className="con-skeleton" style={{ height: "1rem", borderRadius: "4px" }} /></td>
                      ))}
                    </tr>
                  ))
                : filtered.map((courier) => {
                    const sc = statusConfig[courier.status];
                    return (
                      <tr key={courier.id}>
                        {/* Avatar + Name */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div
                              style={{
                                width: "2rem", height: "2rem", borderRadius: "var(--con-radius)",
                                background: "var(--con-brand-subtle)", color: "var(--con-brand)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "var(--con-text-caption)", fontWeight: 600, flexShrink: 0,
                              }}
                            >
                              {initials(courier.full_name)}
                            </div>
                            <span style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>
                              {courier.full_name}
                            </span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td>
                          <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>
                            {courier.phone}
                          </span>
                        </td>

                        {/* City */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--con-text-secondary)" }}>
                            <MapPin size={12} style={{ color: "var(--con-text-muted)" }} />
                            {courier.city ?? "—"}
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            {courier.vehicle_type === "سيارة"
                              ? <Truck size={13} style={{ color: "var(--con-text-muted)" }} />
                              : <Bike  size={13} style={{ color: "var(--con-text-muted)" }} />
                            }
                            <span style={{ color: "var(--con-text-secondary)" }}>{courier.vehicle_type ?? "—"}</span>
                          </div>
                        </td>

                        {/* Rating */}
                        <td>
                          {courier.rating != null ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <Star size={12} style={{ color: "var(--con-warning)", fill: "var(--con-warning)" }} />
                              <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-primary)", fontWeight: 600 }}>
                                {courier.rating.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--con-text-muted)" }}>—</span>
                          )}
                        </td>

                        {/* Total Orders */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            <Package size={12} style={{ color: "var(--con-text-muted)" }} />
                            <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>
                              {(courier.total_orders ?? 0).toLocaleString("ar-SA")}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={sc?.cls ?? "con-badge con-badge-muted"}>
                            {sc?.label ?? courier.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td>
                          <button
                            style={{
                              padding: "0.25rem", borderRadius: "var(--con-radius-sm)",
                              color: "var(--con-text-muted)", background: "transparent", border: "none", cursor: "pointer",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--con-bg-elevated)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                          >
                            <MoreVertical size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="con-empty">
            <Users size={28} style={{ marginBottom: "0.5rem", opacity: 0.3 }} />
            <p>لا توجد نتائج تطابق المعايير المحددة</p>
          </div>
        )}

        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              padding: "0.625rem 1.25rem",
              borderTop: "1px solid var(--con-border-default)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
            }}
          >
            <span>
              {filtered.length} مندوب
              {statusFilter !== "all" && ` · تصفية: ${statusConfig[statusFilter]?.label ?? statusFilter}`}
            </span>
            <span>
              نشط: {filtered.filter((c) => c.status === "active").length}
              {" · "}
              في التوصيل: {filtered.filter((c) => c.status === "on_delivery").length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
