-- =====================================================
-- FLL Finance Engine Schema v1.0
-- فيرست لاين لوجستيكس — نظام التشغيل المالي
-- Aurora PostgreSQL 17.2 | me-south-1
-- =====================================================
-- المبادئ:
-- 1. المحرك المالي في Aurora فقط (مو Excel ولا QuickSight)
-- 2. كل rules versioned + effective-dated
-- 3. كل تعديل مالي يدوي يمر approval + audit
-- 4. السعر يُحسب من: المنصة + المدينة + نوع العقد + نوع المركبة + ملكية المركبة + تاريخ السريان
-- =====================================================

-- Schema separation
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS master;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS audit;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- MASTER DATA — البيانات المرجعية
-- =====================================================

-- المنصات
CREATE TABLE master.platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,          -- hungerstation, keeta, ninja, mrsool, toyou
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    report_grain VARCHAR(30) DEFAULT 'order_level', -- order_level | driver_day_level
    report_frequency VARCHAR(20) DEFAULT 'daily',   -- daily | weekly
    expected_report_hour INTEGER DEFAULT 10,         -- expected delivery hour UTC
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- المدن
CREATE TABLE master.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    region VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- السائقون
CREATE TABLE master.drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    national_id VARCHAR(20) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    iqama_number VARCHAR(20),
    city_id UUID REFERENCES master.cities(id),
    status VARCHAR(20) DEFAULT 'active',        -- active | suspended | terminated
    onboarded_at DATE,
    terminated_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تاريخ عقود السائقين (effective-dated)
CREATE TABLE master.driver_contract_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES master.drivers(id),
    contract_type VARCHAR(30) NOT NULL,         -- freelancer | company_sponsored | kafala | ajir
    employer_type VARCHAR(20) NOT NULL,         -- company | personal
    active_from DATE NOT NULL,
    active_to DATE,                             -- NULL = current
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100)
);

-- المركبات
CREATE TABLE master.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL,          -- car | bike | van
    brand VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    color VARCHAR(30),
    ownership_type VARCHAR(20) NOT NULL,        -- company | personal
    status VARCHAR(20) DEFAULT 'active',
    insurance_expiry DATE,
    inspection_expiry DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تاريخ تعيين المركبات للسائقين (effective-dated)
CREATE TABLE master.driver_vehicle_assignment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES master.drivers(id),
    vehicle_id UUID REFERENCES master.vehicles(id),
    vehicle_type VARCHAR(20) NOT NULL,          -- car | bike | van
    ownership_type VARCHAR(20) NOT NULL,        -- company | personal | none
    active_from DATE NOT NULL,
    active_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100)
);

-- تكلفة مركبات الشركة
CREATE TABLE master.company_vehicle_cost_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_type VARCHAR(20) NOT NULL,
    monthly_depreciation NUMERIC(10,2) DEFAULT 0,
    monthly_insurance NUMERIC(10,2) DEFAULT 0,
    monthly_maintenance NUMERIC(10,2) DEFAULT 0,
    daily_cost NUMERIC(10,2) GENERATED ALWAYS AS (
        (monthly_depreciation + monthly_insurance + monthly_maintenance) / 30.0
    ) STORED,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FINANCE — بطاقات الأسعار والقواعد المالية
-- =====================================================

-- بطاقات الأسعار حسب المنصة (effective-dated)
CREATE TABLE finance.platform_rate_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id UUID NOT NULL REFERENCES master.platforms(id),
    city_id UUID REFERENCES master.cities(id),
    contract_type VARCHAR(30) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL,
    ownership_type VARCHAR(20) NOT NULL,
    payout_basis VARCHAR(30) NOT NULL,          -- per_order | per_day | per_hour | target_based
    base_rate NUMERIC(10,2) NOT NULL,
    company_vehicle_fee NUMERIC(10,2) DEFAULT 0,
    fuel_allowance NUMERIC(10,2) DEFAULT 0,
    maintenance_cost_rule JSONB,
    bonus_formula JSONB,
    penalty_formula JSONB,
    commission_rate NUMERIC(5,2) DEFAULT 12.00,  -- FLL commission %
    vat_rate NUMERIC(5,2) DEFAULT 15.00,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    version INTEGER DEFAULT 1
);

