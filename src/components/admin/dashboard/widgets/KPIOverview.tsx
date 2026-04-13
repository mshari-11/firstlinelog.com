/**
 * KPI Overview Widget — Executive KPI row with 8 key metrics
 */
import { useNavigate } from "react-router-dom";
import {
  Users,
  Package,
  DollarSign,
  AlertCircle,
  Bike,
  Clock,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface KPIItem {
  key: string;
  label: string;
  icon: React.ElementType;
  accent: string;
  change?: number;
  format: (v: number) => string;
  link: string;
  tip: string;
}

export function KPIOverview() {
  const stats = useDashboardStore((s) => s.stats);
  const statsLoading = useDashboardStore((s) => s.statsLoading);
  const navigate = useNavigate();
  // Dashboard.tsx already triggers fetchStats on mount — no duplicate call here

  const kpis: KPIItem[] = [
    {
      key: "totalCouriers",
      label: "إجمالي المناديب",
      icon: Users,
      accent: "var(--con-brand)",
      format: (v) => v > 0 ? String(v) : "--",
      link: "/admin-panel/couriers",
      tip: "عدد المناديب المسجلين في النظام",
    },
    {
      key: "todayOrders",
      label: "طلبات اليوم",
      icon: Package,
      accent: "var(--con-success)",
      format: (v) => v > 0 ? String(v) : "0",
      link: "/admin-panel/orders",
      tip: "عدد الطلبات المستلمة اليوم من جميع المنصات",
    },
    {
      key: "monthRevenue",
      label: "إيرادات الشهر",
      icon: DollarSign,
      accent: "var(--con-info)",
      format: (v) => v > 0 ? `${v.toLocaleString("ar-SA")} ر.س` : "--",
      link: "/admin-panel/finance-dashboard",
      tip: "إجمالي الإيرادات للشهر الحالي",
    },
    {
      key: "pendingComplaints",
      label: "شكاوى معلقة",
      icon: AlertCircle,
      accent: "var(--con-danger)",
      format: (v) => String(v),
      link: "/admin-panel/complaints",
      tip: "شكاوى لم يتم حلها أو تعيينها بعد",
    },
    {
      key: "activeDriversNow",
      label: "مناديب نشطون الآن",
      icon: Bike,
      accent: "var(--con-warning)",
      format: (v) => v > 0 ? String(v) : "--",
      link: "/admin-panel/dispatch",
      tip: "عدد المناديب المتصلين حالياً",
    },
    {
      key: "pendingApprovals",
      label: "اعتمادات بانتظار",
      icon: Clock,
      accent: "var(--con-warning)",
      format: (v) => String(v),
      link: "/admin-panel/approvals",
      tip: "عمليات تنتظر موافقة المدير",
    },
    {
      key: "slaBreaches",
      label: "انتهاكات SLA",
      icon: ShieldAlert,
      accent: "var(--con-danger)",
      format: (v) => String(v),
      link: "/admin-panel/sla",
      tip: "عدد مؤشرات الأداء المتجاوزة للحدود المسموحة",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
        gap: 10,
      }}
    >
      {kpis.map((kpi) => {
        const val = stats[kpi.key as keyof typeof stats] as number;
        return (
          <div
            key={kpi.key}
            className="con-kpi-card"
            onClick={() => navigate(kpi.link)}
            style={{ cursor: "pointer" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <kpi.icon size={15} style={{ color: kpi.accent }} />
              {kpi.change !== undefined && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: "var(--con-text-caption)",
                    fontWeight: 600,
                    color:
                      kpi.change > 0
                        ? "var(--con-success)"
                        : "var(--con-danger)",
                  }}
                >
                  {kpi.change > 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {Math.abs(kpi.change)}%
                </div>
              )}
            </div>
            {statsLoading ? (
              <Skeleton className="h-6 w-3/5 rounded-md mb-1.5" />
            ) : (
              <div className="con-kpi-value" style={{ color: kpi.accent }}>
                {kpi.format(val)}
              </div>
            )}
            <div
              style={{
                fontSize: "var(--con-text-caption)",
                color: "var(--con-text-muted)",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {kpi.label}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    size={11}
                    style={{ color: "var(--con-text-muted)", cursor: "help" }}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p style={{ fontSize: 12, maxWidth: 200 }}>{kpi.tip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
