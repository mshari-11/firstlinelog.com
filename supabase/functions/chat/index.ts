import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, role, userId, context } = await req.json();
    const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt based on role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let systemPrompt = `أنت مساعد ذكي لشركة فيرست لاين لوجستيكس (First Line Logistics).
شركة سعودية متخصصة في خدمات التوصيل اللوجستية.
أجب دائماً بالعربية بشكل مختصر ومفيد.
لا تستخدم markdown أو نجوم (**) في ردودك، استخدم نص عادي فقط.`;

    let dbContext = "";

    if (role === "admin" || role === "owner" || role === "staff") {
      // Fetch admin context
      const [couriersRes, ordersRes, complaintsRes] = await Promise.all([
        supabase.from("couriers_2026_02_17_21_00").select("id, full_name, status, city", { count: "exact" }),
        supabase.from("orders_2026_02_17_21_00").select("id, status, platform", { count: "exact" }),
        supabase.from("complaints_requests").select("id, status, type", { count: "exact" }),
      ]);

      const couriers = couriersRes.data || [];
      const totalCouriers = couriersRes.count || 0;
      const activeCouriers = couriers.filter((c: any) => c.status === "active").length;
      const pendingCouriers = couriers.filter((c: any) => c.status === "pending").length;
      const totalOrders = ordersRes.count || 0;
      const openComplaints = (complaintsRes.data || []).filter((c: any) => c.status === "open").length;

      dbContext = `
بيانات النظام الحالية:
- إجمالي المناديب: ${totalCouriers} (نشط: ${activeCouriers}, بانتظار الموافقة: ${pendingCouriers})
- إجمالي الطلبات: ${totalOrders}
- الشكاوى المفتوحة: ${openComplaints}
- المدن: ${[...new Set(couriers.map((c: any) => c.city).filter(Boolean))].join("، ")}
`;

      systemPrompt += `
أنت مساعد الإدارة. لديك صلاحية الوصول لبيانات النظام.
يمكنك مساعدة المدير في:
- مراجعة إحصائيات المناديب والطلبات
- تقديم تقارير وتحليلات
- الإجابة على أسئلة حول العمليات
- اقتراح تحسينات
${dbContext}`;
    } else if (role === "courier") {
      // Fetch courier-specific data
      const { data: courierData } = await supabase
        .from("couriers_2026_02_17_21_00")
        .select("full_name, phone, city, status, username")
        .eq("user_id", userId)
        .single();

      const { data: orderData, count: orderCount } = await supabase
        .from("orders_2026_02_17_21_00")
        .select("id, order_number, status, platform, delivery_location, created_at", { count: "exact" })
        .eq("courier_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (courierData) {
        dbContext = `
بيانات المندوب:
- الاسم: ${courierData.full_name}
- المدينة: ${courierData.city}
- الحالة: ${courierData.status === "active" ? "نشط" : courierData.status === "pending" ? "بانتظار التفعيل" : "غير نشط"}
- اسم المستخدم: ${courierData.username}
- عدد الطلبات: ${orderCount || 0}
`;
        if (orderData && orderData.length > 0) {
          dbContext += "آخر الطلبات:\n";
          orderData.slice(0, 5).forEach((o: any) => {
            dbContext += `  - طلب #${o.order_number}: ${o.status} (${o.platform || ""}) ${o.delivery_location || ""}\n`;
          });
        }
      }

      systemPrompt += `
أنت مساعد المندوب الشخصي. تساعد المندوب في:
- الاستفسار عن طلباته وحالتها
- معرفة معلومات حسابه
- الأسئلة العامة عن الشركة وسياساتها
- المساعدة في حل المشاكل
لا تكشف بيانات مناديب آخرين أو بيانات إدارية.
${dbContext}`;
    }

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: context || [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reply = data.content?.[0]?.text || "عذراً، لم أتمكن من الرد.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
