/**
 * Alerts Panel Widget — Active alerts, SLA breaches, escalations
 */
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, ChevronLeft, CheckCheck, Filter } from "lucide-react";
import { useState } from "react";
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

const filterTypes = [
  { key: "all", label: "الكل" },
  { key: "sla", label: "SLA" },
  { key: "approval", label: "اعتمادات" },
  { key: "complaint", label: "شكاوى" },
  { key: "finance", label: "مالية" },
  { key: "system", label: "نظام" },
];

export function AlertsPanel() {
  const navigate = useNavigate();
  const { notifications, getUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredUnread = notifications
    .filter((n) => !n.read)
    .filter((n) => activeFilter === "all" || n.type === activeFilter)
    .slice(0, 5);
  const unread = filteredUnread;
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
      subtitle={
        unreadCount > 0 ? `${unreadCount} تنبيه جديد` : "لا توجد تنبيهات"
      }
      icon={AlertTriangle}
      iconColor={unreadCount > 0 ? "var(--con-warning)" : "var(--con-success)"}
      onDrilldown={() => navigate("/admin-panel/notifications")}
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            title="تصفية حسب النوع"
            style={{
              background: showFilters ? "var(--con-brand)14" : "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: "var(--con-radius-sm)",
              color: showFilters ? "var(--con-brand)" : "var(--con-text-muted)",
              display: "flex",
              transition: "all 0.15s",
            }}
          >
            <Filter size={12} />
          </button>
          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              title="تحديد الكل كمقروء"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: "var(--con-radius-sm)",
                color: "var(--con-text-muted)",
                display: "flex",
                transition: "all 0.15s",
              }}
            >
              <CheckCheck size={13} />
            </button>
          )}
        </div>
      }
      noPadding
    >
      <>
      {/* Filter chips */}
      {showFilters && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            padding: "8px 16px",
            borderBottom: "1px solid var(--con-border-default)",
          }}
        >
          {filterTypes.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: "3px 10px",
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "var(--con-font-primary)",
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s",
                borderColor: activeFilter === f.key ? "var(--con-brand)" : "var(--con-border-default)",
                background: activeFilter === f.key ? "var(--con-brand)14" : "transparent",
                color: activeFilter === f.key ? "var(--con-brand)" : "var(--con-text-muted)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {unread.length === 0 ? (
        <div style={{ padding: "24px 16px", textAlign: "center" }}>
          <Bell
            size={28}
            style={{ color: "var(--con-text-disabled)", marginBottom: 8 }}
          />
          <p
            style={{
              fontSize: "var(--con-text-body)",
              color: "var(--con-text-muted)",
              margin: 0,
            }}
          >
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--con-bg-surface-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>
                {typeIcons[n.type] || "🔔"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
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
                <p
                  style={{
                    fontSize: "var(--con-text-caption)",
                    color: "var(--con-text-muted)",
                    margin: 0,
                  }}
                >
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
      </>
    </WidgetShell>
  );
}
