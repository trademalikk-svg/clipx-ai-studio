import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.0";

const cors = {
  "Access-Control-Allow-Origin": "https://trademalikk-svg.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const ALLOWED_EVENTS = new Set([
  "passkey_login_succeeded", "passkey_login_denied", "passkey_registered",
  "passkey_revoked", "recovery_code_generated", "recovery_code_consumed",
  "password_reset_requested", "owner_id_recovery_requested",
  "lover_name_check_succeeded", "lover_name_check_denied", "session_revoked",
]);
const SENSITIVE_KEYS = new Set(["token", "password", "secret", "credential", "biometric", "code", "lover_name"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST required." }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return reply({ error: "Server configuration is incomplete." }, 503);

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return reply({ error: "Sign in required." }, 401);
  const token = authorization.slice(7).trim();
  if (!token || token.length > 8192) return reply({ error: "Sign in required." }, 401);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 2048) return reply({ error: "Request is too large." }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid body");
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }

  const eventType = body.event_type;
  const outcome = body.outcome;
  const metadata = body.metadata === undefined ? {} : body.metadata;
  if (typeof eventType !== "string" || !ALLOWED_EVENTS.has(eventType)
      || !["allowed", "denied", "error"].includes(String(outcome))) {
    return reply({ error: "Unsupported security event." }, 400);
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return reply({ error: "Invalid event metadata." }, 400);
  }
  const safeMetadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase()) || !["method", "device_label", "reason"].includes(key)) {
      return reply({ error: "Sensitive or unsupported metadata is not accepted." }, 400);
    }
    if (typeof value !== "string" || value.length > 80) return reply({ error: "Invalid metadata value." }, 400);
    safeMetadata[key] = value;
  }

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user || !user.email_confirmed_at) return reply({ error: "Verified sign-in required." }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: membershipData, error: membershipError } = await admin.rpc("shif_a_get_membership", { p_user_id: user.id });
  if (membershipError) {
    console.error("SHIF-A audit membership lookup failed:", membershipError.message);
    return reply({ error: "Security service is temporarily unavailable." }, 503);
  }
  const membership = Array.isArray(membershipData) ? membershipData[0] : null;
  if (membership?.role !== "owner") return reply({ error: "Owner access required." }, 403);

  const { error: auditError } = await admin.rpc("shif_a_write_security_event", {
    p_actor_user_id: user.id,
    p_event_type: eventType,
    p_outcome: outcome,
    p_metadata: safeMetadata,
  });
  if (auditError) {
    console.error("SHIF-A audit write failed:", auditError.message);
    return reply({ error: "Security event could not be recorded." }, 503);
  }
  return reply({ recorded: true });
});
