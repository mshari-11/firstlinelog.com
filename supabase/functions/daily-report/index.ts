/**
 * Daily Operations Report — Edge Function
 * يجمع إحصائيات اليوم ويرسل ملخص للإدارة
 * يُشغّل: يومياً عبر Cron (8:00 صباحاً)
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
    const today = new Date().toISOString().split("T")[0];

    // 1. Get stats from Platform API
    const statsRes = await fetch(`${API_BASE}/stats`);
    const statsData = await statsRes.json();
    const stats = statsData.stats || {};

    // 2. Get driver locations (online count)
    const { data: onlineDrivers, count: onlineCount } = await supabase
      .from("driver_locations")
      .select("*", { count: "exact" })
      .eq("is_online", true);

    // 3. Get today's complaints
    const { count: todayComplaints } = await supabase
      .from("complaints")
      .select("*", { count: "exact" })
      .gte("created_at", today);

    // 4. Get pending applications
    const { count: pendingApps } = await supabase
      .from("driver_applications")
      .select("*", { count: "exact" })
      .eq("status", "pending");

    // 5. Build report
    const report = {
      date: today,
      generated_at: new Date().toISOString(),
      operations: {
        total_drivers: stats.drivers?.count || 0,
        online_now: onlineCount || 0,
        total_orders: stats.orders?.count || 0,
        total_complaints: stats.complaints?.count || 0,
        today_complaints: todayComplaints || 0,
        total_vehicles: stats.vehicles?.count || 0,
        total_staff: stats["staff-users"]?.count || 0,
      },
      hr: {
        pending_applications: pendingApps || 0,
      },
      system: {
        api_status: "healthy",
        region: "us-east-1",
        database: "Supabase + DynamoDB",
      },
    };

    // 6. Save report to Supabase
    await supabase.from("daily_reports").insert({
      report_date: today,
      data: report,
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      report,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
