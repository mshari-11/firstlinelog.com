-- ============================================================================
-- FLL Admin Governance Schema
-- Module registry, enhanced permissions, feature toggles, workflows, SLA rules
-- ============================================================================

-- Create admin schema if not exists
CREATE SCHEMA IF NOT EXISTS admin;

-- ─── Module Registry ────────────────────────────────────────────────────────
-- Replaces localStorage page_builder_config with a persistent, shareable store
CREATE TABLE IF NOT EXISTS admin.module_registry (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

COMMENT ON TABLE admin.module_registry IS 'Centralized module configuration — drives sidebar, dashboard, and feature toggles';

-- ─── Enhanced Role Permissions ──────────────────────────────────────────────
-- Extends the flat boolean StaffPermissions with action-level + data-scope control
CREATE TABLE IF NOT EXISTS admin.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  module_id TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '["view"]'::jsonb,
  data_scope JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_name, module_id)
);

COMMENT ON TABLE admin.role_permissions IS 'Action-level permissions per role per module — view, create, edit, delete, approve, export, configure';

-- ─── Feature Toggles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.feature_toggles (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  label_ar TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT false,
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'role', 'user')),
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

COMMENT ON TABLE admin.feature_toggles IS 'Feature flags — global, role-scoped, or user-scoped';

-- ─── Workflow Definitions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  trigger_module TEXT NOT NULL,
  trigger_action TEXT NOT NULL,
  approval_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  sla_hours INTEGER NOT NULL DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);

COMMENT ON TABLE admin.workflows IS 'Approval workflow definitions with multi-step chains and SLA timers';

-- ─── SLA Rules ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.sla_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_name_ar TEXT NOT NULL DEFAULT '',
  threshold_value NUMERIC NOT NULL,
  threshold_unit TEXT NOT NULL CHECK (threshold_unit IN ('minutes', 'hours', 'days', 'percentage', 'count')),
  escalation_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE admin.sla_rules IS 'SLA thresholds with escalation chains — triggers alerts when breached';

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON admin.role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON admin.role_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_feature_toggles_module ON admin.feature_toggles(module_id);
CREATE INDEX IF NOT EXISTS idx_workflows_module ON admin.workflows(trigger_module);
CREATE INDEX IF NOT EXISTS idx_sla_rules_module ON admin.sla_rules(module_id);

-- ─── Seed Default SLA Rules ────────────────────────────────────────────────
INSERT INTO admin.sla_rules (id, module_id, metric_name, metric_name_ar, threshold_value, threshold_unit, escalation_chain, is_active)
VALUES
  (gen_random_uuid(), 'orders', 'Average Delivery Time', 'متوسط وقت التوصيل', 45, 'minutes',
   '[{"afterHours":1,"notifyRole":"staff_operations","notifyMethod":"dashboard"},{"afterHours":4,"notifyRole":"admin","notifyMethod":"email"}]'::jsonb, true),
  (gen_random_uuid(), 'complaints', 'Complaint Response Time', 'وقت استجابة الشكاوى', 2, 'hours',
   '[{"afterHours":2,"notifyRole":"staff_operations","notifyMethod":"dashboard"},{"afterHours":6,"notifyRole":"admin","notifyMethod":"all"}]'::jsonb, true),
  (gen_random_uuid(), 'approvals', 'Approval Turnaround', 'وقت معالجة الاعتمادات', 24, 'hours',
   '[{"afterHours":24,"notifyRole":"owner","notifyMethod":"email"}]'::jsonb, true),
  (gen_random_uuid(), 'orders', 'On-time Delivery Rate', 'معدل التوصيل في الوقت', 95, 'percentage',
   '[{"afterHours":12,"notifyRole":"admin","notifyMethod":"dashboard"}]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- ─── Seed Default Workflow ──────────────────────────────────────────────────
INSERT INTO admin.workflows (name, name_ar, trigger_module, trigger_action, approval_chain, sla_hours, is_active)
VALUES
  ('Payout Batch Approval', 'اعتماد دفعة الرواتب', 'payouts', 'approve',
   '[{"role":"staff_finance","roleAr":"موظف المالية","slaHours":12},{"role":"owner","roleAr":"المالك","slaHours":24}]'::jsonb, 36, true),
  ('Driver Application Approval', 'اعتماد طلب سائق', 'driver-applications', 'approve',
   '[{"role":"staff_hr","roleAr":"موارد بشرية","slaHours":24},{"role":"admin","roleAr":"مدير النظام","slaHours":48}]'::jsonb, 72, true)
ON CONFLICT DO NOTHING;
