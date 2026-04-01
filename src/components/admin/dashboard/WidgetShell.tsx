/**
 * WidgetShell — Consistent wrapper for all dashboard widgets
 * Provides: title, collapse/expand, loading skeleton, refresh, error boundary
 * Enhanced: maximize, pin/favorite, fullscreen controls
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  Download,
  MoreVertical,
} from "lucide-react";
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
  /** Allow maximize/fullscreen for this widget */
  canMaximize?: boolean;
  /** Allow pinning this widget */
  canPin?: boolean;
  /** Allow data export */
  onExport?: () => void;
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
  canMaximize = true,
  canPin = true,
  onExport,
  children,
}: WidgetShellProps) {
  const { isWidgetCollapsed, toggleWidgetCollapse } = useDashboardStore();
  const collapsed = isWidgetCollapsed(id);
  const [refreshing, setRefreshing] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const toggleMaximize = useCallback(() => {
    setMaximized((prev) => !prev);
  }, []);

  const togglePin = useCallback(() => {
    setPinned((prev) => !prev);
  }, []);

  const widgetStyle: React.CSSProperties = maximized
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "var(--con-bg-surface-1)",
        border: "none",
        borderRadius: 0,
        overflow: "auto",
      }
    : {
        background: "var(--con-bg-surface-1)",
        border: pinned
          ? "1px solid var(--con-brand)"
          : "1px solid var(--con-border-default)",
        borderRadius: "var(--con-radius-lg)",
        overflow: "hidden",
        boxShadow: pinned ? `0 0 0 1px var(--con-brand)30` : undefined,
      };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={widgetStyle}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: collapsed
            ? "none"
            : "1px solid var(--con-border-default)",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => toggleWidgetCollapse(id)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 0,
          }}
        >
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
              <p
                style={{
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-muted)",
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div
          style={{ display: "flex", alignItems: "center", gap: 2, position: "relative" }}
          onClick={(e) => e.stopPropagation()}
        >
          {actions}

          {/* Pin button */}
          {canPin && (
            <button
              onClick={togglePin}
              title={pinned ? "إلغاء التثبيت" : "تثبيت اللوحة"}
              style={{
                background: pinned ? "var(--con-brand)14" : "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: "var(--con-radius-sm)",
                color: pinned ? "var(--con-brand)" : "var(--con-text-muted)",
                display: "flex",
                transition: "all 0.15s",
              }}
            >
              {pinned ? <PinOff size={13} /> : <Pin size={13} />}
            </button>
          )}

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
              <RefreshCw
                size={13}
                style={{
                  animation: refreshing
                    ? "spin 0.6s linear infinite"
                    : undefined,
                }}
              />
            </button>
          )}

          {/* More menu (export + drilldown) */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="خيارات إضافية"
              style={{
                background: showMenu ? "var(--con-bg-surface-2)" : "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: "var(--con-radius-sm)",
                color: "var(--con-text-muted)",
                display: "flex",
              }}
            >
              <MoreVertical size={13} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 4,
                    background: "var(--con-bg-surface-2)",
                    border: "1px solid var(--con-border-default)",
                    borderRadius: "var(--con-radius)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                    zIndex: 100,
                    minWidth: 150,
                    overflow: "hidden",
                  }}
                  onMouseLeave={() => setShowMenu(false)}
                >
                  {(drilldownLink || onDrilldown) && (
                    <button
                      onClick={() => { setShowMenu(false); onDrilldown?.(); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--con-text-secondary)",
                        fontSize: "var(--con-text-caption)",
                        fontFamily: "var(--con-font-primary)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <ExternalLink size={12} />
                      عرض التفاصيل
                    </button>
                  )}
                  {onExport && (
                    <button
                      onClick={() => { setShowMenu(false); onExport(); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--con-text-secondary)",
                        fontSize: "var(--con-text-caption)",
                        fontFamily: "var(--con-font-primary)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <Download size={12} />
                      تصدير البيانات
                    </button>
                  )}
                  {onRefresh && (
                    <button
                      onClick={() => { setShowMenu(false); handleRefresh(); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--con-text-secondary)",
                        fontSize: "var(--con-text-caption)",
                        fontFamily: "var(--con-font-primary)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <RefreshCw size={12} />
                      تحديث الآن
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Maximize button */}
          {canMaximize && (
            <button
              onClick={toggleMaximize}
              title={maximized ? "تصغير" : "تكبير"}
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
              {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          {/* Collapse button */}
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
                <p
                  style={{
                    fontSize: "var(--con-text-body)",
                    color: "var(--con-danger)",
                  }}
                >
                  {error}
                </p>
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
                    style={{
                      height: 14,
                      width: `${60 + i * 10}%`,
                      borderRadius: 4,
                      marginBottom: 10,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={noPadding ? undefined : { padding: "14px 16px" }}>
                {children}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
