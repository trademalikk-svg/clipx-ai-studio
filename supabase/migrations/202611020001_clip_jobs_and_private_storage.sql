-- ClipX AI Studio cloud processing foundation
create extension if not exists pgcrypto;

create table if not exists public.clip_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_path text not null,
  source_name text not null,
  source_size bigint not null check (source_size > 0 and source_size <= 2147483648),
  status text not null default 'queued' check (status in ('queued','uploaded','processing','completed','failed')),
  options jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clip_jobs_user_created_idx on public.clip_jobs(user_id, created_at desc);
alter table public.clip_jobs enable row level security;

drop policy if exists "Users read own clip jobs" on public.clip_jobs;
create policy "Users read own clip jobs" on public.clip_jobs for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users create own clip jobs" on public.clip_jobs;
create policy "Users create own clip jobs" on public.clip_jobs for insert to authenticated with check (auth.uid() = user_id);
-- Job state changes are server-managed; clients receive read-only access through RLS.
drop policy if exists "Users update own queued jobs" on public.clip_jobs;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clipx-private', 'clipx-private', false, 2147483648, array['video/mp4','video/webm','video/quicktime','video/x-matroska'])
on conflict (id) do update set public=false, file_size_limit=2147483648;

drop policy if exists "Users upload own ClipX files" on storage.objects;
create policy "Users upload own ClipX files" on storage.objects for insert to authenticated
with check (bucket_id = 'clipx-private' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users read own ClipX files" on storage.objects;
create policy "Users read own ClipX files" on storage.objects for select to authenticated
using (bucket_id = 'clipx-private' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete own ClipX files" on storage.objects;
create policy "Users delete own ClipX files" on storage.objects for delete to authenticated
using (bucket_id = 'clipx-private' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.set_clip_job_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists clip_jobs_updated_at on public.clip_jobs;
create trigger clip_jobs_updated_at before update on public.clip_jobs
for each row execute function public.set_clip_job_updated_at();
