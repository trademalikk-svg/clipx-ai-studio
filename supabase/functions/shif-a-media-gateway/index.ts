import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.0";

const CORS = {
  "Access-Control-Allow-Origin": "https://trademalikk-svg.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const encoder = new TextEncoder();
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
const unb64url = (value: string) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4)), c => c.charCodeAt(0));
async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}
async function makeTaskToken(userId: string, predictionId: string, secret: string) {
  const payload = b64url(encoder.encode(JSON.stringify({ u: userId, p: predictionId, e: Date.now() + 24 * 60 * 60 * 1000 })));
  return payload + "." + await sign(payload, secret);
}
async function readTaskToken(token: string, secret: string, userId: string) {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) throw new Error("Invalid task token.");
  const expected = await sign(payload, secret);
  const a = encoder.encode(signature), b = encoder.encode(expected);
  if (a.length !== b.length || !crypto.subtle.timingSafeEqual) {
    if (signature !== expected) throw new Error("Invalid task token.");
  } else if (!crypto.subtle.timingSafeEqual(a, b)) throw new Error("Invalid task token.");
  const data = JSON.parse(new TextDecoder().decode(unb64url(payload)));
  if (data.u !== userId || typeof data.p !== "string" || data.e < Date.now()) throw new Error("Task token expired or belongs to another account.");
  return data.p as string;
}
function safeModel(value: string | undefined) {
  return !!value && /^[a-z0-9][a-z0-9._-]{1,80}\/([a-z0-9][a-z0-9._-]{1,80})$/i.test(value);
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ error: "POST required." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const token = Deno.env.get("SHIF_A_REPLICATE_API_TOKEN");
  const taskSecret = Deno.env.get("SHIF_A_MEDIA_TASK_SECRET");
  if (!supabaseUrl || !anonKey || !token || !taskSecret || taskSecret.length < 32) {
    return reply({ error: "Cloud media is not configured yet. No provider has been activated." }, 503);
  }
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return reply({ error: "Sign in required." }, 401);
  const jwt = authHeader.slice(7).trim();
  if (!jwt || jwt.length > 8192) return reply({ error: "Invalid session." }, 401);
  const auth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await auth.auth.getUser(jwt);
  if (error || !data.user || !data.user.email_confirmed_at) return reply({ error: "Verified sign-in required." }, 401);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 12000) return reply({ error: "Request too large." }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid");
  } catch { return reply({ error: "Invalid request body." }, 400); }

  const action = body.action;
  if (action === "create") {
    const kind = body.kind;
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (kind !== "image" && kind !== "video") return reply({ error: "Unsupported media type." }, 400);
    if (!prompt || prompt.length > 1800) return reply({ error: "Prompt must contain 1–1800 characters." }, 400);
    const model = kind === "image" ? Deno.env.get("SHIF_A_REPLICATE_IMAGE_MODEL") : Deno.env.get("SHIF_A_REPLICATE_VIDEO_MODEL");
    if (!safeModel(model)) return reply({ error: kind === "image" ? "Image model is not configured." : "Video model is not configured." }, 503);
    const input: Record<string, unknown> = { prompt };
    if (kind === "image") {
      const ratio = typeof body.aspect_ratio === "string" ? body.aspect_ratio : "1:1";
      if (!["1:1", "16:9", "9:16", "4:5", "3:2", "2:3"].includes(ratio)) return reply({ error: "Unsupported image aspect ratio." }, 400);
      input.aspect_ratio = ratio;
      if (typeof body.negative_prompt === "string" && body.negative_prompt.trim()) input.negative_prompt = body.negative_prompt.trim().slice(0, 800);
    } else {
      const duration = Number(body.duration);
      const ratio = typeof body.aspect_ratio === "string" ? body.aspect_ratio : "16:9";
      if (![5, 10].includes(duration)) return reply({ error: "Video duration must be 5 or 10 seconds." }, 400);
      if (!["16:9", "9:16", "1:1"].includes(ratio)) return reply({ error: "Unsupported video aspect ratio." }, 400);
      input.duration = duration;
      input.aspect_ratio = ratio;
    }
    const response = await fetch("https://api.replicate.com/v1/models/" + model + "/predictions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Prefer": "wait=1" },
      body: JSON.stringify({ input }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Replicate create failed:", response.status, result.detail || result.title || "provider error");
      return reply({ error: "Provider could not start the generation. Check the configured model and provider account." }, response.status === 429 ? 429 : 502);
    }
    if (typeof result.id !== "string") return reply({ error: "Provider returned an invalid task." }, 502);
    const task_token = await makeTaskToken(data.user.id, result.id, taskSecret);
    return reply({ task_token, status: result.status || "starting", output: result.output || null });
  }

  if (action === "status") {
    if (typeof body.task_token !== "string" || body.task_token.length > 2048) return reply({ error: "Task token required." }, 400);
    let predictionId: string;
    try { predictionId = await readTaskToken(body.task_token, taskSecret, data.user.id); }
    catch { return reply({ error: "Invalid, expired or unauthorized task token." }, 403); }
    const response = await fetch("https://api.replicate.com/v1/predictions/" + encodeURIComponent(predictionId), {
      headers: { "Authorization": "Bearer " + token },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return reply({ error: "Could not retrieve generation status." }, 502);
    return reply({ status: result.status || "unknown", output: result.output || null,
      error: result.status === "failed" ? "Generation failed at the provider." : null });
  }
  return reply({ error: "Unknown action." }, 400);
});
