/**
 * Governance Types — Workflows, SLA, Approvals
 * Type definitions for the admin governance system
 */

// ─── Workflow Types ─────────────────────────────────────────────────────────
export interface ApprovalStep {
  role: string;
  roleAr: string;
  slaHours: number;
  escalateTo?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nameAr: string;
  triggerModule: string;
  triggerAction: string;
  approvalChain: ApprovalStep[];
  slaHours: number;
  isActive: boolean;
  createdAt: string;
}

// ─── SLA Types ──────────────────────────────────────────────────────────────
export type SLAUnit = "minutes" | "hours" | "days" | "percentage" | "count";

export interface EscalationRule {
  afterHours: number;
  notifyRole: string;
  notifyMethod: "email" | "sms" | "dashboard" | "all";
}

export interface SLARule {
  id: string;
  moduleId: string;
  metricName: string;
  metricNameAr: string;
  thresholdValue: number;
  thresholdUnit: SLAUnit;
  escalationChain: EscalationRule[];
  isActive: boolean;
}

// ─── Feature Toggle Types ───────────────────────────────────────────────────
export interface FeatureToggleEntry {
  id: string;
  moduleId: string;
  label: string;
  labelAr: string;
  enabled: boolean;
  scope: "global" | "role" | "user";
  updatedAt: string;
  updatedBy: string;
}

// ─── Audit Types ────────────────────────────────────────────────────────────
export type AuditAction = "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "APPROVE" | "REJECT" | "EXPORT" | "CONFIGURE";

export interface AuditEntry {
  id: string;
  schemaName: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  ipAddress?: string;
}

// ─── Default SLA Rules ──────────────────────────────────────────────────────
export const DEFAULT_SLA_RULES: SLARule[] = [
  {
    id: "sla-delivery-time",
    moduleId: "orders",
    metricName: "Average Delivery Time",
    metricNameAr: "متوسط وقت التوصيل",
    thresholdValue: 45,
    thresholdUnit: "minutes",
    escalationChain: [
      { afterHours: 1, notifyRole: "staff_operations", notifyMethod: "dashboard" },
      { afterHours: 4, notifyRole: "admin", notifyMethod: "email" },
    ],
    isActive: true,
  },
  {
    id: "sla-complaint-response",
    moduleId: "complaints",
    metricName: "Complaint Response Time",
    metricNameAr: "وقت استجابة الشكاوى",
    thresholdValue: 2,
    thresholdUnit: "hours",
    escalationChain: [
      { afterHours: 2, notifyRole: "staff_operations", notifyMethod: "dashboard" },
      { afterHours: 6, notifyRole: "admin", notifyMethod: "all" },
    ],
    isActive: true,
  },
  {
    id: "sla-approval-turnaround",
    moduleId: "approvals",
    metricName: "Approval Turnaround",
    metricNameAr: "وقت معالجة الاعتمادات",
    thresholdValue: 24,
    thresholdUnit: "hours",
    escalationChain: [
      { afterHours: 24, notifyRole: "owner", notifyMethod: "email" },
    ],
    isActive: true,
  },
  {
    id: "sla-ontime-delivery",
    moduleId: "orders",
    metricName: "On-time Delivery Rate",
    metricNameAr: "معدل التوصيل في الوقت",
    thresholdValue: 95,
    thresholdUnit: "percentage",
    escalationChain: [
      { afterHours: 12, notifyRole: "admin", notifyMethod: "dashboard" },
    ],
    isActive: true,
  },
];

// ─── Default Workflows ──────────────────────────────────────────────────────
export const DEFAULT_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "wf-payout-approval",
    name: "Payout Batch Approval",
    nameAr: "اعتماد دفعة الرواتب",
    triggerModule: "payouts",
    triggerAction: "approve",
    approvalChain: [
      { role: "staff_finance", roleAr: "موظف المالية", slaHours: 12 },
      { role: "owner", roleAr: "المالك", slaHours: 24, escalateTo: "admin" },
    ],
    slaHours: 36,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "wf-excel-import",
    name: "Excel Import Approval",
    nameAr: "اعتماد استيراد Excel",
    triggerModule: "excel",
    triggerAction: "create",
    approvalChain: [
      { role: "staff_finance", roleAr: "موظف المالية", slaHours: 6 },
    ],
    slaHours: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "wf-driver-approval",
    name: "Driver Application Approval",
    nameAr: "اعتماد طلب سائق",
    triggerModule: "driver-applications",
    triggerAction: "approve",
    approvalChain: [
      { role: "staff_hr", roleAr: "موارد بشرية", slaHours: 24 },
      { role: "admin", roleAr: "مدير النظام", slaHours: 48 },
    ],
    slaHours: 72,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];