-- قواعد الحوافز
CREATE TABLE finance.platform_bonus_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id UUID NOT NULL REFERENCES master.platforms(id),
    city_id UUID REFERENCES master.cities(id),
    rule_name VARCHAR(100) NOT NULL,
    rule_name_ar VARCHAR(100),
    condition_json JSONB NOT NULL,              -- {"min_orders": 50, "period": "weekly"}
    bonus_amount NUMERIC(10,2),
    bonus_percentage NUMERIC(5,2),
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- قواعد الخصومات/الجزاءات
CREATE TABLE finance.platform_penalty_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id UUID NOT NULL REFERENCES master.platforms(id),
    penalty_type VARCHAR(50) NOT NULL,          -- late_delivery | order_cancel | customer_complaint | no_show
    penalty_name_ar VARCHAR(100),
    deduction_amount NUMERIC(10,2),
    deduction_percentage NUMERIC(5,2),
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGING — البيانات الخام من الملفات
-- =====================================================

-- سجل الملفات المرفوعة
CREATE TABLE staging.file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    platform_id UUID REFERENCES master.platforms(id),
    platform_code VARCHAR(50) NOT NULL,
    report_date DATE NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64),                     -- SHA-256
    file_size_bytes BIGINT,
    template_version VARCHAR(20),
    row_count INTEGER,
    status VARCHAR(30) DEFAULT 'uploaded',      -- uploaded | validating | valid | invalid | processed | quarantine
    error_message TEXT,
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    UNIQUE(platform_code, report_date, file_hash)
);

-- Template Registry — تعريف أعمدة كل منصة
CREATE TABLE staging.platform_file_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id UUID REFERENCES master.platforms(id),
    platform_code VARCHAR(50) NOT NULL,
    template_version VARCHAR(20) NOT NULL,
    expected_columns JSONB NOT NULL,
    column_mapping JSONB NOT NULL,              -- maps platform columns to canonical names
    grain_type VARCHAR(30) NOT NULL,            -- order_level | driver_day_level
    active_from DATE NOT NULL,
    active_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform_code, template_version)
);

-- بيانات خام من الملفات
CREATE TABLE staging.platform_reports_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(50) NOT NULL REFERENCES staging.file_uploads(batch_id),
    row_number INTEGER,
    raw_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- بيانات موحدة بعد التنظيف
CREATE TABLE staging.platform_reports_staging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(50) NOT NULL,
    platform_code VARCHAR(50) NOT NULL,
    report_date DATE NOT NULL,
    driver_id UUID REFERENCES master.drivers(id),
    driver_external_id VARCHAR(50),             -- ID from platform
    order_id VARCHAR(100),
    grain_type VARCHAR(30) NOT NULL,
    gross_amount NUMERIC(10,2),
    platform_commission NUMERIC(10,2),
    net_to_driver NUMERIC(10,2),
    delivery_count INTEGER DEFAULT 1,
    city_code VARCHAR(30),
    status VARCHAR(30) DEFAULT 'staged',        -- staged | enriched | calculated | posted
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FINANCE — الحقائق المالية (Fact Tables)
-- =====================================================

-- حقائق الطلبات (order-level)
CREATE TABLE finance.platform_orders_fact (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(50) NOT NULL,
    platform_id UUID NOT NULL REFERENCES master.platforms(id),
    driver_id UUID NOT NULL REFERENCES master.drivers(id),
    order_id VARCHAR(100),
    report_date DATE NOT NULL,
    city_id UUID REFERENCES master.cities(id),
    -- Effective-dated context at time of order
    contract_type VARCHAR(30),
    vehicle_type VARCHAR(20),
    ownership_type VARCHAR(20),
    rate_card_id UUID REFERENCES finance.platform_rate_cards(id),
    -- Amounts
    gross_amount NUMERIC(10,2) NOT NULL,
    platform_commission NUMERIC(10,2) DEFAULT 0,
    fll_commission NUMERIC(10,2) DEFAULT 0,
    vat_amount NUMERIC(10,2) DEFAULT 0,
    bonus_amount NUMERIC(10,2) DEFAULT 0,
    penalty_amount NUMERIC(10,2) DEFAULT 0,
    vehicle_cost NUMERIC(10,2) DEFAULT 0,
    net_driver_earning NUMERIC(10,2) NOT NULL,
    -- Metadata
    grain_type VARCHAR(30) DEFAULT 'order_level',
    delivery_count INTEGER DEFAULT 1,
    calculated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- حقائق يومية لكل سائق (aggregated)
CREATE TABLE finance.platform_driver_day_fact (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id UUID NOT NULL REFERENCES master.platforms(id),
    driver_id UUID NOT NULL REFERENCES master.drivers(id),
    report_date DATE NOT NULL,
    city_id UUID REFERENCES master.cities(id),
    contract_type VARCHAR(30),
    vehicle_type VARCHAR(20),
    ownership_type VARCHAR(20),
    total_orders INTEGER DEFAULT 0,
    gross_amount NUMERIC(10,2) DEFAULT 0,
    platform_commission NUMERIC(10,2) DEFAULT 0,
    fll_commission NUMERIC(10,2) DEFAULT 0,
    vat_amount NUMERIC(10,2) DEFAULT 0,
    bonus_amount NUMERIC(10,2) DEFAULT 0,
    penalty_amount NUMERIC(10,2) DEFAULT 0,
    vehicle_cost NUMERIC(10,2) DEFAULT 0,
    net_driver_earning NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform_id, driver_id, report_date)
);

