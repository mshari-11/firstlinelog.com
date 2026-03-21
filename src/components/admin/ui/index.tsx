/**
 * FLL Admin Console — Shared UI Components
 * "Obsidian Command" Design System
 *
 * Reusable building blocks for all admin pages.
 * Uses inline styles with CSS custom properties (--con-*).
 * Icons: lucide-react only.
 */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Search, Filter, Download, ChevronDown } from "lucide-react";

// ─── Transitions ──────────────────────────────────────────────────────────────
const ease = [0.22, 0.68, 0, 1];
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease },
};
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease },
};
const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

// ─── Page Wrapper ─────────────────────────────────────────────────────────────
export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      dir="rtl"
      style={{ display: "flex", flexDirection: "column", gap: 20, padding: "1.5rem" }}
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      {children}
    </motion.div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  iconColor?: string;
}

export function PageHeader({ icon: Icon, title, subtitle, actions, iconColor }: PageHeaderProps) {
  return (
    <motion.div
      variants={fadeUp}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div
            style={{
              background: "var(--con-brand-subtle)",
              borderRadius: "var(--con-radius)",
              padding: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} style={{ color: iconColor || "var(--con-brand)" }} />
          </div>
          <h1
            style={{
              fontSize: "var(--con-text-page-title)",
              fontWeight: 700,
              color: "var(--con-text-primary)",
              margin: 0,
              fontFamily: "var(--con-font-primary)",
              letterSpacing: "-0.025em",
            }}
          >
            {title}
          </h1>
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: "var(--con-text-body)",
              color: "var(--con-text-muted)",
              margin: 0,
              paddingRight: 44,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{actions}</div>}
    </motion.div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
  change?: number;
  loading?: boolean;
  mono?: boolean;
  onClick?: () => void;
}

export function KPICard({ label, value, icon: Icon, accent = "var(--con-brand)", change, loading, mono = true, onClick }: KPICardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="con-kpi-card"
      style={{ cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01 } : undefined}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Icon size={15} style={{ color: accent }} />
        {change !== undefined && (
          <span
            style={{
              fontSize: "var(--con-text-caption)",
              fontWeight: 600,
              fontFamily: "var(--con-font-mono)",
              color: change >= 0 ? "var(--con-success)" : "var(--con-danger)",
            }}
          >
            {change >= 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="con-skeleton" style={{ height: 22, width: "60%", borderRadius: 5, marginBottom: 6 }} />
      ) : (
        <div
          className={mono ? "con-kpi-value" : undefined}
          style={{
            ...(mono
              ? { color: accent }
              : {
                  fontSize: "1.625rem",
                  fontWeight: 700,
                  color: accent,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }),
          }}
        >
          {value}
        </div>
      )}
      <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 4 }}>
        {label}
      </div>
    </motion.div>
  );
}

