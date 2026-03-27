/**
 * WidgetShell — Consistent wrapper for all dashboard widgets
 * Provides: title, collapse/expand, loading skeleton, refresh, error boundary
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, RefreshCw, ExternalLink } from "lucide-react";
import { useDashboardStore } from "@/stores/useDashboardStore";

interface WidgetShellProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  drilldownLink?: string;
  onDrilldown?: () => void;
  actions?: React.ReactNode;
  noPadding?: boolean;
  children: React.ReactNode;
}

export function WidgetShell({
  id,
  title,
  subtitle,
  icon: Icon,
  iconColor = "var(--con-brand)",
  loading,
  error,
  onRefresh,
  drilldownLink,
  onDrilldown,
  actions,
  noPadding,
  children,
}: WidgetShellProps) {
  const { isWidgetCollapsed, toggleWidgetCollapse } = useDashboardStore();
  const collapsed = isWidgetCollapsed(id);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: "var(--con-radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: collapsed ? "none" : "1px solid var(--con-border-default)",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => toggleWidgetCollapse(id)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          {Icon && (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--con-radius-sm)",
                background: `${iconColor}14`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={14} style={{ color: iconColor }} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: "var(--con-text-card-title)",
                fontWeight: 600,
                color: "var(--con-text-primary)",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={(e) => e.stopPropagation()}>
          {actions}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              title="تحديث"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: "var(--con-radius-sm)",
                color: "var(--con-text-muted)",
                display: "flex",
              }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? "spin 0.6s linear infinite" : undefined }} />
            </button>
          )}
          {(drilldownLink || onDrilldown) && (
            <button
              onClick={onDrilldown}
              title="عرض التفاصيل"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: "var(--con-radius-sm)",
                color: "var(--con-brand)",
                display: "flex",
              }}
            >
              <ExternalLink size={13} />
            </button>
          )}
          <button
            onClick={() => toggleWidgetCollapse(id)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--con-text-muted)",
              display: "flex",
            }}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {error ? (
              <div style={{ padding: 20, textAlign: "center" }}>
                <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-danger)" }}>{error}</p>
                {onRefresh && (
                  <button
                    onClick={handleRefresh}
                    style={{
                      marginTop: 8,
                      fontSize: "var(--con-text-caption)",
                      color: "var(--con-brand)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    إعادة المحاولة
                  </button>
                )}
              </div>
            ) : loading ? (
              <div style={{ padding: 20 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="con-skeleton"
                    style={{ height: 14, width: `${60 + i * 10}%`, borderRadius: 4, marginBottom: 10 }}
                  />
                ))}
              </div>
            ) : (
              <div style={noPadding ? undefined : { padding: "14px 16px" }}>{children}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
