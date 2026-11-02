# ClipX Hybrid Mode — rollout and cost controls

## Selected mode
Hybrid Mode is the target architecture: browser editing remains available, authenticated uploads go to private Supabase Storage, an external FFmpeg worker performs cloud rendering, and AI providers are called only from server-side code.

## What exists now
- Supabase Auth and private `clipx-private` storage are configured.
- Authenticated `create-clip-job` and `complete-clip-upload` Edge Functions create and confirm upload jobs.
- `worker/worker.js` is an FFmpeg worker MVP for sequential clips. It is source code only; it is not deployed to a persistent host.
- `generate-video` is an authenticated health endpoint only. Actual text-to-video generation is disabled.
- Smart Highlights in the browser is a frame-change heuristic, not semantic AI.

## Cost safety defaults
- No worker host is provisioned by this repository change.
- Cloud processing must remain off until a trusted host is deliberately configured.
- Paid AI highlights and text-to-video remain off; `MAX_AI_SPEND_USD=0`.
- Conservative worker quotas are 2 jobs per user per day, 25 jobs globally per month, 10 output clips per job, and the existing 2 GB source ceiling.
- These quotas are operational guardrails, not a guarantee of a specific rupee bill. Hosting, storage, bandwidth, and AI vendors bill independently.
- Do not enable any paid provider or billing automatically. A separate approved monthly currency cap and provider pricing review are required before activation.

## Secret handling
Set the following only in the worker host's secret manager:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Never place the service-role key, AI provider keys, or worker credentials in `index.html`, GitHub Pages, public GitHub Actions variables, browser storage, screenshots, or chat. The Edge Functions already use Supabase-managed server environment variables for their Supabase credentials. Provider API keys must be stored as Edge Function secrets and read only by server-side functions.

## Three feature pipelines
1. **Cloud video processing:** signed private upload → job row → worker claims job → FFmpeg renders clips → outputs stored privately → short-lived signed downloads.
2. **AI Highlights:** extract audio/transcript and sampled visual context → server-side AI analysis → validate timestamps and quotas → enqueue selected segments for FFmpeg. Not active until a provider adapter and spend meter exist.
3. **AI Video Generation:** authenticated request → per-user quota and spend reservation → server-side provider adapter → poll provider status → store output privately → signed download. Not active until a provider, pricing, cancellation, and hard spend meter exist.

## Activation checklist
1. Choose an adult-managed hosting/provider account and review its current pricing and data-processing terms.
2. Set a rupee-denominated monthly infrastructure ceiling and a separate AI API ceiling. Keep both at zero until approved.
3. Deploy one worker replica first; add atomic job claiming, job timeouts, stale-job recovery, disk cleanup, signed-download refresh, and monitoring before public launch.
4. Implement transactional per-user quotas and a provider-side spend ledger before enabling AI calls.
5. Add provider keys only through the provider's secret manager / Supabase Edge Function Secrets. Never send keys in chat.
6. Test with non-sensitive sample videos and verify the latest GitHub Actions and Android browser behavior.

## Current honest status
The repository contains an upload/job pipeline and an FFmpeg worker MVP, but cloud rendering is not live until the worker is hosted. Semantic AI highlights and AI video generation are not connected. No paid calls are enabled by this plan.
