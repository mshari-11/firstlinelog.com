/**
 * Jahez/Saned API Relay Proxy — Supabase Edge Function
 * Simply relays requests to Saned gateway using the provided auth token.
 * No Keycloak auth needed — frontend provides the token.
 * Bypasses CORS restrictions.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GATEWAY_BASE = "https://gateway.saned.io/api/v1/drivers-management-portal";
const PROVIDER_ID = "20524";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sanedRequest(endpoint: string, token: string, params?: Record<string, string>): Promise<any> {
  let url = `${GATEWAY_BASE}/${endpoint}`;
  if (params) url += "?" + new URLSearchParams(params).toString();

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept-Language": "ar,en;q=0.9",
      "Referer": "https://sdp-portal.saned.io/",
      "Origin": "https://sdp-portal.saned.io",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Saned ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, token, page, size, status, availability } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "token مطلوب" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let result: any;

    switch (action) {
      case "auth":
        result = { authenticated: true, mode: "relay" };
        break;

      case "profile":
        result = await sanedRequest(`delivery-providers/${PROVIDER_ID}/details`, token);
        break;

      case "stats":
        result = await sanedRequest("delivery-providers/active-inactive", token);
        break;

      case "drivers": {
        const params: Record<string, string> = {
          page: String(page ?? 0),
          size: String(size ?? 100),
        };
        if (status) params.status = status;
        if (availability) params.availability = availability;
        result = await sanedRequest("delivery-providers/driver-list", token, params);
        break;
      }

      case "drivers-all": {
        const allDrivers: any[] = [];
        let currentPage = 0;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
          const batch = await sanedRequest("delivery-providers/driver-list", token, {
            page: String(currentPage),
            size: String(pageSize),
          });

          let drivers: any[] = [];
          let totalElements = 0;

          if (Array.isArray(batch)) {
            drivers = batch;
          } else if (batch && typeof batch === "object") {
            drivers = batch.content || batch.drivers || batch.data || [];
            totalElements = batch.totalElements || batch.total || 0;
          }

          allDrivers.push(...drivers);
          currentPage++;

          if (drivers.length < pageSize || (totalElements > 0 && allDrivers.length >= totalElements)) {
            hasMore = false;
          }
          if (currentPage > 50) break;
        }

        result = { drivers: allDrivers, total: allDrivers.length, pages: currentPage };
        break;
      }

      case "vehicle-types":
        result = await sanedRequest("lookups/vehicle-types", token);
        break;

      case "cities":
        result = await sanedRequest("lookups/cities-by-country-codes", token, { countryCodes: "SA" });
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[jahez-proxy]", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
