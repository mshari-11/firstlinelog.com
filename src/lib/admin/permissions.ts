/**
 * Enhanced Permission Engine — Action-level & Data-scope permissions
 * Extends the base StaffPermissions with granular control
 */

// ─── Types ──────────────────────────────────────────────────────────────────
export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "export" | "configure";

export interface ModulePermission {
  moduleId: string;
  actions: PermissionAction[];
  dataScope?: DataScope;
}

export interface DataScope {
  cities?: string[];
  platforms?: string[];
  departments?: string[];
}

export interface EnhancedRole {
  id: string;
  name: string;
  nameAr: string;
  isSystem: boolean;
  modules: ModulePermission[];
  dashboardWidgets: string[];
}

// ─── Default Roles ──────────────────────────────────────────────────────────
const ALL_ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "approve", "export", "configure"];

export const SYSTEM_ROLES: EnhancedRole[] = [
  {
    id: "admin",
    name: "admin",
    nameAr: "مدير النظام",
    isSystem: true,
    modules: [], // admin gets all by default
    dashboardWidgets: ["*"],
  },
  {
    id: "owner",
    name: "owner",
    nameAr: "المالك",
    isSystem: true,
    modules: [],
    dashboardWidgets: ["*"],
  },
  {
    id: "staff_operations",
    name: "staff_operations",
    nameAr: "موظف تشغيل",
    isSystem: false,
    modules: [
      { moduleId: "orders", actions: ["view", "create", "edit", "export"] },
      { moduleId: "couriers", actions: ["view", "edit"] },
      { moduleId: "complaints", actions: ["view", "create", "edit"] },
      { moduleId: "dispatch", actions: ["view", "create"] },
      { moduleId: "sla", actions: ["view"] },
    ],
    dashboardWidgets: ["kpi-overview", "alerts-panel", "recent-activity", "operations-map", "charts-panel"],
  },
  {
    id: "staff_finance",
    name: "staff_finance",
    nameAr: "موظف مالية",
    isSystem: false,
    modules: [
      { moduleId: "finance-dashboard", actions: ["view", "export"] },
      { moduleId: "revenue", actions: ["view", "export"] },
      { moduleId: "expenses", actions: ["view", "create", "edit", "export"] },
      { moduleId: "cashflow", actions: ["view"] },
      { moduleId: "reconciliation", actions: ["view", "edit", "approve"] },
      { moduleId: "wallet", actions: ["view"] },
      { moduleId: "payouts", actions: ["view", "create", "approve"] },
      { moduleId: "invoices", actions: ["view", "create", "export"] },
    ],
    dashboardWidgets: ["kpi-overview", "finance-snapshot", "charts-panel", "pending-approvals"],
  },
  {
    id: "staff_hr",
    name: "staff_hr",
    nameAr: "موظف موارد بشرية",
    isSystem: false,
    modules: [
      { moduleId: "staff", actions: ["view", "create", "edit"] },
      { moduleId: "attendance", actions: ["view", "edit"] },
      { moduleId: "driver-applications", actions: ["view", "edit", "approve"] },
      { moduleId: "kyc", actions: ["view", "edit"] },
      { moduleId: "driver-training", actions: ["view", "create"] },
    ],
    dashboardWidgets: ["kpi-overview", "alerts-panel", "pending-approvals", "recent-activity"],
  },
  {
    id: "staff_fleet",
    name: "staff_fleet",
    nameAr: "موظف أسطول",
    isSystem: false,
    modules: [
      { moduleId: "vehicles", actions: ["view", "create", "edit", "delete"] },
      { moduleId: "fleet", actions: ["view", "create", "edit"] },
      { moduleId: "fleet-assignments", actions: ["view", "create", "edit", "delete"] },
    ],
    dashboardWidgets: ["kpi-overview", "alerts-panel", "module-status-grid"],
  },
];

// ─── Permission Evaluation ──────────────────────────────────────────────────

/**
 * Check if a role has permission for a specific action on a module.
 * System roles (admin/owner) always return true.
 */
export function evaluatePermission(
  role: EnhancedRole | undefined,
  moduleId: string,
  action: PermissionAction = "view",
): boolean {
  if (!role) return false;
  if (role.isSystem) return true;
  const mod = role.modules.find((m) => m.moduleId === moduleId);
  if (!mod) return false;
  return mod.actions.includes(action);
}

/**
 * Check if the user's data scope allows access to a specific entity.
 */
export function evaluateDataScope(
  role: EnhancedRole | undefined,
  moduleId: string,
  context: { city?: string; platform?: string; department?: string },
): boolean {
  if (!role) return false;
  if (role.isSystem) return true;
  const mod = role.modules.find((m) => m.moduleId === moduleId);
  if (!mod?.dataScope) return true; // no scope restriction
  const { cities, platforms, departments } = mod.dataScope;
  if (cities?.length && context.city && !cities.includes(context.city)) return false;
  if (platforms?.length && context.platform && !platforms.includes(context.platform)) return false;
  if (departments?.length && context.department && !departments.includes(context.department)) return false;
  return true;
}

/**
 * Get allowed widgets for a role
 */
export function getAllowedWidgets(role: EnhancedRole | undefined): string[] {
  if (!role) return [];
  if (role.dashboardWidgets.includes("*")) {
    return [
      "kpi-overview", "system-health", "quick-actions",
      "charts-panel", "alerts-panel", "recent-activity",
      "pending-approvals", "finance-snapshot", "operations-map",
      "module-status-grid", "infrastructure-panel",
    ];
  }
  return role.dashboardWidgets;
}
