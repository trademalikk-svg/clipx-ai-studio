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
- `CLIPX_CLOUD_JOB_RESERVE_PAISE` is mandatory when enabled. It is the conservative maximum reservation per job in INR paise; the worker refuses to start if it is missing or invalid.
- `MAX_INPUT_BYTES` defaults to 2 GB and cannot exceed the existing 2 GB backend ceiling.
- `MAX_CLIPS_PER_JOB=10`.
- `MAX_JOBS_PER_USER_PER_DAY=2`.
- `MAX_JOBS_GLOBAL_PER_MONTH=25`.
- `CLIPX_AI_HIGHLIGHTS_ENABLED=false`, `CLIPX_VIDEO_GENERATION_ENABLED=false`, and `MAX_AI_SPEND_USD=0`. These are rollout gates; no AI provider integration is active yet.

## Monthly budget guardrail (database-backed)
The Supabase database now has a private `clipx_budget_reservations` ledger and service-role-only RPCs:
- `clipx_reserve_budget(category, estimated_paise, idempotency_key)` atomically reserves before work and enforces the INR 1,000 monthly total ceiling.
- `clipx_settle_budget(reservation_id, actual_paise)` finalizes a reservation.
- `clipx_release_budget(reservation_id)` releases an unused reservation.

Allocation caps: cloud processing INR 500/month, AI Highlights INR 250/month, AI video generation INR 250/month. The worker reserves the configured per-job estimate before FFmpeg work and conservatively settles the full reservation until reliable per-job invoice metering exists. Failed jobs also consume the reservation because compute may already have been used.

This is an application-level reservation guard, not a guaranteed provider invoice cap. It does not automatically measure fixed hosting plans, taxes, storage, bandwidth, or delayed provider billing. Provider-side billing limits/alerts and a verified maximum-cost estimate are still required before any paid service is enabled. AI provider integrations remain disabled.

## Operational limitations
- Run one worker replica only; atomic multi-worker claiming is not implemented.
- Signed result links last 24 hours.
- A 2 GB upload does not guarantee that a host has sufficient temporary disk or CPU.
- Before public launch add processing timeouts, stale-job recovery, disk cleanup, retention policy, monitoring, transactional quota reservation and abuse controls.
- Test only with non-sensitive sample footage until privacy and retention behavior is reviewed.
