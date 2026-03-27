-- ============================================================================
-- FLL Finance Engine — Accounting Components + Payout Approval Stages
-- ============================================================================

-- ─── Accounting Components (Rules Engine) ───────────────────────────────────
-- Finance team creates flexible rules: additions (بدل تشغيل, مكافأة)
-- or deductions (تأمين, سلفة, مخالفات) with configurable scope
CREATE TABLE IF NOT EXISTS finance.accounting_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  component_type VARCHAR(20) NOT NULL CHECK (component_type IN ('addition', 'deduction')),
  calc_method VARCHAR(20) NOT NULL CHECK (calc_method IN ('fixed', 'percentage')),
  amount NUMERIC(10,2),
  percentage NUMERIC(5,2),
  scope_type VARCHAR(30) NOT NULL CHECK (scope_type IN ('all', 'contract_type', 'city', 'platform', 'driver')),
  scope_value JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_calc_amount CHECK (
    (calc_method = 'fixed' AND amount IS NOT NULL) OR
    (calc_method = 'percentage' AND percentage IS NOT NULL)
  )
);

COMMENT ON TABLE finance.accounting_components IS 'Configurable accounting rules — additions and deductions applied to driver payouts';

-- ─── Payout Run Stages (5-Stage Approval Workflow) ──────────────────────────
CREATE TABLE IF NOT EXISTS finance.payout_run_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL,
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 5),
  stage_name VARCHAR(50) NOT NULL CHECK (stage_name IN (
    'finance_review', 'ops_approval', 'fleet_approval', 'hr_approval', 'finance_final'
  )),
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_review', 'approved', 'rejected', 'skipped'
  )),
  assigned_to TEXT,
  review_pack JSONB DEFAULT '{}'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(batch_id, stage)
);

COMMENT ON TABLE finance.payout_run_stages IS '5-stage payout approval: Finance Review → Ops → Fleet → HR → Finance Final';

-- ─── Payout Driver Components (junction: which components applied to each driver) ──
CREATE TABLE IF NOT EXISTS finance.payout_driver_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL,
  component_id UUID NOT NULL REFERENCES finance.accounting_components(id),
  component_type VARCHAR(20) NOT NULL,
  calc_method VARCHAR(20) NOT NULL,
  original_amount NUMERIC(10,2),
  applied_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE finance.payout_driver_components IS 'Links driver payouts to applied accounting components with calculated amounts';

-- ─── Alter payout_batches for workflow support ──────────────────────────────
DO $$
BEGIN
  -- Add current_stage tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'finance' AND table_name = 'payout_batches' AND column_name = 'current_stage') THEN
    ALTER TABLE finance.payout_batches ADD COLUMN current_stage INTEGER DEFAULT 1;
  END IF;

  -- Add STC Excel tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'finance' AND table_name = 'payout_batches' AND column_name = 'stc_excel_s3_key') THEN
    ALTER TABLE finance.payout_batches
      ADD COLUMN stc_excel_s3_key VARCHAR(500),
      ADD COLUMN stc_excel_url TEXT,
      ADD COLUMN stc_excel_generated_at TIMESTAMPTZ;
  END IF;

  -- Add stage_history for audit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'finance' AND table_name = 'payout_batches' AND column_name = 'stage_history') THEN
    ALTER TABLE finance.payout_batches ADD COLUMN stage_history JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_acct_components_active ON finance.accounting_components(is_active, scope_type);
CREATE INDEX IF NOT EXISTS idx_acct_components_effective ON finance.accounting_components(effective_from, effective_to) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payout_stages_batch ON finance.payout_run_stages(batch_id, stage);
CREATE INDEX IF NOT EXISTS idx_payout_stages_status ON finance.payout_run_stages(status) WHERE status IN ('pending', 'in_review');
CREATE INDEX IF NOT EXISTS idx_payout_drv_components ON finance.payout_driver_components(payout_id);

-- ─── Seed default components ────────────────────────────────────────────────
INSERT INTO finance.accounting_components (name_ar, name_en, component_type, calc_method, amount, scope_type, priority, effective_from, is_active)
VALUES
  ('بدل تشغيل', 'Operations Allowance', 'addition', 'fixed', 500, 'all', 1, '2026-01-01', true),
  ('تأمين صحي', 'Health Insurance', 'deduction', 'fixed', 200, 'contract_type', 2, '2026-01-01', true),
  ('عمولة FLL', 'FLL Commission', 'deduction', 'percentage', NULL, 'all', 3, '2026-01-01', true),
  ('مكافأة أداء', 'Performance Bonus', 'addition', 'fixed', 300, 'platform', 4, '2026-03-01', true),
  ('صيانة مركبة', 'Vehicle Maintenance', 'deduction', 'fixed', 150, 'contract_type', 5, '2026-01-01', true)
ON CONFLICT DO NOTHING;

-- Set percentage for FLL Commission
UPDATE finance.accounting_components SET percentage = 12 WHERE name_en = 'FLL Commission' AND percentage IS NULL;

-- Set scope_value for scoped components
UPDATE finance.accounting_components SET scope_value = '["company_sponsored","kafala"]' WHERE name_en = 'Health Insurance';
UPDATE finance.accounting_components SET scope_value = '["hungerstation","mrsool"]' WHERE name_en = 'Performance Bonus';
UPDATE finance.accounting_components SET scope_value = '["company_sponsored"]' WHERE name_en = 'Vehicle Maintenance';
