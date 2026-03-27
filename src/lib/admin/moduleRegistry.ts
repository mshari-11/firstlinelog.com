/**
 * Module Registry — Centralized module definitions for the FLL Admin Control Tower
 * Replaces the flat DEFAULT_PAGES array with a richer, extensible system.
 */

export type ModuleGroup =
  | "operations"
  | "finance"
  | "assets_staff"
  | "system"
  | "drivers"
  | "governance"
  | "infrastructure";

export const GROUP_LABELS: Record<ModuleGroup, string> = {
  operations: "التشغيل",
  finance: "المالية والموارد",
  assets_staff: "الأصول والموظفون",
  system: "النظام",
  drivers: "السائقون",
  governance: "الحوكمة والتحكم",
  infrastructure: "البنية التحتية",
};

export interface FeatureToggle {
  id: string;
  label: string;
  labelAr: string;
  enabled: boolean;
  scope: "global" | "role" | "user";
}

export interface SubPageDef {
  id: string;
  label: string;
  path: string;
}

export interface ModuleDefinition {
  id: string;
  label: string;
  labelAr: string;
  group: ModuleGroup;
  icon: string;
  path: string;
  enabled: boolean;
  isCore: boolean;
  order: number;
  version: string;
  requiredPermission?: string;
  features: FeatureToggle[];
  subPages?: SubPageDef[];
  dependencies?: string[];
  badge?: { count: number; variant: string };
}

