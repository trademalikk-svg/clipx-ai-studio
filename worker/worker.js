import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { promises as fs, createWriteStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import os from "node:os";
import path from "node:path";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || "clipx-private";
const POLL_MS = Number(process.env.POLL_MS || 8000);
const DEFAULT_CLIP_SECONDS = Math.min(90, Math.max(10, Number(process.env.CLIP_SECONDS || 30)));
const CLOUD_ENABLED = process.env.CLIPX_CLOUD_PROCESSING_ENABLED === "true";
const MAX_INPUT_BYTES = Math.min(2 * 1024 * 1024 * 1024, Math.max(1, Number(process.env.MAX_INPUT_BYTES || 2 * 1024 * 1024 * 1024)));
const MAX_CLIPS_PER_JOB = Math.min(10, Math.max(1, Number(process.env.MAX_CLIPS_PER_JOB || 10)));
const MAX_JOBS_PER_USER_PER_DAY = Math.min(10, Math.max(1, Number(process.env.MAX_JOBS_PER_USER_PER_DAY || 2)));
const MAX_JOBS_GLOBAL_PER_MONTH = Math.min(250, Math.max(1, Number(process.env.MAX_JOBS_GLOBAL_PER_MONTH || 25)));
if (!CLOUD_ENABLED) {
  console.log("ClipX cloud processing is disabled. Set CLIPX_CLOUD_PROCESSING_ENABLED=true only after approving host costs and quotas.");
  process.exit(0);
}
if (!URL || !KEY) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
const db = createClient(URL, KEY, { auth: { persistSession: false } });

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", d => { stderr += d.toString(); if (stderr.length > 12000) stderr = stderr.slice(-12000); });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve() : reject(new Error(stderr || command + " exited " + code)));
  });
}

async function processJob(job) {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "clipx-"));
  const input = path.join(work, "source");
  const outputDir = path.join(work, "clips");
  await fs.mkdir(outputDir);
  try {
    const { data: signed, error: signedError } = await db.storage.from(BUCKET).createSignedUrl(job.source_path, 300);
    if (signedError || !signed?.signedUrl) throw new Error("Could not create source download URL.");
    const response = await fetch(signed.signedUrl);
    if (!response.ok || !response.body) throw new Error("Source download failed: HTTP " + response.status);
    let downloadedBytes = 0;
    await pipeline(
      Readable.fromWeb(response.body),
      new Transform({
        transform(chunk, encoding, callback) {
          downloadedBytes += chunk.length;
          if (downloadedBytes > MAX_INPUT_BYTES) return callback(new Error("Source file exceeds the 2 GB processing limit."));
          callback(null, chunk);
        }
      }),
      createWriteStream(input)
    );
    if (!downloadedBytes) throw new Error("Source file is empty.");
    const duration = await new Promise((resolve, reject) => {
      const child = spawn("ffprobe", ["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",input]);
      let out = ""; child.stdout.on("data", d => out += d); child.on("error", reject);
      child.on("close", code => code === 0 ? resolve(Number(out.trim())) : reject(new Error("Unable to read video duration.")));
    });
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("Video duration is invalid.");
    const requestedSeconds = Number(job.options?.clipSeconds || DEFAULT_CLIP_SECONDS);
    const clipSeconds = Math.min(90, Math.max(10, Number.isFinite(requestedSeconds) ? requestedSeconds : DEFAULT_CLIP_SECONDS));
    const ratio = ["9:16", "16:9", "1:1"].includes(job.options?.aspectRatio) ? job.options.aspectRatio : "9:16";
    const dimensions = ratio === "16:9" ? [1920,1080] : ratio === "1:1" ? [1080,1080] : [1080,1920];
    const requestedCount = Number(job.options?.requestedCount || 20);
    const safeCount = Math.min(MAX_CLIPS_PER_JOB, Math.max(1, Number.isFinite(requestedCount) ? Math.floor(requestedCount) : MAX_CLIPS_PER_JOB));
    const total = Math.min(safeCount, Math.ceil(duration / clipSeconds));
    const results = [];
    for (let i = 0; i < total; i++) {
      const start = i * clipSeconds;
      const length = Math.min(clipSeconds, duration - start);
      if (length < 2) continue;
      const filename = "clip-" + String(i + 1).padStart(2,"0") + ".mp4";
      const file = path.join(outputDir, filename);
      await run("ffmpeg", ["-y","-ss",String(start),"-i",input,"-t",String(length),"-vf",`scale=${dimensions[0]}:${dimensions[1]}:force_original_aspect_ratio=increase,crop=${dimensions[0]}:${dimensions[1]}`,"-c:v","libx264","-preset","veryfast","-crf","23","-c:a","aac","-b:a","128k","-movflags","+faststart",file]);
      const content = await fs.readFile(file);
      const target = job.user_id + "/" + job.id + "/clips/" + filename;
      const { error: uploadError } = await db.storage.from(BUCKET).upload(target, content, { contentType:"video/mp4", upsert:true });
      if (uploadError) throw new Error("Clip upload failed: " + uploadError.message);
      const { data: link, error: linkError } = await db.storage.from(BUCKET).createSignedUrl(target, 86400);
      if (linkError || !link) throw new Error("Could not create clip download link.");
      results.push({ path:target, name:filename, startSeconds:start, durationSeconds:length, downloadUrl:link.signedUrl });
    }
    const { error: updateError } = await db.from("clip_jobs").update({
      status:"completed",
      result:{ mode:"sequential_ffmpeg_v1", clipSeconds, aspectRatio:ratio, clips:results, note:"Sequential clips only; AI highlight detection and speaker tracking are not enabled." },
      error_message:null
    }).eq("id",job.id).eq("status","processing");
    if (updateError) throw updateError;
  } catch (error) {
    await db.from("clip_jobs").update({ status:"failed", error_message:String(error?.message || error).slice(0,1000) }).eq("id",job.id).eq("status","processing");
  } finally {
    await fs.rm(work,{recursive:true,force:true});
  }
}

