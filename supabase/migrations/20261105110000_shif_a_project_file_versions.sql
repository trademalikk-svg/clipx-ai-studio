-- SHIF-A AI: private project file storage and immutable upload versions
-- Draft only. Apply after explicit approval. Creates a private 20 MiB bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('shif-a-project-files','shif-a-project-files',false,20971520,
 array['text/plain','text/markdown','text/csv','application/pdf','application/json','application/zip','image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=false,file_size_limit=20971520,allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.shif_a_project_files (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 project_id uuid not null references public.shif_a_projects(id) on delete cascade,
 file_name text not null check (char_length(file_name) between 1 and 180),
 object_path text not null unique,
 mime_type text not null,
 file_size bigint not null check (file_size between 1 and 20971520),
 version integer not null check (version > 0),
 created_at timestamptz not null default now(),
 constraint shif_a_project_files_version_unique unique(project_id,file_name,version)
);
create index if not exists shif_a_project_files_project_created_idx
 on public.shif_a_project_files(project_id,file_name,version desc);
alter table public.shif_a_project_files enable row level security;
drop policy if exists "Users manage own SHIF-A project files" on public.shif_a_project_files;
create policy "Users manage own SHIF-A project files" on public.shif_a_project_files for all to authenticated
 using ((select auth.uid())=user_id)
 with check ((select auth.uid())=user_id and exists (
  select 1 from public.shif_a_projects p where p.id=project_id and p.user_id=(select auth.uid())
 ));
grant select,insert,delete on public.shif_a_project_files to authenticated;
revoke all on public.shif_a_project_files from anon,public;

drop policy if exists "Users read own SHIF-A project objects" on storage.objects;
create policy "Users read own SHIF-A project objects" on storage.objects for select to authenticated
 using (bucket_id='shif-a-project-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "Users upload own SHIF-A project objects" on storage.objects;
create policy "Users upload own SHIF-A project objects" on storage.objects for insert to authenticated
 with check (bucket_id='shif-a-project-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "Users delete own SHIF-A project objects" on storage.objects;
create policy "Users delete own SHIF-A project objects" on storage.objects for delete to authenticated
 using (bucket_id='shif-a-project-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
