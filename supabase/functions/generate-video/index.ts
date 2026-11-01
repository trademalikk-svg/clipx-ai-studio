// Supabase Edge Function: generate-video
// Secure Runway text-to-video proxy. Keep RUNWAY_API_KEY server-side only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST required." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const runwayKey = Deno.env.get("RUNWAY_API_KEY");
  if (!supabaseUrl || !anonKey) return reply({ error: "Supabase server configuration is incomplete." }, 503);
  if (!runwayKey) return reply({ status: "missing_secret", error: "RUNWAY_API_KEY secret is not configured." }, 503);

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return reply({ error: "Sign in required." }, 401);
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return reply({ error: "Invalid or expired login session." }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply({ error: "Invalid JSON body." }, 400); }

  const action = body.action;
  if (action === "health") return reply({ status: "connected", provider: "Runway", authenticated: true });

  const headers = {
    "Authorization": `Bearer ${runwayKey}`,
    "X-Runway-Version": "2024-11-06",
    "Content-Type": "application/json",
  };

  if (action === "create") {
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const ratio = body.ratio;
    if (!prompt || prompt.length > 1000) return reply({ error: "Prompt must contain 1–1000 characters." }, 400);
    if (!["720:1280", "1280:720", "960:960"].includes(String(ratio))) {
      return reply({ error: "Unsupported video ratio." }, 400);
    }

    const response = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers,
      body: JSON.stringify({ model: "gen4.5", promptText: prompt, ratio, duration: 5 }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof data?.error === "string" ? data.error : "Runway rejected the generation request.";
      return reply({ error: message, providerStatus: response.status }, response.status === 429 ? 429 : 502);
    }
    if (!data?.id) return reply({ error: "Runway response did not include a task ID." }, 502);
    return reply({ taskId: data.id, status: data.status || "PENDING", estimatedCost: data.estimatedCost || null });
  }

  if (action === "status") {
    const taskId = typeof body.taskId === "string" ? body.taskId : "";
    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(taskId)) return reply({ error: "Invalid task ID." }, 400);
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(taskId)}`, { headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return reply({ error: data?.error || "Could not read generation status.", providerStatus: response.status }, 502);
    const videoUrl = Array.isArray(data.output) && typeof data.output[0] === "string" ? data.output[0] : null;
    return reply({ taskId, status: data.status, videoUrl, failure: data.failure || data.failureCode || null });
  }

  return reply({ error: "Unsupported action. Use health, create, or status." }, 400);
});
