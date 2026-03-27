/**
 * Recent Activity Widget — Recent orders from Supabase with mock fallback
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
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
  delivered:  { cls: "con-badge-success", label: "تم التسليم" },
  on_way:     { cls: "con-badge-info",    label: "في الطريق" },
  picked_up:  { cls: "con-badge-warning", label: "قيد الاستلام" },
  failed:     { cls: "con-badge-danger",  label: "فشل" },
  pending:    { cls: "con-badge-warning", label: "معلق" },
  active:     { cls: "con-badge-info",    label: "نشط" },
};

const mockOrders: OrderRow[] = [
  { id: "#10234", courier: "أحمد محمد",    platform: "جاهز",       status: "delivered", statusAr: "تم التسليم", time: "منذ 5 دقائق" },
  { id: "#10233", courier: "خالد العمري",  platform: "مرسول",      status: "on_way",    statusAr: "في الطريق",  time: "منذ 12 دقيقة" },
  { id: "#10232", courier: "فهد الغامدي",  platform: "كريم",       status: "picked_up", statusAr: "قيد الاستلام", time: "منذ 18 دقيقة" },
  { id: "#10231", courier: "سعد الزهراني", platform: "هنقرستيشن",  status: "delivered", statusAr: "تم التسليم", time: "منذ 25 دقيقة" },
  { id: "#10230", courier: "عمر الشمري",   platform: "كيتا",       status: "delivered", statusAr: "تم التسليم", time: "منذ 31 دقيقة" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

export function RecentActivity() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>(mockOrders);

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
          const badge = orderStatusBadge[row.status] || orderStatusBadge.pending;
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
      noPadding
    >
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
            {orders.map((order) => {
              const badge = orderStatusBadge[order.status] || orderStatusBadge.pending;
              return (
                <tr key={order.id}>
                  <td>
                    <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)", fontSize: 12 }}>
                      {order.id}
                    </span>
                  </td>
                  <td style={{ color: "var(--con-text-primary)", fontWeight: 500 }}>{order.courier}</td>
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
                    <span className={`con-badge con-badge-sm ${badge.cls}`}>{order.statusAr}</span>
                  </td>
                  <td style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>{order.time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
