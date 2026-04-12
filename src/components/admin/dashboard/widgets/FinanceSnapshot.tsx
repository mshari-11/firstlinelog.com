/**
 * Finance Snapshot Widget — Revenue, payouts, pending, cash flow
 * Connected to Supabase with mock fallback
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowRightLeft,
  AlertCircle,
} from "lucide-react";
import { WidgetShell } from "../WidgetShell";
import { supabase } from "@/lib/supabase";

type FinancePeriod = "month" | "week" | "today";

interface FinanceMetric {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  change?: number;
}

const MOCK_METRICS: FinanceMetric[] = [
  {
    label: "إيرادات الشهر",
    value: "-- ر.س",
    icon: TrendingUp,
    accent: "var(--con-success)",
  },
  {
    label: "دفعات مكتملة",
    value: "-- ر.س",
    icon: CreditCard,
    accent: "var(--con-info)",
  },
  {
    label: "دفعات معلقة",
    value: "-- ر.س",
    icon: AlertCircle,
    accent: "var(--con-warning)",
  },
  {
    label: "صافي التدفق",
    value: "-- ر.س",
    icon: ArrowRightLeft,
    accent: "var(--con-brand)",
  },
];

function formatSAR(n: number): string {
  return `${n.toLocaleString("ar-SA")} ر.س`;
}

const periodLabels: Record<FinancePeriod, string> = {
  today: "اليوم",
  week: "الأسبوع",
  month: "الشهر",
};

export function FinanceSnapshot() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<FinanceMetric[]>(MOCK_METRICS);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FinancePeriod>("month");

  useEffect(() => {
    async function fetchFinance() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const now = new Date();
        const monthStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        ).toISOString();
        const prevMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        ).toISOString();
        const prevMonthEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
        ).toISOString();

        // Current month orders revenue
        const [currentRes, prevRes, payoutsRes] = await Promise.all([
          supabase
            .from("orders")
            .select("total_amount")
            .gte("created_at", monthStart),
          supabase
            .from("orders")
            .select("total_amount")
            .gte("created_at", prevMonthStart)
            .lte("created_at", prevMonthEnd),
          supabase.from("driver_payouts" as any).select("net_payout, status"),
        ]);

        const currentRevenue = (currentRes.data || []).reduce(
          (sum: number, r: any) => sum + (Number(r.total_amount) || 0),
          0,
        );
        const prevRevenue = (prevRes.data || []).reduce(
          (sum: number, r: any) => sum + (Number(r.total_amount) || 0),
          0,
        );
        const revenueChange =
          prevRevenue > 0
            ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
            : 0;

        const payouts = payoutsRes.data || [];
        const completedPayouts = payouts
          .filter((p: any) => p.status === "paid")
          .reduce((s: number, p: any) => s + (Number(p.net_payout) || 0), 0);
        const pendingPayouts = payouts
          .filter((p: any) => p.status === "pending")
          .reduce((s: number, p: any) => s + (Number(p.net_payout) || 0), 0);
        const netFlow = currentRevenue - completedPayouts - pendingPayouts;

        setMetrics([
          {
            label: "إيرادات الشهر",
            value: currentRevenue > 0 ? formatSAR(currentRevenue) : "-- ر.س",
            icon: TrendingUp,
            accent: "var(--con-success)",
            change: revenueChange > 0 ? revenueChange : undefined,
          },
          {
            label: "دفعات مكتملة",
            value: completedPayouts > 0 ? formatSAR(completedPayouts) : "-- ر.س",
            icon: CreditCard,
            accent: "var(--con-info)",
          },
          {
            label: "دفعات معلقة",
            value: pendingPayouts > 0 ? formatSAR(pendingPayouts) : "-- ر.س",
            icon: AlertCircle,
            accent: "var(--con-warning)",
          },
          {
            label: "صافي التدفق",
            value: currentRevenue > 0 ? `${netFlow >= 0 ? "+" : ""}${formatSAR(netFlow)}` : "-- ر.س",
            icon: ArrowRightLeft,
            accent: "var(--con-brand)",
          },
        ]);
      } catch {
        /* keep mock */
      }
      setLoading(false);
    }
    fetchFinance();
  }, []);

  return (
    <WidgetShell
      id="finance-snapshot"
      title="نظرة مالية سريعة"
      icon={DollarSign}
      iconColor="var(--con-success)"
      loading={loading}
      onDrilldown={() => navigate("/admin-panel/finance-dashboard")}
      actions={
        <div style={{ display: "flex", gap: 2 }}>
          {(["today", "week", "month"] as FinancePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "2px 8px",
                borderRadius: "var(--con-radius-sm)",
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "var(--con-font-primary)",
                border: "none",
                cursor: "pointer",
                background: period === p ? "var(--con-success)20" : "transparent",
                color: period === p ? "var(--con-success)" : "var(--con-text-disabled)",
                transition: "all 0.15s",
              }}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}
      >
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <m.icon size={13} style={{ color: m.accent }} />
              <span
                style={{
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-muted)",
                }}
              >
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
                  color:
                    m.change >= 0 ? "var(--con-success)" : "var(--con-danger)",
                  fontWeight: 600,
                }}
              >
                {m.change >= 0 ? "+" : ""}
                {m.change}% عن الشهر السابق
              </span>
            )}
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
