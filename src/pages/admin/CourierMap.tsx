/**
 * صفحة توزيع المناديب — Courier City Distribution Dashboard
 * عرض توزيع المناديب حسب المدينة مع إحصائيات ورسوم بيانية
 */
import { useState, useMemo } from "react";
import { MapPin, Users, UserCheck, Truck, Clock, Search, ChevronDown, ChevronUp } from "lucide-react";
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

// ── Mock Data ────────────────────────────────────────────────────────────────
const CITY_COLORS: Record<string, string> = {
  "الرياض": "#3b82f6",
  "جدة": "#22c55e",
  "الدمام": "#f59e0b",
  "مكة": "#a855f7",
  "المدينة": "#ef4444",
};

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

const mockCityData: CityData[] = [
  {
    city: "الرياض",
    total: 45,
    active: 28,
    on_delivery: 10,
    on_leave: 4,
    inactive: 3,
    color: CITY_COLORS["الرياض"],
    couriers: [
      { id: "r1", name: "أحمد محمد السالم", phone: "0501234567", status: "active", vehicle_type: "دراجة", rating: 4.8, last_active: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: "r2", name: "فهد الغامدي", phone: "0509876543", status: "on_leave", vehicle_type: "دراجة", rating: 4.9, last_active: "2026-03-28T14:30:00Z" },
      { id: "r3", name: "عمر الشمري", phone: "0503334455", status: "training", vehicle_type: "سيارة", last_active: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: "r4", name: "سلطان الدوسري", phone: "0504445566", status: "active", vehicle_type: "سيارة", rating: 4.6, last_active: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: "r5", name: "عبدالرحمن العتيبي", phone: "0505556677", status: "on_delivery", vehicle_type: "دراجة", rating: 4.3, last_active: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: "r6", name: "ماجد الحربي", phone: "0506667788", status: "active", vehicle_type: "شاحنة صغيرة", rating: 4.1, last_active: new Date(Date.now() - 45 * 60000).toISOString() },
    ],
  },
  {
    city: "جدة",
    total: 25,
    active: 15,
    on_delivery: 6,
    on_leave: 2,
    inactive: 2,
    color: CITY_COLORS["جدة"],
    couriers: [
      { id: "j1", name: "خالد العمري", phone: "0557654321", status: "on_delivery", vehicle_type: "سيارة", rating: 4.5, last_active: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: "j2", name: "ياسر الزهراني", phone: "0558765432", status: "active", vehicle_type: "دراجة", rating: 4.7, last_active: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: "j3", name: "حسن الشريف", phone: "0559876543", status: "active", vehicle_type: "سيارة", rating: 4.2, last_active: new Date(Date.now() - 8 * 3600000).toISOString() },
      { id: "j4", name: "نواف القرشي", phone: "0550987654", status: "on_leave", vehicle_type: "دراجة", rating: 3.9 },
    ],
  },
  {
    city: "الدمام",
    total: 15,
    active: 8,
    on_delivery: 4,
    on_leave: 1,
    inactive: 2,
    color: CITY_COLORS["الدمام"],
    couriers: [
      { id: "d1", name: "سعد الزهراني", phone: "0551112233", status: "suspended", vehicle_type: "دراجة", rating: 3.9, last_active: "2026-03-15T09:00:00Z" },
      { id: "d2", name: "فيصل العنزي", phone: "0552223344", status: "active", vehicle_type: "سيارة", rating: 4.4, last_active: new Date(Date.now() - 40 * 60000).toISOString() },
      { id: "d3", name: "بدر الشمري", phone: "0553334455", status: "on_delivery", vehicle_type: "دراجة", rating: 4.6, last_active: new Date(Date.now() - 3 * 60000).toISOString() },
    ],
  },
  {
    city: "مكة",
    total: 10,
    active: 6,
    on_delivery: 2,
    on_leave: 1,
    inactive: 1,
    color: CITY_COLORS["مكة"],
    couriers: [
      { id: "m1", name: "محمد القحطاني", phone: "0556667788", status: "active", vehicle_type: "دراجة", rating: 4.7, last_active: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: "m2", name: "علي الغامدي", phone: "0557778899", status: "on_delivery", vehicle_type: "سيارة", rating: 4.0, last_active: new Date(Date.now() - 7 * 60000).toISOString() },
    ],
  },
  {
    city: "المدينة",
    total: 5,
    active: 3,
    on_delivery: 1,
    on_leave: 0,
    inactive: 1,
    color: CITY_COLORS["المدينة"],
    couriers: [
      { id: "md1", name: "عبدالله المالكي", phone: "0558889900", status: "active", vehicle_type: "دراجة", rating: 4.5, last_active: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: "md2", name: "تركي الحارثي", phone: "0559990011", status: "inactive", vehicle_type: "سيارة", rating: 3.8, last_active: "2026-03-01T10:00:00Z" },
    ],
  },
];

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

// ── Main Component ──────────────────────────────────────────────────────────
export default function CourierMap() {
  const [searchCity, setSearchCity] = useState("");
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  const filteredCities = useMemo(() => {
    if (!searchCity.trim()) return mockCityData;
    return mockCityData.filter((c) => c.city.includes(searchCity.trim()));
  }, [searchCity]);

  const totals = useMemo(() => ({
    total: mockCityData.reduce((s, c) => s + c.total, 0),
    active: mockCityData.reduce((s, c) => s + c.active, 0),
    onDelivery: mockCityData.reduce((s, c) => s + c.on_delivery, 0),
    onLeave: mockCityData.reduce((s, c) => s + c.on_leave, 0),
  }), []);

  const pieData = useMemo(() =>
    mockCityData.map((c) => ({ name: c.city, value: c.total, color: c.color })),
  []);

  const barData = useMemo(() =>
    mockCityData.map((c) => ({
      city: c.city,
      نشط: c.active,
      "في التوصيل": c.on_delivery,
      "غير نشط": c.inactive + c.on_leave,
    })),
  []);

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

      {filteredCities.length === 0 && (
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
