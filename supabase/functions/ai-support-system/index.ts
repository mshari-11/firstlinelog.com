// Supabase Edge Function: ai-support-system
// FLL Cloud Chat — AI assistant using Anthropic API
// Secrets needed: ANTHROPIC_API_KEY
// Deploy: supabase functions deploy ai-support-system --project-ref djebhztfewjfyyoortvv
// Set key: supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref djebhztfewjfyyoortvv

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SYSTEM_PROMPT = `أنت مساعد ذكي لشركة فيرست لاين لوجستيكس (FLL) — شركة توصيل سعودية تخدم منصات HungerStation, Keeta, Ninja, Mrsool, ToYou, Jahez, Careem.

قواعد مهمة:
- تحدث بالعربية السعودية دائماً
- كن مختصراً ومباشراً
- إذا السؤال عن مستحقات مالية: وجّه للمالية أو بوابة السائق
- إذا السؤال عن شكوى: اشرح كيف يقدم شكوى عبر النظام
- إذا السؤال عن حساب مقفل: وجّه لـ support@fll.sa
- إذا السؤال خارج نطاق الشركة: اعتذر بلطف ووجّه للسؤال المناسب

أقسام الشركة: المالية، الموارد البشرية، العمليات، المركبات، الشكاوى
المدن: الرياض، جدة، الدمام

معلومات الدعم:
- إيميل: support@fll.sa
- بوابة السائقين: fll.sa/login
- بوابة الموظفين: fll.sa/unified-login`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === "GET") {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    return new Response(
      JSON.stringify({
        function: "ai-support-system",
        status: apiKey ? "ready" : "missing_key",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "مفتاح API غير مكوّن",
        reply:
          "عذراً، خدمة الذكاء الاصطناعي غير مكوّنة حالياً. يرجى التواصل مع المسؤول.",
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json();
    const message = body.message?.trim();
    const history: Array<{ role: string; content: string }> =
      body.history || [];
    const source = body.source || "unknown";

    if (!message) {
      return new Response(JSON.stringify({ error: "الرسالة مطلوبة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build messages array (last 10 from history + current message)
    const messages: Array<{ role: string; content: string }> = [];
    const recentHistory = history.slice(-10);
    for (const h of recentHistory) {
      if (h.role === "user" || h.role === "assistant") {
        messages.push({ role: h.role, content: h.content });
      }
    }
    // Only add the current message if it's not already the last in history
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== message) {
      messages.push({ role: "user", content: message });
    }

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6-20250514",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return new Response(
        JSON.stringify({
          error: "خطأ في خدمة الذكاء الاصطناعي",
          reply: "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();
    const reply = result.content?.[0]?.text || "لم أتمكن من إنشاء رد.";

    return new Response(
      JSON.stringify({
        reply,
        model: result.model,
        source: "supabase-edge",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({
        error: "خطأ في النظام",
        reply: "عذراً، حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
