/**
 * Auto Payroll Calculator — Edge Function
 * يحسب رواتب السائقين تلقائياً بناءً على القواعد المحاسبية
 * يُشغّل: يدوياً أو عبر Cron (آخر كل شهر)
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const API_BASE = Deno.env.get("API_BASE") || "https://k8d4arcxu4.execute-api.us-east-1.amazonaws.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json().catch(() => ({}));
    const period = body.period || new Date().toISOString().slice(0, 7); // YYYY-MM

    // 1. Get all active drivers from DynamoDB via Platform API
    const driversRes = await fetch(`${API_BASE}/drivers?limit=500`);
    const driversData = await driversRes.json();
    const drivers = (driversData.items || []).filter((d: any) => d.status === "active");

    // 2. Get accounting rules from DynamoDB
    const rulesRes = await fetch(`${API_BASE}/accounting-rules?limit=100`);
    const rulesData = await rulesRes.json();
    const rules = (rulesData.items || []).filter((r: any) => r.is_active !== false)
      .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));

    // 3. Get orders count per driver from DynamoDB
    const ordersRes = await fetch(`${API_BASE}/orders?limit=500`);
    const ordersData = await ordersRes.json();
    const orders = ordersData.items || [];

    // 4. Calculate payroll for each driver
    const payroll = drivers.map((driver: any) => {
      const driverOrders = orders.filter((o: any) =>
        o.assignedDriverId === driver.driverId || o.assignedDriverId === driver.id
      );
      const orderCount = driverOrders.length;
      const rate = driver.per_order_rate || 15;
      const gross = orderCount * rate;

      let additions = 0, deductions = 0;
      const appliedRules: any[] = [];

      for (const rule of rules) {
        let applies = false;
        if (rule.scope_type === "all") applies = true;
        else if (rule.scope_type === "contract_type") {
          const vals = JSON.parse(rule.scope_value || "[]");
          applies = vals.includes(driver.contract_type);
        }
        else if (rule.scope_type === "platform") {
          const vals = JSON.parse(rule.scope_value || "[]");
          applies = vals.includes(driver.platform);
        }
        else if (rule.scope_type === "city") {
          const vals = JSON.parse(rule.scope_value || "[]");
          applies = vals.includes(driver.city);
        }
        if (!applies) continue;

        let amount = 0;
        if (rule.calc_method === "fixed") amount = rule.amount || 0;
        else if (rule.calc_method === "percentage") amount = gross * ((rule.percentage || 0) / 100);

        if (rule.component_type === "addition") additions += amount;
        else deductions += amount;

        appliedRules.push({ name: rule.name_ar, type: rule.component_type, amount: Math.round(amount) });
      }

      // Vehicle cost
      let vehicleCost = 0;
      if (driver.vehicle_ownership === "company" || driver.contract_type === "company_sponsored") {
        vehicleCost = driver.vehicle_monthly_cost || 500;
        deductions += vehicleCost;
      }

      const net = Math.max(0, Math.round(gross + additions - deductions));

      return {
        driver_id: driver.driverId || driver.id,
        name: driver.full_name || driver.name,
        phone: driver.phone,
        stc_phone: driver.stc_bank_phone_int || driver.stc_bank_phone,
        platform: driver.platform,
        contract_type: driver.contract_type,
        city: driver.city,
        order_count: orderCount,
        gross_earnings: Math.round(gross),
        total_additions: Math.round(additions),
        total_deductions: Math.round(deductions),
        vehicle_cost: vehicleCost,
        net_payout: net,
        rules_applied: appliedRules,
        period,
      };
    });

    // 5. Save to Supabase
    const batchId = `batch-${Date.now()}`;
    const { error: saveError } = await supabase.from("payroll_batches").insert({
      id: batchId,
      period,
      total_drivers: payroll.length,
      total_gross: payroll.reduce((s: number, p: any) => s + p.gross_earnings, 0),
      total_net: payroll.reduce((s: number, p: any) => s + p.net_payout, 0),
      status: "draft",
      created_at: new Date().toISOString(),
    });

    if (saveError) console.warn("Save batch error:", saveError);

    return new Response(JSON.stringify({
      success: true,
      batch_id: batchId,
      period,
      summary: {
        drivers: payroll.length,
        total_gross: payroll.reduce((s: number, p: any) => s + p.gross_earnings, 0),
        total_additions: payroll.reduce((s: number, p: any) => s + p.total_additions, 0),
        total_deductions: payroll.reduce((s: number, p: any) => s + p.total_deductions, 0),
        total_net: payroll.reduce((s: number, p: any) => s + p.net_payout, 0),
        rules_applied: rules.length,
      },
      payroll,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
