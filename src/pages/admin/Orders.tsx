/**
 * صفحة إدارة الطلبات — Enterprise Order Tracking Console
 */
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Package, Search, CheckCircle2,
  XCircle, Bike, MapPin, RefreshCw,
  Clock, TrendingUp,
} from "lucide-react";

interface Order {
  id: string;
  courier_name: string;
  platform: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  status: "pending" | "picked_up" | "on_way" | "delivered" | "failed" | "returned";
  amount: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:   { label: "بانتظار الاستلام", cls: "con-badge con-badge-warning" },
  picked_up: { label: "تم الاستلام",      cls: "con-badge con-badge-info"    },
  on_way:    { label: "في الطريق",         cls: "con-badge con-badge-brand"   },
  delivered: { label: "تم التسليم",        cls: "con-badge con-badge-success" },
  failed:    { label: "فشل التسليم",       cls: "con-badge con-badge-danger"  },
  returned:  { label: "مرتجع",             cls: "con-badge con-badge-muted"   },
};

const platforms = ["الكل", "jahez", "hungerstation", "toyor", "marsool", "mrsool", "noon", "amazon"];
const platformLabels: Record<string, string> = {
  "الكل": "الكل", jahez: "جاهز", hungerstation: "هنقرستيشن",
  toyor: "طيور", marsool: "مرسول", mrsool: "مرسول برو",
  noon: "نون", amazon: "أمازون",
};

const mockOrders: Order[] = [
  { id: "#10240", courier_name: "أحمد محمد",     platform: "jahez",   customer_name: "محمد علي",       customer_phone: "0501234567", address: "الرياض، حي النزهة",     status: "on_way",    amount: 45, created_at: "14:23" },
  { id: "#10239", courier_name: "خالد العمري",   platform: "marsool", customer_name: "فاطمة السالم",   customer_phone: "0557654321", address: "جدة، حي الروضة",       status: "delivered", amount: 30, created_at: "13:55" },
  { id: "#10238", courier_name: "فهد الغامدي",   platform: "noon",    customer_name: "علي أحمد",       customer_phone: "0509876543", address: "الرياض، حي الملقا",    status: "picked_up", amount: 65, created_at: "13:40" },
  { id: "#10237", courier_name: "سعد الزهراني",  platform: "marsool", customer_name: "هند محمد",       customer_phone: "0551112233", address: "الدمام، حي الفيصلية", status: "pending",   amount: 25, created_at: "13:10" },
  { id: "#10236", courier_name: "عمر الشمري",    platform: "amazon",  customer_name: "عبدالله خالد",   customer_phone: "0503334455", address: "الرياض، حي العليا",    status: "delivered", amount: 80, created_at: "12:45" },
  { id: "#10235", courier_name: "محمد القحطاني", platform: "jahez",   customer_name: "نورة العتيبي",   customer_phone: "0556667788", address: "مكة، حي العزيزية",     status: "failed",    amount: 55, created_at: "12:20" },
  { id: "#10234", courier_name: "أحمد محمد",     platform: "marsool", customer_name: "سلمى الشريف",    customer_phone: "0509998877", address: "الرياض، حي السلام",    status: "returned",  amount: 40, created_at: "11:55" },
];

const kpiConfig = [
  { key: "total",     label: "إجمالي اليوم",   icon: Package,      variant: "brand"   },
  { key: "delivered", label: "تم التسليم",      icon: CheckCircle2, variant: "success" },
  { key: "active",    label: "جارية",           icon: Bike,         variant: "info"    },
  { key: "failed",    label: "فشل / مرتجع",    icon: XCircle,      variant: "danger"  },
] as const;

