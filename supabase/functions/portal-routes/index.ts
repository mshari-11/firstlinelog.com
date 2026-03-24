import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(JSON.stringify({
    drivers: "https://fll.sa/login?role=driver",
    staff: "https://fll.sa/unified-login?role=staff",
    admin: "https://fll.sa/unified-login?role=admin",
    register: "https://fll.sa/register",
    forgot: "https://fll.sa/forgot-password",
    api: "https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com"
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
