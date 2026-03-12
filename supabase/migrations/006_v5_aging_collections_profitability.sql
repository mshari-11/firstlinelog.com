-- =====================================================
-- FLL V5: Aging Reports + Collections + Profitability
-- Additive only — no existing objects modified
-- =====================================================

-- =====================================================
-- PART 1: AGING REPORTS VIEWS
-- =====================================================

-- 1a. Invoice Aging Buckets View
CREATE OR REPLACE VIEW finance.v_invoice_aging AS
SELECT
  i.id AS invoice_id,
  i.invoice_number,
  i.client_name,
  i.total_amount,
  i.paid_amount,
  (i.total_amount - COALESCE(i.paid_amount, 0)) AS outstanding,
  i.due_date,
  i.status,
  i.created_at AS invoice_date,
  CURRENT_DATE - i.due_date::date AS days_overdue,
  CASE
    WHEN CURRENT_DATE - i.due_date::date <= 0 THEN 'current'
    WHEN CURRENT_DATE - i.due_date::date BETWEEN 1 AND 30 THEN '1-30 days'
    WHEN CURRENT_DATE - i.due_date::date BETWEEN 31 AND 60 THEN '31-60 days'
    WHEN CURRENT_DATE - i.due_date::date BETWEEN 61 AND 90 THEN '61-90 days'
    WHEN CURRENT_DATE - i.due_date::date BETWEEN 91 AND 120 THEN '91-120 days'
    ELSE '120+ days'
  END AS aging_bucket,
  CASE
    WHEN CURRENT_DATE - i.due_date::date <= 0 THEN 0
    WHEN CURRENT_DATE - i.due_date::date BETWEEN 1 AND 30 THEN 1
    WHEN CURRENT_DATE - i.due_date::date BETWEEN 31 AND 60 THEN 2
    WHEN CURRENT_DATE - i.due_date::date BETWEEN 61 AND 90 THEN 3
    WHEN CURRENT_DATE - i.due_date::date BETWEEN 91 AND 120 THEN 4
    ELSE 5
  END AS aging_bucket_order
FROM finance.invoices i
WHERE i.status NOT IN ('paid', 'cancelled', 'voided')
  AND (i.total_amount - COALESCE(i.paid_amount, 0)) > 0;

-- 1b. Aging Summary by Client
CREATE OR REPLACE VIEW finance.v_aging_summary_by_client AS
SELECT
  client_name,
  COUNT(*) AS invoice_count,
  SUM(outstanding) AS total_outstanding,
  SUM(CASE WHEN aging_bucket = 'current' THEN outstanding ELSE 0 END) AS current_amount,
  SUM(CASE WHEN aging_bucket = '1-30 days' THEN outstanding ELSE 0 END) AS bucket_1_30,
  SUM(CASE WHEN aging_bucket = '31-60 days' THEN outstanding ELSE 0 END) AS bucket_31_60,
  SUM(CASE WHEN aging_bucket = '61-90 days' THEN outstanding ELSE 0 END) AS bucket_61_90,
  SUM(CASE WHEN aging_bucket = '91-120 days' THEN outstanding ELSE 0 END) AS bucket_91_120,
  SUM(CASE WHEN aging_bucket = '120+ days' THEN outstanding ELSE 0 END) AS bucket_120_plus,
  MAX(days_overdue) AS max_days_overdue,
  AVG(days_overdue)::int AS avg_days_overdue
FROM finance.v_invoice_aging
GROUP BY client_name
ORDER BY total_outstanding DESC;

-- 1c. Overall Aging Summary
CREATE OR REPLACE VIEW finance.v_aging_overview AS
SELECT
  aging_bucket,
  aging_bucket_order,
  COUNT(*) AS invoice_count,
  SUM(outstanding) AS total_amount,
  ROUND(SUM(outstanding) * 100.0 / NULLIF(SUM(SUM(outstanding)) OVER (), 0), 2) AS pct_of_total
FROM finance.v_invoice_aging
GROUP BY aging_bucket, aging_bucket_order
ORDER BY aging_bucket_order;

-- 1d. Aging Trend (monthly snapshot helper)
CREATE TABLE IF NOT EXISTS finance.aging_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  aging_bucket VARCHAR(20) NOT NULL,
  invoice_count INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aging_snapshots_date ON finance.aging_snapshots(snapshot_date);

-- Function to capture aging snapshot
CREATE OR REPLACE FUNCTION finance.capture_aging_snapshot()
RETURNS void AS $$
BEGIN
  INSERT INTO finance.aging_snapshots (snapshot_date, aging_bucket, invoice_count, total_amount)
  SELECT CURRENT_DATE, aging_bucket, invoice_count, total_amount
  FROM finance.v_aging_overview;
