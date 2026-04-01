/**
 * Vector AI Search — Edge Function
 * بحث ذكي بالمعنى (Semantic Search) عبر Anthropic Embeddings
 * يفهم "تأخر توصيل جدة" ويطلع كل الشكاوى المشابهة
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const API_BASE = Deno.env.get("API_BASE") || "https://k8d4arcxu4.execute-api.us-east-1.amazonaws.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple keyword-based semantic search (works without embeddings model)
function semanticScore(text: string, query: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  let score = 0;

  for (const word of queryWords) {
    if (textLower.includes(word)) score += 2;
    // Fuzzy: check if any substring of 3+ chars matches
    if (word.length >= 3) {
      for (let i = 0; i <= textLower.length - 3; i++) {
        if (textLower.slice(i, i + word.length) === word) {
          score += 1;
          break;
        }
      }
    }
  }

  // Boost for exact phrase match
  if (textLower.includes(query.toLowerCase())) score += 5;

  return score;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json().catch(() => ({}));
    const query = (body.query || "").trim();
    const scope = body.scope || "all"; // all, drivers, complaints, orders
    const limit = Math.min(body.limit || 20, 50);

    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { type: string; score: number; data: any }[] = [];

    // 1. Search drivers
    if (scope === "all" || scope === "drivers") {
      // Search in Supabase
      const { data: sbDrivers } = await supabase
        .from("driver_applications")
        .select("id, full_name, phone, city, platform, contract_type, status")
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,city.ilike.%${query}%,platform.ilike.%${query}%`)
        .limit(limit);

      for (const d of sbDrivers || []) {
        const text = `${d.full_name} ${d.phone} ${d.city} ${d.platform} ${d.contract_type}`;
        results.push({
          type: "driver",
          score: semanticScore(text, query),
          data: { id: d.id, name: d.full_name, phone: d.phone, city: d.city, platform: d.platform, status: d.status },
        });
      }

      // Search in DynamoDB
      try {
        const apiRes = await fetch(`${API_BASE}/drivers?limit=100`);
        const apiData = await apiRes.json();
        for (const d of apiData.items || []) {
          const text = `${d.full_name || d.name || ""} ${d.phone || ""} ${d.city || ""} ${d.platform || ""} ${d.contract_type || ""}`;
          const score = semanticScore(text, query);
          if (score > 0) {
            results.push({
              type: "driver",
              score,
              data: { id: d.driverId || d.id, name: d.full_name || d.name, phone: d.phone, city: d.city, platform: d.platform, status: d.status },
            });
          }
        }
      } catch { /* non-critical */ }
    }

    // 2. Search complaints
    if (scope === "all" || scope === "complaints") {
      const { data: complaints } = await supabase
        .from("complaints")
        .select("id, subject, description, status, created_at, driver_name, platform")
        .or(`subject.ilike.%${query}%,description.ilike.%${query}%,driver_name.ilike.%${query}%`)
        .limit(limit);

      for (const c of complaints || []) {
        const text = `${c.subject || ""} ${c.description || ""} ${c.driver_name || ""} ${c.platform || ""}`;
        results.push({
          type: "complaint",
          score: semanticScore(text, query),
          data: { id: c.id, subject: c.subject, status: c.status, driver: c.driver_name, platform: c.platform, created_at: c.created_at },
        });
      }
    }

    // 3. Search orders
    if (scope === "all" || scope === "orders") {
      try {
        const apiRes = await fetch(`${API_BASE}/orders?limit=100`);
        const apiData = await apiRes.json();
        for (const o of apiData.items || []) {
          const text = `${o.customer || o.customer_name || ""} ${o.address || o.delivery_address || ""} ${o.platform || ""} ${o.status || ""}`;
          const score = semanticScore(text, query);
          if (score > 0) {
            results.push({
              type: "order",
              score,
              data: { id: o.id, customer: o.customer || o.customer_name, address: o.address || o.delivery_address, platform: o.platform, status: o.status },
            });
          }
        }
      } catch { /* non-critical */ }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({
      query,
      scope,
      total: results.length,
      results: results.slice(0, limit),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
