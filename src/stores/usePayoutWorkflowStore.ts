/**
 * Payout Workflow Store — Zustand
 * Manages 5-stage payout approval workflow, accounting components, STC Excel generation
 */
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE || "https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com";

// ─── Types ──────────────────────────────────────────────────────────────────
export type ComponentType = "addition" | "deduction";
export type CalcMethod = "fixed" | "percentage";
export type ScopeType = "all" | "contract_type" | "city" | "platform" | "driver";
export type StageStatus = "pending" | "in_review" | "approved" | "rejected" | "skipped";

export interface AccountingComponent {
  id: string;
  name_ar: string;
  name_en?: string;
  component_type: ComponentType;
  calc_method: CalcMethod;
  amount?: number;
  percentage?: number;
  scope_type: ScopeType;
  scope_value?: string;
  is_active: boolean;
  priority: number;
  effective_from: string;
  effective_to?: string;
  notes?: string;
}

export interface DriverPayoutLine {
  id: string;
  driver_id: string;
  driver_name: string;
  national_id: string;
  phone: string;
  stc_bank_phone: string;
  platform: string;
  city: string;
  contract_type: string;
  gross_earnings: number;
  additions: number;
  deductions: number;
  fll_commission: number;
  vat_amount: number;
  net_payout: number;
  status: string;
  components_applied: { id: string; name: string; type: ComponentType; amount: number }[];
  has_vehicle: boolean;
  kyc_complete: boolean;
  is_active: boolean;
}

export interface PayoutStage {
  stage: number;
  stage_name: string;
  label_ar: string;
  status: StageStatus;
  assigned_to?: string;
  decided_by?: string;
  decided_at?: string;
  notes?: string;
  errors: { type: string; message: string; driver_id?: string }[];
  warnings: { type: string; message: string; driver_id?: string }[];
}

export interface PayoutBatch {
  id: string;
  batch_number: string;
  period_start: string;
  period_end: string;
  total_drivers: number;
  total_amount: number;
  current_stage: number;
  status: string;
  stc_excel_url?: string;
  created_at: string;
}

export const STAGE_DEFS: Omit<PayoutStage, "status" | "errors" | "warnings">[] = [
  { stage: 1, stage_name: "finance_review",  label_ar: "مراجعة مالية" },
  { stage: 2, stage_name: "ops_approval",    label_ar: "اعتماد العمليات" },
  { stage: 3, stage_name: "fleet_approval",  label_ar: "اعتماد الأسطول" },
  { stage: 4, stage_name: "hr_approval",     label_ar: "اعتماد الموارد" },
  { stage: 5, stage_name: "finance_final",   label_ar: "الاعتماد النهائي" },
];

// ─── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_DRIVERS: DriverPayoutLine[] = [
  { id: "dp-1", driver_id: "d1", driver_name: "أحمد محمد الشمري", national_id: "1088765432", phone: "0501234567", stc_bank_phone: "966563636006", platform: "جاهز", city: "الرياض", contract_type: "freelance", gross_earnings: 8500, additions: 500, deductions: 1220, fll_commission: 1020, vat_amount: 153, net_payout: 7780, status: "pending", components_applied: [{ id: "c1", name: "بدل تشغيل", type: "addition", amount: 500 }, { id: "c3", name: "عمولة FLL", type: "deduction", amount: 1020 }, { id: "c6", name: "تأمين", type: "deduction", amount: 200 }], has_vehicle: true, kyc_complete: true, is_active: true },
  { id: "dp-2", driver_id: "d2", driver_name: "خالد العمري", national_id: "1092345678", phone: "0559876543", stc_bank_phone: "966559876543", platform: "مرسول", city: "جدة", contract_type: "company_sponsored", gross_earnings: 6200, additions: 800, deductions: 1094, fll_commission: 744, vat_amount: 112, net_payout: 5906, status: "pending", components_applied: [{ id: "c1", name: "بدل تشغيل", type: "addition", amount: 500 }, { id: "c4", name: "مكافأة أداء", type: "addition", amount: 300 }, { id: "c3", name: "عمولة FLL", type: "deduction", amount: 744 }, { id: "c5", name: "صيانة مركبة", type: "deduction", amount: 150 }, { id: "c6", name: "تأمين", type: "deduction", amount: 200 }], has_vehicle: true, kyc_complete: true, is_active: true },
  { id: "dp-3", driver_id: "d3", driver_name: "فهد الغامدي", national_id: "1078901234", phone: "0541112233", stc_bank_phone: "966541112233", platform: "هنقرستيشن", city: "الدمام", contract_type: "freelance", gross_earnings: 4800, additions: 500, deductions: 776, fll_commission: 576, vat_amount: 86, net_payout: 4524, status: "pending", components_applied: [{ id: "c1", name: "بدل تشغيل", type: "addition", amount: 500 }, { id: "c3", name: "عمولة FLL", type: "deduction", amount: 576 }, { id: "c6", name: "تأمين", type: "deduction", amount: 200 }], has_vehicle: false, kyc_complete: true, is_active: true },
  { id: "dp-4", driver_id: "d4", driver_name: "سعد الزهراني", national_id: "1065432109", phone: "0534445566", stc_bank_phone: "966534445566", platform: "جاهز", city: "الرياض", contract_type: "company_sponsored", gross_earnings: 9200, additions: 800, deductions: 1454, fll_commission: 1104, vat_amount: 166, net_payout: 8546, status: "pending", components_applied: [{ id: "c1", name: "بدل تشغيل", type: "addition", amount: 500 }, { id: "c4", name: "مكافأة أداء", type: "addition", amount: 300 }, { id: "c3", name: "عمولة FLL", type: "deduction", amount: 1104 }, { id: "c5", name: "صيانة مركبة", type: "deduction", amount: 150 }, { id: "c6", name: "تأمين", type: "deduction", amount: 200 }], has_vehicle: true, kyc_complete: false, is_active: true },
  { id: "dp-5", driver_id: "d5", driver_name: "عمر الشمري", national_id: "1054321098", phone: "0567778899", stc_bank_phone: "", platform: "كريم", city: "مكة", contract_type: "freelance", gross_earnings: 3100, additions: 500, deductions: 572, fll_commission: 372, vat_amount: 56, net_payout: 3028, status: "pending", components_applied: [{ id: "c1", name: "بدل تشغيل", type: "addition", amount: 500 }, { id: "c3", name: "عمولة FLL", type: "deduction", amount: 372 }, { id: "c6", name: "تأمين", type: "deduction", amount: 200 }], has_vehicle: false, kyc_complete: true, is_active: false },
  { id: "dp-6", driver_id: "d6", driver_name: "ماجد القحطاني", national_id: "1043210987", phone: "0578889900", stc_bank_phone: "966578889900", platform: "مرسول", city: "الرياض", contract_type: "kafala", gross_earnings: 7600, additions: 500, deductions: 1262, fll_commission: 912, vat_amount: 137, net_payout: 6838, status: "pending", components_applied: [{ id: "c1", name: "بدل تشغيل", type: "addition", amount: 500 }, { id: "c3", name: "عمولة FLL", type: "deduction", amount: 912 }, { id: "c5", name: "صيانة مركبة", type: "deduction", amount: 150 }, { id: "c6", name: "تأمين", type: "deduction", amount: 200 }], has_vehicle: true, kyc_complete: true, is_active: true },
];

