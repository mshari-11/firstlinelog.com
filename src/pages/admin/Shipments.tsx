import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Package,
  CheckCircle2,
  XCircle,
  Truck,
  Radio,
  Plus,
  Download,
  Printer,
  X,
  Save,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

type ShipmentStatus = "active" | "delivered" | "cancelled" | "in_transit";
interface Shipment {
  id: string;
  trackingNumber: string;
  platform: string;
  customer: string;
  driver: string;
  status: ShipmentStatus;
  amount: number;
}

const STATUS_MAP: Record<ShipmentStatus, { label: string; cls: string }> = {
  active: { label: "نشطة", cls: "con-badge-info" },
  in_transit: { label: "قيد التوصيل", cls: "con-badge-warning" },
  delivered: { label: "تم التسليم", cls: "con-badge-success" },
  cancelled: { label: "ملغاة", cls: "con-badge-danger" },
};


export default function Shipments() {
  const navigate = useNavigate();
  const [data, setData] = useState<Shipment[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ShipmentStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShipment, setNewShipment] = useState({
    trackingNumber: "",
    customer: "",
    driver: "",
    platform: "",
    status: "active" as ShipmentStatus,
  });

  function exportCSV() {
    const header = "رقم الشحنة,المنصة,العميل,السائق,الحالة,المبلغ";
    const rows = filtered.map(
      (s) =>
        `${s.trackingNumber},${s.platform},${s.customer},${s.driver},${STATUS_MAP[s.status].label},${s.amount}`,
    );
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  function handleAddShipment() {
    if (!newShipment.trackingNumber || !newShipment.customer) return;
    const s: Shipment = {
      id: `SHP-${String(data.length + 1).padStart(3, "0")}`,
      ...newShipment,
      amount: 0,
    };
    setData((prev) => [s, ...prev]);
    setNewShipment({
      trackingNumber: "",
      customer: "",
      driver: "",
      platform: "",
      status: "active",
    });
    setShowAddModal(false);
  }

  useEffect(() => {
    fetchData();
  }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/shipments`);
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d) && d.length) setData(d);
      }
    } catch {
      /* keep mock */
    }
    setLoading(false);
  }

  const filtered = data.filter((a) => {
    const matchSearch =
      a.trackingNumber.includes(search) ||
      a.customer.includes(search) ||
      a.driver.includes(search) ||
      a.platform.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    active: data.filter(
      (s) => s.status === "active" || s.status === "in_transit",
    ).length,
    delivered: data.filter((s) => s.status === "delivered").length,
    cancelled: data.filter((s) => s.status === "cancelled").length,
    total: data.length,
  };

  return (
    <div
      dir="rtl"
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                background: "rgba(59,130,246,0.12)",
                borderRadius: 8,
                padding: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={18} style={{ color: "var(--con-brand)" }} />
            </div>
            <h1
              style={{
                fontSize: "var(--con-text-page-title)",
                fontWeight: 700,
                color: "var(--con-text-primary)",
                margin: 0,
              }}
            >
              الشحنات
            </h1>
          </div>
          <p
            style={{
              fontSize: "var(--con-text-body)",
              color: "var(--con-text-muted)",
              margin: 0,
              paddingRight: 44,
            }}
          >
            تتبع وإدارة جميع الشحنات
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            className="con-btn-ghost"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />{" "}
            تحديث
          </button>
          <button className="con-btn-ghost" onClick={exportCSV}>
            <Download size={14} /> تصدير
          </button>
          <button className="con-btn-ghost" onClick={handlePrint}>
            <Printer size={14} /> طباعة
          </button>
          <button
            className="con-btn-ghost"
            onClick={() => setShowAddModal(true)}
            style={{
              background: "var(--con-brand)",
              color: "#fff",
              borderColor: "var(--con-brand)",
            }}
          >
            <Plus size={14} /> إضافة شحنة
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {[
          {
            label: "نشطة",
            value: stats.active,
            icon: Truck,
            accent: "var(--con-brand)",
            onClick: () => setFilter("active"),
          },
          {
            label: "تم التسليم",
            value: stats.delivered,
            icon: CheckCircle2,
            accent: "var(--con-success)",
            onClick: () => setFilter("delivered"),
          },
          {
            label: "ملغاة",
            value: stats.cancelled,
            icon: XCircle,
            accent: "var(--con-danger)",
            onClick: () => setFilter("cancelled"),
          },
          {
            label: "الإجمالي",
            value: stats.total,
            icon: Package,
            accent: "var(--con-warning)",
            onClick: () => {},
          },
        ].map((k) => (
          <div
            key={k.label}
            className="con-kpi-card"
            onClick={k.onClick}
            style={{ cursor: "pointer" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-muted)",
                }}
              >
                {k.label}
              </span>
              <k.icon size={14} style={{ color: k.accent }} />
            </div>
            <div
              className="con-kpi-value"
              style={{ fontSize: 26, color: k.accent }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="con-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              insetInlineEnd: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--con-text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="con-input"
            style={{ paddingInlineEnd: 32, width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(
            ["all", "active", "in_transit", "delivered", "cancelled"] as const
          ).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "inherit",
                border: filter === s ? "1px solid var(--con-brand, #3b82f6)" : "1px solid var(--con-border, #1a3a52)",
                background: filter === s ? "var(--con-brand-subtle, #1e3a5f)" : "transparent",
                color: filter === s ? "var(--con-brand, #3b82f6)" : "var(--con-text-secondary, #94a3b8)",
                cursor: "pointer",
              }}
            >
              {s === "all" ? "الكل" : STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {filtered.length === 0 ? (
          <div className="con-empty">
            <AlertCircle
              size={32}
              style={{ opacity: 0.25, marginBottom: 10 }}
            />
            <div>لا توجد شحنات مطابقة</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead>
                <tr>
                  <th>رقم الشحنة</th>
                  <th>المنصة</th>
                  <th>العميل</th>
                  <th>السائق</th>
                  <th>الحالة</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--con-font-mono)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "var(--con-brand)",
                        }}
                        onClick={() => navigate("/admin-panel/orders")}
                      >
                        {a.trackingNumber}
                      </span>
                    </td>
                    <td>
                      <span
                        className="con-badge con-badge-sm con-badge-info"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate("/admin-panel/dispatch")}
                      >
                        <Radio
                          size={10}
                          style={{ display: "inline", marginLeft: 3 }}
                        />
                        {a.platform}
                      </span>
                    </td>
                    <td>{a.customer}</td>
                    <td>
                      {a.driver !== "—" ? (
                        <span
                          style={{
                            cursor: "pointer",
                            color: "var(--con-brand)",
                          }}
                          onClick={() => navigate("/admin-panel/couriers")}
                        >
                          {a.driver}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span
                        className={`con-badge con-badge-sm ${STATUS_MAP[a.status].cls}`}
                      >
                        {STATUS_MAP[a.status].label}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--con-font-mono)" }}>
                        {a.amount.toLocaleString("ar-SA")} ر.س
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--con-bg-surface-1)",
              border: "1px solid var(--con-border-default)",
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 440,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2
                style={{
                  fontSize: "var(--con-text-section-title)",
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: 0,
                }}
              >
                إضافة شحنة
              </h2>
              <button
                className="con-btn-ghost"
                onClick={() => setShowAddModal(false)}
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: "var(--con-text-caption)",
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  رقم التتبع *
                </label>
                <input
                  className="con-input"
                  style={{ width: "100%" }}
                  value={newShipment.trackingNumber}
                  onChange={(e) =>
                    setNewShipment((p) => ({
                      ...p,
                      trackingNumber: e.target.value,
                    }))
                  }
                  placeholder="FLL-2026XXXXXX"
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "var(--con-text-caption)",
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  العميل *
                </label>
                <input
                  className="con-input"
                  style={{ width: "100%" }}
                  value={newShipment.customer}
                  onChange={(e) =>
                    setNewShipment((p) => ({ ...p, customer: e.target.value }))
                  }
                  placeholder="اسم العميل"
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "var(--con-text-caption)",
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  السائق
                </label>
                <input
                  className="con-input"
                  style={{ width: "100%" }}
                  value={newShipment.driver}
                  onChange={(e) =>
                    setNewShipment((p) => ({ ...p, driver: e.target.value }))
                  }
                  placeholder="اسم السائق"
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "var(--con-text-caption)",
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  المنصة
                </label>
                <input
                  className="con-input"
                  style={{ width: "100%" }}
                  value={newShipment.platform}
                  onChange={(e) =>
                    setNewShipment((p) => ({ ...p, platform: e.target.value }))
                  }
                  placeholder="هنقرستيشن، مرسول، جاهز..."
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "var(--con-text-caption)",
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الحالة
                </label>
                <select
                  className="con-input"
                  style={{ width: "100%" }}
                  value={newShipment.status}
                  onChange={(e) =>
                    setNewShipment((p) => ({
                      ...p,
                      status: e.target.value as ShipmentStatus,
                    }))
                  }
                >
                  {(Object.keys(STATUS_MAP) as ShipmentStatus[]).map((k) => (
                    <option key={k} value={k}>
                      {STATUS_MAP[k].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}
            >
              <button
                className="con-btn-ghost"
                onClick={handleAddShipment}
                style={{
                  background: "var(--con-brand)",
                  color: "#fff",
                  borderColor: "var(--con-brand)",
                }}
              >
                <Save size={14} /> حفظ
              </button>
              <button
                className="con-btn-ghost"
                onClick={() => setShowAddModal(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
