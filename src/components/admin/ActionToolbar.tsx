/**
 * ActionToolbar — شريط أوامر موحّد لجميع صفحات الإدارة
 * يوفر: إضافة، تصدير (Excel/CSV/PDF)، طباعة، أوامر جماعية، تحديث
 */
import { useState } from "react";
import {
  Plus,
  Download,
  Printer,
  RefreshCw,
  MoreHorizontal,
  FileSpreadsheet,
  FileText,
  File,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  ChevronDown,
  Filter,
  Search,
  X,
} from "lucide-react";

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "primary" | "success" | "danger" | "ghost";
  disabled?: boolean;
  hidden?: boolean;
}

interface ActionToolbarProps {
  /** أزرار الأوامر الرئيسية */
  actions?: ToolbarAction[];
  /** عرض زر التحديث */
  onRefresh?: () => void;
  loading?: boolean;
  /** تصدير البيانات */
  onExport?: (format: "excel" | "csv" | "pdf") => void;
  /** طباعة */
  onPrint?: () => void;
  /** أوامر جماعية */
  bulkActions?: ToolbarAction[];
  selectedCount?: number;
  onClearSelection?: () => void;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { background: "var(--con-accent)", color: "#fff", border: "none" },
  success: {
    background: "rgba(34,197,94,0.12)",
    color: "var(--con-success)",
    border: "1px solid rgba(34,197,94,0.3)",
  },
  danger: {
    background: "rgba(239,68,68,0.12)",
    color: "var(--con-danger)",
    border: "1px solid rgba(239,68,68,0.3)",
  },
  ghost: {
    background: "transparent",
    color: "var(--con-text-secondary)",
    border: "1px solid var(--con-border-default)",
  },
};

export default function ActionToolbar({
  actions = [],
  onRefresh,
  loading,
  onExport,
  onPrint,
  bulkActions = [],
  selectedCount = 0,
  onClearSelection,
}: ActionToolbarProps) {
  const [showExport, setShowExport] = useState(false);

  const visibleActions = actions.filter((a) => !a.hidden);
  const hasBulk = selectedCount > 0 && bulkActions.length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        alignItems: "center",
        marginBottom: "0.75rem",
      }}
    >
      {/* Bulk mode bar */}
      {hasBulk ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 8,
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.3)",
              fontSize: 12,
              color: "var(--con-accent)",
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={14} />
            {selectedCount} محدد
            <button
              onClick={onClearSelection}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "var(--con-text-muted)",
              }}
            >
              <X size={12} />
            </button>
          </div>
          {bulkActions.map((ba) => {
            const Icon = ba.icon;
            return (
              <button
                key={ba.id}
                onClick={ba.onClick}
                disabled={ba.disabled}
                style={{
                  ...variantStyles[ba.variant || "ghost"],
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  opacity: ba.disabled ? 0.5 : 1,
                }}
              >
                <Icon size={13} /> {ba.label}
              </button>
            );
          })}
        </>
      ) : (
        <>
          {/* Primary actions */}
          {visibleActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={a.onClick}
                disabled={a.disabled}
                className={
                  a.variant === "primary"
                    ? "con-btn-primary"
                    : "con-btn con-btn-ghost"
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  ...(a.variant && a.variant !== "primary"
                    ? variantStyles[a.variant]
                    : {}),
                  opacity: a.disabled ? 0.5 : 1,
                }}
              >
                <Icon size={13} /> {a.label}
              </button>
            );
          })}
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Export dropdown */}
      {onExport && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowExport(!showExport)}
            className="con-btn con-btn-ghost"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
            }}
          >
            <Download size={13} /> تصدير <ChevronDown size={10} />
          </button>
          {showExport && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
                onClick={() => setShowExport(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 4,
                  zIndex: 100,
                  background: "var(--con-bg-card)",
                  border: "1px solid var(--con-border-default)",
                  borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  minWidth: 160,
                  overflow: "hidden",
                }}
              >
                {[
                  {
                    fmt: "excel" as const,
                    label: "Excel (.xlsx)",
                    icon: FileSpreadsheet,
                  },
                  { fmt: "csv" as const, label: "CSV", icon: File },
                  { fmt: "pdf" as const, label: "PDF", icon: FileText },
                ].map((e) => (
                  <button
                    key={e.fmt}
                    onClick={() => {
                      onExport(e.fmt);
                      setShowExport(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "var(--con-text-secondary)",
                      fontFamily: "inherit",
                      textAlign: "right",
                    }}
                    onMouseEnter={(ev) =>
                      (ev.currentTarget.style.background =
                        "var(--con-bg-elevated)")
                    }
                    onMouseLeave={(ev) =>
                      (ev.currentTarget.style.background = "none")
                    }
                  >
                    <e.icon size={13} /> {e.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Print */}
      {onPrint && (
        <button
          onClick={onPrint}
          className="con-btn con-btn-ghost"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
          }}
        >
          <Printer size={13} /> طباعة
        </button>
      )}

      {/* Refresh */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="con-btn con-btn-ghost"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />{" "}
          تحديث
        </button>
      )}
    </div>
  );
}

/* ── Export helpers ─────────────────────────────────────────────────────── */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: unknown[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printPage() {
  window.print();
}
