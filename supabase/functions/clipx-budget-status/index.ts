import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://trademalikk-svg.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const caps: Record<string, number> = {
  cloud_processing: 50000,
  ai_highlights: 25000,
  ai_video_generation: 25000,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST required." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return reply({ error: "Server configuration is incomplete." }, 503);
  }

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return reply({ error: "Sign in required." }, 401);
  const token = authorization.slice(7).trim();
  if (!token) return reply({ error: "Sign in required." }, 401);

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return reply({ error: "Invalid or expired session." }, 401);
  if (user.app_metadata?.support_role !== "admin") {
    return reply({ error: "Admin access required." }, 403);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString().slice(0, 10);

  const { data: rows, error } = await admin
    .from("clipx_budget_reservations")
    .select("category,reserved_paise,actual_paise,status")
    .eq("month_start", monthStart);

  if (error) {
    console.error("Budget status query failed:", error.message);
    return reply({ error: "Budget status is temporarily unavailable." }, 503);
  }

  const categories: Record<string, { capPaise: number; spentPaise: number; reservedPaise: number; usedPaise: number }> = {};
  for (const [category, capPaise] of Object.entries(caps)) {
    categories[category] = { capPaise, spentPaise: 0, reservedPaise: 0, usedPaise: 0 };
  }

  for (const row of rows || []) {
    const item = categories[row.category];
    if (!item || row.status === "released") continue;
    if (row.status === "reserved") item.reservedPaise += Number(row.reserved_paise || 0);
    if (row.status === "settled") item.spentPaise += Number(row.actual_paise || 0);
  }

  let spentPaise = 0;
  let reservedPaise = 0;
  for (const item of Object.values(categories)) {
    item.usedPaise = item.spentPaise + item.reservedPaise;
    spentPaise += item.spentPaise;
    reservedPaise += item.reservedPaise;
  }

  return reply({
    monthStart,
    currency: "INR",
    total: {
      capPaise: 100000,
      spentPaise,
      reservedPaise,
      usedPaise: spentPaise + reservedPaise,
    },
    categories,
    disclaimer: "Application ledger only; not a live provider invoice or guaranteed billing cap.",
  });
});
