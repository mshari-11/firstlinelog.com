/**
 * سير عمل الدفعة — Payout Run 5-Stage Approval Workflow
 * Finance Review → Ops → Fleet → HR → Finance Final + STC Bank Excel
 * + 3-Stage Approval Workflow (المالية → العمليات → الإدارة العامة)
 * + Salary Breakdown, Payslip Generation, Bank File Export
 */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import {
  GitBranch,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Users,
  Truck,
  Building2,
  DollarSign,
  ChevronLeft,
  Play,
  Ban,
  Shield,
  Loader2,
  Eye,
  ArrowDown,
  ClipboardList,
  Printer,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  Card,
  KPIGrid,
  KPICard,
  Badge,
  Button,
  Table,
  Modal,
  TextArea,
} from "@/components/admin/ui";
import {
  usePayoutWorkflowStore,
  STAGE_DEFS,
  type PayoutStage,
  type DriverPayoutLine,
} from "@/stores/usePayoutWorkflowStore";
import { toast } from "sonner";
import { exportToExcel, printReport } from "@/lib/exportUtils";
import { supabase } from "@/lib/supabase";

// ─── 3-Stage Approval Workflow Definition ───────────────────────────────────
const APPROVAL_STAGES = [
  { id: 1, name: "إعداد المالية", department: "المالية", icon: "DollarSign" },
  { id: 2, name: "مراجعة العمليات", department: "العمليات", icon: "ClipboardList" },
  { id: 3, name: "اعتماد نهائي", department: "الإدارة العامة", icon: "Shield" },
] as const;

const APPROVAL_ICON_MAP: Record<string, React.ElementType> = {
  DollarSign,
  ClipboardList,
  Shield,
};

interface ApprovalRecord {
  stageId: number;
  status: "pending" | "approved" | "rejected" | "revision";
  approverName?: string;
  approvedAt?: string;
  rejectReason?: string;
}

// ─── Mock deduction breakdown per driver (for tooltip) ─────────────────────
const MOCK_DEDUCTION_BREAKDOWN: Record<string, { label: string; amount: number }[]> = {
  "d1": [
    { label: "غياب", amount: 400 },
    { label: "مخالفات", amount: 300 },
    { label: "صيانة", amount: 320 },
    { label: "سلف", amount: 200 },
  ],
  "d2": [
    { label: "غياب", amount: 200 },
    { label: "مخالفات", amount: 150 },
    { label: "صيانة", amount: 444 },
    { label: "سلف", amount: 300 },
  ],
  "d3": [
    { label: "غياب", amount: 176 },
    { label: "مخالفات", amount: 200 },
    { label: "صيانة", amount: 200 },
    { label: "سلف", amount: 200 },
  ],
  "d4": [
    { label: "غياب", amount: 354 },
    { label: "مخالفات", amount: 400 },
    { label: "صيانة", amount: 350 },
    { label: "سلف", amount: 350 },
  ],
  "d5": [
    { label: "غياب", amount: 172 },
    { label: "مخالفات", amount: 100 },
    { label: "صيانة", amount: 150 },
    { label: "سلف", amount: 150 },
  ],
  "d6": [
    { label: "غياب", amount: 262 },
    { label: "مخالفات", amount: 300 },
    { label: "صيانة", amount: 350 },
    { label: "سلف", amount: 350 },
  ],
};

// ─── Mock order counts per driver ──────────────────────────────────────────
const MOCK_ORDER_COUNTS: Record<string, number> = {
  "d1": 142,
  "d2": 98,
  "d3": 76,
  "d4": 163,
  "d5": 51,
  "d6": 121,
};

// ─── Stage Icons & Colors ───────────────────────────────────────────────────
const STAGE_META: Record<number, { icon: React.ElementType; color: string }> = {
  1: { icon: DollarSign, color: "var(--con-success)" },
  2: { icon: Users, color: "var(--con-brand)" },
  3: { icon: Truck, color: "var(--con-info)" },
  4: { icon: Building2, color: "var(--con-warning)" },
  5: { icon: DollarSign, color: "#8B5CF6" },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--con-text-muted)",
  in_review: "var(--con-info)",
  approved: "var(--con-success)",
  rejected: "var(--con-danger)",
};

function formatSAR(n: number): string {
  return `${n.toLocaleString("ar-SA")} ر.س`;
}

