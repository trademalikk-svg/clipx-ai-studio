import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://trademalikk-svg.github.io"]);
const GEMINI_MODEL = "gemini-3.8-flash";
const MAX_MESSAGE_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 1024;

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

const json = (body: unknown, status: number, origin: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) return new Response("Origin not allowed", { status: 403 });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "POST required." }, 405, origin);

  const contentLength = Number(req.headers.get("Content-Length") || "0");
  if (contentLength > 12000) return json({ error: "Request too large." }, 413, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "SERVER_CONFIGURATION_MISSING", message: "Supabase server configuration is incomplete." }, 503, origin);
  }

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Sign in required." }, 401, origin);
  const token = authorization.slice(7).trim();
  if (!token) return json({ error: "Sign in required." }, 401, origin);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Invalid or expired session." }, 401, origin);
  if (!authData.user.email_confirmed_at) {
    return json({ error: "EMAIL_VERIFICATION_REQUIRED", message: "Email verification is required." }, 403, origin);
  }

  let payload: { message?: unknown; mode?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Valid JSON is required." }, 400, origin);
  }

  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const mode = typeof payload.mode === "string" ? payload.mode : "chat";
  if (!message) return json({ error: "Message is required." }, 400, origin);
  if (message.length > MAX_MESSAGE_CHARS) return json({ error: "Message exceeds 4,000 characters." }, 413, origin);
  if (!["chat", "writing", "coding", "research"].includes(mode)) {
    return json({ error: "Unsupported mode." }, 400, origin);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return json({
      error: "MODEL_PROVIDER_NOT_CONFIGURED",
      message: "Gemini API key is not configured in Supabase Edge Function secrets. No model request was sent.",
    }, 503, origin);
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: allowed, error: limitError } = await adminClient.rpc(
    "shif_a_consume_model_request",
    { p_user_id: authData.user.id },
  );
  if (limitError) {
    console.error("SHIF-A model rate-limit check failed:", limitError.message);
    return json({ error: "Usage protection is temporarily unavailable." }, 503, origin);
  }
  if (allowed !== true) {
    return json({
      error: "USER_RATE_LIMIT_REACHED",
      message: "Limit reached: maximum 10 model requests per hour for this account.",
    }, 429, origin);
  }

  const systemText = [
    "You are SHIF-A AI, a helpful Hindi and English assistant.",
    "Be accurate, explain uncertainty, and never invent sources or claim actions you did not perform.",
    "Keep responses age-appropriate. Do not provide instructions that enable violence, self-harm, dangerous substances, illegal activity, or bypassing safety controls.",
    "Do not request passwords, payment details, API keys, or sensitive personal information.",
    "Respect the selected mode: " + mode + ".",
    "For coding tasks, provide safe, maintainable code and explain assumptions. Never claim code was run or tested unless it actually was.",
    "For writing tasks, produce original content and mark factual claims that need verification.",
  ].join(" ");

  try {
    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.5 },
        }),
        signal: AbortSignal.timeout(25000),
      },
    );
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("Gemini provider returned status:", upstream.status);
      return json({
        error: upstream.status === 429 ? "PROVIDER_LIMIT_REACHED" : "PROVIDER_REQUEST_FAILED",
        message: upstream.status === 429
          ? "Gemini usage limit reached. Try again later; no paid fallback will be used."
          : "Gemini could not complete the request. Check the server-side API configuration.",
      }, upstream.status === 429 ? 429 : 502, origin);
    }

    const answer = Array.isArray(data?.candidates?.[0]?.content?.parts)
      ? data.candidates[0].content.parts.map((part: { text?: string }) => part.text || "").join("").trim()
      : "";
    if (!answer) {
      return json({ error: "EMPTY_MODEL_RESPONSE", message: "Gemini returned no text. Try a shorter prompt." }, 502, origin);
    }

    return json({ answer, model: GEMINI_MODEL, mode, provider: "gemini" }, 200, origin);
  } catch (error) {
    console.error("SHIF-A Gemini gateway request failed:", error instanceof Error ? error.message : "unknown error");
    return json({ error: "MODEL_GATEWAY_UNAVAILABLE", message: "Gemini service is temporarily unavailable." }, 502, origin);
  }
});
