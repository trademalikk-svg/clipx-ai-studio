# ClipX FFmpeg worker MVP

This worker source is prepared for the ClipX `clip_jobs` queue. It is **not currently deployed to a persistent processing host**. Until a host is configured and running, cloud jobs will not render.

## Processing behavior
- Processes authenticated jobs uploaded to the private `clipx-private` bucket.
- Uses FFmpeg to create sequential clips (not semantic AI highlights).
- Supports 10–90 second clip segments and 9:16, 16:9, or 1:1 output.
- Default maximum: 10 output clips per job.
- Default quota: 2 jobs per user per UTC day and 25 jobs globally per UTC month.
- Default input ceiling: the existing 2 GB source limit.

This is **not AI highlight detection**. It does not understand story, detect exciting moments, track speakers, or generate captions.

## Safe activation
The worker exits without processing unless `CLIPX_CLOUD_PROCESSING_ENABLED=true`. Keep it false until a trusted host is selected and its pricing is reviewed. This repository change does not create a host or start paid compute.

## Build and run
From the repository root:

```sh
docker build -f worker/Dockerfile -t clipx-worker .
docker run --restart unless-stopped --env-file worker/.env clipx-worker
```

Copy `worker/.env.example` into the host's secret/config interface. Do not commit the real `.env` file. Prefer the host's secret manager rather than a local env file in production.

Required server-only secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Important settings:
- `CLIPX_CLOUD_PROCESSING_ENABLED=false` by default.
- `MAX_INPUT_BYTES` defaults to 2 GB and cannot exceed the existing 2 GB backend ceiling.
- `MAX_CLIPS_PER_JOB=10`.
- `MAX_JOBS_PER_USER_PER_DAY=2`.
- `MAX_JOBS_GLOBAL_PER_MONTH=25`.
- `CLIPX_AI_HIGHLIGHTS_ENABLED=false`, `CLIPX_VIDEO_GENERATION_ENABLED=false`, and `MAX_AI_SPEND_USD=0`. These are rollout gates; no AI provider integration is active yet.

These quotas are operational guardrails, not a guaranteed rupee bill. Hosting, storage, bandwidth and any future AI provider may charge independently. Set a rupee-denominated budget and provider spend meter before enabling paid services.

## Operational limitations
- Run one worker replica only; atomic multi-worker claiming is not implemented.
- Signed result links last 24 hours.
- A 2 GB upload does not guarantee that a host has sufficient temporary disk or CPU.
- Before public launch add processing timeouts, stale-job recovery, disk cleanup, retention policy, monitoring, transactional quota reservation and abuse controls.
- Test only with non-sensitive sample footage until privacy and retention behavior is reviewed.
