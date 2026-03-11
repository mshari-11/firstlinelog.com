-- ============================================================
-- FLL Finance & Operations Schema v1.0
-- "المحرك المالي في Aurora فقط، وليس في Excel"
-- ============================================================

-- Schema
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS master;

-- ============================================================
-- MASTER DATA (master.*)
-- ============================================================

-- السائقين
CREATE TABLE master.drivers (
    driver_id       TEXT PRIMARY KEY,
    national_id     TEXT UNIQUE NOT NULL,
    full_name_ar    TEXT NOT NULL,
    full_name_en    TEXT,
    phone           TEXT,
    email           TEXT,
    city            TEXT,
    status          TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','suspended','terminated')),
    onboarded_at    TIMESTAMPTZ DEFAULT NOW(),
    terminated_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- تاريخ عقود السائقين (effective dating)
CREATE TABLE master.driver_contract_history (
    id              SERIAL PRIMARY KEY,
    driver_id       TEXT NOT NULL REFERENCES master.drivers(driver_id),
    contract_type   TEXT NOT NULL CHECK (contract_type IN ('freelancer','company_sponsored','kafala','ajir','part_time')),
    employer_type   TEXT NOT NULL CHECK (employer_type IN ('company','personal')),
    active_from     DATE NOT NULL,
    active_to       DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_overlap_contracts UNIQUE (driver_id, active_from)
);
CREATE INDEX idx_contract_driver_date ON master.driver_contract_history(driver_id, active_from, active_to);

-- المركبات
CREATE TABLE master.vehicles (
    vehicle_id      TEXT PRIMARY KEY,
    plate_number    TEXT UNIQUE,
    vehicle_type    TEXT NOT NULL CHECK (vehicle_type IN ('car','bike','van','truck')),
    brand           TEXT,
    model           TEXT,
    year            INT,
    color           TEXT,
    ownership_type  TEXT NOT NULL CHECK (ownership_type IN ('company','personal')),
    status          TEXT DEFAULT 'active' CHECK (status IN ('active','maintenance','retired','available','assigned')),
    daily_cost      NUMERIC(10,2) DEFAULT 0,
    insurance_expiry DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- تاريخ تعيين المركبة للسائق (effective dating)
CREATE TABLE master.driver_vehicle_assignment_history (
    id              SERIAL PRIMARY KEY,
    driver_id       TEXT NOT NULL REFERENCES master.drivers(driver_id),
    vehicle_id      TEXT NOT NULL REFERENCES master.vehicles(vehicle_id),
    vehicle_type    TEXT NOT NULL,
    ownership_type  TEXT NOT NULL,
    active_from     DATE NOT NULL,
    active_to       DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_overlap_vehicle UNIQUE (driver_id, active_from)
);
CREATE INDEX idx_vehicle_assign_date ON master.driver_vehicle_assignment_history(driver_id, active_from, active_to);

-- المنصات
CREATE TABLE master.platforms (
    platform_id     TEXT PRIMARY KEY,
    name_ar         TEXT NOT NULL,
    name_en         TEXT NOT NULL,
    status          TEXT DEFAULT 'active',
    report_type     TEXT DEFAULT 'order_level' CHECK (report_type IN ('order_level','driver_day_level')),
    report_frequency TEXT DEFAULT 'daily',
    contact_email   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- المدن
CREATE TABLE master.cities (
    city_id         TEXT PRIMARY KEY,
    name_ar         TEXT NOT NULL,
    name_en         TEXT NOT NULL,
    region          TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- بطاقات الأسعار (Rate Cards) — قلب الحساب المالي
-- ============================================================

CREATE TABLE finance.platform_rate_cards (
    rate_card_id    SERIAL PRIMARY KEY,
    platform_id     TEXT NOT NULL REFERENCES master.platforms(platform_id),
    city_id         TEXT REFERENCES master.cities(city_id),
    contract_type   TEXT NOT NULL,
    vehicle_type    TEXT NOT NULL,
    ownership_type  TEXT NOT NULL,
    payout_basis    TEXT NOT NULL CHECK (payout_basis IN ('per_order','per_day','per_hour','target_based')),
    base_rate       NUMERIC(10,2) NOT NULL,
    company_vehicle_fee NUMERIC(10,2) DEFAULT 0,
    fuel_allowance  NUMERIC(10,2) DEFAULT 0,
    maintenance_cost_rule TEXT,
    bonus_formula_json  JSONB,
    penalty_formula_json JSONB,
    commission_rate NUMERIC(5,2) DEFAULT 12.00,
    vat_rate        NUMERIC(5,2) DEFAULT 15.00,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_rate_card_lookup ON finance.platform_rate_cards(platform_id, city_id, contract_type, vehicle_type, ownership_type, effective_from);

-- قواعد الحوافز
CREATE TABLE finance.platform_bonus_rules (
    id              SERIAL PRIMARY KEY,
    platform_id     TEXT NOT NULL REFERENCES master.platforms(platform_id),
    city_id         TEXT,
    bonus_name_ar   TEXT NOT NULL,
    threshold_type  TEXT NOT NULL CHECK (threshold_type IN ('order_count','revenue','hours','rating')),
    threshold_value NUMERIC(10,2) NOT NULL,
    bonus_amount    NUMERIC(10,2) NOT NULL,
    bonus_type      TEXT DEFAULT 'fixed' CHECK (bonus_type IN ('fixed','percentage')),
    period          TEXT DEFAULT 'weekly' CHECK (period IN ('daily','weekly','monthly')),
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- قواعد العقوبات
CREATE TABLE finance.platform_penalty_rules (
    id              SERIAL PRIMARY KEY,
    platform_id     TEXT NOT NULL REFERENCES master.platforms(platform_id),
    penalty_name_ar TEXT NOT NULL,
    penalty_type    TEXT NOT NULL CHECK (penalty_type IN ('late_delivery','order_cancel','customer_complaint','no_show','policy_violation')),
    deduction_amount NUMERIC(10,2) NOT NULL,
    deduction_type  TEXT DEFAULT 'fixed' CHECK (deduction_type IN ('fixed','percentage')),
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEMPLATE REGISTRY — خرائط ملفات المنصات
-- ============================================================

CREATE TABLE finance.platform_file_templates (
    template_id     SERIAL PRIMARY KEY,
    platform_id     TEXT NOT NULL REFERENCES master.platforms(platform_id),
    template_version TEXT NOT NULL DEFAULT 'v1',
    expected_columns_json JSONB NOT NULL,
    column_mapping_json   JSONB NOT NULL,
    grain_type      TEXT NOT NULL CHECK (grain_type IN ('order_level','driver_day_level')),
    active_from     DATE NOT NULL,
    active_to       DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INGESTION & STAGING
-- ============================================================

-- سجل الملفات المرفوعة
CREATE TABLE finance.upload_batches (
    batch_id        TEXT PRIMARY KEY,
    platform_id     TEXT NOT NULL REFERENCES master.platforms(platform_id),
    report_date     DATE NOT NULL,
    file_name       TEXT NOT NULL,
    file_hash       TEXT NOT NULL,
    s3_key          TEXT NOT NULL,
    template_version TEXT,
    uploaded_by     TEXT,
    row_count       INT,
    total_amount    NUMERIC(12,2),
    status          TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded','validating','validated','quarantined','processing','processed','reconciled','failed')),
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_file UNIQUE (platform_id, report_date, file_hash)
);

-- بيانات التقارير الخام
CREATE TABLE finance.platform_reports_raw (
    id              BIGSERIAL PRIMARY KEY,
    batch_id        TEXT NOT NULL REFERENCES finance.upload_batches(batch_id),
    platform_id     TEXT NOT NULL,
    report_date     DATE NOT NULL,
    raw_data        JSONB NOT NULL,
    row_number      INT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- بيانات التقارير المنظفة (staging)
CREATE TABLE finance.platform_reports_staging (
    id              BIGSERIAL PRIMARY KEY,
    batch_id        TEXT NOT NULL REFERENCES finance.upload_batches(batch_id),
    platform_id     TEXT NOT NULL,
    report_date     DATE NOT NULL,
    driver_id       TEXT,
    order_id        TEXT,
    grain_type      TEXT NOT NULL,
    gross_amount    NUMERIC(10,2),
    platform_fee    NUMERIC(10,2),
    delivery_fee    NUMERIC(10,2),
    tip_amount      NUMERIC(10,2) DEFAULT 0,
    bonus_amount    NUMERIC(10,2) DEFAULT 0,
    penalty_amount  NUMERIC(10,2) DEFAULT 0,
    net_amount      NUMERIC(10,2),
    city            TEXT,
    order_count     INT DEFAULT 1,
    status          TEXT DEFAULT 'staged',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_staging_batch ON finance.platform_reports_staging(batch_id);
CREATE INDEX idx_staging_driver_date ON finance.platform_reports_staging(driver_id, report_date);

-- ============================================================
-- CANONICAL FACT TABLES
-- ============================================================

-- أوامر المنصة (order-level)
CREATE TABLE finance.platform_orders_fact (
    id              BIGSERIAL PRIMARY KEY,
    batch_id        TEXT NOT NULL,
    platform_id     TEXT NOT NULL,
    report_date     DATE NOT NULL,
    driver_id       TEXT NOT NULL,
    order_id        TEXT,
    city_id         TEXT,
    contract_type   TEXT,
    vehicle_type    TEXT,
    ownership_type  TEXT,
    rate_card_id    INT,
    gross_amount    NUMERIC(10,2) NOT NULL,
    base_pay        NUMERIC(10,2),
    delivery_fee    NUMERIC(10,2),
    tip_amount      NUMERIC(10,2) DEFAULT 0,
    bonus_amount    NUMERIC(10,2) DEFAULT 0,
    penalty_amount  NUMERIC(10,2) DEFAULT 0,
    commission_amount NUMERIC(10,2) DEFAULT 0,
    vat_amount      NUMERIC(10,2) DEFAULT 0,
    company_vehicle_fee NUMERIC(10,2) DEFAULT 0,
    net_driver_pay  NUMERIC(10,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_fact_driver ON finance.platform_orders_fact(driver_id, report_date);
CREATE INDEX idx_orders_fact_platform ON finance.platform_orders_fact(platform_id, report_date);

-- ملخص يومي للسائق (driver-day-level)
CREATE TABLE finance.platform_driver_day_fact (
    id              BIGSERIAL PRIMARY KEY,
    batch_id        TEXT NOT NULL,
    platform_id     TEXT NOT NULL,
    report_date     DATE NOT NULL,
    driver_id       TEXT NOT NULL,
    city_id         TEXT,
    contract_type   TEXT,
    vehicle_type    TEXT,
    ownership_type  TEXT,
    rate_card_id    INT,
    order_count     INT DEFAULT 0,
    hours_worked    NUMERIC(5,2),
    gross_amount    NUMERIC(10,2) NOT NULL,
    total_delivery_fees NUMERIC(10,2) DEFAULT 0,
    total_tips      NUMERIC(10,2) DEFAULT 0,
    total_bonuses   NUMERIC(10,2) DEFAULT 0,
    total_penalties NUMERIC(10,2) DEFAULT 0,
    commission_amount NUMERIC(10,2) DEFAULT 0,
    vat_amount      NUMERIC(10,2) DEFAULT 0,
    company_vehicle_fee NUMERIC(10,2) DEFAULT 0,
    net_driver_pay  NUMERIC(10,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_driver_day UNIQUE (platform_id, driver_id, report_date, batch_id)
);
CREATE INDEX idx_driver_day_lookup ON finance.platform_driver_day_fact(driver_id, report_date);

-- ============================================================
-- WALLET & LEDGER — المحفظة والسجل المالي
-- ============================================================

CREATE TABLE finance.driver_wallets (
    driver_id       TEXT PRIMARY KEY REFERENCES master.drivers(driver_id),
    current_balance NUMERIC(12,2) DEFAULT 0,
    total_earned    NUMERIC(12,2) DEFAULT 0,
    total_deducted  NUMERIC(12,2) DEFAULT 0,
    total_paid_out  NUMERIC(12,2) DEFAULT 0,
    last_payout_at  TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE finance.wallet_ledger_entries (
    id              BIGSERIAL PRIMARY KEY,
    driver_id       TEXT NOT NULL REFERENCES master.drivers(driver_id),
    entry_type      TEXT NOT NULL CHECK (entry_type IN ('credit','debit')),
    category        TEXT NOT NULL CHECK (category IN ('earnings','bonus','penalty','commission','vat','vehicle_fee','adjustment','payout','refund')),
    amount          NUMERIC(10,2) NOT NULL,
    running_balance NUMERIC(12,2),
    reference_type  TEXT,
    reference_id    TEXT,
    description_ar  TEXT,
    performed_by    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ledger_driver ON finance.wallet_ledger_entries(driver_id, created_at DESC);

-- ============================================================
-- RECONCILIATION — التسوية
-- ============================================================

CREATE TABLE finance.reconciliation_batches (
    recon_id        TEXT PRIMARY KEY,
    batch_id        TEXT NOT NULL REFERENCES finance.upload_batches(batch_id),
    platform_id     TEXT NOT NULL,
    report_date     DATE NOT NULL,
    platform_total  NUMERIC(12,2),
    calculated_total NUMERIC(12,2),
    variance_amount NUMERIC(12,2),
    variance_pct    NUMERIC(5,2),
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','matched','variance','approved','rejected')),
    approved_by     TEXT,
    approved_at     TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE finance.reconciliation_items (
    id              BIGSERIAL PRIMARY KEY,
    recon_id        TEXT NOT NULL REFERENCES finance.reconciliation_batches(recon_id),
    driver_id       TEXT NOT NULL,
    platform_amount NUMERIC(10,2),
    calculated_amount NUMERIC(10,2),
    variance        NUMERIC(10,2),
    status          TEXT DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYOUTS — الصرف
-- ============================================================

CREATE TABLE finance.payout_batches (
    payout_batch_id TEXT PRIMARY KEY,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    total_amount    NUMERIC(12,2) NOT NULL,
    driver_count    INT NOT NULL,
    payment_method  TEXT DEFAULT 'stc_bank',
    status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','processing','completed','failed')),
    approved_by     TEXT,
    approved_at     TIMESTAMPTZ,
    exported_file   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE finance.driver_payouts (
    id              BIGSERIAL PRIMARY KEY,
    payout_batch_id TEXT NOT NULL REFERENCES finance.payout_batches(payout_batch_id),
    driver_id       TEXT NOT NULL REFERENCES master.drivers(driver_id),
    gross_earnings  NUMERIC(10,2) NOT NULL,
    total_deductions NUMERIC(10,2) DEFAULT 0,
    net_payout      NUMERIC(10,2) NOT NULL,
    bank_name       TEXT DEFAULT 'STC Bank',
    iban            TEXT,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','transferred','failed','cancelled')),
    transferred_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payout_driver ON finance.driver_payouts(driver_id, created_at DESC);

-- ============================================================
-- MANUAL ADJUSTMENTS & APPROVALS
-- ============================================================

CREATE TABLE finance.manual_adjustments (
    adjustment_id   TEXT PRIMARY KEY,
    driver_id       TEXT NOT NULL REFERENCES master.drivers(driver_id),
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('credit','debit')),
    category        TEXT NOT NULL,
    amount          NUMERIC(10,2) NOT NULL,
    reason_ar       TEXT NOT NULL,
    requested_by    TEXT NOT NULL,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','manager_approved','finance_approved','rejected','applied')),
    manager_approved_by TEXT,
    manager_approved_at TIMESTAMPTZ,
    finance_approved_by TEXT,
    finance_approved_at TIMESTAMPTZ,
    applied_at      TIMESTAMPTZ,
    ledger_entry_id BIGINT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE finance.approval_requests (
    id              SERIAL PRIMARY KEY,
    entity_type     TEXT NOT NULL,
    entity_id       TEXT NOT NULL,
    action          TEXT NOT NULL,
    requested_by    TEXT NOT NULL,
    approval_level  TEXT NOT NULL CHECK (approval_level IN ('manager','finance','admin')),
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    decided_by      TEXT,
    decided_at      TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE finance.audit_log (
    id              BIGSERIAL PRIMARY KEY,
    table_name      TEXT NOT NULL,
    record_id       TEXT NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','APPROVE','REJECT')),
    old_values      JSONB,
    new_values      JSONB,
    performed_by    TEXT NOT NULL,
    ip_address      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_table ON finance.audit_log(table_name, created_at DESC);

-- ============================================================
-- COST PROFILES — تكلفة المركبات
-- ============================================================

CREATE TABLE master.company_vehicle_cost_profiles (
    id              SERIAL PRIMARY KEY,
    vehicle_type    TEXT NOT NULL,
    daily_depreciation NUMERIC(10,2),
    daily_insurance NUMERIC(10,2),
    daily_maintenance NUMERIC(10,2),
    fuel_per_km     NUMERIC(10,4),
    total_daily_cost NUMERIC(10,2) GENERATED ALWAYS AS (daily_depreciation + daily_insurance + daily_maintenance) STORED,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA — بيانات أساسية
-- ============================================================

-- المنصات
INSERT INTO master.platforms (platform_id, name_ar, name_en, report_type) VALUES
('hungerstation', 'هنقرستيشن', 'HungerStation', 'order_level'),
('keeta', 'كيتا', 'Keeta', 'order_level'),
('ninja', 'نينجا', 'Ninja', 'driver_day_level'),
('mrsool', 'مرسول', 'Mrsool', 'order_level'),
('toyou', 'تويو', 'ToYou', 'driver_day_level'),
('careem', 'كريم', 'Careem', 'order_level'),
('jahez', 'جاهز', 'Jahez', 'order_level')
ON CONFLICT (platform_id) DO NOTHING;

-- المدن الرئيسية
INSERT INTO master.cities (city_id, name_ar, name_en, region) VALUES
('jeddah', 'جدة', 'Jeddah', 'مكة المكرمة'),
('riyadh', 'الرياض', 'Riyadh', 'الرياض'),
('makkah', 'مكة المكرمة', 'Makkah', 'مكة المكرمة'),
('madinah', 'المدينة المنورة', 'Madinah', 'المدينة المنورة'),
('dammam', 'الدمام', 'Dammam', 'الشرقية'),
('khobar', 'الخبر', 'Khobar', 'الشرقية'),
('taif', 'الطائف', 'Taif', 'مكة المكرمة'),
('tabuk', 'تبوك', 'Tabuk', 'تبوك'),
('abha', 'أبها', 'Abha', 'عسير'),
('jizan', 'جيزان', 'Jizan', 'جازان'),
('hail', 'حائل', 'Hail', 'حائل'),
('buraydah', 'بريدة', 'Buraydah', 'القصيم'),
('najran', 'نجران', 'Najran', 'نجران'),
('yanbu', 'ينبع', 'Yanbu', 'المدينة المنورة'),
('arar', 'عرعر', 'Arar', 'الحدود الشمالية'),
('sakaka', 'سكاكا', 'Sakaka', 'الجوف')
ON CONFLICT (city_id) DO NOTHING;

-- تكلفة المركبات (company vehicles)
INSERT INTO master.company_vehicle_cost_profiles (vehicle_type, daily_depreciation, daily_insurance, daily_maintenance, fuel_per_km, effective_from) VALUES
('car', 45.00, 8.00, 12.00, 0.45, '2026-01-01'),
('bike', 15.00, 3.00, 5.00, 0.15, '2026-01-01'),
('van', 65.00, 12.00, 18.00, 0.65, '2026-01-01')
ON CONFLICT DO NOTHING;

-- ============================================================
-- VIEWS — واجهات عرض مفيدة
-- ============================================================

-- ربحية السائق اليومية
CREATE OR REPLACE VIEW finance.v_driver_daily_profitability AS
SELECT 
    f.driver_id,
    d.full_name_ar,
    f.platform_id,
    p.name_ar as platform_name,
    f.report_date,
    f.order_count,
    f.gross_amount,
    f.commission_amount,
    f.vat_amount,
    f.total_bonuses,
    f.total_penalties,
    f.company_vehicle_fee,
    f.net_driver_pay,
    f.gross_amount - f.net_driver_pay as company_revenue
FROM finance.platform_driver_day_fact f
JOIN master.drivers d ON d.driver_id = f.driver_id
JOIN master.platforms p ON p.platform_id = f.platform_id;

-- ملخص المنصة الشهري
CREATE OR REPLACE VIEW finance.v_platform_monthly_summary AS
SELECT 
    platform_id,
    DATE_TRUNC('month', report_date) as month,
    COUNT(DISTINCT driver_id) as active_drivers,
    SUM(order_count) as total_orders,
    SUM(gross_amount) as total_gross,
    SUM(commission_amount) as total_commission,
    SUM(vat_amount) as total_vat,
    SUM(net_driver_pay) as total_driver_pay,
    SUM(gross_amount) - SUM(net_driver_pay) as total_company_revenue
FROM finance.platform_driver_day_fact
GROUP BY platform_id, DATE_TRUNC('month', report_date);

-- رصيد محافظ السائقين
CREATE OR REPLACE VIEW finance.v_wallet_summary AS
SELECT 
    w.driver_id,
    d.full_name_ar,
    d.status as driver_status,
    w.current_balance,
    w.total_earned,
    w.total_deducted,
    w.total_paid_out,
    w.last_payout_at
FROM finance.driver_wallets w
JOIN master.drivers d ON d.driver_id = w.driver_id;

-- Function: حساب الأجر حسب effective date
CREATE OR REPLACE FUNCTION finance.get_effective_rate_card(
    p_platform_id TEXT,
    p_city_id TEXT,
    p_driver_id TEXT,
    p_report_date DATE
) RETURNS TABLE (
    rate_card_id INT,
    base_rate NUMERIC,
    commission_rate NUMERIC,
    vat_rate NUMERIC,
    company_vehicle_fee NUMERIC,
    fuel_allowance NUMERIC,
    payout_basis TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.rate_card_id,
        rc.base_rate,
        rc.commission_rate,
        rc.vat_rate,
        rc.company_vehicle_fee,
        rc.fuel_allowance,
        rc.payout_basis
    FROM finance.platform_rate_cards rc
    JOIN master.driver_contract_history dch 
        ON dch.driver_id = p_driver_id
        AND p_report_date >= dch.active_from 
        AND (dch.active_to IS NULL OR p_report_date <= dch.active_to)
    JOIN master.driver_vehicle_assignment_history dvh
        ON dvh.driver_id = p_driver_id
        AND p_report_date >= dvh.active_from
        AND (dvh.active_to IS NULL OR p_report_date <= dvh.active_to)
    WHERE rc.platform_id = p_platform_id
        AND (rc.city_id = p_city_id OR rc.city_id IS NULL)
        AND rc.contract_type = dch.contract_type
        AND rc.vehicle_type = dvh.vehicle_type
        AND rc.ownership_type = dvh.ownership_type
        AND p_report_date >= rc.effective_from
        AND (rc.effective_to IS NULL OR p_report_date <= rc.effective_to)
        AND rc.is_active = TRUE
    ORDER BY rc.city_id NULLS LAST
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- DONE
SELECT 'FLL Finance Schema v1.0 installed successfully' as status;
