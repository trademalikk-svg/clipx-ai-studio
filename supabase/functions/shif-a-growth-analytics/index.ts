import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.0";

const CORS = {
  "Access-Control-Allow-Origin": "https://trademalikk-svg.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const OWNER_EMAIL = "trademalikk@gmail.com";
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const isoDay = (value: Date) => value.toISOString().slice(0, 10);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET") return reply({ error: "GET required." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return reply({ error: "Analytics service is not configured." }, 503);

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return reply({ error: "Sign in required." }, 401);
  const token = authorization.slice(7).trim();
  if (!token || token.length > 8192) return reply({ error: "Invalid session." }, 401);

  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user || !user.email_confirmed_at) {
    return reply({ error: "Verified sign-in required." }, 401);
  }

  // Match the existing deployed SHIF-A access function: exact confirmed owner email only.
  // Do not trust user_metadata or an undeployed membership RPC for authorization.
  if (user.email?.toLowerCase() !== OWNER_EMAIL) {
    return reply({ error: "Owner access required." }, 403);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const today = new Date();
  const from = new Date(today.getTime() - 29 * 86400000);
  const { data, error } = await admin.rpc("shif_a_get_growth_daily_counts", {
    p_from: isoDay(from),
    p_to: isoDay(today),
  });
  if (error) {
    console.error("Growth analytics query failed:", error.message);
    return reply({ error: "Signup analytics are not installed yet." }, 503);
  }
  const rows = Array.isArray(data) ? data : [];
  const total = rows.reduce((sum: number, row: { signup_count?: number | string }) => sum + Number(row.signup_count || 0), 0);
  return reply({
    period: "last_30_utc_days",
    totalVerifiedSignups: total,
    daily: rows.map((row: { day_utc: string; signup_count: number | string }) => ({
      date: row.day_utc,
      count: Number(row.signup_count || 0),
    })),
    privacy: "Daily aggregates only; no account identifiers or content are returned.",
  });
});
