-- SHIF-A AI: member-aware project, file, chat and storage access
-- Draft only. Apply only after explicit owner approval and staging review.
-- Helper functions are SECURITY DEFINER to avoid recursive membership-table RLS.
create or replace function public.shif_a_project_role(p_project_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.shif_a_projects p
      where p.id = p_project_id and p.user_id = (select auth.uid())
    ) then 'owner'
    else (
      select m.role
      from public.shif_a_project_members m
      where m.project_id = p_project_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
      limit 1
    )
  end;
$$;

create or replace function public.shif_a_can_read_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.shif_a_project_role(p_project_id) is not null;
$$;

create or replace function public.shif_a_can_edit_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.shif_a_project_role(p_project_id) in ('owner','admin','editor'), false);
$$;

create or replace function public.shif_a_can_use_project_ai(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.shif_a_project_role(p_project_id) in ('owner','admin','editor','ai_user'), false);
$$;

revoke all on function public.shif_a_project_role(uuid) from public, anon;
revoke all on function public.shif_a_can_read_project(uuid) from public, anon;
revoke all on function public.shif_a_can_edit_project(uuid) from public, anon;
revoke all on function public.shif_a_can_use_project_ai(uuid) from public, anon;
grant execute on function public.shif_a_project_role(uuid) to authenticated, service_role;
grant execute on function public.shif_a_can_read_project(uuid) to authenticated, service_role;
grant execute on function public.shif_a_can_edit_project(uuid) to authenticated, service_role;
grant execute on function public.shif_a_can_use_project_ai(uuid) to authenticated, service_role;

-- Projects: owner retains write/delete authority; active members can read.
drop policy if exists "Users can read own SHIF-A projects" on public.shif_a_projects;
create policy "Owners and active members can read SHIF-A projects"
  on public.shif_a_projects for select to authenticated
  using (public.shif_a_can_read_project(id));

drop policy if exists "Users can update own SHIF-A projects" on public.shif_a_projects;
create policy "Only owners can update SHIF-A projects"
  on public.shif_a_projects for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own SHIF-A projects" on public.shif_a_projects;
create policy "Only owners can delete SHIF-A projects"
  on public.shif_a_projects for delete to authenticated
  using (user_id = (select auth.uid()));

-- Project files: members can read; owner/admin/editor can upload; owner/admin can delete.
drop policy if exists "Users manage own SHIF-A project files" on public.shif_a_project_files;
create policy "Project members read SHIF-A files"
  on public.shif_a_project_files for select to authenticated
  using (public.shif_a_can_read_project(project_id));

create policy "Editors upload SHIF-A project files"
  on public.shif_a_project_files for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.shif_a_can_edit_project(project_id)
  );

create policy "Owners and admins delete SHIF-A project files"
  on public.shif_a_project_files for delete to authenticated
  using (coalesce(public.shif_a_project_role(project_id) in ('owner','admin'), false));

-- Conversations are private to their creator, even inside a shared project.
-- Only roles allowed to use project AI may create project-scoped conversations.
drop policy if exists "Users can manage own SHIF-A conversations" on public.shif_a_conversations;
create policy "Users read own SHIF-A conversations"
  on public.shif_a_conversations for select to authenticated
  using (
    user_id = (select auth.uid())
    and (project_id is null or public.shif_a_can_read_project(project_id))
  );

create policy "AI roles create own project conversations"
  on public.shif_a_conversations for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      project_id is null
      or public.shif_a_can_use_project_ai(project_id)
    )
  );

create policy "Users update own SHIF-A conversations"
  on public.shif_a_conversations for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (project_id is null or public.shif_a_can_read_project(project_id))
  );

create policy "Users delete own SHIF-A conversations"
  on public.shif_a_conversations for delete to authenticated
  using (user_id = (select auth.uid()));

-- Messages remain private to the conversation creator. A composite FK also
-- prevents a member from inserting into another member's conversation.
drop policy if exists "Users can manage own SHIF-A chat messages" on public.shif_a_chat_messages;
create policy "Users read own SHIF-A chat messages"
  on public.shif_a_chat_messages for select to authenticated
  using (user_id = (select auth.uid()));

create policy "AI roles insert own SHIF-A chat messages"
  on public.shif_a_chat_messages for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.shif_a_conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
        and (c.project_id is null or public.shif_a_can_use_project_ai(c.project_id))
    )
  );

create policy "Users delete own SHIF-A chat messages"
  on public.shif_a_chat_messages for delete to authenticated
  using (user_id = (select auth.uid()));

-- Storage paths remain {uploader_user_id}/{project_id}/{random-id}-{filename}.
-- Upload is allowed before metadata insertion; read requires a matching metadata
-- row so an unrelated object in the bucket is never exposed through project access.
drop policy if exists "Users read own SHIF-A project objects" on storage.objects;
create policy "Project members read registered SHIF-A objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'shif-a-project-files'
    and exists (
      select 1 from public.shif_a_project_files f
      where f.object_path = name
        and public.shif_a_can_read_project(f.project_id)
    )
  );

drop policy if exists "Users upload own SHIF-A project objects" on storage.objects;
create policy "Editors upload SHIF-A project objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'shif-a-project-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.shif_a_can_edit_project(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "Users delete own SHIF-A project objects" on storage.objects;
create policy "Editors remove own SHIF-A upload objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'shif-a-project-files'
    and (
      (
        (storage.foldername(name))[1] = (select auth.uid())::text
        and public.shif_a_can_edit_project(((storage.foldername(name))[2])::uuid)
      )
      or public.shif_a_project_role(((storage.foldername(name))[2])::uuid) in ('owner','admin')
    )
  );

comment on function public.shif_a_project_role(uuid) is
  'Returns owner or active project member role for the current authenticated user; null otherwise.';
comment on function public.shif_a_can_use_project_ai(uuid) is
  'Database gate for creating project-scoped chat records; does not meter direct third-party inference requests.';
