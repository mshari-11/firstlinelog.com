-- ============================================================================
-- 010: FLL HR Schema — Attendance, Leave, Payroll, Performance
-- Builds on existing hr.* tables, adds operational HR tracking
-- ============================================================================

-- Create HR schema if not exists (may already exist from earlier migrations)
CREATE SCHEMA IF NOT EXISTS hr;

-- ─── Attendance Records ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'remote', 'holiday')),
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

COMMENT ON TABLE hr.attendance_records IS 'Daily attendance tracking for all employees';

-- ─── Leave Balances ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity')),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  remaining_days INTEGER GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, leave_type, year)
);

COMMENT ON TABLE hr.leave_balances IS 'Annual leave balance per employee per type';

-- ─── Payroll Runs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid', 'cancelled')),
  total_gross NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  total_net NUMERIC(12,2) DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE hr.payroll_runs IS 'Monthly payroll batch runs';

-- ─── Payroll Lines ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr.payroll_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES hr.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL DEFAULT '',
  base_salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  allowances NUMERIC(10,2) DEFAULT 0,
  overtime_amount NUMERIC(10,2) DEFAULT 0,
  deductions NUMERIC(10,2) DEFAULT 0,
  gosi_contribution NUMERIC(10,2) DEFAULT 0,
  net_salary NUMERIC(10,2) GENERATED ALWAYS AS (base_salary + allowances + overtime_amount - deductions - gosi_contribution) STORED,
  bank_name TEXT,
  iban TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE hr.payroll_lines IS 'Individual employee payroll line items';

-- ─── Performance Reviews ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr.performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL DEFAULT '',
  reviewer_id UUID,
  reviewer_name TEXT,
  review_period TEXT NOT NULL,
  overall_rating NUMERIC(3,1) CHECK (overall_rating BETWEEN 1.0 AND 5.0),
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  strengths TEXT,
  improvements TEXT,
  goals JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'acknowledged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE hr.performance_evaluations IS 'Employee performance review records with category ratings';

-- ─── Training Programs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr.training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'safety', 'technical', 'compliance', 'leadership')),
  duration_hours INTEGER DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE hr.training_programs IS 'Training program definitions';

-- ─── Training Enrollments ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr.training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES hr.training_programs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'failed', 'withdrawn')),
  score NUMERIC(5,2),
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, employee_id)
);

COMMENT ON TABLE hr.training_enrollments IS 'Employee enrollment in training programs';

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON hr.attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON hr.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON hr.leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON hr.payroll_runs(status);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_run ON hr.payroll_lines(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_performance_employee ON hr.performance_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_program ON hr.training_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_employee ON hr.training_enrollments(employee_id);
