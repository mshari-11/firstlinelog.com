import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://firstlinelog.com",
  "https://www.firstlinelog.com",
  "https://fll.sa",
  "https://www.fll.sa",
]);

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://firstlinelog.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  const cors = buildCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  // 1. Authorization header required
  const authHeader = req.headers.get("Authorization") ?? "";
  const callerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!callerToken) return json({ error: "Missing Authorization header" }, 401, cors);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // 2. Verify caller via the anon client + provided token
  const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${callerToken}` } },
  });
  const { data: { user }, error: authErr } = await authClient.auth.getUser(callerToken);
  if (authErr || !user) return json({ error: "Invalid or expired token" }, 401, cors);

  // 3. Check caller is admin (looks at app_metadata.role or a roles table)
  const adminClient = createClient(supabaseUrl, serviceKey);
  const role =
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined);

  let isAdmin = role === "admin" || role === "owner" || role === "super_admin";
  if (!isAdmin) {
    // Fallback: check a role mapping table if it exists
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = ["admin", "owner", "super_admin"].includes(roleRow?.role ?? "");
  }
  if (!isAdmin) return json({ error: "Forbidden: admin role required" }, 403, cors);

  // 4. Parse + validate input
  let user_id: string | undefined;
  let password: string | undefined;
  try {
    ({ user_id, password } = await req.json());
  } catch {
    return json({ error: "Invalid JSON body" }, 400, cors);
  }
  if (!user_id || typeof user_id !== "string") return json({ error: "user_id required" }, 400, cors);
  if (!password || typeof password !== "string" || password.length < 8) {
    return json({ error: "password must be at least 8 characters" }, 400, cors);
  }

  // 5. Perform the privileged operation
  const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
  if (error) return json({ success: false, error: error.message }, 400, cors);

  // 6. Audit log (best-effort)
  await adminClient.from("audit_log").insert({
    action: "admin_set_password",
    actor_id: user.id,
    actor_email: user.email,
    target_user_id: user_id,
    created_at: new Date().toISOString(),
  }).then(() => {}).catch(() => {});

  return json({ success: true }, 200, cors);
});
