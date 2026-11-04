import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://trademalikk-svg.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return hex(new Uint8Array(digest));
}
function makeToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}
const validToolId = /^[a-z0-9][a-z0-9-]{1,63}$/;

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
  if (!token) return reply({ error: "Sign in required." }, 401);

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return reply({ error: "Invalid or expired session." }, 401);
  if (!user.email || !user.email_confirmed_at) {
    return reply({ error: "A verified email address is required." }, 403);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Valid JSON body required." }, 400);
  }

  if (body.action === "create") {
    const { data: memberships, error: membershipError } = await admin.rpc("shif_a_get_membership", { p_user_id: user.id });
    if (membershipError) return reply({ error: "Owner access could not be verified." }, 503);
    const membership = Array.isArray(memberships) ? memberships[0] : null;
    if (membership?.role !== "owner") return reply({ error: "Owner access required." }, 403);

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return reply({ error: "A valid invitation email is required." }, 400);
    }
    const role = body.role === "customer" ? "customer" : "invited";
    const tools = Array.isArray(body.enabledTools) ? body.enabledTools : [];
    if (tools.length > 40 || !tools.every((item) => typeof item === "string" && validToolId.test(item))) {
      return reply({ error: "Invalid tool access list." }, 400);
    }

    const invitationToken = makeToken();
    const tokenHash = await sha256(invitationToken);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    // The database validates expires_at and enforces accepted_at IS NULL for one-time use.\n    const { data: invitationId, error } = await admin.rpc("shif_a_create_invitation", {
      p_email: email,
      p_role: role,
      p_token_hash: tokenHash,
      p_invited_by: user.id,
      p_enabled_tools: tools,
      p_expires_at: expires_at,
    });
    if (error || !invitationId) {
      console.error("SHIF-A invitation creation failed:", error?.message || "No invitation ID returned.");
      return reply({ error: "Invitation could not be created." }, 503);
    }
    return reply({
      invitationId,
      email,
      role,
      expiresAt: expires_at,
      invitationToken,
      note: "Token is shown once. Share it only with the intended recipient. Email delivery is not configured yet.",
    }, 201);
  }

  if (body.action === "accept") {
    const invitationToken = typeof body.invitationToken === "string" ? body.invitationToken.trim() : "";
    if (!/^[a-f0-9]{64}$/.test(invitationToken)) return reply({ error: "Valid invitation token required." }, 400);
    const tokenHash = await sha256(invitationToken);
    const { data, error } = await admin.rpc("shif_a_accept_invitation", {
      p_user_id: user.id,
      p_email: user.email.trim().toLowerCase(),
      p_token_hash: tokenHash,
    });
    if (error) {
      console.error("SHIF-A invitation acceptance failed:", error.message);
      return reply({ error: "Invitation acceptance is temporarily unavailable." }, 503);
    }
    const membership = Array.isArray(data) ? data[0] : null;
    if (!membership) return reply({ error: "Invitation is invalid, expired, already used, or belongs to another email." }, 409);
    return reply({
      accepted: true,
      role: membership.role,
      enabledTools: membership.enabled_tools || [],
      unlimitedPlatformCredits: membership.unlimited_platform_credits === true,
      providerQuotasApply: true,
    });
  }

  return reply({ error: "Unknown action. Use create or accept." }, 400);
});