-- =====================================================
-- FINANCE — المحفظة والدفعات (Wallet & Payouts)
-- =====================================================

-- محفظة السائق
CREATE TABLE finance.driver_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID UNIQUE NOT NULL REFERENCES master.drivers(id),
    balance NUMERIC(12,2) DEFAULT 0,
    pending_balance NUMERIC(12,2) DEFAULT 0,
    total_earned NUMERIC(12,2) DEFAULT 0,
    total_paid_out NUMERIC(12,2) DEFAULT 0,
    total_deductions NUMERIC(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'SAR',
    last_payout_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- سجل حركات المحفظة (Immutable Ledger)
CREATE TABLE finance.driver_wallet_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES master.drivers(id),
    wallet_id UUID NOT NULL REFERENCES finance.driver_wallets(id),
    transaction_type VARCHAR(30) NOT NULL,      -- earning | bonus | penalty | deduction | payout | adjustment | reversal
    amount NUMERIC(12,2) NOT NULL,              -- positive = credit, negative = debit
    running_balance NUMERIC(12,2) NOT NULL,
    reference_type VARCHAR(30),                 -- order_fact | bonus_rule | penalty_rule | manual_adjustment | payout_batch
    reference_id UUID,
    description TEXT,
    description_ar TEXT,
    period_start DATE,
    period_end DATE,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    posted_by VARCHAR(100),
    -- Immutability: no UPDATE/DELETE allowed, corrections via reversal entries
    is_reversed BOOLEAN DEFAULT FALSE,
    reversal_of UUID REFERENCES finance.driver_wallet_ledger(id)
);

-- دفعات الرواتب
CREATE TABLE finance.payout_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(30) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_drivers INTEGER DEFAULT 0,
    total_amount NUMERIC(14,2) DEFAULT 0,
    payment_method VARCHAR(30) DEFAULT 'stc_bank', -- stc_bank | bank_transfer | cash
    status VARCHAR(30) DEFAULT 'draft',         -- draft | calculating | pending_review | approved | processing | completed | failed
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    exported_file_s3 VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفاصيل الدفعات
CREATE TABLE finance.driver_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES finance.payout_batches(id),
    driver_id UUID NOT NULL REFERENCES master.drivers(id),
    gross_earnings NUMERIC(12,2) NOT NULL,
    total_deductions NUMERIC(12,2) DEFAULT 0,
    fll_commission NUMERIC(12,2) DEFAULT 0,
    vat_amount NUMERIC(12,2) DEFAULT 0,
    net_payout NUMERIC(12,2) NOT NULL,
    bank_name VARCHAR(50),
    bank_iban VARCHAR(34),
    status VARCHAR(30) DEFAULT 'pending',       -- pending | approved | paid | failed
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FINANCE — التسويات والتعديلات
-- =====================================================

-- دورات التسوية
CREATE TABLE finance.reconciliation_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(50) REFERENCES staging.file_uploads(batch_id),
    platform_code VARCHAR(50) NOT NULL,
    report_date DATE NOT NULL,
    platform_total NUMERIC(14,2),               -- total from platform file
    calculated_total NUMERIC(14,2),             -- our calculated total
    variance NUMERIC(14,2),
    variance_pct NUMERIC(5,2),
    status VARCHAR(30) DEFAULT 'pending',       -- pending | matched | variance_low | variance_high | approved | rejected
    threshold_pct NUMERIC(5,2) DEFAULT 2.00,    -- acceptable variance %
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- بنود التسوية التفصيلية
CREATE TABLE finance.reconciliation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID NOT NULL REFERENCES finance.reconciliation_batches(id),
    driver_id UUID REFERENCES master.drivers(id),
    platform_amount NUMERIC(10,2),
    calculated_amount NUMERIC(10,2),
    variance NUMERIC(10,2),
    item_status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- التعديلات اليدوية