// ─── Stage Stepper ──────────────────────────────────────────────────────────
function StageStepper({
  stages,
  currentStage,
}: {
  stages: PayoutStage[];
  currentStage: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "16px 0",
      }}
    >
      {stages.map((s, idx) => {
        const meta = STAGE_META[s.stage];
        const Icon = meta.icon;
        const isActive = s.stage === currentStage;
        const isDone = s.status === "approved";
        const isRejected = s.status === "rejected";
        const circleColor = isRejected
          ? "var(--con-danger)"
          : isDone
            ? "var(--con-success)"
            : isActive
              ? "var(--con-info)"
              : "var(--con-bg-elevated)";
        const borderColor = isRejected
          ? "var(--con-danger)"
          : isDone
            ? "var(--con-success)"
            : isActive
              ? "var(--con-info)"
              : "var(--con-border-default)";

        return (
          <div key={s.stage} style={{ display: "flex", alignItems: "center" }}>
            {/* Circle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                minWidth: 80,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: circleColor,
                  border: `2px solid ${borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s",
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={18} style={{ color: "#fff" }} />
                ) : isRejected ? (
                  <XCircle size={18} style={{ color: "#fff" }} />
                ) : isActive ? (
                  <Loader2
                    size={16}
                    style={{
                      color: "#fff",
                      animation: "spin 2s linear infinite",
                    }}
                  />
                ) : (
                  <Icon size={16} style={{ color: "var(--con-text-muted)" }} />
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive
                      ? "var(--con-text-primary)"
                      : "var(--con-text-muted)",
                  }}
                >
                  {s.label_ar}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: STATUS_COLORS[s.status],
                    fontWeight: 600,
                  }}
                >
                  {s.status === "approved"
                    ? "معتمد"
                    : s.status === "rejected"
                      ? "مرفوض"
                      : s.status === "in_review"
                        ? "قيد المراجعة"
                        : "بانتظار"}
                </div>
              </div>
            </div>
            {/* Connector line */}
            {idx < stages.length - 1 && (
              <div
                style={{
                  width: 40,
                  height: 2,
                  background: isDone
                    ? "var(--con-success)"
                    : "var(--con-border-default)",
                  margin: "0 4px",
                  marginBottom: 30,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 3-Stage Approval Stepper (Visual) ─────────────────────────────────────
function ApprovalStageStepper({
  approvals,
}: {
  approvals: ApprovalRecord[];
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 0,
        padding: "20px 0 12px",
      }}
    >
      {APPROVAL_STAGES.map((stage, idx) => {
        const record = approvals.find((a) => a.stageId === stage.id);
        const status = record?.status || "pending";
        const Icon = APPROVAL_ICON_MAP[stage.icon] || DollarSign;
        const isDone = status === "approved";
        const isRejected = status === "rejected";
        const isRevision = status === "revision";
        const isCurrent =
          !isDone &&
          !isRejected &&
          !isRevision &&
          (idx === 0 || approvals.find((a) => a.stageId === stage.id - 1)?.status === "approved");

        const circleColor = isDone
          ? "var(--con-success)"
          : isRejected
            ? "var(--con-danger)"
            : isRevision
              ? "var(--con-warning)"
              : isCurrent
                ? "var(--con-brand)"
                : "var(--con-bg-elevated)";
        const borderColor = isDone
          ? "var(--con-success)"
          : isRejected
            ? "var(--con-danger)"
            : isRevision
              ? "var(--con-warning)"
              : isCurrent
                ? "var(--con-brand)"
                : "var(--con-border-default)";

        return (
          <div key={stage.id} style={{ display: "flex", alignItems: "flex-start" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                minWidth: 120,
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: circleColor,
                  border: `2.5px solid ${borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s",
                  boxShadow: isCurrent ? `0 0 12px ${borderColor}40` : "none",
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={22} style={{ color: "#fff" }} />
                ) : isRejected ? (
                  <XCircle size={22} style={{ color: "#fff" }} />
                ) : isRevision ? (
                  <RotateCcw size={18} style={{ color: "#fff" }} />
                ) : isCurrent ? (
                  <Icon size={20} style={{ color: "#fff" }} />
                ) : (
                  <Icon size={18} style={{ color: "var(--con-text-muted)" }} />
                )}
              </div>
              {/* Label */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isCurrent || isDone
                      ? "var(--con-text-primary)"
                      : "var(--con-text-muted)",
                  }}
                >
                  {stage.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--con-text-muted)",
                    marginTop: 2,
                  }}
                >
                  {stage.department}
                </div>
                {record?.approverName && (
                  <div style={{ fontSize: 10, color: "var(--con-brand)", marginTop: 2, fontWeight: 600 }}>
                    {record.approverName}
                  </div>
                )}
                {record?.approvedAt && (
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--con-text-disabled)",
                      fontFamily: "var(--con-font-mono)",
                      marginTop: 1,
                    }}
                  >
                    {new Date(record.approvedAt).toLocaleDateString("ar-SA")}
                  </div>
                )}
                {/* Status badge */}
                <div style={{ marginTop: 4 }}>
                  <Badge
                    variant={
                      isDone
                        ? "success"
                        : isRejected
                          ? "danger"
                          : isRevision
                            ? "warning"
                            : isCurrent
                              ? "brand"
                              : "muted"
                    }
                  >
                    {isDone
                      ? "معتمد"
                      : isRejected
                        ? "مرفوض"
                        : isRevision
                          ? "طلب تعديل"
                          : isCurrent
                            ? "قيد المراجعة"
                            : "بانتظار"}
                  </Badge>
                </div>
              </div>
            </div>
            {/* Connector */}
            {idx < APPROVAL_STAGES.length - 1 && (
              <div
                style={{
                  width: 60,
                  height: 3,
                  background: isDone
                    ? "var(--con-success)"
                    : "var(--con-border-default)",
                  marginTop: 23,
                  borderRadius: 2,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Approval Actions Panel ────────────────────────────────────────────────
function ApprovalActionsPanel({
  approvals,
  onApprove,
  onReject,
  onRequestRevision,
}: {
  approvals: ApprovalRecord[];
  onApprove: () => void;
  onReject: () => void;
  onRequestRevision: () => void;
}) {
  // Find current approval stage
  const currentApproval = APPROVAL_STAGES.find((stage) => {
    const record = approvals.find((a) => a.stageId === stage.id);
    if (!record || record.status === "pending") {
      // Check if previous is approved (or this is stage 1)
      if (stage.id === 1) return true;
      const prev = approvals.find((a) => a.stageId === stage.id - 1);
      return prev?.status === "approved";
    }
    return false;
  });

  if (!currentApproval) return null;

  return (
    <Card title={`إجراءات الاعتماد — ${currentApproval.name}`}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 13, color: "var(--con-text-secondary)" }}>
          المرحلة الحالية:{" "}
          <strong style={{ color: "var(--con-text-primary)" }}>
            {currentApproval.name}
          </strong>{" "}
          — {currentApproval.department}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {currentApproval.id > 1 && (
            <Button variant="ghost" icon={RotateCcw} onClick={onRequestRevision}>
              طلب تعديل
            </Button>
          )}
          <Button variant="danger" icon={Ban} onClick={onReject}>
            رفض
          </Button>
          <Button icon={CheckCircle2} onClick={onApprove}>
            اعتماد
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Deduction Tooltip ─────────────────────────────────────────────────────
function DeductionTooltip({
  driverId,
  totalDeductions,
}: {
  driverId: string;
  totalDeductions: number;
}) {
  const [show, setShow] = useState(false);
  const breakdown = MOCK_DEDUCTION_BREAKDOWN[driverId] || [];

  return (
    <div
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        style={{
          fontFamily: "var(--con-font-mono)",
          color: "var(--con-danger)",
        }}
      >
        -{formatSAR(totalDeductions)}
      </span>
      <Info
        size={12}
        style={{ color: "var(--con-text-muted)", cursor: "pointer" }}
      />
      {show && breakdown.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            insetInlineStart: 0,
            zIndex: 50,
            minWidth: 200,
            padding: 10,
            borderRadius: "var(--con-radius)",
            background: "var(--con-bg-surface)",
            border: "1px solid var(--con-border-default)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            marginTop: 4,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--con-text-primary)", marginBottom: 6 }}>
            تفصيل الخصومات
          </div>
          {breakdown.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                fontSize: 11,
                color: "var(--con-text-secondary)",
                borderBottom: i < breakdown.length - 1 ? "1px solid var(--con-border-default)" : "none",
              }}
            >
              <span>{item.label}</span>
              <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-danger)" }}>
                -{formatSAR(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Salary Breakdown Section ──────────────────────────────────────────────
function SalaryBreakdownSection({
  drivers,
  onGeneratePayslip,
}: {
  drivers: DriverPayoutLine[];
  onGeneratePayslip: (driver: DriverPayoutLine) => void;
}) {
  const totalOrders = drivers.reduce((s, d) => s + (MOCK_ORDER_COUNTS[d.driver_id] || 0), 0);
  const totalGross = drivers.reduce((s, d) => s + d.gross_earnings, 0);
  const totalDeductions = drivers.reduce((s, d) => s + d.deductions, 0);
  const totalNet = drivers.reduce((s, d) => s + d.net_payout, 0);

  return (
    <Card title="كشف الرواتب التفصيلي" noPadding>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--con-bg-surface-2)",
                borderBottom: "2px solid var(--con-border-default)",
              }}
            >
              {["اسم المندوب", "عدد الطلبات", "الإيرادات الإجمالية", "الخصومات", "صافي المستحق", "كشف الراتب"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "var(--con-text-primary)",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr
                key={d.id}
                style={{
                  borderBottom: "1px solid var(--con-border-default)",
                }}
              >
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>
                    {d.driver_name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--con-text-muted)" }}>
                    {d.platform} · {d.contract_type}
                  </div>
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontFamily: "var(--con-font-mono)",
                    color: "var(--con-text-secondary)",
                    textAlign: "center",
                  }}
                >
                  {MOCK_ORDER_COUNTS[d.driver_id] || 0}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontFamily: "var(--con-font-mono)",
                    color: "var(--con-success)",
                  }}
                >
                  {formatSAR(d.gross_earnings)}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <DeductionTooltip driverId={d.driver_id} totalDeductions={d.deductions} />
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontFamily: "var(--con-font-mono)",
                    fontWeight: 700,
                    color: "var(--con-text-primary)",
                  }}
                >
                  {formatSAR(d.net_payout)}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <Button
                    variant="ghost"
                    icon={Printer}
                    onClick={() => onGeneratePayslip(d)}
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    إنشاء كشف راتب
                  </Button>
                </td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr
              style={{
                background: "var(--con-bg-surface-2)",
                borderTop: "2px solid var(--con-border-default)",
              }}
            >
              <td
                style={{
                  padding: "10px 14px",
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                }}
              >
                الإجمالي
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  fontFamily: "var(--con-font-mono)",
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  textAlign: "center",
                }}
              >
                {totalOrders}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  fontFamily: "var(--con-font-mono)",
                  fontWeight: 700,
                  color: "var(--con-success)",
                }}
              >
                {formatSAR(totalGross)}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  fontFamily: "var(--con-font-mono)",
                  fontWeight: 700,
                  color: "var(--con-danger)",
                }}
              >
                -{formatSAR(totalDeductions)}
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  fontFamily: "var(--con-font-mono)",
                  fontWeight: 700,
                  color: "var(--con-brand)",
                }}
              >
                {formatSAR(totalNet)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Review Panel: Finance Review (Stage 1) ─────────────────────────────────
function FinanceReviewPanel() {
  const { drivers, getStageSummary, getStageErrors, getStageWarnings } =
    usePayoutWorkflowStore();
  const summary = getStageSummary(1) as any;
  const errors = getStageErrors(1);
  const warnings = getStageWarnings(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIGrid cols="repeat(5, 1fr)">
        <KPICard
          label="عدد السائقين"
          value={summary.totalDrivers || 0}
          icon={Users}
          accent="var(--con-brand)"
        />
        <KPICard
          label="إجمالي الأرباح"
          value={formatSAR(summary.totalGross || 0)}
          icon={DollarSign}
          accent="var(--con-success)"
          mono={false}
        />
        <KPICard
          label="إجمالي الإضافات"
          value={formatSAR(summary.totalAdditions || 0)}
          icon={DollarSign}
          accent="var(--con-info)"
          mono={false}
        />
        <KPICard
          label="إجمالي الخصومات"
          value={formatSAR(summary.totalDeductions || 0)}
          icon={DollarSign}
          accent="var(--con-danger)"
          mono={false}
        />
        <KPICard
          label="صافي الدفعة"
          value={formatSAR(summary.totalNet || 0)}
          icon={DollarSign}
          accent="var(--con-brand)"
          mono={false}
        />
      </KPIGrid>

      {errors.length > 0 && (
        <Card
          title={`أخطاء تمنع الاعتماد (${errors.length})`}
          style={{ borderColor: "var(--con-danger)" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {errors.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: "var(--con-radius-sm)",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <XCircle
                  size={13}
                  style={{ color: "var(--con-danger)", flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: "var(--con-danger)" }}>
                  {e.message}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="تفاصيل السائقين" noPadding>
        <Table
          headers={[
            "السائق",
            "المنصة",
            "الإجمالي",
            "إضافات",
            "خصومات",
            "عمولة FLL",
            "الصافي",
            "STC Phone",
          ]}
        >
          {drivers.map((d) => (
            <tr key={d.id}>
              <td>
                <div
                  style={{ fontWeight: 600, color: "var(--con-text-primary)" }}
                >
                  {d.driver_name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--con-text-muted)",
                    fontFamily: "var(--con-font-mono)",
                  }}
                >
                  {d.contract_type}
                </div>
              </td>
              <td>
                <Badge variant="brand">{d.platform}</Badge>
              </td>
              <td
                style={{
                  fontFamily: "var(--con-font-mono)",
                  color: "var(--con-text-secondary)",
                }}
              >
                {formatSAR(d.gross_earnings)}
              </td>
              <td
                style={{
                  fontFamily: "var(--con-font-mono)",
                  color: "var(--con-success)",
                }}
              >
                +{formatSAR(d.additions)}
              </td>
              <td
                style={{
                  fontFamily: "var(--con-font-mono)",
                  color: "var(--con-danger)",
                }}
              >
                -{formatSAR(d.deductions)}
              </td>
              <td
                style={{
                  fontFamily: "var(--con-font-mono)",
                  color: "var(--con-warning)",
                }}
              >
                -{formatSAR(d.fll_commission)}
              </td>
              <td
                style={{
                  fontFamily: "var(--con-font-mono)",
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                }}
              >
                {formatSAR(d.net_payout)}
              </td>
              <td
                style={{
                  fontFamily: "var(--con-font-mono)",
                  fontSize: 11,
                  color: d.stc_bank_phone
                    ? "var(--con-text-muted)"
                    : "var(--con-danger)",
                }}
              >
                {d.stc_bank_phone || "غير مسجل"}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ─── Review Panel: Ops (Stage 2) ────────────────────────────────────────────
function OpsReviewPanel() {
  const { drivers, getStageSummary, getStageWarnings } =
    usePayoutWorkflowStore();
  const summary = getStageSummary(2) as any;
  const warnings = getStageWarnings(2);
  const platforms = [...new Set(drivers.map((d) => d.platform))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIGrid cols="repeat(3, 1fr)">
        <KPICard
          label="سائقين نشطين"
          value={summary.active || 0}
          icon={Users}
          accent="var(--con-success)"
        />
        <KPICard
          label="غير نشطين (في الدفعة)"
          value={summary.inactive || 0}
          icon={Users}
          accent="var(--con-danger)"
        />
        <KPICard
          label="منصات مشاركة"
          value={summary.platforms || 0}
          icon={Truck}
          accent="var(--con-brand)"
        />
      </KPIGrid>

      {warnings.length > 0 && (
        <Card title={`تحذيرات (${warnings.length})`}>
          {warnings.map((w, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: "var(--con-radius-sm)",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                marginBottom: 4,
              }}
            >
              <AlertTriangle
                size={13}
                style={{ color: "var(--con-warning)", flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, color: "var(--con-warning)" }}>
                {w.message}
              </span>
            </div>
          ))}
        </Card>
      )}

      <Card title="توزيع المنصات">
        {platforms.map((p) => {
          const count = drivers.filter((d) => d.platform === p).length;
          const total = drivers
            .filter((d) => d.platform === p)
            .reduce((s, d) => s + d.net_payout, 0);
          return (
            <div
              key={p}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--con-border-default)",
              }}
            >
              <span
                style={{ fontWeight: 600, color: "var(--con-text-primary)" }}
              >
                {p}
              </span>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 12, color: "var(--con-text-muted)" }}>
                  {count} سائق
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--con-font-mono)",
                    color: "var(--con-brand)",
                  }}
                >
                  {formatSAR(total)}
                </span>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── Review Panel: Fleet (Stage 3) ──────────────────────────────────────────
function FleetReviewPanel() {
  const { drivers, getStageSummary, getStageWarnings } =
    usePayoutWorkflowStore();
  const summary = getStageSummary(3) as any;
  const warnings = getStageWarnings(3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIGrid cols="repeat(2, 1fr)">
        <KPICard
          label="بمركبة مسجلة"
          value={summary.withVehicle || 0}
          icon={Truck}
          accent="var(--con-success)"
        />
        <KPICard
          label="بدون مركبة"
          value={summary.withoutVehicle || 0}
          icon={Truck}
          accent="var(--con-danger)"
        />
      </KPIGrid>
      {warnings.length > 0 && (
        <Card title={`تنبيهات الأسطول (${warnings.length})`}>
          {warnings.map((w, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: "var(--con-radius-sm)",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                marginBottom: 4,
              }}
            >
              <AlertTriangle
                size={13}
                style={{ color: "var(--con-warning)", flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, color: "var(--con-warning)" }}>
                {w.message}
              </span>
            </div>
          ))}
        </Card>
      )}
      <Card title="توزيع نوع التعاقد">
        {[...new Set(drivers.map((d) => d.contract_type))].map((ct) => (
          <div
            key={ct}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid var(--con-border-default)",
            }}
          >
            <span style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>
              {ct}
            </span>
            <span
              style={{
                fontFamily: "var(--con-font-mono)",
                color: "var(--con-text-muted)",
              }}
            >
              {drivers.filter((d) => d.contract_type === ct).length} سائق
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Review Panel: HR (Stage 4) ─────────────────────────────────────────────
function HRReviewPanel() {
  const { drivers, getStageSummary, getStageWarnings } =
    usePayoutWorkflowStore();
  const summary = getStageSummary(4) as any;
  const warnings = getStageWarnings(4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIGrid cols="repeat(2, 1fr)">
        <KPICard
          label="KYC مكتمل"
          value={summary.kycComplete || 0}
          icon={Shield}
          accent="var(--con-success)"
        />
        <KPICard
          label="KYC ناقص"
          value={summary.kycIncomplete || 0}
          icon={Shield}
          accent="var(--con-danger)"
        />
      </KPIGrid>
      {warnings.length > 0 && (
        <Card title={`تنبيهات الموارد البشرية (${warnings.length})`}>
          {warnings.map((w, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: "var(--con-radius-sm)",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                marginBottom: 4,
              }}
            >
              <AlertTriangle
                size={13}
                style={{ color: "var(--con-warning)", flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, color: "var(--con-warning)" }}>
                {w.message}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── Review Panel: Finance Final (Stage 5) ──────────────────────────────────
function FinanceFinalPanel() {
  const { batch, stages, drivers, generateStcExcel } = usePayoutWorkflowStore();
  const [generating, setGenerating] = useState(false);
  const totalNet = drivers.reduce((s, d) => s + d.net_payout, 0);
  const validDrivers = drivers.filter(
    (d) => d.stc_bank_phone && d.net_payout > 0 && d.is_active,
  );

  const handleGenerate = async () => {
    setGenerating(true);
    const url = await generateStcExcel();
    setGenerating(false);
    if (url) toast.success("تم إنشاء ملف STC Bank Excel");
    else toast.error("تعذّر إنشاء الملف — حاول مرة أخرى");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Final Summary */}
      <Card title="ملخص نهائي">
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: "var(--con-radius)",
              background: "var(--con-bg-surface-2)",
              border: "1px solid var(--con-border-default)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--con-text-muted)",
                marginBottom: 4,
              }}
            >
              إجمالي الدفعة
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                fontFamily: "var(--con-font-mono)",
                color: "var(--con-text-primary)",
              }}
            >
              {formatSAR(totalNet)}
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: "var(--con-radius)",
              background: "var(--con-bg-surface-2)",
              border: "1px solid var(--con-border-default)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--con-text-muted)",
                marginBottom: 4,
              }}
            >
              سائقين مؤهلين لـ STC
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                fontFamily: "var(--con-font-mono)",
                color: "var(--con-brand)",
              }}
            >
              {validDrivers.length} / {drivers.length}
            </div>
          </div>
        </div>
      </Card>

      {/* Approval Chain */}
      <Card title="سلسلة الموافقات">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {stages
            .filter((s) => s.stage < 5)
            .map((s) => (
              <div
                key={s.stage}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "var(--con-radius-sm)",
                  background: "var(--con-bg-surface-2)",
                  border: "1px solid var(--con-border-default)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {s.status === "approved" ? (
                    <CheckCircle2
                      size={14}
                      style={{ color: "var(--con-success)" }}
                    />
                  ) : (
                    <Clock
                      size={14}
                      style={{ color: "var(--con-text-muted)" }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--con-text-primary)",
                    }}
                  >
                    {s.label_ar}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {s.decided_by && (
                    <span
                      style={{ fontSize: 11, color: "var(--con-text-muted)" }}
                    >
                      {s.decided_by}
                    </span>
                  )}
                  {s.decided_at && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--con-font-mono)",
                        color: "var(--con-text-disabled)",
                      }}
                    >
                      {new Date(s.decided_at).toLocaleString("ar-SA")}
                    </span>
                  )}
                  <Badge
                    variant={
                      s.status === "approved"
                        ? "success"
                        : s.status === "rejected"
                          ? "danger"
                          : "muted"
                    }
                  >
                    {s.status === "approved"
                      ? "معتمد"
                      : s.status === "rejected"
                        ? "مرفوض"
                        : "بانتظار"}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* STC Excel Generation */}
      <Card title="ملف STC Bank Excel" subtitle="توليد ملف التحويلات البنكية">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              padding: 12,
              borderRadius: "var(--con-radius)",
              background: "rgba(14,212,197,0.06)",
              border: "1px solid var(--con-border-brand)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--con-text-secondary)",
                lineHeight: 1.8,
              }}
            >
              سيتم إنشاء ملف Excel بالتنسيق المطلوب لـ STC Bank:
              <br />• <strong>العمود A</strong>: Reference (اسم السائق - المنصة
              - نوع التعاقد)
              <br />• <strong>العمود B</strong>: Telephone (966XXXXXXXXX)
              <br />• <strong>العمود C</strong>: Amount (المبلغ الصافي)
              <br />• <strong>عدد الصفوف</strong>: {validDrivers.length} سائق
              <br />• <strong>إجمالي المبلغ</strong>:{" "}
              {formatSAR(validDrivers.reduce((s, d) => s + d.net_payout, 0))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button
              icon={generating ? Loader2 : FileSpreadsheet}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "جارٍ الإنشاء..." : "إنشاء ملف STC Bank"}
            </Button>
            {batch?.stc_excel_url && (
              <Button
                variant="ghost"
                icon={Download}
                onClick={() => window.open(batch.stc_excel_url, "_blank")}
              >
                تنزيل الملف
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Payslip Generator ─────────────────────────────────────────────────────
function generatePayslip(driver: DriverPayoutLine, batch: { period_start: string; period_end: string; batch_number: string }) {
  const breakdown = MOCK_DEDUCTION_BREAKDOWN[driver.driver_id] || [];
  const additions = driver.components_applied.filter((c) => c.type === "addition");
  const deductions = driver.components_applied.filter((c) => c.type === "deduction");

  const additionsTotal = additions.reduce((s, c) => s + c.amount, 0);
  const deductionsTotal = deductions.reduce((s, c) => s + c.amount, 0);

  const html = `
    <div style="max-width:700px;margin:0 auto;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;width:40%;border:1px solid #d1d5db;background:#f3f4f6;">اسم المندوب</td>
          <td style="padding:8px 12px;border:1px solid #d1d5db;">${driver.driver_name}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;border:1px solid #d1d5db;background:#f3f4f6;">رقم الهوية</td>
          <td style="padding:8px 12px;border:1px solid #d1d5db;">${driver.national_id}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;border:1px solid #d1d5db;background:#f3f4f6;">الفترة</td>
          <td style="padding:8px 12px;border:1px solid #d1d5db;">${batch.period_start} — ${batch.period_end}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;border:1px solid #d1d5db;background:#f3f4f6;">رقم الدفعة</td>
          <td style="padding:8px 12px;border:1px solid #d1d5db;">${batch.batch_number}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;border:1px solid #d1d5db;background:#f3f4f6;">المنصة</td>
          <td style="padding:8px 12px;border:1px solid #d1d5db;">${driver.platform}</td>
        </tr>
      </table>

      <h3 style="font-size:16px;color:#1e3a5f;margin:20px 0 10px;border-bottom:2px solid #3b82f6;padding-bottom:6px;">تفصيل الراتب</h3>

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:8px 12px;background:#3b82f6;color:#fff;text-align:right;border:1px solid #d1d5db;">البند</th>
            <th style="padding:8px 12px;background:#3b82f6;color:#fff;text-align:right;border:1px solid #d1d5db;">المبلغ (ر.س)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:8px 12px;border:1px solid #d1d5db;font-weight:600;">الراتب الأساسي (إجمالي الإيرادات)</td>
            <td style="padding:8px 12px;border:1px solid #d1d5db;font-family:monospace;">${driver.gross_earnings.toLocaleString("ar-SA")}</td>
          </tr>
          ${additions
            .map(
              (a) => `
          <tr style="background:#f0fdf4;">
            <td style="padding:8px 12px;border:1px solid #d1d5db;color:#16a34a;">+ ${a.name}</td>
            <td style="padding:8px 12px;border:1px solid #d1d5db;font-family:monospace;color:#16a34a;">+${a.amount.toLocaleString("ar-SA")}</td>
          </tr>`
            )
            .join("")}
          ${deductions
            .map(
              (d) => `
          <tr style="background:#fef2f2;">
            <td style="padding:8px 12px;border:1px solid #d1d5db;color:#dc2626;">- ${d.name}</td>
            <td style="padding:8px 12px;border:1px solid #d1d5db;font-family:monospace;color:#dc2626;">-${d.amount.toLocaleString("ar-SA")}</td>
          </tr>`
            )
            .join("")}
          ${breakdown
            .map(
              (b) => `
          <tr style="background:#fef2f2;">
            <td style="padding:8px 12px;border:1px solid #d1d5db;color:#dc2626;padding-right:24px;">- ${b.label}</td>
            <td style="padding:8px 12px;border:1px solid #d1d5db;font-family:monospace;color:#dc2626;">-${b.amount.toLocaleString("ar-SA")}</td>
          </tr>`
            )
            .join("")}
          <tr style="background:#eff6ff;font-weight:700;">
            <td style="padding:10px 12px;border:2px solid #3b82f6;font-size:15px;">صافي المستحق</td>
            <td style="padding:10px 12px;border:2px solid #3b82f6;font-family:monospace;font-size:15px;color:#1e3a5f;">${driver.net_payout.toLocaleString("ar-SA")} ر.س</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:30px;padding-top:20px;border-top:1px dashed #d1d5db;display:flex;justify-content:space-between;">
        <div style="text-align:center;">
          <div style="font-size:12px;color:#6b7280;">توقيع المندوب</div>
          <div style="margin-top:30px;border-bottom:1px solid #374151;width:150px;"></div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:12px;color:#6b7280;">توقيع المالية</div>
          <div style="margin-top:30px;border-bottom:1px solid #374151;width:150px;"></div>
        </div>
      </div>
    </div>
  `;

  printReport(`كشف راتب — ${driver.driver_name}`, html);
}

// ─── Bank File Export ──────────────────────────────────────────────────────
function exportBankFile(drivers: DriverPayoutLine[], batchNumber: string) {
  const rows = drivers
    .filter((d) => d.stc_bank_phone && d.net_payout > 0 && d.is_active)
    .map((d) => ({
      Reference: `${d.driver_name} - ${d.platform} - ${d.contract_type}`,
      Phone: d.stc_bank_phone.startsWith("966")
        ? d.stc_bank_phone
        : `966${d.stc_bank_phone.replace(/^0/, "")}`,
      Amount: d.net_payout,
    }));

  if (rows.length === 0) {
    toast.error("لا يوجد سائقين مؤهلين لتصدير ملف البنك");
    return;
  }

  exportToExcel(rows, `STC_Bank_${batchNumber}`, "STC Bank Transfer");
  toast.success(`تم تصدير ملف البنك — ${rows.length} سائق`);
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function PayoutRunWorkflow() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    batch,
    stages,
    drivers,
    loading,
    initBatch,
    advanceStage,
    rejectStage,
    reset,
  } = usePayoutWorkflowStore();
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [revisionModal, setRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");

  // 3-stage approval state
  const [approvals, setApprovals] = useState<ApprovalRecord[]>(
    APPROVAL_STAGES.map((s) => ({ stageId: s.id, status: "pending" }))
  );
  const [approvalRejectModal, setApprovalRejectModal] = useState(false);
  const [approvalRejectReason, setApprovalRejectReason] = useState("");

  useEffect(() => {
    initBatch(batchId);
    return () => reset();
  }, [batchId, initBatch, reset]);

  const currentStage = batch?.current_stage || 1;
  const currentStageDef = stages[currentStage - 1];
  const hasErrors =
    usePayoutWorkflowStore.getState().getStageErrors(currentStage).length > 0;

  // Find current approval stage ID
  const currentApprovalStageId = (() => {
    for (const stage of APPROVAL_STAGES) {
      const record = approvals.find((a) => a.stageId === stage.id);
      if (!record || record.status === "pending") {
        if (stage.id === 1) return stage.id;
        const prev = approvals.find((a) => a.stageId === stage.id - 1);
        if (prev?.status === "approved") return stage.id;
      }
    }
    return null;
  })();

  const handleApprove = () => {
    advanceStage(undefined, user?.full_name || "admin");
    toast.success(`تم اعتماد: ${currentStageDef?.label_ar}`);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("يجب كتابة سبب الرفض");
      return;
    }
    rejectStage(rejectReason, user?.full_name || "admin");
    setRejectModal(false);
    setRejectReason("");
    toast.error("تم الرفض — أُعيد للمالية للمراجعة");
  };

  // 3-stage approval handlers
  const handleApprovalApprove = () => {
    if (!currentApprovalStageId) return;
    setApprovals((prev) =>
      prev.map((a) =>
        a.stageId === currentApprovalStageId
          ? {
              ...a,
              status: "approved",
              approverName: user?.full_name || "admin",
              approvedAt: new Date().toISOString(),
            }
          : a
      )
    );
    const stageName = APPROVAL_STAGES.find((s) => s.id === currentApprovalStageId)?.name;
    toast.success(`تم اعتماد: ${stageName}`);

    // If all 3 approved, log to supabase
    const allApproved =
      approvals.filter((a) => a.status === "approved").length === APPROVAL_STAGES.length - 1;
    if (allApproved && supabase) {
      try {
        supabase
          .from("payout_approval_log" as any)
          .insert({
            batch_id: batchId || batch?.id,
            stage_id: currentApprovalStageId,
            action: "approved",
            decided_by: user?.full_name || "admin",
            decided_at: new Date().toISOString(),
          })
          .then(() => {});
      } catch {
        /* silent */
      }
    }
  };

  const handleApprovalReject = () => {
    if (!approvalRejectReason.trim()) {
      toast.error("يجب كتابة سبب الرفض");
      return;
    }
    if (!currentApprovalStageId) return;
    setApprovals((prev) =>
      prev.map((a) =>
        a.stageId === currentApprovalStageId
          ? { ...a, status: "rejected", rejectReason: approvalRejectReason }
          : a
      )
    );
    setApprovalRejectModal(false);
    setApprovalRejectReason("");
    toast.error("تم رفض المرحلة");
  };

  const handleRequestRevision = () => {
    if (!currentApprovalStageId || currentApprovalStageId <= 1) return;
    if (!revisionReason.trim()) {
      // Open modal to get reason
      setRevisionModal(true);
      return;
    }
    // Send back to previous stage
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.stageId === currentApprovalStageId)
          return { ...a, status: "revision", rejectReason: revisionReason };
        if (a.stageId === currentApprovalStageId - 1)
          return { ...a, status: "pending", approverName: undefined, approvedAt: undefined };
        return a;
      })
    );
    setRevisionModal(false);
    setRevisionReason("");
    toast.info("تم طلب التعديل — أُعيد للمرحلة السابقة");
  };

  const handleGeneratePayslip = (driver: DriverPayoutLine) => {
    if (!batch) return;
    generatePayslip(driver, batch);
    toast.success(`تم إنشاء كشف راتب: ${driver.driver_name}`);
  };

  const handleExportBankFile = () => {
    if (!batch) return;
    exportBankFile(drivers, batch.batch_number);
  };

  if (loading || !batch) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <Loader2
            size={32}
            style={{
              color: "var(--con-brand)",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "var(--con-text-muted)" }}>جارٍ تحميل الدفعة...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        icon={GitBranch}
        title="سير عمل الدفعة"
        subtitle={`${batch.batch_number} · ${batch.period_start} → ${batch.period_end} · ${batch.total_drivers} سائق`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="ghost"
              icon={FileSpreadsheet}
              onClick={handleExportBankFile}
            >
              تصدير ملف البنك
            </Button>
            <Button
              variant="ghost"
              icon={ChevronLeft}
              onClick={() => navigate("/admin-panel/payouts")}
            >
              العودة للدفعات
            </Button>
          </div>
        }
      />

      {/* 3-Stage Approval Stepper */}
      <Card title="مراحل الاعتماد">
        <ApprovalStageStepper approvals={approvals} />
      </Card>

      {/* Approval Actions */}
      <ApprovalActionsPanel
        approvals={approvals}
        onApprove={handleApprovalApprove}
        onReject={() => setApprovalRejectModal(true)}
        onRequestRevision={() => {
          if (!currentApprovalStageId || currentApprovalStageId <= 1) {
            toast.error("لا يمكن طلب تعديل من المرحلة الأولى");
            return;
          }
          setRevisionModal(true);
        }}
      />

      {/* 5-Stage Pipeline Stepper (existing) */}
      <Card title="مراحل المعالجة الداخلية">
        <StageStepper stages={stages} currentStage={currentStage} />
      </Card>

      {/* Stage Content */}
      {currentStage === 1 && <FinanceReviewPanel />}
      {currentStage === 2 && <OpsReviewPanel />}
      {currentStage === 3 && <FleetReviewPanel />}
      {currentStage === 4 && <HRReviewPanel />}
      {currentStage === 5 && <FinanceFinalPanel />}

      {/* Salary Breakdown Section */}
      <SalaryBreakdownSection
        drivers={drivers}
        onGeneratePayslip={handleGeneratePayslip}
      />

      {/* Action Bar */}
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--con-text-secondary)" }}>
            المرحلة الحالية:{" "}
            <strong style={{ color: "var(--con-text-primary)" }}>
              {currentStageDef?.label_ar}
            </strong>
            {hasErrors && currentStage === 1 && (
              <span style={{ color: "var(--con-danger)", marginRight: 12 }}>
                — يوجد أخطاء تمنع الاعتماد
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {currentStage <= 5 && (
              <>
                <Button
                  variant="danger"
                  icon={Ban}
                  onClick={() => setRejectModal(true)}
                >
                  رفض
                </Button>
                <Button
                  icon={currentStage === 5 ? CheckCircle2 : Play}
                  onClick={handleApprove}
                  disabled={hasErrors && currentStage === 1}
                >
                  {currentStage === 5
                    ? "اعتماد نهائي وتجميد"
                    : "اعتماد والانتقال للمرحلة التالية"}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Reject Modal (5-stage pipeline) */}
      <Modal
        open={rejectModal}
        onClose={() => setRejectModal(false)}
        title="رفض المرحلة"
        width={420}
        actions={
          <>
            <Button variant="danger" onClick={handleReject}>
              تأكيد الرفض
            </Button>
            <Button variant="ghost" onClick={() => setRejectModal(false)}>
              إلغاء
            </Button>
          </>
        }
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--con-text-secondary)",
            marginBottom: 12,
          }}
        >
          سيتم إرجاع الدفعة للمالية (المرحلة 1) للمراجعة. اكتب سبب الرفض:
        </p>
        <TextArea
          value={rejectReason}
          onChange={setRejectReason}
          placeholder="سبب الرفض..."
          rows={3}
        />
      </Modal>

      {/* Approval Reject Modal (3-stage approval) */}
      <Modal
        open={approvalRejectModal}
        onClose={() => setApprovalRejectModal(false)}
        title="رفض الاعتماد"
        width={420}
        actions={
          <>
            <Button variant="danger" onClick={handleApprovalReject}>
              تأكيد الرفض
            </Button>
            <Button variant="ghost" onClick={() => setApprovalRejectModal(false)}>
              إلغاء
            </Button>
          </>
        }
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--con-text-secondary)",
            marginBottom: 12,
          }}
        >
          سيتم رفض هذه المرحلة من الاعتماد. اكتب سبب الرفض:
        </p>
        <TextArea
          value={approvalRejectReason}
          onChange={setApprovalRejectReason}
          placeholder="سبب الرفض..."
          rows={3}
        />
      </Modal>

      {/* Revision Request Modal */}
      <Modal
        open={revisionModal}
        onClose={() => setRevisionModal(false)}
        title="طلب تعديل"
        width={420}
        actions={
          <>
            <Button icon={RotateCcw} onClick={handleRequestRevision}>
              تأكيد طلب التعديل
            </Button>
            <Button variant="ghost" onClick={() => setRevisionModal(false)}>
              إلغاء
            </Button>
          </>
        }
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--con-text-secondary)",
            marginBottom: 12,
          }}
        >
          سيتم إرجاع الدفعة للمرحلة السابقة لإجراء التعديلات المطلوبة. اكتب سبب طلب التعديل:
        </p>
        <TextArea
          value={revisionReason}
          onChange={setRevisionReason}
          placeholder="سبب طلب التعديل..."
          rows={3}
        />
      </Modal>
    </PageWrapper>
  );
}
