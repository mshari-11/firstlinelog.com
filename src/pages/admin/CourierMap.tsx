/**
 * صفحة توزيع المناديب — Courier City Distribution Dashboard
 * عرض توزيع المناديب حسب المدينة مع إحصائيات ورسوم بيانية
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { MapPin, Users, UserCheck, Truck, Clock, Search, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  PageWrapper,
  PageHeader,
  KPIGrid,
  KPICard,
  Card,
  Badge,
} from "@/components/admin/ui";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────
interface CityCourier {
  id: string;
  name: string;
  phone: string;
  status: "active" | "inactive" | "on_delivery" | "on_leave" | "suspended" | "training";
  vehicle_type: string;
  rating?: number;
  last_active?: string;
}

interface CityData {
  city: string;
  total: number;
  active: number;
  on_delivery: number;
  on_leave: number;
  inactive: number;
  color: string;
  couriers: CityCourier[];
}

// ── City Colors ───────────────────────────────────────────────────────────────
const CITY_COLORS: Record<string, string> = {
  "الرياض": "#3b82f6",
  "جدة": "#22c55e",
  "الدمام": "#f59e0b",
  "مكة": "#a855f7",
  "المدينة": "#ef4444",
};

const FALLBACK_COLOR = "#94a3b8";

function getCityColor(city: string): string {
  return CITY_COLORS[city] ?? FALLBACK_COLOR;
}

function getOnlineStatus(lastActive?: string): { color: string; label: string } {
  if (!lastActive) return { color: "#64748b", label: "غير متصل" };
  const diff = Date.now() - new Date(lastActive).getTime();
  const minutes = diff / 60000;
  if (minutes < 60) return { color: "#22c55e", label: `منذ ${Math.round(minutes)} دقيقة` };
  const hours = minutes / 60;
  if (hours < 24) return { color: "#f59e0b", label: `منذ ${Math.round(hours)} ساعة` };
  const days = hours / 24;
  return { color: "#64748b", label: `منذ ${Math.round(days)} يوم` };
}

// ── Raw courier row from Supabase ─────────────────────────────────────────────
interface CourierRow {
  id: string;
  full_name?: string;
  name?: string;
  phone?: string;
  status?: string;
  vehicle_type?: string;
  rating?: number;
  last_active?: string;
  city?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "يعمل", color: "#22c55e" },
  inactive: { label: "لا يعمل", color: "#64748b" },
  on_delivery: { label: "في التوصيل", color: "#3b82f6" },
  on_leave: { label: "إجازة", color: "#f59e0b" },
  suspended: { label: "موقوف", color: "#ef4444" },
  training: { label: "تحت التدريب", color: "#8b5cf6" },
};

// ── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--con-bg-elevated, #0a1628)",
      border: "1px solid var(--con-border-default, #1a3a52)",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
      direction: "rtl",
    }}>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: i < payload.length - 1 ? 4 : 0, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span>{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Helper: group raw rows into CityData ──────────────────────────────────────
function groupByCities(rows: CourierRow[]): CityData[] {
  const map = new Map<string, CityData>();
  for (const row of rows) {
    const city = row.city ?? "غير محدد";
    const color = getCityColor(city);
    if (!map.has(city)) {
      map.set(city, { city, total: 0, active: 0, on_delivery: 0, on_leave: 0, inactive: 0, color, couriers: [] });
    }
    const cd = map.get(city)!;
    cd.total += 1;
    const status = (row.status ?? "inactive") as CityCourier["status"];
    if (status === "active") cd.active += 1;
    else if (status === "on_delivery") cd.on_delivery += 1;
    else if (status === "on_leave") cd.on_leave += 1;
    else cd.inactive += 1;
    cd.couriers.push({
      id: row.id,
      name: row.full_name ?? row.name ?? "—",
      phone: row.phone ?? "",
      status,
      vehicle_type: row.vehicle_type ?? "—",
      rating: row.rating,
      last_active: row.last_active,
    });
  }
  return Array.from(map.values());
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function CourierMap() {
  const [searchCity, setSearchCity] = useState("");
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("couriers")
        .select("id, full_name, name, phone, status, vehicle_type, rating, last_active, city");
      if (error) throw error;
      setCityData(groupByCities((data ?? []) as CourierRow[]));
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "فشل جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const filteredCities = useMemo(() => {
    if (!searchCity.trim()) return cityData;
    return cityData.filter((c) => c.city.includes(searchCity.trim()));
  }, [searchCity, cityData]);

  const totals = useMemo(() => ({
    total: cityData.reduce((s, c) => s + c.total, 0),
    active: cityData.reduce((s, c) => s + c.active, 0),
    onDelivery: cityData.reduce((s, c) => s + c.on_delivery, 0),
    onLeave: cityData.reduce((s, c) => s + c.on_leave, 0),
  }), [cityData]);

  const pieData = useMemo(() =>
    cityData.map((c) => ({ name: c.city, value: c.total, color: c.color })),
  [cityData]);

  const barData = useMemo(() =>
    cityData.map((c) => ({
      city: c.city,
      نشط: c.active,
      "في التوصيل": c.on_delivery,
      "غير نشط": c.inactive + c.on_leave,
    })),
  [cityData]);

  const _s: Record<string, React.CSSProperties> = {
    section: {
      background: "var(--con-bg-elevated, #0a1628)",
      border: "1px solid var(--con-border-default, #1a3a52)",
      borderRadius: 10,
      padding: 20,
    },
    chartTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: "var(--con-text-primary)",
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
  };

  return (
    <PageWrapper>
      <PageHeader
        title="توزيع المناديب"
        subtitle="عرض توزيع المناديب حسب المدن مع الإحصائيات التفصيلية"
        icon={MapPin}
        actions={
          <button
            type="button"
            onClick={fetchLocations}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--con-brand, #3b82f6)",
              background: "var(--con-brand, #3b82f6)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            سحب المواقع
          </button>
        }
      />

      {/* KPIs */}
      <KPIGrid>
        <KPICard label="إجمالي المناديب" value={totals.total} icon={Users} accent="var(--con-brand)" />
        <KPICard label="نشطون الآن" value={totals.active} icon={UserCheck} accent="var(--con-success)" />
        <KPICard label="في التوصيل" value={totals.onDelivery} icon={Truck} accent="var(--con-info)" />
        <KPICard label="في إجازة" value={totals.onLeave} icon={Clock} accent="var(--con-warning)" />
      </KPIGrid>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        {/* Pie Chart */}
        <div style={_s.section}>
          <div style={_s.chartTitle}>
            <MapPin size={16} />
            توزيع المناديب حسب المدينة
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                paddingAngle={3}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            {pieData.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--con-text-secondary)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: "inline-block" }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div style={_s.section}>
          <div style={_s.chartTitle}>
            <Users size={16} />
            حالة المناديب حسب المدينة
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical" margin={{ right: 10, left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--con-text-muted)" }} />
              <YAxis type="category" dataKey="city" tick={{ fontSize: 12, fill: "var(--con-text-secondary)" }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="نشط" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="في التوصيل" stackId="a" fill="#3b82f6" />
              <Bar dataKey="غير نشط" stackId="a" fill="#64748b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--con-bg-elevated, #0a1628)",
          border: "1px solid var(--con-border-default, #1a3a52)",
          borderRadius: 8,
          padding: "0.5rem 0.75rem",
          maxWidth: 320,
        }}>
          <Search size={14} style={{ color: "var(--con-text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="ابحث بالمدينة..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--con-text-primary)",
              fontSize: 13,
              width: "100%",
              direction: "rtl",
            }}
          />
        </div>
      </div>

      {/* City Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
        {filteredCities.map((city) => {
          const isExpanded = expandedCity === city.city;
          return (
            <Card key={city.city} noPadding>
              <div style={{ padding: 16 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: `${city.color}18`,
                      border: `1px solid ${city.color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <MapPin size={18} style={{ color: city.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--con-text-primary)" }}>{city.city}</div>
                      <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{city.total} مندوب</div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: city.color,
                  }}>
                    {city.total}
                  </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
                  {[
                    { label: "نشط", value: city.active, color: "#22c55e" },
                    { label: "في التوصيل", value: city.on_delivery, color: "#3b82f6" },
                    { label: "إجازة", value: city.on_leave, color: "#f59e0b" },
                    { label: "غير نشط", value: city.inactive, color: "#64748b" },
                  ].map((s) => (
                    <div key={s.label} style={{
                      background: `${s.color}11`,
                      border: `1px solid ${s.color}33`,
                      borderRadius: 6,
                      padding: "6px 4px",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: "var(--con-text-muted)", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Expand Button */}
                <button
                  type="button"
                  onClick={() => setExpandedCity(isExpanded ? null : city.city)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 0",
                    borderRadius: 6,
                    border: "1px solid var(--con-border-default, #1a3a52)",
                    background: "transparent",
                    color: "var(--con-text-secondary)",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "var(--con-bg-elevated, #0a1628)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isExpanded ? "إخفاء القائمة" : `عرض المناديب (${city.couriers.length})`}
                </button>

                {/* Expanded Courier List */}
                {isExpanded && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    {city.couriers.map((courier) => {
                      const statusInfo = STATUS_LABELS[courier.status] ?? { label: courier.status, color: "#64748b" };
                      const onlineInfo = getOnlineStatus(courier.last_active);
                      return (
                        <div
                          key={courier.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: "1px solid var(--con-border-default, #1a3a52)",
                            background: "var(--con-bg-elevated, #0a1628)",
                          }}
                        >
                          {/* Online dot */}
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: onlineInfo.color,
                            flexShrink: 0,
                            boxShadow: onlineInfo.color === "#22c55e" ? "0 0 6px rgba(34,197,94,0.5)" : "none",
                          }} />
                          {/* Avatar */}
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: `${city.color}22`,
                            color: city.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {courier.name.charAt(0)}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {courier.name}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--con-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                              <span>{courier.vehicle_type}</span>
                              {courier.rating != null && <span>★ {courier.rating.toFixed(1)}</span>}
                              <span style={{ color: onlineInfo.color }}>{onlineInfo.label}</span>
                            </div>
                          </div>
                          {/* Status badge */}
                          <span style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: `${statusInfo.color}18`,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.color}44`,
                            whiteSpace: "nowrap",
                          }}>
                            {statusInfo.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {fetchError && (
        <Card>
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--con-danger, #ef4444)" }}>
            <div style={{ fontSize: 14 }}>{fetchError}</div>
          </div>
        </Card>
      )}

      {!loading && !fetchError && cityData.length === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--con-text-muted)" }}>
            <MapPin size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
            <div style={{ fontSize: 14 }}>لا توجد بيانات مواقع</div>
            <div style={{ fontSize: 12, marginTop: 6, color: "var(--con-text-muted)" }}>
              اضغط "سحب المواقع" لجلب البيانات من قاعدة البيانات
            </div>
          </div>
        </Card>
      )}

      {!loading && !fetchError && cityData.length > 0 && filteredCities.length === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--con-text-muted)" }}>
            <MapPin size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
            <div style={{ fontSize: 14 }}>لا توجد مدن تطابق البحث</div>
          </div>
        </Card>
      )}
    </PageWrapper>
  );
}
