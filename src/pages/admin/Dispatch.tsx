/**
 * Live Dispatch Map — Mapbox GL + order dispatch UI
 * Shows driver pins on map, allows assigning orders to drivers,
 * status updates, and real-time-style dispatch panel.
 *
 * Map token: set VITE_MAPBOX_TOKEN in .env
 * Falls back to a styled static placeholder if token is missing.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MapPin, Truck, Package, Clock, CheckCircle2, XCircle,
  AlertTriangle, Search, RefreshCw, Radio, ChevronRight,
  Navigation, Phone, Star, Layers, Filter, Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type DriverStatus = "available" | "busy" | "offline";
type OrderStatus = "pending" | "assigned" | "pickup" | "delivering" | "delivered" | "cancelled";

interface Driver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  status: DriverStatus;
  lat: number;
  lng: number;
  vehicle: string;
  activeOrderId?: string;
}

interface Order {
  id: string;
  customer: string;
  address: string;
  platform: string;
  amount: number;
  status: OrderStatus;
  lat: number;
  lng: number;
  assignedDriverId?: string;
  createdAt: string;
  estimatedTime?: number;
}

// ─── Mock data (Riyadh area) ──────────────────────────────────────────────────
const MOCK_DRIVERS: Driver[] = [
  { id: "D01", name: "محمد العتيبي",   phone: "0501234567", rating: 4.8, status: "available",  lat: 24.7136, lng: 46.6753, vehicle: "دراجة نارية" },
  { id: "D02", name: "خالد الزهراني",  phone: "0512345678", rating: 4.5, status: "busy",       lat: 24.7250, lng: 46.6900, vehicle: "سيارة",       activeOrderId: "O02" },
  { id: "D03", name: "سعد الدوسري",    phone: "0523456789", rating: 4.9, status: "available",  lat: 24.6980, lng: 46.7100, vehicle: "دراجة نارية" },
  { id: "D04", name: "فهد القحطاني",   phone: "0534567890", rating: 4.2, status: "offline",    lat: 24.7400, lng: 46.6500, vehicle: "سيارة" },
  { id: "D05", name: "عبدالله الشمري", phone: "0545678901", rating: 4.7, status: "available",  lat: 24.7050, lng: 46.6600, vehicle: "دراجة نارية" },
];

const MOCK_ORDERS: Order[] = [
  { id: "O01", customer: "أحمد محمد",    address: "حي النزهة، شارع الأمير سلطان", platform: "جاهز",          amount: 45.00,  status: "pending",    lat: 24.7190, lng: 46.6820, createdAt: "14:22" },
  { id: "O02", customer: "سارة العلي",   address: "حي الملقا، طريق أنس بن مالك",  platform: "هنقرستيشن",   amount: 32.50,  status: "assigned",   lat: 24.7260, lng: 46.6950, createdAt: "14:18", assignedDriverId: "D02", estimatedTime: 12 },
  { id: "O03", customer: "فيصل الغامدي", address: "حي العليا، شارع التخصصي",       platform: "طلبات",        amount: 78.00,  status: "delivering", lat: 24.6900, lng: 46.7200, createdAt: "14:05", assignedDriverId: "D02", estimatedTime: 7 },
  { id: "O04", customer: "نورة الحربي",  address: "حي الياسمين، شارع التحلية",     platform: "نون",          amount: 55.25,  status: "pending",    lat: 24.7380, lng: 46.6580, createdAt: "14:30" },
  { id: "O05", customer: "ماجد الرشيدي", address: "حي الروضة، شارع الإمام الترمذي", platform: "جاهز",        amount: 91.00,  status: "delivered",  lat: 24.7070, lng: 46.6640, createdAt: "13:55", assignedDriverId: "D01" },
];

// ─── Status configs ───────────────────────────────────────────────────────────
const DRIVER_STATUS_CONFIG: Record<DriverStatus, { label: string; color: string; dot: string }> = {
  available: { label: "متاح",   color: "var(--con-success)",         dot: "#16A34A" },
  busy:      { label: "مشغول",  color: "var(--con-warning)",         dot: "#D97706" },
  offline:   { label: "غير متصل", color: "var(--con-text-muted)",   dot: "#7E8CA2" },
};

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: JSX.Element }> = {
  pending:    { label: "بانتظار إسناد",  color: "var(--con-warning)", icon: <Clock size={13} /> },
  assigned:   { label: "تم الإسناد",     color: "var(--con-info)",    icon: <Truck size={13} /> },
  pickup:     { label: "في الاستلام",    color: "var(--con-brand)",   icon: <Package size={13} /> },
  delivering: { label: "جارٍ التوصيل",  color: "var(--con-brand)",   icon: <Navigation size={13} /> },
  delivered:  { label: "تم التوصيل",    color: "var(--con-success)", icon: <CheckCircle2 size={13} /> },
  cancelled:  { label: "ملغي",           color: "var(--con-danger)",  icon: <XCircle size={13} /> },
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

// ─── Driver pin SVG ───────────────────────────────────────────────────────────
function DriverPin({ status, selected }: { status: DriverStatus; selected: boolean }) {
  const color = DRIVER_STATUS_CONFIG[status].dot;
  return (
    <div style={{
      width: selected ? "36px" : "30px",
      height: selected ? "36px" : "30px",
      borderRadius: "50%",
      background: color,
      border: `2px solid ${selected ? "#fff" : "rgba(255,255,255,0.5)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer",
      boxShadow: selected ? `0 0 0 4px ${color}55` : "0 2px 6px rgba(0,0,0,0.4)",
      transition: "all 0.2s",
    }}>
      <Truck size={selected ? 16 : 13} color="#fff" />
    </div>
  );
}

function OrderPin({ status, selected }: { status: OrderStatus; selected: boolean }) {
  const isPending = status === "pending";
  return (
    <div style={{
      width: selected ? "28px" : "22px",
      height: selected ? "28px" : "22px",
      borderRadius: "50%",
      background: isPending ? "var(--con-warning)" : "var(--con-brand)",
      border: `2px solid ${selected ? "#fff" : "rgba(255,255,255,0.5)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer",
      boxShadow: selected ? "0 0 0 3px rgba(59,130,246,0.4)" : "0 2px 4px rgba(0,0,0,0.3)",
      transition: "all 0.2s",
      animation: isPending ? "pulse 2s infinite" : "none",
    }}>
      <Package size={selected ? 13 : 10} color="#fff" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Dispatch() {
  const mapRef = useRef<MapRef>(null);
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [dataSource, setDataSource] = useState<"loading" | "live" | "mock">("loading");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // ── Fetch real data from Supabase, fall back to mock ──
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (!supabase) {
        setDataSource("mock");
        return;
      }

      try {
        const { data: couriers } = await supabase
          .from("couriers")
          .select("id, full_name, full_name_ar, phone, city, platform, vehicle_type, status, latitude, longitude");

        if (cancelled) return;

        if (couriers && couriers.length > 0) {
          const mapped: Driver[] = couriers.map((c) => {
            const statusMap: Record<string, DriverStatus> = { active: "available", inactive: "offline", suspended: "offline" };
            return {
              id: c.id,
              name: c.full_name_ar || c.full_name || "—",
              phone: c.phone || "",
              rating: 4.5,
              status: statusMap[c.status] || "offline",
              lat: c.latitude ? parseFloat(c.latitude) : 24.7136 + (Math.random() - 0.5) * 0.08,
              lng: c.longitude ? parseFloat(c.longitude) : 46.6753 + (Math.random() - 0.5) * 0.08,
              vehicle: c.vehicle_type || "—",
            };
          });
          setDrivers(mapped);
          setDataSource("live");
        } else {
          setDataSource("mock");
        }
      } catch {
        if (!cancelled) setDataSource("mock");
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [showDrivers, setShowDrivers] = useState(true);
  const [showOrders, setShowOrders] = useState(true);

  // KPIs
  const available = drivers.filter((d) => d.status === "available").length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const delivering = orders.filter((o) => o.status === "delivering" || o.status === "assigned" || o.status === "pickup").length;

  const flyTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });
  }, []);

  function assignOrder(orderId: string, driverId: string) {
    setOrders((prev) => prev.map((o) => o.id === orderId
      ? { ...o, status: "assigned", assignedDriverId: driverId, estimatedTime: Math.floor(Math.random() * 15) + 5 }
      : o
    ));
    setDrivers((prev) => prev.map((d) => d.id === driverId
      ? { ...d, status: "busy", activeOrderId: orderId }
      : d
    ));
    setSelectedOrder(null);
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    if (status === "delivered" || status === "cancelled") {
      const order = orders.find((o) => o.id === orderId);
      if (order?.assignedDriverId) {
        setDrivers((prev) => prev.map((d) => d.id === order.assignedDriverId
          ? { ...d, status: "available", activeOrderId: undefined }
          : d
        ));
      }
    }
  }

  const filteredOrders = orders.filter((o) => {
    const matchSearch = !orderSearch || o.id.toLowerCase().includes(orderSearch.toLowerCase()) || o.customer.includes(orderSearch);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const noToken = !MAPBOX_TOKEN;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflow: "hidden" }}>

      {/* CSS for pulse animation */}
      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(217,119,6,0.6)} 50%{box-shadow:0 0 0 8px rgba(217,119,6,0)} }`}</style>

      {/* ── Top KPI bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1rem",
        padding: "0.625rem 1.25rem",
        background: "var(--con-bg-surface-2)",
        borderBottom: "1px solid var(--con-border-default)",
        flexShrink: 0,
        flexWrap: "wrap",
      }}>
        <h1 style={{ fontSize: "14px", fontWeight: 700, color: "var(--con-text-primary)", marginLeft: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          لوحة الإرسال المباشر
          {dataSource === "live" && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "100px", background: "var(--con-success-subtle,#dcfce7)", color: "var(--con-success)" }}>مباشر</span>}
          {dataSource === "mock" && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "100px", background: "var(--con-warning-subtle,#fef3c7)", color: "var(--con-warning)" }}>تجريبي</span>}
          {dataSource === "loading" && <RefreshCw size={12} style={{ animation: "spin 1s linear infinite", color: "var(--con-text-muted)" }} />}
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", flex: 1, flexWrap: "wrap" }}>
          {[
            { label: "متاح للإرسال",   value: available,    color: "var(--con-success)", icon: <Truck size={13} /> },
            { label: "طلبات معلّقة",   value: pending,      color: "var(--con-warning)", icon: <Clock size={13} /> },
            { label: "جارٍ التوصيل",   value: delivering,   color: "var(--con-brand)",   icon: <Navigation size={13} /> },
            { label: "إجمالي الطلبات", value: orders.length, color: "var(--con-text-secondary)", icon: <Package size={13} /> },
          ].map((k) => (
            <div key={k.label} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ color: k.color }}>{k.icon}</span>
              <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "14px", fontWeight: 700, color: k.color }}>{k.value}</span>
              <span style={{ fontSize: "11px", color: "var(--con-text-muted)" }}>{k.label}</span>
            </div>
          ))}
        </div>

        {/* Layer toggles */}
        <div style={{ display: "flex", gap: "0.375rem" }}>
          <button
            onClick={() => setShowDrivers(!showDrivers)}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.3rem 0.625rem", borderRadius: "var(--con-radius-sm)",
              fontSize: "12px", fontWeight: 500, border: "1px solid",
              cursor: "pointer", transition: "all 0.15s",
              borderColor: showDrivers ? "var(--con-success)" : "var(--con-border-default)",
              background: showDrivers ? "var(--con-success-subtle)" : "transparent",
              color: showDrivers ? "var(--con-success)" : "var(--con-text-muted)",
            }}
          >
            <Truck size={12} /> السائقون
          </button>
          <button
            onClick={() => setShowOrders(!showOrders)}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.3rem 0.625rem", borderRadius: "var(--con-radius-sm)",
              fontSize: "12px", fontWeight: 500, border: "1px solid",
              cursor: "pointer", transition: "all 0.15s",
              borderColor: showOrders ? "var(--con-brand)" : "var(--con-border-default)",
              background: showOrders ? "var(--con-brand-subtle)" : "transparent",
              color: showOrders ? "var(--con-brand)" : "var(--con-text-muted)",
            }}
          >
            <Package size={12} /> الطلبات
          </button>
        </div>
      </div>

      {/* ── Main content: map + side panel ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Map area ── */}
        <div style={{ flex: 1, position: "relative" }}>
          {noToken ? (
            // Placeholder when no Mapbox token
            <div style={{
              width: "100%", height: "100%",
              background: "var(--con-bg-surface-1)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "0.75rem",
            }}>
              <MapPin size={32} style={{ color: "var(--con-text-muted)" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--con-text-secondary)" }}>
                الخريطة التفاعلية
              </p>
              <p style={{ fontSize: "12px", color: "var(--con-text-muted)", textAlign: "center", maxWidth: "320px", lineHeight: 1.6 }}>
                أضف <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-brand)" }}>VITE_MAPBOX_TOKEN</span> في ملف{" "}
                <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-brand)" }}>.env</span>{" "}
                لتفعيل خريطة Mapbox التفاعلية. بيانات السائقين والطلبات جاهزة للعرض.
              </p>
              <div style={{
                padding: "0.75rem 1rem",
                background: "var(--con-bg-elevated)",
                border: "1px solid var(--con-border-strong)",
                borderRadius: "var(--con-radius)",
                fontFamily: "var(--con-font-mono)",
                fontSize: "12px",
                color: "var(--con-brand)",
                marginTop: "0.25rem",
              }}>
                VITE_MAPBOX_TOKEN=pk.eyJ1...
              </div>
              {/* Show driver/order summary cards as fallback */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                {drivers.map((d) => (
                  <div key={d.id} onClick={() => setSelectedDriver(d === selectedDriver ? null : d)}
                    style={{
                      padding: "0.5rem 0.75rem",
                      background: selectedDriver?.id === d.id ? "var(--con-brand-subtle)" : "var(--con-bg-elevated)",
                      border: `1px solid ${selectedDriver?.id === d.id ? "var(--con-brand-border)" : "var(--con-border-default)"}`,
                      borderRadius: "var(--con-radius)",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "0.5rem",
                    }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: DRIVER_STATUS_CONFIG[d.status].dot, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "var(--con-text-primary)" }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Map
              ref={mapRef}
              initialViewState={{ longitude: 46.6753, latitude: 24.7136, zoom: 12 }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              <NavigationControl position="bottom-left" />

              {/* Driver markers */}
              {showDrivers && drivers.map((driver) => (
                <Marker key={driver.id} longitude={driver.lng} latitude={driver.lat} anchor="center"
                  onClick={(e) => { e.originalEvent.stopPropagation(); setSelectedDriver(driver === selectedDriver ? null : driver); flyTo(driver.lat, driver.lng); }}
                >
                  <DriverPin status={driver.status} selected={selectedDriver?.id === driver.id} />
                </Marker>
              ))}

              {/* Order markers */}
              {showOrders && orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").map((order) => (
                <Marker key={order.id} longitude={order.lng} latitude={order.lat} anchor="center"
                  onClick={(e) => { e.originalEvent.stopPropagation(); setSelectedOrder(order === selectedOrder ? null : order); flyTo(order.lat, order.lng); }}
                >
                  <OrderPin status={order.status} selected={selectedOrder?.id === order.id} />
                </Marker>
              ))}

              {/* Driver popup */}
              {selectedDriver && (
                <Popup longitude={selectedDriver.lng} latitude={selectedDriver.lat}
                  anchor="top" onClose={() => setSelectedDriver(null)}
                  style={{ background: "var(--con-bg-elevated)" }}
                >
                  <div style={{ padding: "0.5rem", minWidth: "160px", background: "var(--con-bg-elevated)", borderRadius: "6px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>{selectedDriver.name}</p>
                    <p style={{ fontSize: "11px", color: "var(--con-text-muted)" }}>{selectedDriver.vehicle}</p>
                    <span style={{ fontSize: "11px", color: DRIVER_STATUS_CONFIG[selectedDriver.status].color }}>{DRIVER_STATUS_CONFIG[selectedDriver.status].label}</span>
                  </div>
                </Popup>
              )}
            </Map>
          )}
        </div>

        {/* ── Right side panel ── */}
        <div style={{
          width: "340px",
          background: "var(--con-bg-surface-1)",
          borderLeft: "1px solid var(--con-border-default)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}>

          {/* Panel header */}
          <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--con-border-default)" }}>
            <div style={{ position: "relative", marginBottom: "0.5rem" }}>
              <Search size={13} style={{ position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }} />
              <input
                className="con-input"
                placeholder="بحث برقم الطلب أو العميل..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{ width: "100%", paddingRight: "2rem", fontSize: "12px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {(["all", "pending", "assigned", "delivering", "delivered"] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "0.2rem 0.5rem", borderRadius: "100px",
                    fontSize: "11px", border: "1px solid",
                    cursor: "pointer", transition: "all 0.15s",
                    borderColor: statusFilter === s ? "var(--con-brand)" : "var(--con-border-default)",
                    background: statusFilter === s ? "var(--con-brand-subtle)" : "transparent",
                    color: statusFilter === s ? "var(--con-brand)" : "var(--con-text-muted)",
                  }}
                >
                  {s === "all" ? "الكل" : ORDER_STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Order list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--con-text-muted)", fontSize: "13px" }}>
                لا توجد طلبات
              </div>
            ) : (
              filteredOrders.map((order) => {
                const statusCfg = ORDER_STATUS_CONFIG[order.status];
                const assignedDriver = drivers.find((d) => d.id === order.assignedDriverId);
                const isSelected = selectedOrder?.id === order.id;

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(isSelected ? null : order);
                      if (!isSelected) flyTo(order.lat, order.lng);
                    }}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid var(--con-border-default)",
                      cursor: "pointer",
                      background: isSelected ? "var(--con-brand-subtle)" : "transparent",
                      borderLeft: isSelected ? "2px solid var(--con-brand)" : "2px solid transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                      <div>
                        <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "11px", color: "var(--con-brand)", fontWeight: 600 }}>
                          {order.id}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--con-text-muted)", marginRight: "0.5rem" }}>
                          {order.platform}
                        </span>
                      </div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.25rem",
                        fontSize: "11px", fontWeight: 500,
                        color: statusCfg.color,
                        background: `${statusCfg.color}18`,
                        padding: "1px 6px", borderRadius: "100px",
                      }}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>

                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "0.2rem" }}>
                      {order.customer}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--con-text-muted)", marginBottom: "0.375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.address}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--con-success)" }}>
                        {order.amount.toFixed(2)} ر.س
                      </span>
                      {assignedDriver ? (
                        <span style={{ fontSize: "11px", color: "var(--con-text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Truck size={11} /> {assignedDriver.name}
                          {order.estimatedTime && (
                            <span style={{ color: "var(--con-brand)", fontFamily: "var(--con-font-mono)" }}> ~{order.estimatedTime}د</span>
                          )}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--con-warning)" }}>
                          <Clock size={11} style={{ display: "inline", marginLeft: "3px" }} />
                          {order.createdAt}
                        </span>
                      )}
                    </div>

                    {/* Expanded: assign + status actions */}
                    {isSelected && (
                      <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--con-border-default)" }}>

                        {/* Assign driver (only if pending) */}
                        {order.status === "pending" && (
                          <div>
                            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--con-text-muted)", marginBottom: "0.375rem" }}>
                              إسناد إلى سائق:
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {drivers.filter((d) => d.status === "available").map((d) => (
                                <button
                                  key={d.id}
                                  onClick={(e) => { e.stopPropagation(); assignOrder(order.id, d.id); }}
                                  style={{
                                    display: "flex", alignItems: "center", gap: "0.5rem",
                                    padding: "0.375rem 0.625rem",
                                    background: "var(--con-bg-elevated)",
                                    border: "1px solid var(--con-border-default)",
                                    borderRadius: "var(--con-radius-sm)",
                                    cursor: "pointer",
                                    fontSize: "12px", color: "var(--con-text-primary)",
                                    textAlign: "right",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--con-brand)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--con-border-default)")}
                                >
                                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: DRIVER_STATUS_CONFIG[d.status].dot, flexShrink: 0 }} />
                                  <span style={{ flex: 1 }}>{d.name}</span>
                                  <span style={{ fontSize: "11px", color: "var(--con-text-muted)" }}>{d.vehicle}</span>
                                  <Star size={11} style={{ color: "var(--con-warning)" }} />
                                  <span style={{ fontSize: "11px", fontFamily: "var(--con-font-mono)", color: "var(--con-warning)" }}>{d.rating}</span>
                                </button>
                              ))}
                              {drivers.filter((d) => d.status === "available").length === 0 && (
                                <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>لا يوجد سائق متاح حالياً</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Status update buttons */}
                        {order.status !== "pending" && order.status !== "delivered" && order.status !== "cancelled" && (
                          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                            {order.status === "assigned" && (
                              <button onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, "pickup"); }}
                                className="con-btn-primary" style={{ fontSize: "11px", padding: "0.3rem 0.625rem", flex: 1 }}>
                                <Package size={12} /> في الاستلام
                              </button>
                            )}
                            {order.status === "pickup" && (
                              <button onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, "delivering"); }}
                                className="con-btn-primary" style={{ fontSize: "11px", padding: "0.3rem 0.625rem", flex: 1 }}>
                                <Navigation size={12} /> بدء التوصيل
                              </button>
                            )}
                            {order.status === "delivering" && (
                              <button onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, "delivered"); }}
                                className="con-btn-primary" style={{ fontSize: "11px", padding: "0.3rem 0.625rem", flex: 1 }}>
                                <CheckCircle2 size={12} /> تم التوصيل
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, "cancelled"); }}
                              className="con-btn-danger" style={{ fontSize: "11px", padding: "0.3rem 0.625rem" }}>
                              <XCircle size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Driver availability footer */}
          <div style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid var(--con-border-default)",
            background: "var(--con-bg-surface-2)",
          }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--con-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              حالة السائقين
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {drivers.map((d) => (
                <div
                  key={d.id}
                  onClick={() => { setSelectedDriver(d === selectedDriver ? null : d); flyTo(d.lat, d.lng); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.3rem 0.375rem", borderRadius: "var(--con-radius-sm)",
                    cursor: "pointer",
                    background: selectedDriver?.id === d.id ? "var(--con-bg-elevated)" : "transparent",
                    transition: "background 0.1s",
                  }}
                >
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: DRIVER_STATUS_CONFIG[d.status].dot, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "12px", color: "var(--con-text-primary)" }}>{d.name}</span>
                  <span style={{ fontSize: "11px", color: DRIVER_STATUS_CONFIG[d.status].color }}>
                    {DRIVER_STATUS_CONFIG[d.status].label}
                  </span>
                  {d.activeOrderId && (
                    <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "10px", color: "var(--con-brand)" }}>
                      {d.activeOrderId}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
