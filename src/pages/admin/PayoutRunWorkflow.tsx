/**
 * سير عمل الدفعة — Payout Run 5-Stage Approval Workflow
 * Finance Review → Ops → Fleet → HR → Finance Final + STC Bank Excel
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import {
  GitBranch, CheckCircle2, XCircle, Clock, AlertTriangle,
  Download, FileSpreadsheet, Users, Truck, Building2, DollarSign,
  ChevronLeft, Play, Ban, Shield, Loader2, Eye, ArrowDown,
} from "lucide-react";
import {
  PageWrapper, PageHeader, Card, KPIGrid, KPICard, Badge,
  Button, Table, Modal, TextArea,
} from "@/components/admin/ui";
import { usePayoutWorkflowStore, STAGE_DEFS, type PayoutStage } from "@/stores/usePayoutWorkflowStore";
import { toast } from "sonner";

// ─── Stage Icons & Colors ───────────────────────────────────────────────────
const STAGE_META: Record<number, { icon: React.ElementType; color: string }> = {
  1: { icon: DollarSign, color: "var(--con-success)" },
  2: { icon: Users,      color: "var(--con-brand)" },
  3: { icon: Truck,      color: "var(--con-info)" },
  4: { icon: Building2,  color: "var(--con-warning)" },
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
function StageStepper({ stages, currentStage }: { stages: PayoutStage[]; currentStage: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "16px 0" }}>
      {stages.map((s, idx) => {
        const meta = STAGE_META[s.stage];
        const Icon = meta.icon;
        const isActive = s.stage === currentStage;
        const isDone = s.status === "approved";
        const isRejected = s.status === "rejected";
        const circleColor = isRejected ? "var(--con-danger)" : isDone ? "var(--con-success)" : isActive ? "var(--con-info)" : "var(--con-bg-elevated)";
        const borderColor = isRejected ? "var(--con-danger)" : isDone ? "var(--con-success)" : isActive ? "var(--con-info)" : "var(--con-border-default)";

        return (
          <div key={s.stage} style={{ display: "flex", alignItems: "center" }}>
            {/* Circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 80 }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: circleColor,
                  border: `2px solid ${borderColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s",
                }}
              >
                {isDone ? <CheckCircle2 size={18} style={{ color: "#fff" }} /> :
                 isRejected ? <XCircle size={18} style={{ color: "#fff" }} /> :
                 isActive ? <Loader2 size={16} style={{ color: "#fff", animation: "spin 2s linear infinite" }} /> :
                 <Icon size={16} style={{ color: "var(--con-text-muted)" }} />}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? "var(--con-text-primary)" : "var(--con-text-muted)" }}>
                  {s.label_ar}
                </div>
                <div style={{ fontSize: 9, color: STATUS_COLORS[s.status], fontWeight: 600 }}>
                  {s.status === "approved" ? "معتمد" : s.status === "rejected" ? "مرفوض" : s.status === "in_review" ? "قيد المراجعة" : "بانتظار"}
                </div>
              </div>
            </div>
            {/* Connector line */}
            {idx < stages.length - 1 && (
              <div style={{ width: 40, height: 2, background: isDone ? "var(--con-success)" : "var(--con-border-default)", margin: "0 4px", marginBottom: 30 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Review Panel: Finance Review (Stage 1) ─────────────────────────────────
function FinanceReviewPanel() {
  const { drivers, getStageSummary, getStageErrors, getStageWarnings } = usePayoutWorkflowStore();
  const summary = getStageSummary(1) as any;
  const errors = getStageErrors(1);
  const warnings = getStageWarnings(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIGrid cols="repeat(5, 1fr)">
        <KPICard label="عدد السائقين" value={summary.totalDrivers || 0} icon={Users} accent="var(--con-brand)" />
        <KPICard label="إجمالي الأرباح" value={formatSAR(summary.totalGross || 0)} icon={DollarSign} accent="var(--con-success)" mono={false} />
        <KPICard label="إجمالي الإضافات" value={formatSAR(summary.totalAdditions || 0)} icon={DollarSign} accent="var(--con-info)" mono={false} />
        <KPICard label="إجمالي الخصومات" value={formatSAR(summary.totalDeductions || 0)} icon={DollarSign} accent="var(--con-danger)" mono={false} />
        <KPICard label="صافي الدفعة" value={formatSAR(summary.totalNet || 0)} icon={DollarSign} accent="var(--con-brand)" mono={false} />
      </KPIGrid>

      {errors.length > 0 && (
        <Card title={`أخطاء تمنع الاعتماد (${errors.length})`} style={{ borderColor: "var(--con-danger)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {errors.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: "var(--con-radius-sm)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <XCircle size={13} style={{ color: "var(--con-danger)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--con-danger)" }}>{e.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="تفاصيل السائقين" noPadding>
        <Table headers={["السائق", "المنصة", "الإجمالي", "إضافات", "خصومات", "عمولة FLL", "الصافي", "STC Phone"]}>
          {drivers.map((d) => (
            <tr key={d.id}>
              <td>
                <div style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>{d.driver_name}</div>
                <div style={{ fontSize: 10, color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)" }}>{d.contract_type}</div>
              </td>
              <td><Badge variant="brand">{d.platform}</Badge></td>
              <td style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>{formatSAR(d.gross_earnings)}</td>
              <td style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-success)" }}>+{formatSAR(d.additions)}</td>
              <td style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-danger)" }}>-{formatSAR(d.deductions)}</td>
              <td style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-warning)" }}>-{formatSAR(d.fll_commission)}</td>
              <td style={{ fontFamily: "var(--con-font-mono)", fontWeight: 700, color: "var(--con-text-primary)" }}>{formatSAR(d.net_payout)}</td>
              <td style={{ fontFamily: "var(--con-font-mono)", fontSize: 11, color: d.stc_bank_phone ? "var(--con-text-muted)" : "var(--con-danger)" }}>
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
  const { drivers, getStageSummary, getStageWarnings } = usePayoutWorkflowStore();
  const summary = getStageSummary(2) as any;
  const warnings = getStageWarnings(2);
  const platforms = [...new Set(drivers.map((d) => d.platform))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIGrid cols="repeat(3, 1fr)">
        <KPICard label="سائقين نشطين" value={summary.active || 0} icon={Users} accent="var(--con-success)" />
        <KPICard label="غير نشطين (في الدفعة)" value={summary.inactive || 0} icon={Users} accent="var(--con-danger)" />
        <KPICard label="منصات مشاركة" value={summary.platforms || 0} icon={Truck} accent="var(--con-brand)" />
      </KPIGrid>

      {warnings.length > 0 && (
        <Card title={`تحذيرات (${warnings.length})`}>
          {warnings.map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: "var(--con-radius-sm)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: 4 }}>
              <AlertTriangle size={13} style={{ color: "var(--con-warning)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--con-warning)" }}>{w.message}</span>
            </div>
          ))}
        </Card>
      )}

      <Card title="توزيع المنصات">
        {platforms.map((p) => {
          const count = drivers.filter((d) => d.platform === p).length;
          const total = drivers.filter((d) => d.platform === p).reduce((s, d) => s + d.net_payout, 0);
          return (
            <div key={p} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--con-border-default)" }}>
              <span style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>{p}</span>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 12, color: "var(--con-text-muted)" }}>{count} سائق</span>
                <span style={{ fontSize: 12, fontFamily: "var(--con-font-mono)", color: "var(--con-brand)" }}>{formatSAR(total)}</span>
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
  const { drivers, getStageSummary, getStageWarnings } = usePayoutWorkflowStore();
  const summary = getStageSummary(3) as any;
  const warnings = getStageWarnings(3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIGrid cols="repeat(2, 1fr)">
        <KPICard label="بمركبة مسجلة" value={summary.withVehicle || 0} icon={Truck} accent="var(--con-success)" />
        <KPICard label="بدون مركبة" value={summary.withoutVehicle || 0} icon={Truck} accent="var(--con-danger)" />
      </KPIGrid>
      {warnings.length > 0 && (
        <Card title={`تنبيهات الأسطول (${warnings.length})`}>
          {warnings.map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: "var(--con-radius-sm)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: 4 }}>
              <AlertTriangle size={13} style={{ color: "var(--con-warning)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--con-warning)" }}>{w.message}</span>
            </div>
          ))}
        </Card>
      )}
      <Card title="توزيع نوع التعاقد">
        {[...new Set(drivers.map((d) => d.contract_type))].map((ct) => (
          <div key={ct} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--con-border-default)" }}>
            <span style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>{ct}</span>
            <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-muted)" }}>{drivers.filter((d) => d.contract_type === ct).length} سائق</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Review Panel: HR (Stage 4) ─────────────────────────────────────────────
function HRReviewPanel() {
  const { drivers, getStageSummary, getStageWarnings } = usePayoutWorkflowStore();
  const summary = getStageSummary(4) as any;
  const warnings = getStageWarnings(4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIGrid cols="repeat(2, 1fr)">
        <KPICard label="KYC مكتمل" value={summary.kycComplete || 0} icon={Shield} accent="var(--con-success)" />
        <KPICard label="KYC ناقص" value={summary.kycIncomplete || 0} icon={Shield} accent="var(--con-danger)" />
      </KPIGrid>
      {warnings.length > 0 && (
        <Card title={`تنبيهات الموارد البشرية (${warnings.length})`}>
          {warnings.map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: "var(--con-radius-sm)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: 4 }}>
              <AlertTriangle size={13} style={{ color: "var(--con-warning)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--con-warning)" }}>{w.message}</span>
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
  const validDrivers = drivers.filter((d) => d.stc_bank_phone && d.net_payout > 0 && d.is_active);

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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 12, borderRadius: "var(--con-radius)", background: "var(--con-bg-surface-2)", border: "1px solid var(--con-border-default)" }}>
            <div style={{ fontSize: 11, color: "var(--con-text-muted)", marginBottom: 4 }}>إجمالي الدفعة</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--con-font-mono)", color: "var(--con-text-primary)" }}>{formatSAR(totalNet)}</div>
          </div>
          <div style={{ padding: 12, borderRadius: "var(--con-radius)", background: "var(--con-bg-surface-2)", border: "1px solid var(--con-border-default)" }}>
            <div style={{ fontSize: 11, color: "var(--con-text-muted)", marginBottom: 4 }}>سائقين مؤهلين لـ STC</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--con-font-mono)", color: "var(--con-brand)" }}>{validDrivers.length} / {drivers.length}</div>
          </div>
        </div>
      </Card>

      {/* Approval Chain */}
      <Card title="سلسلة الموافقات">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {stages.filter((s) => s.stage < 5).map((s) => (
            <div key={s.stage} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "var(--con-radius-sm)", background: "var(--con-bg-surface-2)", border: "1px solid var(--con-border-default)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {s.status === "approved" ? <CheckCircle2 size={14} style={{ color: "var(--con-success)" }} /> : <Clock size={14} style={{ color: "var(--con-text-muted)" }} />}
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--con-text-primary)" }}>{s.label_ar}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {s.decided_by && <span style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{s.decided_by}</span>}
                {s.decided_at && <span style={{ fontSize: 10, fontFamily: "var(--con-font-mono)", color: "var(--con-text-disabled)" }}>{new Date(s.decided_at).toLocaleString("ar-SA")}</span>}
                <Badge variant={s.status === "approved" ? "success" : s.status === "rejected" ? "danger" : "muted"}>
                  {s.status === "approved" ? "معتمد" : s.status === "rejected" ? "مرفوض" : "بانتظار"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* STC Excel Generation */}
      <Card title="ملف STC Bank Excel" subtitle="توليد ملف التحويلات البنكية">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ padding: 12, borderRadius: "var(--con-radius)", background: "rgba(14,212,197,0.06)", border: "1px solid var(--con-border-brand)" }}>
            <div style={{ fontSize: 12, color: "var(--con-text-secondary)", lineHeight: 1.8 }}>
              سيتم إنشاء ملف Excel بالتنسيق المطلوب لـ STC Bank:
              <br />• <strong>العمود A</strong>: Reference (اسم السائق - المنصة - نوع التعاقد)
              <br />• <strong>العمود B</strong>: Telephone (966XXXXXXXXX)
              <br />• <strong>العمود C</strong>: Amount (المبلغ الصافي)
              <br />• <strong>عدد الصفوف</strong>: {validDrivers.length} سائق
              <br />• <strong>إجمالي المبلغ</strong>: {formatSAR(validDrivers.reduce((s, d) => s + d.net_payout, 0))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={generating ? Loader2 : FileSpreadsheet} onClick={handleGenerate} disabled={generating}>
              {generating ? "جارٍ الإنشاء..." : "إنشاء ملف STC Bank"}
            </Button>
            {batch?.stc_excel_url && (
              <Button variant="ghost" icon={Download} onClick={() => window.open(batch.stc_excel_url, "_blank")}>
                تنزيل الملف
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function PayoutRunWorkflow() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { batch, stages, loading, initBatch, advanceStage, rejectStage, reset } = usePayoutWorkflowStore();
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    initBatch(batchId);
    return () => reset();
  }, [batchId, initBatch, reset]);

  const currentStage = batch?.current_stage || 1;
  const currentStageDef = stages[currentStage - 1];
  const hasErrors = usePayoutWorkflowStore.getState().getStageErrors(currentStage).length > 0;

  const handleApprove = () => {
    advanceStage(undefined, user?.full_name || "admin");
    toast.success(`تم اعتماد: ${currentStageDef?.label_ar}`);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.error("يجب كتابة سبب الرفض"); return; }
    rejectStage(rejectReason, user?.full_name || "admin");
    setRejectModal(false);
    setRejectReason("");
    toast.error("تم الرفض — أُعيد للمالية للمراجعة");
  };

  if (loading || !batch) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <Loader2 size={32} style={{ color: "var(--con-brand)", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
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
          <Button variant="ghost" icon={ChevronLeft} onClick={() => navigate("/admin-panel/payouts")}>
            العودة للدفعات
          </Button>
        }
      />

      {/* Stage Stepper */}
      <Card>
        <StageStepper stages={stages} currentStage={currentStage} />
      </Card>

      {/* Stage Content */}
      {currentStage === 1 && <FinanceReviewPanel />}
      {currentStage === 2 && <OpsReviewPanel />}
      {currentStage === 3 && <FleetReviewPanel />}
      {currentStage === 4 && <HRReviewPanel />}
      {currentStage === 5 && <FinanceFinalPanel />}

      {/* Action Bar */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: "var(--con-text-secondary)" }}>
            المرحلة الحالية: <strong style={{ color: "var(--con-text-primary)" }}>{currentStageDef?.label_ar}</strong>
            {hasErrors && currentStage === 1 && (
              <span style={{ color: "var(--con-danger)", marginRight: 12 }}>
                — يوجد أخطاء تمنع الاعتماد
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {currentStage <= 5 && (
              <>
                <Button variant="danger" icon={Ban} onClick={() => setRejectModal(true)}>
                  رفض
                </Button>
                <Button
                  icon={currentStage === 5 ? CheckCircle2 : Play}
                  onClick={handleApprove}
                  disabled={hasErrors && currentStage === 1}
                >
                  {currentStage === 5 ? "اعتماد نهائي وتجميد" : "اعتماد والانتقال للمرحلة التالية"}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        open={rejectModal}
        onClose={() => setRejectModal(false)}
        title="رفض المرحلة"
        width={420}
        actions={
          <>
            <Button variant="danger" onClick={handleReject}>تأكيد الرفض</Button>
            <Button variant="ghost" onClick={() => setRejectModal(false)}>إلغاء</Button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: "var(--con-text-secondary)", marginBottom: 12 }}>
          سيتم إرجاع الدفعة للمالية (المرحلة 1) للمراجعة. اكتب سبب الرفض:
        </p>
        <TextArea value={rejectReason} onChange={setRejectReason} placeholder="سبب الرفض..." rows={3} />
      </Modal>
    </PageWrapper>
  );
}
