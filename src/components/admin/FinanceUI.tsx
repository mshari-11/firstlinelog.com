/**
 * مكونات مشتركة لصفحات المالية - Shared Finance UI Components
 * Unified KPI cards, chart wrappers, tables, badges, and page headers
 */
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown } from "lucide-react";

// ─── Chart Tooltip Style ─────────────────────────────────────────────────────
export const chartTooltipStyle = {
  background: "var(--con-bg-elevated)",
  border: "1px solid var(--con-border-strong)",
  borderRadius: 8,
  color: "var(--con-text-primary)",
  fontSize: 12,
  padding: "8px 12px",
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
export interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  accent: string;
  warning?: boolean;
  loading?: boolean;
  invertChange?: boolean;
}

export function KPICard({
  label, value, change, changeLabel, icon: Icon, accent, warning, loading, invertChange,
}: KPICardProps) {
  const effectiveAccent = warning ? "var(--con-warning)" : accent;

  if (loading) {
    return (
      <div style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10,
        padding: "18px 16px",
        minHeight: 130,
      }}>
        <div className="con-skeleton" style={{ height: 14, width: "60%", marginBottom: 12 }} />
        <div className="con-skeleton" style={{ height: 28, width: "80%", marginBottom: 12 }} />
        <div className="con-skeleton" style={{ height: 12, width: "40%" }} />
      </div>
    );
  }

  const changeColor = (() => {
    if (change === undefined) return "";
    if (invertChange) return change <= 0 ? "var(--con-success)" : "var(--con-warning)";
    return change >= 0 ? "var(--con-success)" : "var(--con-danger)";
  })();

  return (
    <div
      style={{
        background: "var(--con-bg-surface-1)",
        border: `1px solid ${effectiveAccent}33`,
        borderRadius: 10,
        padding: "18px 16px",
        transition: "background 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 500 }}>
          {label}
        </span>
        <div style={{
          background: `${effectiveAccent}14`,
          borderRadius: 8,
          padding: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon size={16} style={{ color: effectiveAccent }} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--con-text-primary)", marginBottom: 8 }}>
        {value}
      </div>
      {change !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--con-text-caption)", color: changeColor }}>
          {(invertChange ? change <= 0 : change >= 0)
            ? <ArrowUpRight size={14} />
            : <ArrowDownLeft size={14} />}
          <span>{Math.abs(change)}%{changeLabel ? ` ${changeLabel}` : ""}</span>
        </div>
      )}
    </div>
  );
}

// ─── Chart Card ──────────────────────────────────────────────────────────────
export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: "1px solid var(--con-border-default)",
      borderRadius: 10,
      padding: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
          {title}
        </h3>
        {subtitle && (
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────────────
export function PageHeader({
  icon: Icon, title, subtitle, actions,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={18} style={{ color: "var(--con-brand)" }} />
          </div>
          <h1 style={{
            fontSize: "var(--con-text-page-title)", fontWeight: 700,
            color: "var(--con-text-primary)", margin: 0,
          }}>
            {title}
          </h1>
        </div>
        {subtitle && (
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  completed: { bg: "rgba(34,197,94,0.12)", color: "var(--con-success)", border: "rgba(34,197,94,0.25)" },
  paid:      { bg: "rgba(34,197,94,0.12)", color: "var(--con-success)", border: "rgba(34,197,94,0.25)" },
  pending:   { bg: "rgba(217,119,6,0.12)", color: "var(--con-warning)", border: "rgba(217,119,6,0.25)" },
  rejected:  { bg: "rgba(220,38,38,0.12)", color: "var(--con-danger)",  border: "rgba(220,38,38,0.25)" },
  failed:    { bg: "rgba(220,38,38,0.12)", color: "var(--con-danger)",  border: "rgba(220,38,38,0.25)" },
  approved:  { bg: "rgba(14,165,233,0.12)", color: "var(--con-info)",   border: "rgba(14,165,233,0.25)" },
};

const statusLabels: Record<string, string> = {
  completed: "مكتمل",
  paid: "مدفوع",
  pending: "في الانتظار",
  rejected: "مرفوض",
  failed: "فشل",
  approved: "معتمد",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = statusColors[status] || statusColors.pending;
  return (
    <span style={{
      padding: "3px 8px",
      borderRadius: 4,
      fontSize: "var(--con-text-caption)",
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {label || statusLabels[status] || status}
    </span>
  );
}

// ─── Data Table ──────────────────────────────────────────────────────────────
export interface TableColumn {
  key: string;
  label: string;
  align?: "right" | "center" | "left";
  mono?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export function DataTable({
  title, columns, data, headerAction,
}: {
  title: string;
  columns: TableColumn[];
  data: any[];
  headerAction?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: "1px solid var(--con-border-default)",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: "1px solid var(--con-border-default)",
      }}>
        <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
          {title}
        </h3>
        {headerAction}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--con-bg-surface-2)", borderBottom: "1px solid var(--con-border-default)" }}>
              {columns.map((col) => (
                <th key={col.key} style={{
                  padding: "12px 16px",
                  textAlign: col.align || "right",
                  color: "var(--con-text-muted)",
                  fontSize: "var(--con-text-caption)",
                  fontWeight: 600,
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--con-border-default)", height: 52 }}>
                {columns.map((col) => (
                  <td key={col.key} style={{
                    padding: "12px 16px",
                    textAlign: col.align || "right",
                    color: "var(--con-text-primary)",
                    fontSize: "var(--con-text-body)",
                    fontFamily: col.mono ? "var(--con-font-mono)" : undefined,
                  }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Metric Row ──────────────────────────────────────────────────────────────
export function MetricRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid var(--con-border-default)",
    }}>
      <span style={{ color: "var(--con-text-muted)" }}>{label}</span>
      <span style={{ color: accent, fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>{value}</span>
    </div>
  );
}

// ─── Currency Formatter ──────────────────────────────────────────────────────
export function formatSAR(amount: number, compact = false): string {
  if (compact) return `${(amount / 1000).toFixed(0)}ك ر.س`;
  return `${amount.toLocaleString("ar-SA")} ر.س`;
}
