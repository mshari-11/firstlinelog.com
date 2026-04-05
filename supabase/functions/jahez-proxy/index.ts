/**
 * Jahez/Saned API Proxy — Supabase Edge Function
 * Authenticates with Keycloak SSO and proxies requests to Saned gateway.
 * Bypasses CORS restrictions for the FLL admin panel.
 *
 * Usage from frontend:
 *   POST /functions/v1/jahez-proxy
 *   Body: { "action": "auth" | "drivers" | "stats" | "profile" | "lookups", "page": 0, "size": 100 }
 *
 * Auth flow: Keycloak password grant → access_token → Saned gateway API
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const KEYCLOAK_URL = "https://sso.jahez.net/auth/realms/merchant/protocol/openid-connect/token";
const KEYCLOAK_CLIENT = "saned-merchant";
const GATEWAY_BASE = "https://gateway.saned.io/api/v1/drivers-management-portal";

const JAHEZ_USERNAME = Deno.env.get("JAHEZ_USERNAME") || "";
const JAHEZ_PASSWORD = Deno.env.get("JAHEZ_PASSWORD") || "";
const PROVIDER_ID = Deno.env.get("JAHEZ_PROVIDER_ID") || "20524";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache token in memory (edge function instance)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: KEYCLOAK_CLIENT,
    username: JAHEZ_USERNAME,
    password: JAHEZ_PASSWORD,
  });

  const res = await fetch(KEYCLOAK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Keycloak auth failed: ${res.status} — ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const expiresIn = data.expires_in || 300; // default 5 min

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return cachedToken.token;
}

async function sanedRequest(endpoint: string, params?: Record<string, string>, passedToken?: string): Promise<any> {
  // Use passed token (from browser) or fall back to Keycloak auth
  const token = passedToken || await getAccessToken();

  let url = `${GATEWAY_BASE}/${endpoint}`;
  if (params) {
    url += "?" + new URLSearchParams(params).toString();
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Saned API ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json();
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, page, size, status, availability, token: clientToken } = await req.json();

    // Use client-provided token (from browser Saned session) or server-side Keycloak auth
    const useToken = clientToken || undefined;

    if (!clientToken && (!JAHEZ_USERNAME || !JAHEZ_PASSWORD)) {
      return new Response(
        JSON.stringify({ error: "أرسل token من المتصفح أو اضبط بيانات Keycloak" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let result: any;

    switch (action) {
      case "auth":
        if (clientToken) {
          result = { authenticated: true, mode: "client_token", tokenLength: clientToken.length };
        } else {
          const token = await getAccessToken();
          result = { authenticated: true, mode: "keycloak", tokenLength: token.length };
        }
        break;

      case "profile":
        result = await sanedRequest(`delivery-providers/${PROVIDER_ID}/details`, undefined, useToken);
        break;

      case "stats":
        result = await sanedRequest("delivery-providers/active-inactive", undefined, useToken);
        break;

      case "drivers": {
        const params: Record<string, string> = {
          page: String(page ?? 0),
          size: String(size ?? 100),
        };
        if (status) params.status = status;
        if (availability) params.availability = availability;
        result = await sanedRequest("delivery-providers/driver-list", params, useToken);
        break;
      }

      case "drivers-all": {
        const allDrivers: any[] = [];
        let currentPage = 0;
        const pageSize = 100;
        let totalFetched = 0;
        let hasMore = true;

        while (hasMore) {
          const batch = await sanedRequest("delivery-providers/driver-list", {
            page: String(currentPage),
            size: String(pageSize),
          }, useToken);

          let drivers: any[] = [];
          let totalElements = 0;

          if (Array.isArray(batch)) {
            drivers = batch;
            totalElements = batch.length;
          } else if (batch && typeof batch === "object") {
            drivers = batch.content || batch.drivers || batch.data || [];
            totalElements = batch.totalElements || batch.total || 0;
          }

          allDrivers.push(...drivers);
          totalFetched += drivers.length;
          currentPage++;

          if (drivers.length < pageSize || (totalElements > 0 && totalFetched >= totalElements)) {
            hasMore = false;
          }
          if (currentPage > 50) break;
        }

        result = {
          drivers: allDrivers,
          total: allDrivers.length,
          pages: currentPage,
        };
        break;
      }

      case "vehicle-types":
        result = await sanedRequest("lookups/vehicle-types", undefined, useToken);
        break;

      case "cities":
        result = await sanedRequest("lookups/cities-by-country-codes", { countryCodes: "SA" }, useToken);
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
    console.error("[jahez-proxy] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
