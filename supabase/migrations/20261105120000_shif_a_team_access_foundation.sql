-- SHIF-A AI: project membership and invitation foundation
-- DRAFT ONLY. Not applied to Supabase. Do not enable invite UI until a trusted
-- server-side invitation/acceptance function and complete RLS tests are deployed.

create table if not exists public.shif_a_project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.shif_a_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor','ai_user','viewer')),
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  ai_messages_per_24h integer not null default 30 check (ai_messages_per_24h between 0 and 1000),
  storage_limit_bytes bigint not null default 104857600 check (storage_limit_bytes between 0 and 10737418240),
  max_file_size_bytes bigint not null default 10485760 check (max_file_size_bytes between 1 and 20971520),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id,user_id),
  constraint shif_a_members_not_owner check (role <> 'owner')
);

create index if not exists shif_a_members_user_status_idx
  on public.shif_a_project_members(user_id,status);
create index if not exists shif_a_members_project_status_idx
  on public.shif_a_project_members(project_id,status);

alter table public.shif_a_project_members enable row level security;

drop policy if exists "SHIF-A members read own membership or owned project" on public.shif_a_project_members;
create policy "SHIF-A members read own membership or owned project"
  on public.shif_a_project_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.shif_a_projects p
      where p.id = project_id and p.user_id = (select auth.uid())
    )
  );

revoke all on public.shif_a_project_members from anon, public, authenticated;
grant select on public.shif_a_project_members to authenticated;

-- Invitations store only a token hash. Raw tokens are returned once by a
-- trusted server-side function and are never stored in browser-readable rows.
create table if not exists public.shif_a_project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.shif_a_projects(id) on delete cascade,
  invited_email text not null check (char_length(invited_email) between 3 and 254),
  role text not null check (role in ('admin','editor','ai_user','viewer')),
  token_hash text not null unique check (char_length(token_hash) = 64),
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users(id),
  accepted_by uuid null references auth.users(id),
  accepted_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint shif_a_invite_expiry_future check (expires_at > created_at)
);
create index if not exists shif_a_invites_project_status_idx
  on public.shif_a_project_invitations(project_id,status,expires_at);

alter table public.shif_a_project_invitations enable row level security;
revoke all on public.shif_a_project_invitations from anon, public, authenticated;

create table if not exists public.shif_a_access_audit (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.shif_a_projects(id) on delete cascade,
  actor_user_id uuid null references auth.users(id) on delete set null,
  target_user_id uuid null references auth.users(id) on delete set null,
  action text not null check (action in (
    'invitation_created','invitation_accepted','invitation_revoked',
    'member_role_changed','member_limits_changed','member_suspended','member_reactivated'
  )),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists shif_a_access_audit_project_created_idx
  on public.shif_a_access_audit(project_id,created_at desc);

alter table public.shif_a_access_audit enable row level security;
drop policy if exists "SHIF-A owners read access audit" on public.shif_a_access_audit;
create policy "SHIF-A owners read access audit"
  on public.shif_a_access_audit for select to authenticated
  using (exists (
    select 1 from public.shif_a_projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));
revoke all on public.shif_a_access_audit from anon, public;
grant select on public.shif_a_access_audit to authenticated;
revoke insert, update, delete on public.shif_a_access_audit from anon, public, authenticated;

-- Atomic invitation acceptance helper. Called only by the authenticated Edge Function
-- using service_role after it verifies the caller's JWT and confirmed email.
create or replace function public.shif_a_accept_project_invitation(
  p_user_id uuid,
  p_verified_email text,
  p_token_hash text
)
returns table(project_id uuid, role text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_invite public.shif_a_project_invitations%rowtype;
begin
  if p_user_id is null or p_verified_email is null
     or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid invitation acceptance' using errcode = '22023';
  end if;

  select i.* into v_invite
  from public.shif_a_project_invitations i
  where i.token_hash = p_token_hash
    and i.invited_email = lower(btrim(p_verified_email))
    and i.status = 'pending'
    and i.expires_at > now()
  for update;

  if not found then
    return;
  end if;

  update public.shif_a_project_invitations
    set status = 'accepted', accepted_by = p_user_id, accepted_at = now()
    where id = v_invite.id and status = 'pending';
  if not found then
    return;
  end if;

  insert into public.shif_a_project_members
    (project_id,user_id,role,status,invited_by)
  values
    (v_invite.project_id,p_user_id,v_invite.role,'active',v_invite.invited_by)
  on conflict (project_id,user_id) do update
    set role = excluded.role, status = 'active', invited_by = excluded.invited_by,
        updated_at = now();

  insert into public.shif_a_access_audit
    (project_id,actor_user_id,target_user_id,action,details)
  values
    (v_invite.project_id,p_user_id,p_user_id,'invitation_accepted',
     jsonb_build_object('role',v_invite.role));

  return query select v_invite.project_id,v_invite.role;
end;
$$;

revoke all on function public.shif_a_accept_project_invitation(uuid,text,text) from public,anon,authenticated;
grant execute on function public.shif_a_accept_project_invitation(uuid,text,text) to service_role;


-- Include explicit revocation in the immutable access audit vocabulary.
alter table public.shif_a_access_audit
  drop constraint if exists shif_a_access_audit_action_check;
alter table public.shif_a_access_audit
  add constraint shif_a_access_audit_action_check check (action in (
    'invitation_created','invitation_accepted','invitation_revoked',
    'member_role_changed','member_limits_changed','member_suspended',
    'member_reactivated','member_revoked'
  ));