async function tick() {
  const { data: jobs, error } = await db.from("clip_jobs").select("*").eq("status","uploaded").order("created_at").limit(1);
  if (error) { console.error("Queue read failed:",error.message); return; }
  const job = jobs?.[0];
  if (!job) return;

  // Quotas count the current queued job too, so they cap created jobs rather than only completed jobs.
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const [{ count: userDaily }, { count: globalMonthly }] = await Promise.all([
    db.from("clip_jobs").select("id", { count: "exact", head: true }).eq("user_id", job.user_id).gte("created_at", dayStart),
    db.from("clip_jobs").select("id", { count: "exact", head: true }).gte("created_at", monthStart)
  ]);
  if ((userDaily || 0) > MAX_JOBS_PER_USER_PER_DAY) {
    await db.from("clip_jobs").update({ status:"failed", error_message:"Daily cloud-processing quota reached." }).eq("id", job.id).eq("status","uploaded");
    return;
  }
  if ((globalMonthly || 0) > MAX_JOBS_GLOBAL_PER_MONTH) {
    await db.from("clip_jobs").update({ status:"failed", error_message:"Monthly cloud-processing quota reached." }).eq("id", job.id).eq("status","uploaded");
    return;
  }
  const { data: claimed, error: claimError } = await db.from("clip_jobs").update({status:"processing"}).eq("id",job.id).eq("status","uploaded").select("id").maybeSingle();
  if (claimError || !claimed) return;
  console.log("Processing job",job.id);
  await processJob(job);
  console.log("Finished job",job.id);
}

console.log("ClipX FFmpeg worker started; polling every",POLL_MS,"ms");
while (true) {
  try { await tick(); } catch (error) { console.error(error); }
  await new Promise(resolve => setTimeout(resolve,POLL_MS));
}
