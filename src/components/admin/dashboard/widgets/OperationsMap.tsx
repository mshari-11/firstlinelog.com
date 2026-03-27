/**
 * Operations Map Widget — Mini dispatch/courier map overview
 * Shows a simplified view of active couriers by city
 */
import { useNavigate } from "react-router-dom";
import { Map, MapPin } from "lucide-react";
import { WidgetShell } from "../WidgetShell";

interface CityMetric {
  city: string;
  activeCouriers: number;
  todayOrders: number;
  avgDeliveryMin: number;
}

const cityData: CityMetric[] = [
  { city: "الرياض",     activeCouriers: 14, todayOrders: 89,  avgDeliveryMin: 32 },
  { city: "جدة",        activeCouriers: 8,  todayOrders: 56,  avgDeliveryMin: 38 },
  { city: "الدمام",     activeCouriers: 5,  todayOrders: 34,  avgDeliveryMin: 28 },
  { city: "مكة",        activeCouriers: 4,  todayOrders: 28,  avgDeliveryMin: 41 },
  { city: "المدينة",    activeCouriers: 3,  todayOrders: 19,  avgDeliveryMin: 35 },
  { city: "أبها",       activeCouriers: 2,  todayOrders: 11,  avgDeliveryMin: 45 },
];

export function OperationsMap() {
  const navigate = useNavigate();

  const totalActive = cityData.reduce((sum, c) => sum + c.activeCouriers, 0);
  const totalOrders = cityData.reduce((sum, c) => sum + c.todayOrders, 0);

  return (
    <WidgetShell
      id="operations-map"
      title="التوزيع التشغيلي"
      subtitle={`${totalActive} مندوب نشط · ${totalOrders} طلب اليوم`}
      icon={Map}
      iconColor="var(--con-brand)"
      onDrilldown={() => navigate("/admin-panel/dispatch")}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 80px 80px",
            gap: 8,
            padding: "6px 0",
            borderBottom: "1px solid var(--con-border-default)",
          }}
        >
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 600 }}>المدينة</span>
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 600, textAlign: "center" }}>مناديب</span>
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 600, textAlign: "center" }}>طلبات</span>
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 600, textAlign: "center" }}>متوسط</span>
        </div>

        {cityData.map((city) => (
          <div
            key={city.city}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px 80px",
              gap: 8,
              padding: "6px 0",
              borderBottom: "1px solid var(--con-border-default)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={12} style={{ color: "var(--con-brand)" }} />
              <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-primary)", fontWeight: 500 }}>
                {city.city}
              </span>
            </div>
            <span
              style={{
                fontSize: "var(--con-text-body)",
                fontFamily: "var(--con-font-mono)",
                color: "var(--con-brand)",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {city.activeCouriers}
            </span>
            <span
              style={{
                fontSize: "var(--con-text-body)",
                fontFamily: "var(--con-font-mono)",
                color: "var(--con-text-secondary)",
                textAlign: "center",
              }}
            >
              {city.todayOrders}
            </span>
            <span
              style={{
                fontSize: "var(--con-text-body)",
                fontFamily: "var(--con-font-mono)",
                color: city.avgDeliveryMin > 40 ? "var(--con-warning)" : "var(--con-text-muted)",
                textAlign: "center",
              }}
            >
              {city.avgDeliveryMin}د
            </span>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