END;
$$ LANGUAGE plpgsql;

-- 1e. Aging Trend View (last 12 months)
CREATE OR REPLACE VIEW finance.v_aging_trend AS
SELECT
  snapshot_date,
  aging_bucket,
  invoice_count,
  total_amount
FROM finance.aging_snapshots
WHERE snapshot_date >= CURRENT_DATE - INTERVAL '12 months'
ORDER BY snapshot_date DESC, aging_bucket;


-- =====================================================
-- PART 2: COLLECTIONS DASHBOARD VIEWS
-- =====================================================

-- 2a. Collections tracking table
CREATE TABLE IF NOT EXISTS finance.collection_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'sms', 'visit', 'legal_notice', 'payment_plan', 'escalation'
  notes TEXT,
  follow_up_date DATE,
  assigned_to VARCHAR(255),
  outcome VARCHAR(50), -- 'promised_payment', 'partial_payment', 'no_response', 'disputed', 'resolved'
  promised_amount NUMERIC(18,2),
  promised_date DATE,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_collection_activities_invoice ON finance.collection_activities(invoice_id);
CREATE INDEX IF NOT EXISTS idx_collection_activities_followup ON finance.collection_activities(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_collection_activities_assigned ON finance.collection_activities(assigned_to);

-- 2b. Collection priority scoring
CREATE OR REPLACE VIEW finance.v_collection_priority AS
SELECT
  a.invoice_id,
  a.invoice_number,
  a.client_name,
  a.outstanding,
  a.days_overdue,
  a.aging_bucket,
  -- Priority score: higher = more urgent
  (
    CASE WHEN a.days_overdue > 120 THEN 50
         WHEN a.days_overdue > 90 THEN 40
         WHEN a.days_overdue > 60 THEN 30
         WHEN a.days_overdue > 30 THEN 20
         ELSE 10 END
    +
    CASE WHEN a.outstanding > 100000 THEN 30
         WHEN a.outstanding > 50000 THEN 20
         WHEN a.outstanding > 10000 THEN 10
         ELSE 5 END
  ) AS priority_score,
  CASE
    WHEN a.days_overdue > 90 OR a.outstanding > 100000 THEN 'critical'
    WHEN a.days_overdue > 60 OR a.outstanding > 50000 THEN 'high'
    WHEN a.days_overdue > 30 OR a.outstanding > 10000 THEN 'medium'
    ELSE 'low'
  END AS priority_level,
  (SELECT COUNT(*) FROM finance.collection_activities ca WHERE ca.invoice_id = a.invoice_id) AS activity_count,
  (SELECT MAX(ca.created_at) FROM finance.collection_activities ca WHERE ca.invoice_id = a.invoice_id) AS last_activity_date,
  (SELECT ca.follow_up_date FROM finance.collection_activities ca WHERE ca.invoice_id = a.invoice_id ORDER BY ca.created_at DESC LIMIT 1) AS next_follow_up
FROM finance.v_invoice_aging a
ORDER BY priority_score DESC;

-- 2c. Collections KPI view
CREATE OR REPLACE VIEW finance.v_collections_kpi AS
SELECT
  COUNT(*) AS total_overdue_invoices,
  SUM(outstanding) AS total_overdue_amount,
  SUM(CASE WHEN aging_bucket IN ('91-120 days', '120+ days') THEN outstanding ELSE 0 END) AS critical_amount,
  AVG(days_overdue)::int AS avg_days_overdue,
  COUNT(CASE WHEN aging_bucket = '120+ days' THEN 1 END) AS invoices_120_plus,
  (SELECT COUNT(DISTINCT invoice_id) FROM finance.collection_activities WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS invoices_contacted_7d,
  (SELECT COUNT(*) FROM finance.collection_activities WHERE follow_up_date = CURRENT_DATE) AS follow_ups_today,
  (SELECT COUNT(*) FROM finance.collection_activities WHERE follow_up_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') AS follow_ups_next_7d
FROM finance.v_invoice_aging
WHERE days_overdue > 0;

-- 2d. Collection Effectiveness (DSO - Days Sales Outstanding)
CREATE OR REPLACE VIEW finance.v_dso_monthly AS
SELECT
  date_trunc('month', i.created_at)::date AS month,
  COUNT(*) AS invoices_issued,
  SUM(i.total_amount) AS total_invoiced,
  SUM(COALESCE(i.paid_amount, 0)) AS total_collected,
  ROUND(SUM(COALESCE(i.paid_amount, 0)) * 100.0 / NULLIF(SUM(i.total_amount), 0), 2) AS collection_rate_pct,
  AVG(
    CASE WHEN i.status = 'paid' THEN
      EXTRACT(day FROM (COALESCE(i.updated_at, now()) - i.created_at))
    END
  )::int AS avg_dso
FROM finance.invoices i
WHERE i.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY date_trunc('month', i.created_at)
ORDER BY month DESC;


-- =====================================================
-- PART 3: CITY / DRIVER / CLIENT PROFITABILITY
-- =====================================================

-- 3a. Profitability base table (for computed snapshots)
CREATE TABLE IF NOT EXISTS finance.profitability_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  dimension VARCHAR(50) NOT NULL, -- 'city', 'driver', 'client', 'platform', 'vehicle_type'
  dimension_value VARCHAR(255) NOT NULL,
  total_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  gross_profit NUMERIC(18,2) NOT NULL DEFAULT 0,
  margin_pct NUMERIC(8,2) NOT NULL DEFAULT 0,
  order_count INT NOT NULL DEFAULT 0,
  avg_revenue_per_order NUMERIC(18,2) NOT NULL DEFAULT 0,
  avg_cost_per_order NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profit_snap_date ON finance.profitability_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_profit_snap_dim ON finance.profitability_snapshots(dimension, dimension_value);

-- 3b. Revenue by City View
CREATE OR REPLACE VIEW finance.v_revenue_by_city AS
SELECT
  COALESCE(r.city, 'غير محدد') AS city,
  COUNT(*) AS transaction_count,
  SUM(r.amount) AS total_revenue,
  AVG(r.amount) AS avg_revenue,
  MIN(r.created_at) AS first_transaction,
  MAX(r.created_at) AS last_transaction
FROM finance.revenue_records r
GROUP BY r.city
ORDER BY total_revenue DESC;

-- 3c. Revenue by Platform View
CREATE OR REPLACE VIEW finance.v_revenue_by_platform AS
SELECT
  COALESCE(r.platform, 'غير محدد') AS platform,
  COUNT(*) AS transaction_count,
  SUM(r.amount) AS total_revenue,
  AVG(r.amount) AS avg_revenue,
  date_trunc('month', r.created_at)::date AS month
FROM finance.revenue_records r
WHERE r.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY r.platform, date_trunc('month', r.created_at)
ORDER BY month DESC, total_revenue DESC;

-- 3d. Expense by Category View
CREATE OR REPLACE VIEW finance.v_expense_by_category AS
SELECT
  COALESCE(e.category, 'غير مصنف') AS category,
  COUNT(*) AS expense_count,
  SUM(e.amount) AS total_expense,
  AVG(e.amount) AS avg_expense,
  date_trunc('month', e.expense_date)::date AS month
FROM finance.expenses e
WHERE e.expense_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY e.category, date_trunc('month', e.expense_date)
ORDER BY month DESC, total_expense DESC;

-- 3e. Driver Profitability View (earnings vs payouts vs costs)
CREATE OR REPLACE VIEW finance.v_driver_profitability AS
SELECT
  wt.driver_id,
  COUNT(CASE WHEN wt.event_type IN ('earning', 'bonus', 'incentive') THEN 1 END) AS earning_transactions,
  SUM(CASE WHEN wt.event_type IN ('earning', 'bonus', 'incentive') THEN wt.amount ELSE 0 END) AS total_earnings,
  SUM(CASE WHEN wt.event_type IN ('deduction', 'penalty', 'fee') THEN ABS(wt.amount) ELSE 0 END) AS total_deductions,
  SUM(CASE WHEN wt.event_type = 'payout' THEN ABS(wt.amount) ELSE 0 END) AS total_payouts,
  SUM(wt.amount) AS net_balance,
  dw.balance AS current_wallet_balance,
  dw.is_frozen AS wallet_frozen,
  MIN(wt.created_at) AS first_activity,
  MAX(wt.created_at) AS last_activity
FROM public.wallet_transactions wt
LEFT JOIN public.driver_wallets dw ON dw.driver_id = wt.driver_id
GROUP BY wt.driver_id, dw.balance, dw.is_frozen
ORDER BY total_earnings DESC;

-- 3f. Monthly P&L Summary
CREATE OR REPLACE VIEW finance.v_monthly_pnl AS
SELECT
  date_trunc('month', COALESCE(r.created_at, e.expense_date))::date AS month,
  COALESCE(rev.total_revenue, 0) AS total_revenue,
  COALESCE(exp.total_expenses, 0) AS total_expenses,
  COALESCE(rev.total_revenue, 0) - COALESCE(exp.total_expenses, 0) AS net_profit,
  CASE WHEN COALESCE(rev.total_revenue, 0) > 0
    THEN ROUND((COALESCE(rev.total_revenue, 0) - COALESCE(exp.total_expenses, 0)) * 100.0 / rev.total_revenue, 2)
    ELSE 0
  END AS margin_pct
FROM (
  SELECT date_trunc('month', created_at)::date AS month, SUM(amount) AS total_revenue
  FROM finance.revenue_records
  WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY date_trunc('month', created_at)
) rev
FULL OUTER JOIN (
  SELECT date_trunc('month', expense_date)::date AS month, SUM(amount) AS total_expenses
  FROM finance.expenses
  WHERE expense_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY date_trunc('month', expense_date)
) exp ON rev.month = exp.month
LEFT JOIN finance.revenue_records r ON false
LEFT JOIN finance.expenses e ON false
ORDER BY month DESC;

-- Fix: Simpler Monthly P&L
DROP VIEW IF EXISTS finance.v_monthly_pnl;
CREATE OR REPLACE VIEW finance.v_monthly_pnl AS
WITH months AS (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
    date_trunc('month', CURRENT_DATE),
    '1 month'
  )::date AS month
),
rev AS (
  SELECT date_trunc('month', created_at)::date AS month, SUM(amount) AS total_revenue
  FROM finance.revenue_records
  WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY 1
),
exp AS (
  SELECT date_trunc('month', expense_date)::date AS month, SUM(amount) AS total_expenses
  FROM finance.expenses
  WHERE expense_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY 1
)
SELECT
  m.month,
  COALESCE(r.total_revenue, 0) AS total_revenue,
  COALESCE(e.total_expenses, 0) AS total_expenses,
  COALESCE(r.total_revenue, 0) - COALESCE(e.total_expenses, 0) AS net_profit,
  CASE WHEN COALESCE(r.total_revenue, 0) > 0
    THEN ROUND((COALESCE(r.total_revenue, 0) - COALESCE(e.total_expenses, 0)) * 100.0 / r.total_revenue, 2)
    ELSE 0
  END AS margin_pct
FROM months m
LEFT JOIN rev r ON r.month = m.month
LEFT JOIN exp e ON e.month = m.month
ORDER BY m.month DESC;

-- 3g. Profitability snapshot function
CREATE OR REPLACE FUNCTION finance.capture_profitability_snapshot(p_dimension VARCHAR DEFAULT 'city')
RETURNS void AS $$
BEGIN
  IF p_dimension = 'city' THEN
    INSERT INTO finance.profitability_snapshots (dimension, dimension_value, total_revenue, order_count, avg_revenue_per_order)
    SELECT 'city', city, total_revenue, transaction_count, avg_revenue
    FROM finance.v_revenue_by_city;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- PART 4: ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_invoices_status_due ON finance.invoices(status, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON finance.invoices(client_name);
CREATE INDEX IF NOT EXISTS idx_revenue_city ON finance.revenue_records(city);
CREATE INDEX IF NOT EXISTS idx_revenue_platform ON finance.revenue_records(platform);
CREATE INDEX IF NOT EXISTS idx_revenue_created ON finance.revenue_records(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON finance.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON finance.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_driver ON public.wallet_transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON public.wallet_transactions(event_type);


-- =====================================================
-- PART 5: SEED DATA FOR TESTING
-- =====================================================

-- Insert sample collection activity types as reference
COMMENT ON TABLE finance.collection_activities IS 'Tracks all collection follow-up activities for overdue invoices';
COMMENT ON VIEW finance.v_invoice_aging IS 'Shows all unpaid invoices with aging buckets (current, 1-30, 31-60, 61-90, 91-120, 120+ days)';
COMMENT ON VIEW finance.v_collection_priority IS 'Prioritized list of overdue invoices with collection status and priority scoring';
COMMENT ON VIEW finance.v_aging_summary_by_client IS 'Aging summary grouped by client with bucket breakdown';
COMMENT ON VIEW finance.v_driver_profitability IS 'Driver-level profitability: earnings, deductions, payouts, net balance';
COMMENT ON VIEW finance.v_monthly_pnl IS 'Monthly profit & loss summary for last 12 months';

-- Done!
-- Summary:
-- Tables created: aging_snapshots, collection_activities, profitability_snapshots (3 new)
-- Views created: v_invoice_aging, v_aging_summary_by_client, v_aging_overview, v_aging_trend,
--                v_collection_priority, v_collections_kpi, v_dso_monthly,
--                v_revenue_by_city, v_revenue_by_platform, v_expense_by_category,
--                v_driver_profitability, v_monthly_pnl (12 new views)
-- Functions: capture_aging_snapshot(), capture_profitability_snapshot() (2 new)
-- Indexes: 9 new indexes
