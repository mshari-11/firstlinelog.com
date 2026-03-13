-- ============================================================
-- 007: Finance Analytical Views + Rate Card Function
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
