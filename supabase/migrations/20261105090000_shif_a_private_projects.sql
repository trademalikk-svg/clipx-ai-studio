-- SHIF-A AI: private project workspace foundation
-- Draft migration only. Apply to Supabase only after explicit owner approval.
create table if not exists public.shif_a_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  category text not null default 'general'
    check (category in ('general','website','content','business','learning','research','software')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shif_a_projects_user_updated_idx
  on public.shif_a_projects(user_id, updated_at desc);

alter table public.shif_a_projects enable row level security;

drop policy if exists "Users can read own SHIF-A projects" on public.shif_a_projects;
create policy "Users can read own SHIF-A projects"
  on public.shif_a_projects for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own SHIF-A projects" on public.shif_a_projects;
create policy "Users can create own SHIF-A projects"
  on public.shif_a_projects for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own SHIF-A projects" on public.shif_a_projects;
create policy "Users can update own SHIF-A projects"
  on public.shif_a_projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own SHIF-A projects" on public.shif_a_projects;
create policy "Users can delete own SHIF-A projects"
  on public.shif_a_projects for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.shif_a_projects to authenticated;
revoke all on public.shif_a_projects from anon, public;

create or replace function public.shif_a_set_project_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shif_a_projects_updated_at on public.shif_a_projects;
create trigger shif_a_projects_updated_at
before update on public.shif_a_projects
for each row execute function public.shif_a_set_project_updated_at();

revoke all on function public.shif_a_set_project_updated_at() from public, anon, authenticated;
