// Supabase Edge Function: create-clip-job
// Required secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
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
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return reply({ error: "Backend secrets are not configured." }, 503);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return reply({ error: "Sign in required." }, 401);
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return reply({ error: "Invalid session." }, 401);

  let body: any;
  try { body = await req.json(); } catch { return reply({ error: "Invalid JSON." }, 400); }
  const name = String(body?.fileName || "").trim().slice(0, 180);
  const size = Number(body?.fileSize);
  const mime = String(body?.mimeType || "");
  if (!name || !Number.isSafeInteger(size) || size < 1 || size > 2 * 1024 * 1024 * 1024)
    return reply({ error: "Choose a video smaller than 2 GB." }, 400);
  if (!["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"].includes(mime))
    return reply({ error: "Unsupported video type." }, 415);

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const jobId = crypto.randomUUID();
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${jobId}/${safeName}`;
  const { data: signed, error: signError } = await admin.storage.from("clipx-private").createSignedUploadUrl(path);
  if (signError || !signed) return reply({ error: "Could not create secure upload URL." }, 500);

  const { error: insertError } = await admin.from("clip_jobs").insert({
    id: jobId, user_id: user.id, source_path: path, source_name: name, source_size: size,
    status: "queued", options: body?.options && typeof body.options === "object" ? body.options : {},
  });
  if (insertError) {
    await admin.storage.from("clipx-private").remove([path]);
    return reply({ error: "Could not create processing job." }, 500);
  }
  return reply({ jobId, bucket: "clipx-private", path, token: signed.token, uploadUrl: signed.signedUrl, status: "queued" });
});
