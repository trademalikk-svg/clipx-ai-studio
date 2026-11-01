// Supabase Edge Function: complete-clip-upload
// Confirms the signed upload exists, then marks the user's job uploaded.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!url || !anon || !service) return reply({ error: "Backend secrets are not configured." }, 503);
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return reply({ error: "Sign in required." }, 401);
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return reply({ error: "Invalid session." }, 401);
  let body: any; try { body = await req.json(); } catch { return reply({ error: "Invalid JSON." }, 400); }
  if (typeof body?.jobId !== "string") return reply({ error: "jobId required." }, 400);
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: job, error } = await admin.from("clip_jobs").select("id,user_id,source_path,status").eq("id", body.jobId).eq("user_id", user.id).maybeSingle();
  if (error || !job) return reply({ error: "Job not found." }, 404);
  const { data: file, error: fileError } = await admin.storage.from("clipx-private").createSignedUrl(job.source_path, 60);
  if (fileError || !file) return reply({ error: "Uploaded file not found. Upload may still be in progress." }, 409);
  const { error: updateError } = await admin.from("clip_jobs").update({ status: "uploaded" }).eq("id", job.id).eq("user_id", user.id);
  if (updateError) return reply({ error: "Could not update job status." }, 500);
  return reply({ jobId: job.id, status: "uploaded", message: "Secure upload confirmed. Cloud processing provider is not yet connected." });
});
