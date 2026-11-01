# ClipX cloud backend setup

This repository now contains the first secure cloud-job backend layer. It does not yet perform AI clipping by itself.

## Included
- Private `clipx-private` Storage bucket (2 GB per-file ceiling; actual project limits may be lower).
- `clip_jobs` table with per-user Row Level Security.
- `create-clip-job` Edge Function: validates the signed-in user and video metadata, creates a private signed-upload URL, and records a queued job.
- `complete-clip-upload` Edge Function: verifies the uploaded object and marks the job uploaded.

## Required one-time Supabase setup
Run the SQL migration in the Supabase SQL Editor:
`supabase/migrations/202611020001_clip_jobs_and_private_storage.sql`

Deploy both Edge Functions using the Supabase CLI:
```sh
supabase functions deploy create-clip-job
supabase functions deploy complete-clip-upload
```

Set Edge Function secrets in Supabase (never in GitHub Pages or browser JavaScript):
```sh
supabase secrets set SUPABASE_URL=https://qmoxfzgiwamblpouxitn.supabase.co
supabase secrets set SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```
Use the real project values from the Supabase dashboard. Do not commit them to this repository or share them in chat.

## Not yet included / not to be advertised as working
- No video transcoding worker or AI highlight provider is connected.
- The upload endpoints only store and register source files; they do not create clips.
- A separate trusted worker (FFmpeg-capable compute) and an AI speech/highlight provider integration are required for cloud clipping. Keep provider keys server-side, add per-user quotas, job timeouts, cleanup/retention, and abuse controls before public launch.
- The browser app is not yet wired to these endpoints. Existing local browser editing remains unchanged.

## Security notes
The bucket is private. The service-role key is used only inside Edge Functions. Never put it in `index.html`. Review the generated SQL against the target Supabase project before applying it; migrations are not auto-applied by GitHub Pages.
