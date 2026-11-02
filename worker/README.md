# ClipX FFmpeg worker MVP

This worker source is prepared for the ClipX `clip_jobs` queue, but it is **not currently deployed to a persistent processing host**. Until a host is configured and the process is running, uploaded jobs will remain queued/uploaded and no cloud clips will be rendered.

## Processing behavior
- Polls `clip_jobs` for uploaded jobs and claims one job at a time.
- Downloads the source from the private `clipx-private` bucket.
- Uses the job's selected duration (10–90 seconds; the UI offers 30/60/90) and aspect ratio (9:16, 16:9, or 1:1).
- Creates sequential MP4 clips, at most 20 per job.
- Uploads outputs to the private bucket and marks the job completed.

This is **not AI highlight detection**. It does not detect exciting moments, transcribe speech, track speakers, or generate captions.

## Build and run
From the repository root:

```sh
docker build -f worker/Dockerfile -t clipx-worker .
docker run --restart unless-stopped \
  -e SUPABASE_URL \
  -e SUPABASE_SERVICE_ROLE_KEY \
  clipx-worker
```

Prefer a host's secret manager instead of literal command-line values. Required environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only; never expose in browser, GitHub Pages, logs, or chat)

Optional:
- `SUPABASE_BUCKET` (default `clipx-private`)
- `CLIP_SECONDS` (default 30; per-job settings take precedence)
- `POLL_MS` (default 8000)

Build context is the repository root; Dockerfile path is `worker/Dockerfile`.

## Operational limits
- Start with one worker replica. Multi-worker atomic claiming is not implemented.
- Signed result links last 24 hours.
- A 2 GB upload limit does not mean the host can process a 2 GB file; size the host for temporary disk and CPU use.
- Add processing timeouts, disk limits, retries, stale-job recovery, cleanup/retention, monitoring, user quotas, and abuse controls before public launch.