const MOCK_BATCH: PayoutBatch = {
  id: "batch-001",
  batch_number: "PAY-2026-03-W4",
  period_start: "2026-03-21",
  period_end: "2026-03-27",
  total_drivers: 6,
  total_amount: MOCK_DRIVERS.reduce((s, d) => s + d.net_payout, 0),
  current_stage: 1,
  status: "finance_review",
  created_at: new Date().toISOString(),
};

// ─── Store ──────────────────────────────────────────────────────────────────
interface PayoutWorkflowState {
  batch: PayoutBatch | null;
  drivers: DriverPayoutLine[];
  stages: PayoutStage[];
  components: AccountingComponent[];
  loading: boolean;

  // Actions
  initBatch: (batchId?: string) => Promise<void>;
  advanceStage: (notes?: string, decidedBy?: string) => void;
  rejectStage: (reason: string, decidedBy?: string) => void;
  generateStcExcel: () => Promise<string | null>;
  fetchComponents: () => Promise<void>;
  reset: () => void;

  // Computed
  getStageErrors: (stage: number) => { type: string; message: string; driver_id?: string }[];
  getStageWarnings: (stage: number) => { type: string; message: string; driver_id?: string }[];
  getStageSummary: (stage: number) => Record<string, number | string>;
}

export const usePayoutWorkflowStore = create<PayoutWorkflowState>()((set, get) => ({
  batch: null,
  drivers: [],
  stages: [],
  components: [],
  loading: false,

  initBatch: async (batchId) => {
    set({ loading: true });
    // Initialize stages
    const stages: PayoutStage[] = STAGE_DEFS.map((d) => ({
      ...d,
      status: d.stage === 1 ? "in_review" : "pending",
      errors: [],
      warnings: [],
    }));

    // Try Supabase
    if (supabase && batchId) {
      try {
        const { data: batchData } = await supabase.from("payout_batches" as any).select("*").eq("id", batchId).single();
        if (batchData) {
          // Load real data... for now use mock
        }
      } catch { /* fallback */ }
    }

    set({
      batch: MOCK_BATCH,
      drivers: MOCK_DRIVERS,
      stages,
      loading: false,
    });
  },

  advanceStage: (notes, decidedBy) => {
    const { batch, stages } = get();
    if (!batch) return;
    const currentIdx = batch.current_stage - 1;
    if (currentIdx >= stages.length) return;

    const updated = stages.map((s, i) => {
      if (i === currentIdx) return { ...s, status: "approved" as StageStatus, notes, decided_by: decidedBy || "admin", decided_at: new Date().toISOString() };
      if (i === currentIdx + 1) return { ...s, status: "in_review" as StageStatus };
      return s;
    });

    const newStage = Math.min(batch.current_stage + 1, 5);
    set({
      stages: updated,
      batch: { ...batch, current_stage: newStage, status: newStage > 5 ? "completed" : STAGE_DEFS[newStage - 1].stage_name },
    });
  },

  rejectStage: (reason, decidedBy) => {
    const { batch, stages } = get();
    if (!batch) return;
    const currentIdx = batch.current_stage - 1;

    const updated = stages.map((s, i) => {
      if (i === currentIdx) return { ...s, status: "rejected" as StageStatus, notes: reason, decided_by: decidedBy || "admin", decided_at: new Date().toISOString() };
      if (i > currentIdx) return { ...s, status: "pending" as StageStatus };
      return s;
    });

    // Reset to stage 1
    updated[0] = { ...updated[0], status: "in_review" as StageStatus };

    set({
      stages: updated,
      batch: { ...batch, current_stage: 1, status: "finance_review" },
    });
  },

  generateStcExcel: async () => {
    const { batch, drivers } = get();
    if (!batch) return null;

    const payouts = drivers
      .filter((d) => d.stc_bank_phone && d.net_payout > 0 && d.is_active)
      .map((d) => ({
        reference: `${d.driver_name} - ${d.platform} - ${d.contract_type}`,
        phone: d.stc_bank_phone,
        amount: d.net_payout,
      }));

    try {
      const res = await fetch(`${API_BASE}/api/generate-stc-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: batch.batch_number, period: `${batch.period_start}_${batch.period_end}`, payouts }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        set({ batch: { ...batch, stc_excel_url: data.presigned_url || data.url } });
        return data.presigned_url || data.url;
      }
    } catch { /* silent */ }
    return null;
  },

  fetchComponents: async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from("accounting_components" as any).select("*").eq("is_active", true).order("priority");
      if (data && data.length > 0) {
        set({ components: data as AccountingComponent[] });
      }
    } catch { /* keep empty */ }
  },

  reset: () => {
    set({ batch: null, drivers: [], stages: [], loading: false });
  },

  getStageErrors: (stage) => {
    const { drivers } = get();
    const errors: { type: string; message: string; driver_id?: string }[] = [];
    if (stage === 1) {
      // Finance: check missing phone, zero amounts, duplicates
      for (const d of drivers) {
        if (!d.stc_bank_phone) errors.push({ type: "missing_phone", message: `${d.driver_name}: رقم STC Bank غير مسجل`, driver_id: d.driver_id });
        if (d.net_payout <= 0) errors.push({ type: "zero_amount", message: `${d.driver_name}: المبلغ الصافي صفر أو سالب`, driver_id: d.driver_id });
      }
      const phones = drivers.filter((d) => d.stc_bank_phone).map((d) => d.stc_bank_phone);
      const dupes = phones.filter((p, i) => phones.indexOf(p) !== i);
      for (const dup of [...new Set(dupes)]) {
        errors.push({ type: "duplicate_phone", message: `رقم ${dup} مكرر على أكثر من سائق` });
      }
    }
    return errors;
  },

  getStageWarnings: (stage) => {
    const { drivers } = get();
    const warnings: { type: string; message: string; driver_id?: string }[] = [];
    if (stage === 2) {
      for (const d of drivers) {
        if (!d.is_active) warnings.push({ type: "inactive_driver", message: `${d.driver_name}: سائق غير نشط في الدفعة`, driver_id: d.driver_id });
      }
    }
    if (stage === 3) {
      for (const d of drivers) {
        if (!d.has_vehicle) warnings.push({ type: "no_vehicle", message: `${d.driver_name}: بدون مركبة مسجلة`, driver_id: d.driver_id });
      }
    }
    if (stage === 4) {
      for (const d of drivers) {
        if (!d.kyc_complete) warnings.push({ type: "incomplete_kyc", message: `${d.driver_name}: وثائق KYC غير مكتملة`, driver_id: d.driver_id });
      }
    }
    return warnings;
  },

  getStageSummary: (stage) => {
    const { drivers, batch } = get();
    const totalGross = drivers.reduce((s, d) => s + d.gross_earnings, 0);
    const totalNet = drivers.reduce((s, d) => s + d.net_payout, 0);
    const totalAdditions = drivers.reduce((s, d) => s + d.additions, 0);
    const totalDeductions = drivers.reduce((s, d) => s + d.deductions, 0);

    if (stage === 1) return { totalDrivers: drivers.length, totalGross, totalNet, totalAdditions, totalDeductions };
    if (stage === 2) {
      const active = drivers.filter((d) => d.is_active).length;
      return { active, inactive: drivers.length - active, platforms: [...new Set(drivers.map((d) => d.platform))].length };
    }
    if (stage === 3) {
      const withVehicle = drivers.filter((d) => d.has_vehicle).length;
      return { withVehicle, withoutVehicle: drivers.length - withVehicle };
    }
    if (stage === 4) {
      const kycComplete = drivers.filter((d) => d.kyc_complete).length;
      return { kycComplete, kycIncomplete: drivers.length - kycComplete };
    }
    if (stage === 5) return { totalNet, excelGenerated: batch?.stc_excel_url ? "نعم" : "لا" };
    return {};
  },
}));
