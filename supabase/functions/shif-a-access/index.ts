import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://trademalikk-svg.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return reply({ error: "GET required." }, 405);

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

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc("shif_a_get_membership", { p_user_id: user.id });
  if (error) {
    console.error("SHIF-A access lookup failed:", error.message);
    return reply({ error: "Access profile is temporarily unavailable." }, 503);
  }

  const membership = Array.isArray(data) ? data[0] : null;
  const role = membership?.role || "unassigned";
  return reply({
    role,
    enabledTools: Array.isArray(membership?.enabled_tools) ? membership.enabled_tools : [],
    unlimitedPlatformCredits: membership?.unlimited_platform_credits === true,
    providerQuotasApply: true,
    accountEmailConfirmed: Boolean(user.email_confirmed_at),
  });
});
