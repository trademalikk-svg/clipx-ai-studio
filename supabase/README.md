# ClipX cloud backend setup

The repository contains a private upload queue, two authenticated Supabase Edge Functions, and a Docker/FFmpeg worker. This is sequential clip rendering, **not AI highlight detection**.

## 1. Apply the database migration

In the Supabase Dashboard for project `qmoxfzgiwamblpouxitn`, open **SQL Editor**, create a new query, paste the complete file:

`supabase/migrations/202611020001_clip_jobs_and_private_storage.sql`

Run it once. It creates the private `clipx-private` bucket and `clip_jobs` table. Users can read only their own jobs; job state changes are server-managed.

## 2. Deploy the Edge Functions

Install the Supabase CLI on a trusted computer, sign in, then run from the repository root:

```sh
supabase login
supabase link --project-ref qmoxfzgiwamblpouxitn
supabase secrets set SUPABASE_URL=https://qmoxfzgiwamblpouxitn.supabase.co
supabase secrets set SUPABASE_ANON_KEY=YOUR_PROJECT_ANON_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_PROJECT_SERVICE_ROLE_KEY
supabase functions deploy create-clip-job
supabase functions deploy complete-clip-upload
```

Get the real keys from **Supabase Dashboard → Project Settings → API**. Enter them only in the CLI prompt/secure terminal. Never paste the service-role key into ChatGPT, GitHub, the website, or browser code. If your CLI version does not accept a secret assignment as written, use the Dashboard's Edge Function Secrets page.

## 3. Run the FFmpeg worker

Build the Docker image from the repository root:

```sh
docker build -f worker/Dockerfile -t clipx-worker .
```

Run it on a trusted Docker host with secrets configured in that host's secret manager:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- Optional: `CLIP_SECONDS` (default 30), `POLL_MS` (default 8000)

Start with exactly one replica. The worker honors each job's selected 30/60/90-second duration and 9:16/16:9/1:1 aspect ratio. It creates sequential clips, up to 20 per job. It does not identify highlights, transcribe speech, or generate captions.

## 4. Verify

1. Confirm both Functions show as deployed in Supabase.
2. Confirm the `clip_jobs` table and private bucket exist.
3. Start the worker and check its logs show it is polling.
4. Sign in to ClipX, upload a small video using **Upload to Cloud & Create Clips**, and watch the job row move from `queued` → `uploaded` → `processing` → `completed`.
5. Confirm the generated files are in the private bucket. Signed download links in job results expire after 24 hours.

## Important operational limits

- This MVP queue is intended for one worker replica; multi-worker atomic claiming is not implemented.
- The 2 GB upload cap is not a guarantee the host has enough memory, disk, or time to process a 2 GB file.
- Before public launch, add resource/time limits, per-user quotas, retries, stale-job recovery, storage retention/cleanup, monitoring, and abuse controls.
- Do not describe this as AI highlight detection. It is deterministic sequential FFmpeg cutting.
- GitHub Pages does not deploy Supabase SQL/Functions or run Docker containers. Those are separate deployment steps requiring access to the Supabase project and a Docker host.