// ─── KPI Grid ─────────────────────────────────────────────────────────────────
export function KPIGrid({ children, cols }: { children: React.ReactNode; cols?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      style={{
        display: "grid",
        gridTemplateColumns: cols || "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  noPadding?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, title, subtitle, actions, noPadding, style }: CardProps) {
  return (
    <motion.div
      variants={fadeUp}
      style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: "var(--con-radius-lg)",
        overflow: "hidden",
        ...style,
      }}
    >
      {(title || actions) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid var(--con-border-default)",
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: "var(--con-text-card-title)",
                  fontWeight: 600,
                  color: "var(--con-text-primary)",
                  margin: 0,
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: "2px 0 0" }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div style={noPadding ? undefined : { padding: "18px 20px" }}>{children}</div>
    </motion.div>
  );
}

// ─── Toolbar (Search + Filters) ───────────────────────────────────────────────
interface ToolbarProps {
  search?: string;
  onSearch?: (val: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function Toolbar({ search, onSearch, searchPlaceholder, children, actions }: ToolbarProps) {
  return (
    <motion.div variants={fadeUp} className="con-toolbar" style={{ flexWrap: "wrap" }}>
      {onSearch !== undefined && (
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--con-text-disabled)",
              pointerEvents: "none",
            }}
          />
          <input
            className="con-input"
            style={{ width: "100%", paddingRight: 32 }}
            placeholder={searchPlaceholder || "بحث..."}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
      {children}
      {actions && <div style={{ marginRight: "auto", display: "flex", gap: 6 }}>{actions}</div>}
    </motion.div>
  );
}

// ─── Select Dropdown ──────────────────────────────────────────────────────────
interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  style?: React.CSSProperties;
}

export function Select({ value, onChange, options, style }: SelectProps) {
  return (
    <select
      className="con-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        cursor: "pointer",
        appearance: "none",
        paddingLeft: 28,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23636D83' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left 10px center",
        ...style,
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
interface TabItem {
  key: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <motion.div variants={fadeUp} className="con-tabs">
      {items.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            className={`con-tab${isActive ? " active" : ""}`}
            onClick={() => onChange(tab.key)}
            style={{ position: "relative" }}
          >
            {tab.icon && <tab.icon size={14} />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: "0.5625rem",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 100,
                  marginRight: 4,
                  fontFamily: "var(--con-font-mono)",
                  background: isActive ? "var(--con-brand-subtle)" : "rgba(255,255,255,0.05)",
                  color: isActive ? "var(--con-brand)" : "var(--con-text-muted)",
                }}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                style={{
                  position: "absolute",
                  bottom: -1,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "var(--con-brand)",
                  borderRadius: "1px 1px 0 0",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </motion.div>
  );
}

// ─── Table Wrapper ────────────────────────────────────────────────────────────
interface TableProps {
  headers: string[];
  children: React.ReactNode;
  emptyIcon?: React.ElementType;
  emptyText?: string;
  isEmpty?: boolean;
}

export function Table({ headers, children, emptyIcon: EmptyIcon, emptyText, isEmpty }: TableProps) {
  if (isEmpty) {
    return (
      <div className="con-empty">
        {EmptyIcon && <EmptyIcon size={40} />}
        <p style={{ fontSize: "var(--con-text-body)" }}>{emptyText || "لا توجد بيانات"}</p>
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="con-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface BadgeProps {
  variant: "success" | "warning" | "danger" | "info" | "brand" | "muted";
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({ variant, children, dot }: BadgeProps) {
  return (
    <span className={`con-badge con-badge-${variant}`}>
      {dot && <span className={`con-dot con-dot-${variant}`} />}
      {children}
    </span>
  );
}

// ─── Icon Button ──────────────────────────────────────────────────────────────
interface IconButtonProps {
  icon: React.ElementType;
  onClick?: () => void;
  title?: string;
  variant?: "ghost" | "danger" | "brand";
  size?: number;
  style?: React.CSSProperties;
}

export function IconButton({ icon: Icon, onClick, title, variant = "ghost", size = 14, style: customStyle }: IconButtonProps) {
  const colors = {
    ghost: { color: "var(--con-text-muted)", hover: "var(--con-text-primary)", bg: "rgba(255,255,255,0.04)" },
    danger: { color: "var(--con-danger)", hover: "var(--con-danger)", bg: "var(--con-danger-subtle)" },
    brand: { color: "var(--con-brand)", hover: "var(--con-brand)", bg: "var(--con-brand-subtle)" },
  };
  const c = colors[variant];
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 6,
        borderRadius: "var(--con-radius-sm)",
        color: c.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
        ...customStyle,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = c.hover;
        e.currentTarget.style.background = c.bg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = c.color;
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon size={size} />
    </button>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
  icon?: React.ElementType;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}

export function Button({ children, variant = "primary", icon: Icon, onClick, disabled, style, type = "button" }: ButtonProps) {
  const cls = `con-btn-${variant}`;
  return (
    <button
      className={cls}
      onClick={onClick}
      disabled={disabled}
      type={type}
      style={{
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : undefined,
        ...style,
      }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

// ─── Modal / Dialog ───────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Modal({ open, onClose, title, width, children, actions }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...fadeIn}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease }}
            style={{
              background: "var(--con-bg-surface-1)",
              border: "1px solid var(--con-border-strong)",
              borderRadius: "var(--con-radius-xl)",
              boxShadow: "var(--con-shadow-overlay)",
              width: width || 560,
              maxWidth: "92vw",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            dir="rtl"
          >
            {/* Header */}
            {title && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--con-border-default)",
                }}
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
                <IconButton icon={X} onClick={onClose} title="إغلاق" />
              </div>
            )}
            {/* Body */}
            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>{children}</div>
            {/* Footer actions */}
            {actions && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 8,
                  padding: "14px 20px",
                  borderTop: "1px solid var(--con-border-default)",
                }}
              >
                {actions}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Detail Field (label + value pair) ────────────────────────────────────────
interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  mono?: boolean;
}

export function DetailField({ label, value, icon: Icon, mono }: DetailFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 500 }}>
        {Icon && <Icon size={11} style={{ marginLeft: 4, verticalAlign: "middle" }} />}
        {label}
      </span>
      <span
        style={{
          fontSize: "var(--con-text-body)",
          color: "var(--con-text-primary)",
          fontWeight: 500,
          fontFamily: mono ? "var(--con-font-mono)" : undefined,
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Detail Grid ──────────────────────────────────────────────────────────────
export function DetailGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "16px 24px",
        padding: "4px 0",
      }}
    >
      {children}
    </div>
  );
}

// ─── Section inside modal / page ──────────────────────────────────────────────
export function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginTop: 16, ...style }}>
      <h4
        style={{
          fontSize: "var(--con-text-card-title)",
          fontWeight: 600,
          color: "var(--con-text-primary)",
          margin: "0 0 12px",
          paddingBottom: 8,
          borderBottom: "1px solid var(--con-border-default)",
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

// ─── Status Indicator (live dot) ──────────────────────────────────────────────
export function StatusIndicator({ label, status = "success" }: { label: string; status?: "success" | "warning" | "danger" }) {
  const colors = {
    success: "var(--con-success)",
    warning: "var(--con-warning)",
    danger: "var(--con-danger)",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: "var(--con-radius)",
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: colors[status],
          animation: "pulse 2s infinite",
        }}
      />
      <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>{label}</span>
    </div>
  );
}

// ─── Loading Skeleton Row ─────────────────────────────────────────────────────
export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <div
                className="con-skeleton"
                style={{
                  height: 14,
                  width: `${60 + Math.random() * 30}%`,
                  borderRadius: 4,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel, variant = "danger", loading }: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={420}
      actions={
        <>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "جارٍ التنفيذ..." : confirmLabel || "تأكيد"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
        </>
      }
    >
      <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)", margin: 0, lineHeight: 1.7 }}>
        {message}
      </p>
    </Modal>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="con-empty" style={{ padding: "3rem 2rem" }}>
      <Icon size={44} />
      <p style={{ fontSize: "var(--con-text-body)", fontWeight: 500, color: "var(--con-text-muted)" }}>{title}</p>
      {description && (
        <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-disabled)", maxWidth: 280 }}>{description}</p>
      )}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function TextArea({ value, onChange, placeholder, rows = 3, style }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
}) {
  return (
    <textarea
      className="con-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ width: "100%", resize: "vertical", fontFamily: "var(--con-font-primary)", ...style }}
    />
  );
}
