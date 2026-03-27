/**
 * Quick Actions Widget — Command buttons for common admin operations
 */
import { useNavigate } from "react-router-dom";
import {
  UserPlus, FileSpreadsheet, CreditCard,
  CheckCircle2, Map, BarChart3, ShieldAlert, Settings,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  path: string;
}

const actions: QuickAction[] = [
  { id: "approve",    label: "الاعتمادات",    icon: CheckCircle2,   color: "var(--con-success)",  path: "/admin-panel/approvals" },
  { id: "dispatch",   label: "الإرسال",       icon: Map,            color: "var(--con-brand)",    path: "/admin-panel/dispatch" },
  { id: "import",     label: "استيراد Excel", icon: FileSpreadsheet, color: "var(--con-info)",     path: "/admin-panel/excel" },
  { id: "payouts",    label: "الدفعات",       icon: CreditCard,     color: "var(--con-warning)",  path: "/admin-panel/payouts" },
  { id: "drivers",    label: "سائق جديد",    icon: UserPlus,       color: "var(--con-brand)",    path: "/admin-panel/driver-applications" },
  { id: "reports",    label: "التقارير",       icon: BarChart3,      color: "var(--con-info)",     path: "/admin-panel/reports" },
  { id: "sla",        label: "مراقبة SLA",    icon: ShieldAlert,    color: "var(--con-danger)",   path: "/admin-panel/sla" },
  { id: "settings",   label: "الإعدادات",     icon: Settings,       color: "var(--con-text-muted)", path: "/admin-panel/settings" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
      }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => navigate(action.path)}
          title={action.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: "var(--con-radius)",
            border: "1px solid var(--con-border-default)",
            background: "var(--con-bg-surface-1)",
            color: "var(--con-text-secondary)",
            fontSize: "var(--con-text-caption)",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
            fontFamily: "var(--con-font-primary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${action.color}50`;
            e.currentTarget.style.background = `${action.color}10`;
            e.currentTarget.style.color = action.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--con-border-default)";
            e.currentTarget.style.background = "var(--con-bg-surface-1)";
            e.currentTarget.style.color = "var(--con-text-secondary)";
          }}
        >
          <action.icon size={13} style={{ color: action.color }} />
          {action.label}
        </button>
      ))}
    </div>
  );
}
