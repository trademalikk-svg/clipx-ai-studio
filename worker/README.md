ClipX FFmpeg worker MVP

What it does:
- Polls clip_jobs for uploaded jobs.
- Downloads the source from the private clipx-private bucket.
- Creates sequential 30-second (configurable) 9:16 MP4 clips with FFmpeg.
- Uploads clips back to the private bucket and marks the job completed.

This is NOT AI highlight detection. It does not detect exciting moments, transcribe speech, track speakers, or generate word-level captions. It is a first cloud-rendering milestone only and creates at most 20 clips per job.

Deploy this directory as a Docker worker on a trusted container host. Configure secrets in that host's secret manager:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (server-side only; never expose in browser, GitHub Pages, logs, or chat)
- Optional SUPABASE_BUCKET (default clipx-private), CLIP_SECONDS (default 30, range 10-90), POLL_MS (default 8000)

Build context: repository root; Dockerfile path worker/Dockerfile.

Operational limits: start with one worker replica. The MVP queue does not yet use a database transaction with FOR UPDATE SKIP LOCKED, so multiple replicas can race. Signed download links last 24 hours. The 2 GB input cap is not a promise that the host can process 2 GB. Add timeouts, disk limits, retries, cleanup, monitoring, user quotas and retention controls before public launch. The browser app is not wired to create jobs, upload to this queue, or display cloud results yet.
