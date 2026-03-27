/**
 * Finance Snapshot Widget — Revenue, payouts, pending, cash flow strip
 */
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, CreditCard, ArrowRightLeft, AlertCircle } from "lucide-react";
import { WidgetShell } from "../WidgetShell";

interface FinanceMetric {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  change?: number;
}

const metrics: FinanceMetric[] = [
  { label: "إيرادات الشهر",    value: "142,000 ر.س",  icon: TrendingUp,     accent: "var(--con-success)", change: 11 },
  { label: "دفعات مكتملة",     value: "98,500 ر.س",   icon: CreditCard,     accent: "var(--con-info)" },
  { label: "دفعات معلقة",      value: "43,500 ر.س",   icon: AlertCircle,    accent: "var(--con-warning)" },
  { label: "صافي التدفق",       value: "+23,800 ر.س",  icon: ArrowRightLeft, accent: "var(--con-brand)", change: 5 },
];

export function FinanceSnapshot() {
  const navigate = useNavigate();

  return (
    <WidgetShell
      id="finance-snapshot"
      title="نظرة مالية سريعة"
      icon={DollarSign}
      iconColor="var(--con-success)"
      onDrilldown={() => navigate("/admin-panel/finance-dashboard")}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--con-radius)",
              background: `${m.accent}08`,
              border: `1px solid ${m.accent}20`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <m.icon size={13} style={{ color: m.accent }} />
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                {m.label}
              </span>
            </div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--con-text-primary)",
                fontFamily: "var(--con-font-mono)",
              }}
            >
              {m.value}
            </div>
            {m.change !== undefined && (
              <span
                style={{
                  fontSize: "var(--con-text-caption)",
                  color: m.change >= 0 ? "var(--con-success)" : "var(--con-danger)",
                  fontWeight: 600,
                }}
              >
                {m.change >= 0 ? "+" : ""}{m.change}% عن الشهر السابق
              </span>
            )}
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
