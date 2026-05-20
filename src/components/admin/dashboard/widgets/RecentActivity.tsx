/**
 * Recent Activity Widget — Recent orders from Supabase with mock fallback
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Filter } from "lucide-react";
import { WidgetShell } from "../WidgetShell";
import { supabase } from "@/lib/supabase";

interface OrderRow {
  id: string;
  courier: string;
  platform: string;
  status: string;
  statusAr: string;
  time: string;
}

const orderStatusBadge: Record<string, { cls: string; label: string }> = {
  delivered: { cls: "con-badge-success", label: "تم التسليم" },
  on_way: { cls: "con-badge-info", label: "في الطريق" },
  picked_up: { cls: "con-badge-warning", label: "قيد الاستلام" },
  failed: { cls: "con-badge-danger", label: "فشل" },
  pending: { cls: "con-badge-warning", label: "معلق" },
  active: { cls: "con-badge-info", label: "نشط" },
};

const mockOrders: OrderRow[] = [
  {
    id: "#10234",
    courier: "أحمد محمد",
    platform: "جاهز",
    status: "delivered",
    statusAr: "تم التسليم",
    time: "منذ 5 دقائق",
  },
  {
    id: "#10233",
    courier: "خالد العمري",
    platform: "مرسول",
    status: "on_way",
    statusAr: "في الطريق",
    time: "منذ 12 دقيقة",
  },
  {
    id: "#10232",
    courier: "فهد الغامدي",
    platform: "كريم",
    status: "picked_up",
    statusAr: "قيد الاستلام",
    time: "منذ 18 دقيقة",
  },
  {
    id: "#10231",
    courier: "سعد الزهراني",
    platform: "هنقرستيشن",
    status: "delivered",
    statusAr: "تم التسليم",
    time: "منذ 25 دقيقة",
  },
  {
    id: "#10230",
    courier: "عمر الشمري",
    platform: "كيتا",
    status: "delivered",
    statusAr: "تم التسليم",
    time: "منذ 31 دقيقة",
  },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

const statusFilters = [
  { key: "all", label: "الكل" },
  { key: "delivered", label: "تم التسليم" },
  { key: "on_way", label: "في الطريق" },
  { key: "picked_up", label: "قيد الاستلام" },
  { key: "failed", label: "فشل" },
  { key: "pending", label: "معلق" },
];

export function RecentActivity() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>(mockOrders);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, courier_name, platform, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        if (error || !data || data.length === 0) return;
        const mapped: OrderRow[] = data.map((row: any) => {
          const badge =
            orderStatusBadge[row.status] || orderStatusBadge.pending;
          return {
            id: `#${String(row.id).slice(-5)}`,
            courier: row.courier_name || "غير معيّن",
            platform: row.platform || "—",
            status: row.status || "pending",
            statusAr: badge.label,
            time: timeAgo(row.created_at),
          };
        });
        setOrders(mapped);
      } catch {
        // Keep mock data
      }
    }
    fetchOrders();
  }, []);

  return (
    <WidgetShell
      id="recent-activity"
      title="آخر الطلبات"
      icon={ClipboardList}
      iconColor="var(--con-info)"
      onDrilldown={() => navigate("/admin-panel/orders")}
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Live indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 10,
              background: "var(--con-success)10",
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--con-success)",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: 9, color: "var(--con-success)", fontWeight: 600 }}>
              مباشر
            </span>
          </div>
          {/* Filter toggle */}
          <button
            onClick={() => setShowStatusFilter(!showStatusFilter)}
            title="تصفية حسب الحالة"
            style={{
              background: showStatusFilter ? "var(--con-brand)14" : "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: "var(--con-radius-sm)",
              color: showStatusFilter ? "var(--con-brand)" : "var(--con-text-muted)",
              display: "flex",
              transition: "all 0.15s",
            }}
          >
            <Filter size={12} />
          </button>
        </div>
      }
      noPadding
    >
      <>
      {/* Status filter chips */}
      {showStatusFilter && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            padding: "8px 16px",
            borderBottom: "1px solid var(--con-border-default)",
          }}
        >
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              style={{
                padding: "3px 10px",
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "var(--con-font-primary)",
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s",
                borderColor: statusFilter === f.key ? "var(--con-info)" : "var(--con-border-default)",
                background: statusFilter === f.key ? "var(--con-info)14" : "transparent",
                color: statusFilter === f.key ? "var(--con-info)" : "var(--con-text-muted)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table className="con-table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>المندوب</th>
              <th>المنصة</th>
              <th>الحالة</th>
              <th>الوقت</th>
            </tr>
          </thead>
          <tbody>
            {orders.filter((o) => statusFilter === "all" || o.status === statusFilter).map((order) => {
              const badge =
                orderStatusBadge[order.status] || orderStatusBadge.pending;
              return (
                <tr key={order.id}>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--con-font-mono)",
                        color: "var(--con-text-secondary)",
                        fontSize: 12,
                      }}
                    >
                      {order.id}
                    </span>
                  </td>
                  <td
                    style={{
                      color: "var(--con-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {order.courier}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "var(--con-text-caption)",
                        fontWeight: 500,
                        padding: "2px 8px",
                        borderRadius: 5,
                        background: "var(--con-bg-surface-2)",
                        color: "var(--con-text-secondary)",
                        border: "1px solid var(--con-border-default)",
                      }}
                    >
                      {order.platform}
                    </span>
                  </td>
                  <td>
                    <span className={`con-badge con-badge-sm ${badge.cls}`}>
                      {order.statusAr}
                    </span>
                  </td>
                  <td
                    style={{
                      color: "var(--con-text-muted)",
                      fontSize: "var(--con-text-caption)",
                    }}
                  >
                    {order.time}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </>
    </WidgetShell>
  );
}
