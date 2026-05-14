/**
 * Jahez/Saned API Relay Proxy — Supabase Edge Function
 * Relays requests to Saned gateway using the provided auth token.
 *
 * SECURITY (2026-05-14):
 *   - Requires a valid Supabase JWT (caller must be authenticated FLL staff/admin).
 *   - CORS restricted to firstlinelog.com / fll.sa.
 *   - The "raw" passthrough action is admin-only.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_HOST = "https://gateway.saned.io";
const DRIVERS_PORTAL = "api/v1/drivers-management-portal";
const PROVIDER_ID = "20524";

const ALLOWED_ORIGINS = new Set([
  "https://firstlinelog.com",
  "https://www.firstlinelog.com",
  "https://fll.sa",
  "https://www.fll.sa",
]);

const ALLOWED_RAW_PREFIXES = [
  "api/v1/drivers-management-portal/",
  "api/v1/payment/",
  "api/v1/analytics/",
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://firstlinelog.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function sanedRequest(endpoint: string, token: string, params?: Record<string, string>): Promise<unknown> {
  let path: string;
  if (endpoint.startsWith("api/") || endpoint.startsWith("/")) {
    path = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  } else {
    path = `${DRIVERS_PORTAL}/${endpoint}`;
  }
  let url = `${GATEWAY_HOST}/${path}`;
  if (params && Object.keys(params).length > 0) {
    url += "?" + new URLSearchParams(params).toString();
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept-Language": "ar,en;q=0.9",
      Referer: "https://sdp-portal.saned.io/",
      Origin: "https://sdp-portal.saned.io",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Saned ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

serve(async (req: Request) => {
  const cors = buildCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  // 1. Authenticate the caller against Supabase
  const authHeader = req.headers.get("Authorization") ?? "";
  const callerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!callerToken) return json({ error: "Missing Authorization header" }, 401, cors);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${callerToken}` } },
  });

  const { data: { user }, error: authErr } = await authClient.auth.getUser(callerToken);
  if (authErr || !user) return json({ error: "Invalid or expired token" }, 401, cors);

  const role =
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined) ?? "";
  const isAdmin = ["admin", "owner", "super_admin"].includes(role);
  const isStaff = isAdmin || role === "staff";
  if (!isStaff) return json({ error: "Forbidden" }, 403, cors);

  try {
    const body = await req.json();
    const { action, token, page, size, status, availability } = body;

    if (!token) {
      return json({ error: "Saned token required" }, 400, cors);
    }

    let result: unknown;

    switch (action) {
      case "auth":
        result = { authenticated: true, mode: "relay" };
        break;

      case "profile":
        result = await sanedRequest(`delivery-providers/${PROVIDER_ID}/details`, token);
        break;

      case "stats":
        result = await sanedRequest("delivery-providers/active-inactive", token, {
          DeliveryProviderId: PROVIDER_ID,
        });
        break;

      case "drivers": {
        const params: Record<string, string> = {
          DeliveryProviderId: PROVIDER_ID,
          page: String(page ?? 1),
          pageSize: String(size ?? 100),
          driverId: "",
        };
        if (status) params.driverStatus = status;
        if (availability) params.availability = availability;
        result = await sanedRequest("delivery-providers/driver-list", token, params);
        break;
      }

      case "drivers-all": {
        const allDrivers: unknown[] = [];
        let currentPage = 1;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
          const batch = await sanedRequest("delivery-providers/driver-list", token, {
            DeliveryProviderId: PROVIDER_ID,
            page: String(currentPage),
            pageSize: String(pageSize),
            driverId: "",
          });

          let drivers: unknown[] = [];
          let totalElements = 0;

          if (Array.isArray(batch)) {
            drivers = batch;
          } else if (batch && typeof batch === "object") {
            const inner = (batch as Record<string, unknown>).data ?? batch;
            const innerObj = inner as Record<string, unknown>;
            drivers = (innerObj.result ?? innerObj.content ?? innerObj.drivers ?? []) as unknown[];
            if (!Array.isArray(drivers)) drivers = [];
            totalElements = (innerObj.rowsCount ?? innerObj.totalElements ?? innerObj.total ?? 0) as number;
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
        result = await sanedRequest("lookups/cities-by-country-codes", token, { CountryCodes: "SA" });
        break;

      case "driver-payments": {
        const pParams: Record<string, string> = { DeliveryProviderId: PROVIDER_ID };
        if (page) pParams.page = String(page);
        if (size) pParams.pageSize = String(size);
        result = await sanedRequest("payment/driver-payments", token, pParams);
        break;
      }

      case "payment-summary":
        result = await sanedRequest("payment/summary", token, { DeliveryProviderId: PROVIDER_ID });
        break;

      case "accountant-report": {
        const rParams: Record<string, string> = { DeliveryProviderId: PROVIDER_ID };
        if (body.startDate) rParams.startDate = body.startDate;
        if (body.endDate) rParams.endDate = body.endDate;
        result = await sanedRequest("payment/accountant-report", token, rParams);
        break;
      }

      case "delivery-insights":
        result = await sanedRequest("analytics/delivery-insights", token, { DeliveryProviderId: PROVIDER_ID });
        break;

      case "sdp-payment-report": {
        const p = page ?? 1;
        const s = size ?? 10;
        const params: Record<string, string> = {};
        if (body.startDate) params.startDate = body.startDate;
        if (body.endDate) params.endDate = body.endDate;
        if (body.driverId) params.driverId = String(body.driverId);
        const version = body.v2 ? "v2" : "v1";
        result = await sanedRequest(
          `api/${version}/payment/transactions/sdpReport/${PROVIDER_ID}/page/${p}/pageSize/${s}`,
          token,
          params,
        );
        break;
      }

      case "accountant-report-v2": {
        const p = page ?? 1;
        const s = size ?? 10;
        const params: Record<string, string> = {};
        if (body.startDate) params.startDate = body.startDate;
        if (body.endDate) params.endDate = body.endDate;
        result = await sanedRequest(
          `api/v1/payment/settlements/accountantReport/page/${p}/pageSize/${s}`,
          token,
          params,
        );
        break;
      }

      case "accountants-list":
        result = await sanedRequest(`api/v1/payment/settlements/accountants`, token);
        break;

      case "driver-all-full":
        result = await sanedRequest(`driver/all`, token, { DeliveryProviderId: PROVIDER_ID });
        break;

      case "dispatches":
        result = await sanedRequest(`drivers/dispatches`, token);
        break;

      case "registration-requests":
        result = await sanedRequest(
          `api/v1/drivers-management/account/portal/get-registration-requests`,
          token,
        );
        break;

      case "driver-orders-report": {
        const p: Record<string, string> = { DeliveryProviderId: PROVIDER_ID };
        if (body.driverId) p.driverId = body.driverId;
        if (body.startDate) p.startDate = body.startDate;
        if (body.endDate) p.endDate = body.endDate;
        if (page) p.page = String(page);
        if (size) p.pageSize = String(size);
        result = await sanedRequest("reports/driver-orders-report", token, p);
        break;
      }

      case "driver-detail": {
        if (!body.driverId) throw new Error("driverId required");
        result = await sanedRequest(
          `delivery-providers/driver/${body.driverId}`,
          token,
          { DeliveryProviderId: PROVIDER_ID },
        );
        break;
      }

      case "raw": {
        if (!isAdmin) return json({ error: "raw action is admin-only" }, 403, cors);
        const rawEndpoint = body.endpoint as string;
        const rawParams = (body.params as Record<string, string>) ?? {};
        if (!rawEndpoint) throw new Error("endpoint required for raw action");
        const normalized = rawEndpoint.replace(/^\/+/, "");
        if (!ALLOWED_RAW_PREFIXES.some((p) => normalized.startsWith(p))) {
          return json({ error: "endpoint not in allowlist" }, 400, cors);
        }
        result = await sanedRequest(normalized, token, { DeliveryProviderId: PROVIDER_ID, ...rawParams });
        break;
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400, cors);
    }

    return json(result, 200, cors);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500, cors);
  }
});
