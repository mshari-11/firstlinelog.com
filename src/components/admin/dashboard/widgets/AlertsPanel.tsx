/**
 * Alerts Panel Widget — Active alerts, SLA breaches, escalations
 */
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, ChevronLeft } from "lucide-react";
import { WidgetShell } from "../WidgetShell";
import { useNotificationStore } from "@/stores/useNotificationStore";

const priorityColors: Record<string, string> = {
  urgent: "var(--con-danger)",
  high: "var(--con-warning)",
  normal: "var(--con-info)",
  low: "var(--con-text-muted)",
};

const typeIcons: Record<string, string> = {
  sla: "⚠️",
  approval: "📋",
  complaint: "💬",
  finance: "💰",
  system: "⚙️",
  order: "📦",
};

export function AlertsPanel() {
  const navigate = useNavigate();
  const { notifications, getUnreadCount, markAsRead } = useNotificationStore();
  const unread = notifications.filter((n) => !n.read).slice(0, 5);
  const unreadCount = getUnreadCount();

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  };

  return (
    <WidgetShell
      id="alerts-panel"
      title="التنبيهات والاستثناءات"
      subtitle={unreadCount > 0 ? `${unreadCount} تنبيه جديد` : "لا توجد تنبيهات"}
      icon={AlertTriangle}
      iconColor={unreadCount > 0 ? "var(--con-warning)" : "var(--con-success)"}
      onDrilldown={() => navigate("/admin-panel/notifications")}
      noPadding
    >
      {unread.length === 0 ? (
        <div style={{ padding: "24px 16px", textAlign: "center" }}>
          <Bell size={28} style={{ color: "var(--con-text-disabled)", marginBottom: 8 }} />
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0 }}>
            لا توجد تنبيهات نشطة
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {unread.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markAsRead(n.id);
                if (n.link) navigate(n.link);
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 16px",
                borderBottom: "1px solid var(--con-border-default)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{typeIcons[n.type] || "🔔"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span
                    style={{
                      fontSize: "var(--con-text-body)",
                      fontWeight: 600,
                      color: "var(--con-text-primary)",
                    }}
                  >
                    {n.title}
                  </span>
                </div>
                <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
                  {n.message}
                </p>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--con-text-disabled)",
                    fontFamily: "var(--con-font-mono)",
                    marginTop: 4,
                    display: "inline-block",
                  }}
                >
                  {timeAgo(n.createdAt)}
                </span>
              </div>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: priorityColors[n.priority],
                  flexShrink: 0,
                  marginTop: 6,
                }}
              />
            </div>
          ))}
          {unreadCount > 5 && (
            <button
              onClick={() => navigate("/admin-panel/notifications")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "10px",
                fontSize: "var(--con-text-caption)",
                color: "var(--con-brand)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              عرض الكل ({unreadCount}) <ChevronLeft size={12} />
            </button>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
