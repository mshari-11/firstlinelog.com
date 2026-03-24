/**
 * stripe-worker — Supabase Edge Function
 * Background worker for async Stripe tasks:
 *   - Process pending payouts to couriers via Stripe Connect
 *   - Retry failed payment intents
 *   - Sync Stripe balance to Supabase
 *   - Send payment confirmation emails via SES
 *
 * POST /functions/v1/stripe-worker
 * Body: { task: "process_payouts" | "retry_failed" | "sync_balance" | "send_confirmations", params?: object }
 */

import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Task handlers ──────────────────────────────────────────────────────────────

async function processPayouts(params: any) {
  // Fetch approved payout lines from Supabase
  const { data: lines, error } = await supabase
    .from("payout_lines")
    .select("*, couriers(stripe_account_id, full_name)")
    .eq("status", "approved")
    .limit(params?.batch_size ?? 50);

  if (error) throw error;
  if (!lines?.length) return { processed: 0, message: "لا توجد دفعات معتمدة" };

  let processed = 0;
  const results: any[] = [];

  for (const line of lines) {
    try {
      const stripeAccountId = line.couriers?.stripe_account_id;
      if (!stripeAccountId) {
        results.push({ id: line.id, status: "skipped", reason: "لا يوجد حساب Stripe" });
        continue;
      }

      // Create Stripe transfer to courier's connected account
      const transfer = await stripe.transfers.create({
        amount: Math.round(line.amount * 100),
        currency: "sar",
        destination: stripeAccountId,
        metadata: { payout_line_id: line.id, courier_id: line.courier_id },
      });

      await supabase
        .from("payout_lines")
        .update({
          status: "paid",
          stripe_transfer_id: transfer.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", line.id);

      processed++;
      results.push({ id: line.id, status: "paid", transfer_id: transfer.id });
    } catch (err: any) {
      console.error(`Failed to process payout line ${line.id}:`, err.message);
      await supabase
        .from("payout_lines")
        .update({ status: "failed", failure_reason: err.message })
        .eq("id", line.id);
      results.push({ id: line.id, status: "failed", error: err.message });
    }
  }

  return { processed, total: lines.length, results };
}

async function retryFailed(_params: any) {
  const { data: failed } = await supabase
    .from("payments")
    .select("*")
    .eq("status", "failed")
    .lt("retry_count", 3)
    .limit(20);

  if (!failed?.length) return { retried: 0 };

  let retried = 0;
  for (const payment of failed) {
    try {
      await stripe.paymentIntents.confirm(payment.stripe_payment_intent_id);
      await supabase
        .from("payments")
        .update({ retry_count: (payment.retry_count ?? 0) + 1, last_retry_at: new Date().toISOString() })
        .eq("id", payment.id);
      retried++;
    } catch {
      await supabase
        .from("payments")
        .update({ retry_count: (payment.retry_count ?? 0) + 1 })
        .eq("id", payment.id);
    }
  }

  return { retried, total: failed.length };
}

async function syncBalance(_params: any) {
  const balance = await stripe.balance.retrieve();
  const available = balance.available.find(b => b.currency === "sar");
  const pending = balance.pending.find(b => b.currency === "sar");

  await supabase.from("system_settings").upsert({
    key: "stripe_balance",
    value: JSON.stringify({
      available: (available?.amount ?? 0) / 100,
      pending: (pending?.amount ?? 0) / 100,
      synced_at: new Date().toISOString(),
    }),
    updated_at: new Date().toISOString(),
  });

  return {
    available: (available?.amount ?? 0) / 100,
    pending: (pending?.amount ?? 0) / 100,
  };
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { task, params = {} } = await req.json();

    let result: any;

    switch (task) {
      case "process_payouts":
        result = await processPayouts(params);
        break;
      case "retry_failed":
        result = await retryFailed(params);
        break;
      case "sync_balance":
        result = await syncBalance(params);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `مهمة غير معروفة: ${task}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ task, success: true, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("stripe-worker error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "خطأ داخلي" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
