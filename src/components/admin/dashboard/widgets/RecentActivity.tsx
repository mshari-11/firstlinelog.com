/**
 * Recent Activity Widget — Recent orders, events, and audit trail
 */
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { WidgetShell } from "../WidgetShell";
import { ClipboardList } from "lucide-react";

const orderStatusBadge: Record<string, { cls: string; label: string }> = {
  delivered:  { cls: "con-badge-success", label: "تم التسليم" },
  on_way:     { cls: "con-badge-info",    label: "في الطريق" },
  picked_up:  { cls: "con-badge-warning", label: "قيد الاستلام" },
  failed:     { cls: "con-badge-danger",  label: "فشل" },
};

const recentOrders = [
  { id: "#10234", courier: "أحمد محمد",    platform: "جاهز",    status: "delivered", time: "منذ 5 دقائق" },
  { id: "#10233", courier: "خالد العمري",  platform: "مرسول",   status: "on_way",    time: "منذ 12 دقيقة" },
  { id: "#10232", courier: "فهد الغامدي",  platform: "كريم",    status: "picked_up", time: "منذ 18 دقيقة" },
  { id: "#10231", courier: "سعد الزهراني", platform: "هنقرستيشن", status: "delivered", time: "منذ 25 دقيقة" },
  { id: "#10230", courier: "عمر الشمري",   platform: "كيتا",    status: "delivered", time: "منذ 31 دقيقة" },
];

export function RecentActivity() {
  const navigate = useNavigate();

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
            {recentOrders.map((order) => {
              const badge = orderStatusBadge[order.status] || orderStatusBadge.delivered;
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
                    <span className={`con-badge con-badge-sm ${badge.cls}`}>{badge.label}</span>
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
