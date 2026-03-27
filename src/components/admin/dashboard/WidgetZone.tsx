/**
 * WidgetZone — Container for a group of dashboard widgets
 * Manages layout and optional collapsibility
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface WidgetZoneProps {
  zone: string;
  title?: string;
  layout?: "vertical" | "horizontal" | "grid";
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  cols?: string;
  gap?: number;
  children: React.ReactNode;
}

export function WidgetZone({
  zone,
  title,
  layout = "vertical",
  collapsible = false,
  defaultCollapsed = false,
  cols,
  gap = 14,
  children,
}: WidgetZoneProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const layoutStyle: React.CSSProperties = (() => {
    switch (layout) {
      case "horizontal":
        return { display: "flex", flexWrap: "wrap", gap };
      case "grid":
        return {
          display: "grid",
          gridTemplateColumns: cols || "repeat(auto-fit, minmax(280px, 1fr))",
          gap,
        };
      default:
        return { display: "flex", flexDirection: "column", gap };
    }
  })();

  return (
    <div data-zone={zone}>
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: collapsible && collapsed ? 0 : 10,
            cursor: collapsible ? "pointer" : undefined,
          }}
          onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        >
          <h2
            style={{
              fontSize: "var(--con-text-section-title)",
              fontWeight: 600,
              color: "var(--con-text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          {collapsible && (
            <button
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--con-text-muted)",
                display: "flex",
                padding: 4,
              }}
            >
              {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {(!collapsible || !collapsed) && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={collapsible ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.2 }}
            style={{ overflow: collapsible ? "hidden" : undefined, ...layoutStyle }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