// ─── Default Module Definitions ─────────────────────────────────────────────
export const DEFAULT_MODULES: ModuleDefinition[] = [
  // ── Operations ──
  { id: "dashboard",    labelAr: "مركز التحكم",      label: "Control Tower",        group: "operations",  icon: "LayoutDashboard", path: "/admin-panel/dashboard",     enabled: true,  isCore: true,  order: 0,  version: "2.0.0", features: [] },
  { id: "couriers",     labelAr: "المناديب",          label: "Couriers",             group: "operations",  icon: "Users",           path: "/admin-panel/couriers",      enabled: true,  isCore: false, order: 1,  version: "1.0.0", requiredPermission: "couriers", features: [] },
  { id: "orders",       labelAr: "الطلبات",           label: "Orders",               group: "operations",  icon: "ClipboardList",   path: "/admin-panel/orders",        enabled: true,  isCore: false, order: 2,  version: "1.0.0", requiredPermission: "orders", features: [] },
  { id: "complaints",   labelAr: "الشكاوى",           label: "Complaints",           group: "operations",  icon: "MessageSquare",   path: "/admin-panel/complaints",    enabled: true,  isCore: false, order: 3,  version: "1.0.0", requiredPermission: "complaints", features: [] },
  { id: "dispatch",     labelAr: "الخريطة والإرسال", label: "Dispatch",             group: "operations",  icon: "Map",             path: "/admin-panel/dispatch",      enabled: true,  isCore: false, order: 4,  version: "1.0.0", requiredPermission: "orders", features: [] },
  { id: "shipments",    labelAr: "الشحنات",           label: "Shipments",            group: "operations",  icon: "Package",         path: "/admin-panel/shipments",     enabled: true,  isCore: false, order: 5,  version: "1.0.0", requiredPermission: "orders", features: [] },
  { id: "sla",          labelAr: "مراقبة SLA",        label: "SLA Monitor",          group: "operations",  icon: "Target",          path: "/admin-panel/sla",           enabled: true,  isCore: false, order: 6,  version: "1.0.0", features: [] },
  { id: "marketplace",  labelAr: "تكاملات المنصات",   label: "Marketplace",          group: "operations",  icon: "Plug",            path: "/admin-panel/marketplace",   enabled: true,  isCore: false, order: 7,  version: "1.0.0", features: [] },

  // ── Finance ──
  { id: "finance-dashboard", labelAr: "لوحة المالية",       label: "Finance Dashboard",  group: "finance", icon: "LayoutDashboard", path: "/admin-panel/finance-dashboard",  enabled: true, isCore: false, order: 10, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "revenue",           labelAr: "الإيرادات",           label: "Revenue",            group: "finance", icon: "TrendingUp",      path: "/admin-panel/revenue",            enabled: true, isCore: false, order: 11, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "expenses",          labelAr: "المصروفات",           label: "Expenses",           group: "finance", icon: "Receipt",         path: "/admin-panel/expenses",           enabled: true, isCore: false, order: 12, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "cashflow",          labelAr: "التدفقات النقدية",   label: "Cash Flow",          group: "finance", icon: "ArrowRightLeft",  path: "/admin-panel/cashflow",           enabled: true, isCore: false, order: 13, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "financial-reports", labelAr: "التقارير المالية",   label: "Financial Reports",  group: "finance", icon: "FileText",        path: "/admin-panel/financial-reports",  enabled: true, isCore: false, order: 14, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "ai-finance",       labelAr: "تحليل AI المالي",    label: "AI Finance",         group: "finance", icon: "Brain",           path: "/admin-panel/ai-finance",         enabled: true, isCore: false, order: 15, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "finance",           labelAr: "الرواتب والمالية",   label: "Payroll",            group: "finance", icon: "Wallet",          path: "/admin-panel/finance",            enabled: true, isCore: false, order: 16, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "wallet",            labelAr: "محافظ السائقين",     label: "Driver Wallets",     group: "finance", icon: "Landmark",        path: "/admin-panel/wallet",             enabled: true, isCore: false, order: 17, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "reconciliation",   labelAr: "مطابقة مالية",       label: "Reconciliation",     group: "finance", icon: "GitCompare",      path: "/admin-panel/reconciliation",     enabled: true, isCore: false, order: 18, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "invoices",          labelAr: "الفواتير",            label: "Invoices",           group: "finance", icon: "FileCheck",       path: "/admin-panel/invoices",           enabled: true, isCore: false, order: 19, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "payouts",           labelAr: "إدارة الدفعات",      label: "Payouts",            group: "finance", icon: "CreditCard",      path: "/admin-panel/payouts",            enabled: true, isCore: false, order: 20, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "bank-alerts",      labelAr: "تنبيهات بنكية",      label: "Bank Alerts",        group: "finance", icon: "Landmark",        path: "/admin-panel/bank-alerts",        enabled: true, isCore: false, order: 21, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "finance-close",    labelAr: "الإغلاق اليومي",     label: "Finance Close",      group: "finance", icon: "Lock",            path: "/admin-panel/finance-close",      enabled: true, isCore: false, order: 22, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "monthly-report",   labelAr: "التقرير الشهري",     label: "Monthly Report",     group: "finance", icon: "FileText",        path: "/admin-panel/monthly-report",     enabled: true, isCore: false, order: 23, version: "1.0.0", requiredPermission: "finance", features: [] },
  { id: "reports",           labelAr: "التقارير",            label: "Reports",            group: "finance", icon: "BarChart3",       path: "/admin-panel/reports",            enabled: true, isCore: false, order: 24, version: "1.0.0", requiredPermission: "reports", features: [] },
  { id: "excel",             labelAr: "استيراد Excel",      label: "Excel Import",       group: "finance", icon: "FileSpreadsheet", path: "/admin-panel/excel",              enabled: true, isCore: false, order: 25, version: "1.0.0", requiredPermission: "excel", features: [] },

  // ── Assets & Staff ──
  { id: "vehicles",          labelAr: "المركبات",            label: "Vehicles",           group: "assets_staff", icon: "Car",        path: "/admin-panel/vehicles",          enabled: true, isCore: false, order: 30, version: "1.0.0", features: [] },
  { id: "staff",             labelAr: "الأقسام والموظفين",  label: "Staff",              group: "assets_staff", icon: "Building2",  path: "/admin-panel/staff",             enabled: true, isCore: false, order: 31, version: "1.0.0", features: [] },
  { id: "fleet",             labelAr: "إدارة الأسطول",      label: "Fleet",              group: "assets_staff", icon: "Truck",      path: "/admin-panel/fleet",             enabled: true, isCore: false, order: 32, version: "1.0.0", features: [] },
  { id: "fleet-assignments", labelAr: "تعيينات المركبات",   label: "Fleet Assignments",  group: "assets_staff", icon: "Link2",      path: "/admin-panel/fleet-assignments", enabled: true, isCore: false, order: 33, version: "1.0.0", features: [] },
  { id: "attendance",        labelAr: "الحضور والانصراف",   label: "Attendance",         group: "assets_staff", icon: "Clock",      path: "/admin-panel/attendance",        enabled: true, isCore: false, order: 34, version: "1.0.0", features: [] },

  // ── Drivers ──
  { id: "driver-applications", labelAr: "طلبات السائقين",    label: "Driver Applications", group: "drivers", icon: "Users",          path: "/admin-panel/driver-applications", enabled: true, isCore: false, order: 40, version: "1.0.0", features: [] },
  { id: "kyc",                 labelAr: "وثائق KYC",          label: "KYC Management",     group: "drivers", icon: "Shield",         path: "/admin-panel/kyc",                 enabled: true, isCore: false, order: 41, version: "1.0.0", features: [] },
  { id: "driver-training",    labelAr: "تدريب السائقين",     label: "Driver Training",    group: "drivers", icon: "GraduationCap",  path: "/admin-panel/driver-training",     enabled: true, isCore: false, order: 42, version: "1.0.0", features: [] },

  // ── System ──
  { id: "approvals",     labelAr: "الاعتمادات",       label: "Approvals",       group: "system", icon: "CheckCircle2",  path: "/admin-panel/approvals",     enabled: true, isCore: false, order: 50, version: "1.0.0", features: [] },
  { id: "tasks",         labelAr: "المهام",           label: "Tasks",           group: "system", icon: "ListTodo",      path: "/admin-panel/tasks",         enabled: true, isCore: false, order: 51, version: "1.0.0", features: [] },
  { id: "notifications", labelAr: "الإشعارات",       label: "Notifications",   group: "system", icon: "Bell",          path: "/admin-panel/notifications", enabled: true, isCore: false, order: 52, version: "1.0.0", features: [] },
  { id: "audit-log",    labelAr: "سجل التدقيق",     label: "Audit Log",       group: "system", icon: "ScrollText",    path: "/admin-panel/audit-log",     enabled: true, isCore: false, order: 53, version: "1.0.0", features: [] },
  { id: "email-logs",   labelAr: "سجل الإيميلات",   label: "Email Logs",      group: "system", icon: "Mail",          path: "/admin-panel/email-logs",    enabled: true, isCore: false, order: 54, version: "1.0.0", features: [] },
  { id: "risk",          labelAr: "إدارة المخاطر",   label: "Risk Management", group: "system", icon: "ShieldAlert",   path: "/admin-panel/risk",          enabled: true, isCore: false, order: 55, version: "1.0.0", features: [] },
  { id: "reactivation",  labelAr: "إعادة التفعيل",   label: "Reactivation",    group: "system", icon: "UserCheck",     path: "/admin-panel/reactivation",  enabled: true, isCore: false, order: 56, version: "1.0.0", features: [] },
  { id: "ai-reports",   labelAr: "تقارير AI",       label: "AI Reports",      group: "system", icon: "Sparkles",      path: "/admin-panel/ai-reports",    enabled: true, isCore: false, order: 57, version: "1.0.0", requiredPermission: "reports", features: [] },
  { id: "n8n-workflows", labelAr: "سير العمل (n8n)", label: "n8n Workflows",  group: "system", icon: "Zap",           path: "/admin-panel/n8n-workflows", enabled: true, isCore: false, order: 58, version: "1.0.0", features: [] },
  { id: "settings",      labelAr: "الإعدادات",       label: "Settings",        group: "system", icon: "Settings2",     path: "/admin-panel/settings",      enabled: true, isCore: true,  order: 59, version: "1.0.0", features: [] },
  { id: "pagebuilder",   labelAr: "منشئ الصفحات",   label: "Page Builder",    group: "system", icon: "LayoutDashboard", path: "/admin-panel/page-builder", enabled: true, isCore: true,  order: 60, version: "1.0.0", features: [] },

  // ── Governance (NEW) ──
  { id: "gov-permissions", labelAr: "إدارة الصلاحيات",    label: "Permissions",       group: "governance", icon: "Shield",        path: "/admin-panel/governance/permissions", enabled: true, isCore: false, order: 70, version: "1.0.0", features: [] },
  { id: "gov-features",   labelAr: "مفاتيح الميزات",      label: "Feature Toggles",   group: "governance", icon: "ToggleLeft",    path: "/admin-panel/governance/features",    enabled: true, isCore: false, order: 71, version: "1.0.0", features: [] },
  { id: "gov-workflows",  labelAr: "سير عمل الاعتماد",    label: "Workflow Builder",  group: "governance", icon: "GitBranch",     path: "/admin-panel/governance/workflows",   enabled: true, isCore: false, order: 72, version: "1.0.0", features: [] },
  { id: "gov-sla",        labelAr: "إعدادات SLA",         label: "SLA Config",        group: "governance", icon: "Timer",         path: "/admin-panel/governance/sla",         enabled: true, isCore: false, order: 73, version: "1.0.0", features: [] },
  { id: "gov-audit",      labelAr: "لوحة التدقيق",        label: "Audit Dashboard",   group: "governance", icon: "Eye",           path: "/admin-panel/governance/audit",       enabled: true, isCore: false, order: 74, version: "1.0.0", features: [] },

  // ── Infrastructure (NEW) ──
  { id: "infrastructure",  labelAr: "البنية التحتية",      label: "Infrastructure",    group: "infrastructure", icon: "Server",   path: "/admin-panel/governance/infrastructure", enabled: true, isCore: false, order: 80, version: "1.0.0", features: [] },
  { id: "api-management",  labelAr: "إدارة API والربط",    label: "API Management",    group: "infrastructure", icon: "Plug",     path: "/admin-panel/governance/api",            enabled: true, isCore: false, order: 81, version: "1.0.0", features: [] },
];

/**
 * Convert module definitions back to PageConfig format for backward compatibility
 * with the existing Sidebar and PageBuilder
 */
export function toPageConfig(modules: ModuleDefinition[]) {
  return modules.map((m) => ({
    id: m.id,
    label: m.labelAr,
    path: m.path,
    group: GROUP_LABELS[m.group] || m.group,
    icon: m.icon,
    enabled: m.enabled,
    order: m.order,
    permission: m.requiredPermission,
    isCore: m.isCore,
  }));
}