CREATE TABLE finance.manual_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES master.drivers(id),
    adjustment_type VARCHAR(30) NOT NULL,       -- credit | debit | correction | reversal
    amount NUMERIC(10,2) NOT NULL,
    reason TEXT NOT NULL,
    reason_ar TEXT,
    supporting_doc_s3 VARCHAR(500),
    status VARCHAR(30) DEFAULT 'pending',       -- pending | approved | rejected | posted
    requested_by VARCHAR(100) NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    ledger_entry_id UUID REFERENCES finance.driver_wallet_ledger(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- طلبات الاعتماد
CREATE TABLE finance.approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type VARCHAR(50) NOT NULL,          -- manual_adjustment | payout_batch | rate_card_change | reconciliation_override
    reference_id UUID NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    assigned_to VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending',       -- pending | approved | rejected | escalated
    priority VARCHAR(10) DEFAULT 'normal',      -- low | normal | high | urgent
    notes TEXT,
    decided_by VARCHAR(100),
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT — سجل التدقيق
-- =====================================================

CREATE TABLE audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_name VARCHAR(30) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL,                -- INSERT | UPDATE | DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- =====================================================
-- INDEXES — فهارس الأداء
-- =====================================================

CREATE INDEX idx_driver_contract_driver ON master.driver_contract_history(driver_id, active_from, active_to);
CREATE INDEX idx_driver_vehicle_driver ON master.driver_vehicle_assignment_history(driver_id, active_from, active_to);
CREATE INDEX idx_rate_cards_lookup ON finance.platform_rate_cards(platform_id, city_id, contract_type, vehicle_type, ownership_type, effective_from);
CREATE INDEX idx_orders_fact_driver ON finance.platform_orders_fact(driver_id, report_date);
CREATE INDEX idx_orders_fact_platform ON finance.platform_orders_fact(platform_id, report_date);
CREATE INDEX idx_driver_day_lookup ON finance.platform_driver_day_fact(driver_id, report_date);
CREATE INDEX idx_wallet_ledger_driver ON finance.driver_wallet_ledger(driver_id, posted_at);
CREATE INDEX idx_file_uploads_platform ON staging.file_uploads(platform_code, report_date);
CREATE INDEX idx_staging_reports ON staging.platform_reports_staging(batch_id, driver_id);
CREATE INDEX idx_reconciliation_date ON finance.reconciliation_batches(platform_code, report_date);
CREATE INDEX idx_audit_table ON audit.audit_log(schema_name, table_name, changed_at);

-- =====================================================
-- VIEWS — عروض مفيدة
-- =====================================================

-- عرض: الوضع الحالي لكل سائق (العقد + المركبة الفعالين الآن)
CREATE OR REPLACE VIEW finance.v_driver_current_status AS
SELECT
    d.id AS driver_id,
    d.name_ar,
    d.national_id,
    d.phone,
    c.name_ar AS city,
    dc.contract_type,
    dc.employer_type,
    dv.vehicle_type,
    dv.ownership_type,
    v.plate_number,
    w.balance AS wallet_balance,
    w.last_payout_date
FROM master.drivers d
LEFT JOIN master.cities c ON d.city_id = c.id
LEFT JOIN master.driver_contract_history dc ON dc.driver_id = d.id
    AND CURRENT_DATE BETWEEN dc.active_from AND COALESCE(dc.active_to, '2099-12-31')
LEFT JOIN master.driver_vehicle_assignment_history dv ON dv.driver_id = d.id
    AND CURRENT_DATE BETWEEN dv.active_from AND COALESCE(dv.active_to, '2099-12-31')
LEFT JOIN master.vehicles v ON dv.vehicle_id = v.id
LEFT JOIN finance.driver_wallets w ON w.driver_id = d.id
WHERE d.status = 'active';

-- عرض: ربحية يومية حسب المنصة والمدينة
CREATE OR REPLACE VIEW finance.v_daily_profitability AS
SELECT
    f.report_date,
    p.name_ar AS platform,
    c.name_ar AS city,
    f.contract_type,
    f.vehicle_type,
    f.ownership_type,
    COUNT(*) AS driver_count,
    SUM(f.total_orders) AS total_orders,
    SUM(f.gross_amount) AS total_gross,
    SUM(f.fll_commission) AS total_fll_commission,
    SUM(f.vehicle_cost) AS total_vehicle_cost,
    SUM(f.net_driver_earning) AS total_driver_earning,
    SUM(f.fll_commission) - SUM(f.vehicle_cost) AS net_profit
FROM finance.platform_driver_day_fact f
JOIN master.platforms p ON f.platform_id = p.id
LEFT JOIN master.cities c ON f.city_id = c.id
GROUP BY f.report_date, p.name_ar, c.name_ar, f.contract_type, f.vehicle_type, f.ownership_type;

-- Function: الحصول على بطاقة السعر المناسبة لسائق في تاريخ معين
CREATE OR REPLACE FUNCTION finance.get_effective_rate_card(
    p_driver_id UUID,
    p_platform_id UUID,
    p_report_date DATE
) RETURNS UUID AS $$
DECLARE
    v_contract_type VARCHAR;
    v_vehicle_type VARCHAR;
    v_ownership_type VARCHAR;
    v_city_id UUID;
    v_rate_card_id UUID;
BEGIN
    -- Get driver's contract at report date
    SELECT contract_type INTO v_contract_type
    FROM master.driver_contract_history
    WHERE driver_id = p_driver_id
      AND p_report_date BETWEEN active_from AND COALESCE(active_to, '2099-12-31')
    ORDER BY active_from DESC LIMIT 1;

    -- Get driver's vehicle at report date
    SELECT vehicle_type, ownership_type INTO v_vehicle_type, v_ownership_type
    FROM master.driver_vehicle_assignment_history
    WHERE driver_id = p_driver_id
      AND p_report_date BETWEEN active_from AND COALESCE(active_to, '2099-12-31')
    ORDER BY active_from DESC LIMIT 1;

    -- Get driver's city
    SELECT city_id INTO v_city_id FROM master.drivers WHERE id = p_driver_id;

    -- Find matching rate card
    SELECT id INTO v_rate_card_id
    FROM finance.platform_rate_cards
    WHERE platform_id = p_platform_id
      AND (city_id = v_city_id OR city_id IS NULL)
      AND contract_type = COALESCE(v_contract_type, 'freelancer')
      AND vehicle_type = COALESCE(v_vehicle_type, 'car')
      AND ownership_type = COALESCE(v_ownership_type, 'personal')
      AND p_report_date BETWEEN effective_from AND COALESCE(effective_to, '2099-12-31')
      AND is_active = TRUE
    ORDER BY city_id NULLS LAST, effective_from DESC
    LIMIT 1;

    RETURN v_rate_card_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA — بيانات أولية
-- =====================================================

-- المنصات
INSERT INTO master.platforms (code, name_ar, name_en, report_grain) VALUES
('hungerstation', 'هنقرستيشن', 'HungerStation', 'order_level'),
('keeta', 'كيتا', 'Keeta', 'order_level'),
('ninja', 'نينجا', 'Ninja', 'driver_day_level'),
('mrsool', 'مرسول', 'Mrsool', 'order_level'),
('toyou', 'تويو', 'ToYou', 'driver_day_level'),
('jahez', 'جاهز', 'Jahez', 'order_level'),
('careem', 'كريم', 'Careem', 'order_level')
ON CONFLICT (code) DO NOTHING;

-- المدن
INSERT INTO master.cities (code, name_ar, name_en, region) VALUES
('RUH', 'الرياض', 'Riyadh', 'الرياض'),
('JED', 'جدة', 'Jeddah', 'مكة المكرمة'),
('DMM', 'الدمام', 'Dammam', 'الشرقية'),
('MKK', 'مكة المكرمة', 'Makkah', 'مكة المكرمة'),
('MED', 'المدينة المنورة', 'Madinah', 'المدينة المنورة'),
('KHM', 'خميس مشيط', 'Khamis Mushait', 'عسير'),
('TAB', 'تبوك', 'Tabuk', 'تبوك'),
('ABH', 'أبها', 'Abha', 'عسير'),
('BUR', 'بريدة', 'Buraidah', 'القصيم'),
('HAI', 'حائل', 'Hail', 'حائل'),
('JUB', 'الجبيل', 'Jubail', 'الشرقية'),
('YAN', 'ينبع', 'Yanbu', 'المدينة المنورة'),
('KHO', 'الخبر', 'Khobar', 'الشرقية'),
('TAI', 'الطائف', 'Taif', 'مكة المكرمة'),
('NAJ', 'نجران', 'Najran', 'نجران'),
('JIZ', 'جازان', 'Jazan', 'جازان')
ON CONFLICT (code) DO NOTHING;

COMMENT ON SCHEMA finance IS 'FLL Financial Engine — محرك الحساب المالي الرئيسي';
COMMENT ON SCHEMA master IS 'FLL Master Data — البيانات المرجعية (سائقين، مركبات، منصات، مدن)';
COMMENT ON SCHEMA staging IS 'FLL Staging — البيانات الخام والمعالجة من ملفات المنصات';
COMMENT ON SCHEMA audit IS 'FLL Audit — سجل التدقيق لكل العمليات المالية';
