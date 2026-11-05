import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.0";

const CORS = {
  "Access-Control-Allow-Origin": "https://trademalikk-svg.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
const randomHex = (size: number) => {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return hex(bytes);
};
const sha256 = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
const normalizeCode = (value: string) => value.replace(/[-\s]/g, "").toLowerCase();
const readAal = (jwt: string) => {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    return String(JSON.parse(decoded).aal || "");
  } catch { return ""; }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return respond({ error: "POST required." }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return respond({ error: "Recovery service unavailable." }, 503);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return respond({ error: "Sign in required." }, 401);
  const jwt = authHeader.slice(7).trim();
  if (!jwt || jwt.length > 8192) return respond({ error: "Sign in required." }, 401);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 2048) return respond({ error: "Request too large." }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid");
  } catch { return respond({ error: "Invalid request." }, 400); }

  const action = body.action;
  if (action !== "generate" && action !== "revoke_with_code") return respond({ error: "Unsupported action." }, 400);
  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(jwt);
  const user = authData?.user;
  if (authError || !user || !user.email_confirmed_at) return respond({ error: "Verified sign-in required." }, 401);

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, experimental: { passkey: true } },
  });
  const { data: membershipData, error: membershipError } = await admin.rpc("shif_a_get_membership", { p_user_id: user.id });
  const membership = Array.isArray(membershipData) ? membershipData[0] : null;
  if (membershipError || membership?.role !== "owner") return respond({ error: "Owner access required." }, 403);

  if (action === "generate" && readAal(jwt) !== "aal2") {
    return respond({ error: "Recovery codes बनाने से पहले authenticator MFA (AAL2) verify करें." }, 403);
  }
  const rateAction = action === "generate" ? "generate" : "consume";
  const { data: allowed, error: rateError } = await admin.rpc("shif_a_check_recovery_rate", {
    p_user_id: user.id, p_action: rateAction,
  });
  if (rateError || allowed !== true) return respond({ error: "बहुत अधिक प्रयास हुए हैं। 15 मिनट बाद दोबारा कोशिश करें." }, 429);

  if (action === "generate") {
    const rawCodes = Array.from({ length: 8 }, () => {
      const value = randomHex(16).toUpperCase();
      return value.match(/.{1,4}/g)!.join("-");
    });
    const records = await Promise.all(rawCodes.map(async code => {
      const salt = randomHex(16);
      return { salt, code_hash: await sha256(salt + ":" + normalizeCode(code)) };
    }));
    const { data: storedCount, error: storeError } = await admin.rpc("shif_a_replace_recovery_codes", {
      p_user_id: user.id, p_codes: records,
    });
    if (storeError || storedCount !== 8) {
      console.error("SHIF-A recovery-code storage failed:", storeError?.message || "Unexpected row count");
      return respond({ error: "Recovery codes save नहीं हो सके।" }, 503);
    }
    const { error: auditError } = await admin.rpc("shif_a_write_security_event", {
      p_actor_user_id: user.id, p_event_type: "recovery_code_generated",
      p_outcome: "allowed", p_metadata: { method: "aal2" },
    });
    if (auditError) return respond({ error: "Audit record could not be confirmed. Generate a fresh set before relying on these codes." }, 503);
    return respond({ codes: rawCodes, count: rawCodes.length, expires_in_days: 365, shown_once: true });
  }

  if (typeof body.code !== "string" || body.code.length < 16 || body.code.length > 64
      || typeof body.passkey_id !== "string"
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.passkey_id)) {
    return respond({ revoked: false, error: "Recovery code या passkey चयन अमान्य है।" }, 400);
  }
  const normalized = normalizeCode(body.code);
  if (!/^[a-f0-9]{32}$/.test(normalized)) return respond({ revoked: false, error: "Recovery code अमान्य है या पहले इस्तेमाल हो चुका है।" }, 400);

  const { data: verifiers, error: listError } = await admin.rpc("shif_a_list_recovery_verifiers", { p_user_id: user.id });
  if (listError || !Array.isArray(verifiers)) return respond({ error: "Recovery verification unavailable." }, 503);
  let matchedId: string | null = null;
  for (const verifier of verifiers) {
    const candidate = await sha256(String(verifier.salt) + ":" + normalized);
    if (candidate === verifier.code_hash) matchedId = verifier.id;
  }
  if (!matchedId) {
    await admin.rpc("shif_a_write_security_event", {
      p_actor_user_id: user.id, p_event_type: "recovery_code_consumed",
      p_outcome: "denied", p_metadata: { method: "passkey_revocation" },
    });
    return respond({ revoked: false, error: "Recovery code अमान्य है या पहले इस्तेमाल हो चुका है।" }, 400);
  }

  const { data: credentials, error: credentialError } = await admin.auth.admin.passkey.listPasskeys({ userId: user.id });
  if (credentialError || !Array.isArray(credentials) || !credentials.some((item: { id?: string }) => item.id === body.passkey_id)) {
    return respond({ revoked: false, error: "Selected passkey नहीं मिली। Passkey list refresh करें।" }, 404);
  }

  const { data: consumed, error: consumeError } = await admin.rpc("shif_a_consume_recovery_code", {
    p_user_id: user.id, p_code_id: matchedId,
  });
  if (consumeError || consumed !== true) return respond({ revoked: false, error: "Recovery code अमान्य है या पहले इस्तेमाल हो चुका है।" }, 409);
  const { error: deleteError } = await admin.auth.admin.passkey.deletePasskey({
    userId: user.id, passkeyId: body.passkey_id,
  });
  if (deleteError) {
    console.error("SHIF-A passkey revocation failed:", deleteError.message);
    await admin.rpc("shif_a_write_security_event", {
      p_actor_user_id: user.id, p_event_type: "recovery_code_consumed",
      p_outcome: "error", p_metadata: { method: "passkey_revocation" },
    });
    return respond({ revoked: false, code_consumed: true, error: "Code consume हुआ, लेकिन passkey revoke नहीं हो सकी। नया code generate करें और फिर प्रयास करें।" }, 503);
  }
  const { error: auditError } = await admin.rpc("shif_a_write_security_event", {
    p_actor_user_id: user.id, p_event_type: "passkey_revoked",
    p_outcome: "allowed", p_metadata: { method: "recovery_code" },
  });
  if (auditError) return respond({ revoked: true, audit_recorded: false, warning: "Passkey revoke हुई; audit confirmation विफल रही।" }, 200);
  return respond({ revoked: true, audit_recorded: true });
});
