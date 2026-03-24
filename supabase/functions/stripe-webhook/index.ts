/**
 * stripe-webhook — Supabase Edge Function
 * Receives Stripe webhook events and processes them.
 *
 * POST /functions/v1/stripe-webhook
 * Stripe signs every webhook with STRIPE_WEBHOOK_SECRET.
 *
 * Handled events:
 *   payment_intent.succeeded      → mark order as paid in Supabase
 *   payment_intent.payment_failed → mark order as failed
 *   charge.refunded               → mark order as refunded
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

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`Processing Stripe event: ${event.type} [${event.id}]`);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await supabase
            .from("payments")
            .upsert({
              id: pi.id,
              order_id: orderId,
              amount: pi.amount / 100,
              currency: pi.currency,
              status: "succeeded",
              stripe_payment_intent_id: pi.id,
              paid_at: new Date().toISOString(),
            });
          await supabase
            .from("orders")
            .update({ payment_status: "paid", paid_at: new Date().toISOString() })
            .eq("id", orderId);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await supabase
            .from("payments")
            .upsert({
              id: pi.id,
              order_id: orderId,
              amount: pi.amount / 100,
              currency: pi.currency,
              status: "failed",
              stripe_payment_intent_id: pi.id,
              failure_reason: pi.last_payment_error?.message,
            });
          await supabase
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", orderId);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
        if (piId) {
          await supabase
            .from("payments")
            .update({ status: "refunded", refunded_at: new Date().toISOString() })
            .eq("stripe_payment_intent_id", piId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error processing webhook event:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Processing error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