export default function AdminOrders() {
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [platformFilter, setPlatformFilter] = useState("الكل");
  const [orders, setOrders]               = useState<Order[]>(mockOrders);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`*, couriers(full_name)`)
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          const mapped = data.map((o: any) => ({
            id: `#${o.id}`,
            courier_name: o.couriers?.full_name || "غير محدد",
            platform: o.platform,
            customer_name: o.customer_name || "غير محدد",
            customer_phone: o.customer_phone || "",
            address: o.delivery_address || "",
            status: o.status,
            amount: o.amount || 0,
            created_at: new Date(o.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
          }));
          setOrders(mapped);
        }
      } catch (_) {
        // fallback to mock data
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch   = o.id.includes(search) || o.courier_name.includes(search) || o.customer_name.includes(search);
    const matchStatus   = statusFilter === "all" || o.status === statusFilter;
    const matchPlatform = platformFilter === "الكل" || o.platform === platformFilter;
    return matchSearch && matchStatus && matchPlatform;
  });

  const stats = {
    total:     orders.length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    active:    orders.filter((o) => ["pending", "picked_up", "on_way"].includes(o.status)).length,
    failed:    orders.filter((o) => o.status === "failed" || o.status === "returned").length,
  };

  const variantStyle = (v: string) => {
    const map: Record<string, { icon: string; bg: string }> = {
      brand:   { icon: "var(--con-brand)",   bg: "var(--con-brand-subtle)"   },
      success: { icon: "var(--con-success)", bg: "var(--con-success-subtle)" },
      info:    { icon: "var(--con-info)",    bg: "var(--con-info-subtle)"    },
      danger:  { icon: "var(--con-danger)",  bg: "var(--con-danger-subtle)"  },
    };
    return map[v] ?? map.brand;
  };

  const totalAmount = filtered.reduce((s, o) => s + o.amount, 0);

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }} dir="rtl">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", lineHeight: 1.2 }}>
            الطلبات
          </h1>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>
            تتبع ومتابعة جميع طلبات التوصيل
          </p>
        </div>
        <button
          className="con-btn-ghost"
          style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={14} />
          تحديث
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
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="con-toolbar">
          {/* Search */}
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={14}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }}
            />
            <input
              className="con-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الطلب، المندوب، أو العميل..."
              style={{ paddingRight: "2.25rem", width: "100%" }}
            />
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
            {[
              { value: "all",       label: "الكل" },
              { value: "pending",   label: "بانتظار الاستلام" },
              { value: "on_way",    label: "في الطريق" },
              { value: "delivered", label: "تم التسليم" },
              { value: "failed",    label: "فشل" },
              { value: "returned",  label: "مرتجع" },
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

        {/* Platform pills row */}
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "var(--con-radius-sm)",
                fontSize: "var(--con-text-caption)",
                fontWeight: platformFilter === p ? 600 : 400,
                border: "1px solid",
                borderColor: platformFilter === p ? "var(--con-border-brand)" : "var(--con-border-default)",
                background: platformFilter === p ? "var(--con-brand-subtle)" : "transparent",
                color: platformFilter === p ? "var(--con-brand)" : "var(--con-text-muted)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {platformLabels[p] ?? p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orders Table ── */}
      <div className="con-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="con-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>المندوب</th>
                <th>المنصة</th>
                <th>العميل</th>
                <th>العنوان</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j}><div className="con-skeleton" style={{ height: "1rem", borderRadius: "4px" }} /></td>
                      ))}
                    </tr>
                  ))
                : filtered.map((order) => {
                    const sc = statusConfig[order.status];
                    return (
                      <tr key={order.id} style={{ cursor: "pointer" }}>
                        {/* Order ID */}
                        <td>
                          <span style={{ fontFamily: "var(--con-font-mono)", fontWeight: 600, color: "var(--con-brand)", fontSize: "var(--con-text-table)" }}>
                            {order.id}
                          </span>
                        </td>

                        {/* Courier */}
                        <td style={{ color: "var(--con-text-primary)" }}>{order.courier_name}</td>

                        {/* Platform */}
                        <td>
                          <span className="con-badge con-badge-muted" style={{ textTransform: "none" }}>
                            {platformLabels[order.platform] ?? order.platform}
                          </span>
                        </td>

                        {/* Customer */}
                        <td>
                          <div style={{ lineHeight: 1.4 }}>
                            <div style={{ color: "var(--con-text-primary)", fontWeight: 500 }}>{order.customer_name}</div>
                            <div style={{ fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                              {order.customer_phone}
                            </div>
                          </div>
                        </td>

                        {/* Address */}
                        <td>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.25rem", maxWidth: "9rem" }}>
                            <MapPin size={11} style={{ color: "var(--con-text-muted)", marginTop: "0.15rem", flexShrink: 0 }} />
                            <span style={{ color: "var(--con-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {order.address}
                            </span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td>
                          <span style={{ fontFamily: "var(--con-font-mono)", fontWeight: 600, color: "var(--con-text-primary)" }}>
                            {order.amount.toFixed(0)} ر.س
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={sc?.cls ?? "con-badge con-badge-muted"}>
                            {sc?.label ?? order.status}
                          </span>
                        </td>

                        {/* Time */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Clock size={11} style={{ color: "var(--con-text-muted)" }} />
                            <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>
                              {order.created_at}
                            </span>
                          </div>
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
            <Package size={28} style={{ marginBottom: "0.5rem", opacity: 0.3 }} />
            <p>لا توجد طلبات تطابق المعايير المحددة</p>
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
            <span>{filtered.length} طلب معروض</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <TrendingUp size={12} style={{ color: "var(--con-success)" }} />
              الإجمالي:&nbsp;
              <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-primary)", fontWeight: 600 }}>
                {totalAmount.toFixed(0)} ر.س
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
