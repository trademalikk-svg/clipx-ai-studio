// Supabase Edge Function: generate-video
// Health-only backend diagnostic. Video generation stays disabled to prevent unexpected usage.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST required." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const runwayKey = Deno.env.get("RUNWAY_API_KEY");

  if (!supabaseUrl || !anonKey) {
    return reply({ error: "Supabase server configuration is incomplete." }, 503);
  }

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return reply({ error: "Sign in required." }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return reply({ error: "Invalid or expired login session." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Invalid JSON body." }, 400);
  }

  if (body.action !== "health") {
    return reply({
      error: "Video generation is currently disabled. Only the health check is available.",
      generationEnabled: false,
    }, 403);
  }

  if (!runwayKey) {
    return reply({
      status: "missing_secret",
      authenticated: true,
      secretConfigured: false,
      generationRequested: false,
      error: "RUNWAY_API_KEY secret is not configured.",
    }, 503);
  }

  return reply({
    status: "connected",
    authenticated: true,
    secretConfigured: true,
    generationEnabled: false,
    generationRequested: false,
  });
});
