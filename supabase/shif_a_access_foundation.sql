-- SHIF-A access foundation draft. NOT applied to production.
-- Apply only after review of project grants, Auth configuration and Edge Functions.
-- Internal authorization records remain in the non-exposed private schema.
create schema if not exists private;

create table if not exists private.shif_a_memberships (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'customer' check (role in ('owner','invited','customer')),
 enabled_tools text[] not null default '{}',
 unlimited_platform_credits boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null,
 constraint shif_a_unlimited_role_check check (
   unlimited_platform_credits = (role in ('owner','invited'))
 )
);

create table if not exists private.shif_a_invitations (
 id uuid primary key default gen_random_uuid(),
 email_normalized text not null check (
   email_normalized = lower(btrim(email_normalized)) and length(email_normalized) between 5 and 254
 ),
 role text not null default 'invited' check (role in ('invited','customer')),
 token_hash text not null unique check (length(token_hash) = 64),
 invited_by uuid not null references auth.users(id) on delete restrict,
 enabled_tools text[] not null default '{}',
 expires_at timestamptz not null,
 accepted_at timestamptz,
 accepted_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 constraint shif_a_invite_acceptance_consistency check (
   (accepted_at is null and accepted_by is null) or
   (accepted_at is not null and accepted_by is not null)
 ),
 constraint shif_a_invite_expiry check (expires_at > created_at)
);
create index if not exists shif_a_invites_email_pending
 on private.shif_a_invitations(email_normalized, expires_at)
 where accepted_at is null;

create table if not exists private.shif_a_access_audit (
 id bigint generated always as identity primary key,
 actor_user_id uuid references auth.users(id) on delete set null,
 action text not null,
 target_user_id uuid references auth.users(id) on delete set null,
 invitation_id uuid references private.shif_a_invitations(id) on delete set null,
 outcome text not null check (outcome in ('allowed','denied','error')),
 created_at timestamptz not null default now()
);

alter table private.shif_a_memberships ENABLE ROW LEVEL SECURITY;
alter table private.shif_a_invitations ENABLE ROW LEVEL SECURITY;
alter table private.shif_a_access_audit ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.shif_a_memberships TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.shif_a_invitations TO service_role;
GRANT SELECT, INSERT ON private.shif_a_access_audit TO service_role;
GRANT USAGE, SELECT ON SEQUENCE private.shif_a_access_audit_id_seq TO service_role;

-- No browser-facing RLS policies. Trusted server endpoints must authenticate
-- users, enforce role checks, and use service_role only on the server.
-- Owner bootstrap is intentionally NOT included in this migration.

-- Restricted RPC bridge: the private schema itself does not need to be exposed
-- through the Data API. Only the service_role used by trusted Edge Functions
-- can execute these fixed-purpose functions.
create or replace function public.shif_a_get_membership(p_user_id uuid)
returns table(role text, enabled_tools text[], unlimited_platform_credits boolean)
language sql
security definer
set search_path = pg_catalog, private
as $$
  select m.role, m.enabled_tools, m.unlimited_platform_credits
  from private.shif_a_memberships m
  where m.user_id = p_user_id
  limit 1
$$;

create or replace function public.shif_a_create_invitation(
  p_email text,
  p_role text,
  p_token_hash text,
  p_invited_by uuid,
  p_enabled_tools text[],
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  v_id uuid;
begin
  if p_role not in ('invited', 'customer')
     or p_email is null
     or p_email <> lower(btrim(p_email))
     or length(p_email) < 5
     or length(p_email) > 254
     or p_token_hash !~ '^[a-f0-9]{64}$'
     or p_expires_at <= now()
     or p_expires_at > now() + interval '8 days' then
    raise exception 'Invalid invitation request' using errcode = '22023';
  end if;

  insert into private.shif_a_invitations
    (email_normalized, role, token_hash, invited_by, enabled_tools, expires_at)
  values
    (p_email, p_role, p_token_hash, p_invited_by, coalesce(p_enabled_tools, '{}'), p_expires_at)
  returning id into v_id;

  insert into private.shif_a_access_audit(actor_user_id, action, invitation_id, outcome)
  values (p_invited_by, 'invitation_created', v_id, 'allowed');

  return v_id;
end;
$$;

create or replace function public.shif_a_accept_invitation(
  p_user_id uuid,
  p_email text,
  p_token_hash text
)
returns table(role text, enabled_tools text[], unlimited_platform_credits boolean)
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  v_invite private.shif_a_invitations%rowtype;
begin
  select * into v_invite
  from private.shif_a_invitations i
  where i.token_hash = p_token_hash
    and i.email_normalized = lower(btrim(p_email))
    and i.accepted_at is null
    and i.expires_at > now()
  for update;

  if not found then
    return;
  end if;

  update private.shif_a_invitations
  set accepted_at = now(), accepted_by = p_user_id
  where id = v_invite.id and accepted_at is null;

  if not found then
    return;
  end if;

  insert into private.shif_a_memberships
    (user_id, role, enabled_tools, unlimited_platform_credits, created_by)
  values
    (p_user_id, v_invite.role, v_invite.enabled_tools,
     (v_invite.role = 'invited'), v_invite.invited_by)
  on conflict (user_id) do update
    set role = excluded.role,
        enabled_tools = excluded.enabled_tools,
        unlimited_platform_credits = excluded.unlimited_platform_credits,
        updated_at = now(),
        created_by = excluded.created_by;

  insert into private.shif_a_access_audit(actor_user_id, action, target_user_id, invitation_id, outcome)
  values (v_invite.invited_by, 'invitation_accepted', p_user_id, v_invite.id, 'allowed');

  return query
    select m.role, m.enabled_tools, m.unlimited_platform_credits
    from private.shif_a_memberships m
    where m.user_id = p_user_id;
end;
$$;

revoke all on function public.shif_a_get_membership(uuid) from public, anon, authenticated;
revoke all on function public.shif_a_create_invitation(text, text, text, uuid, text[], timestamptz) from public, anon, authenticated;
revoke all on function public.shif_a_accept_invitation(uuid, text, text) from public, anon, authenticated;
grant execute on function public.shif_a_get_membership(uuid) to service_role;
grant execute on function public.shif_a_create_invitation(text, text, text, uuid, text[], timestamptz) to service_role;
grant execute on function public.shif_a_accept_invitation(uuid, text, text) to service_role;

-- Owner security records. These remain inaccessible to browser roles.
create table if not exists private.shif_a_owner_recovery_codes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 code_hash text not null check (code_hash ~ '^[a-f0-9]{64}$'),
 salt text not null check (salt ~ '^[a-f0-9]{32,64}$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 consumed_at timestamptz,
 constraint shif_a_recovery_expiry check (expires_at > created_at)
);
create unique index if not exists shif_a_recovery_code_hash_unique on private.shif_a_owner_recovery_codes(code_hash);
create index if not exists shif_a_recovery_user_active on private.shif_a_owner_recovery_codes(user_id, expires_at) where consumed_at is null;

create table if not exists private.shif_a_owner_security_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 lover_name_salt text check (lover_name_salt is null or lover_name_salt ~ '^[a-f0-9]{32,64}$'),
 lover_name_hash text check (lover_name_hash is null or lover_name_hash ~ '^[a-f0-9]{64}$'),
 lover_name_configured_at timestamptz,
 updated_at timestamptz not null default now(),
 constraint shif_a_lover_name_pair check (
  (lover_name_salt is null and lover_name_hash is null and lover_name_configured_at is null)
  or (lover_name_salt is not null and lover_name_hash is not null and lover_name_configured_at is not null)
 )
);

create table if not exists private.shif_a_security_events (
 id bigint generated always as identity primary key,
 actor_user_id uuid references auth.users(id) on delete set null,
 event_type text not null check (event_type in (
  'passkey_login_succeeded','passkey_login_denied','passkey_registered','passkey_revoked',
  'recovery_code_generated','recovery_code_consumed','password_reset_requested',
  'owner_id_recovery_requested','lover_name_check_succeeded','lover_name_check_denied','session_revoked'
 )),
 outcome text not null check (outcome in ('allowed','denied','error')),
 metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
 created_at timestamptz not null default now()
);
create index if not exists shif_a_security_events_actor_created on private.shif_a_security_events(actor_user_id, created_at desc);

alter table private.shif_a_owner_recovery_codes ENABLE ROW LEVEL SECURITY;
alter table private.shif_a_owner_security_settings ENABLE ROW LEVEL SECURITY;
alter table private.shif_a_security_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.shif_a_owner_recovery_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.shif_a_owner_security_settings TO service_role;
GRANT SELECT, INSERT ON private.shif_a_security_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE private.shif_a_security_events_id_seq TO service_role;

-- Narrow audit writer. It runs as the caller (service_role), not SECURITY DEFINER.
create or replace function public.shif_a_write_security_event(p_actor_user_id uuid,p_event_type text,p_outcome text,p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security invoker set search_path = pg_catalog, private
as $$
begin
 if p_event_type not in (
  'passkey_login_succeeded','passkey_login_denied','passkey_registered','passkey_revoked',
  'recovery_code_generated','recovery_code_consumed','password_reset_requested',
  'owner_id_recovery_requested','lover_name_check_succeeded','lover_name_check_denied','session_revoked'
 ) then raise exception 'Unsupported security event' using errcode = '22023'; end if;
 if p_outcome not in ('allowed','denied','error') then raise exception 'Unsupported event outcome' using errcode = '22023'; end if;
 if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' or octet_length(p_metadata::text) > 512 then
  raise exception 'Invalid event metadata' using errcode = '22023';
 end if;
 if p_metadata ?| array['token','password','secret','credential','biometric','code','lover_name'] then
  raise exception 'Sensitive metadata is not permitted' using errcode = '22023';
 end if;
 insert into private.shif_a_security_events(actor_user_id,event_type,outcome,metadata)
 values (p_actor_user_id,p_event_type,p_outcome,p_metadata);
end;
$$;
revoke all on function public.shif_a_write_security_event(uuid,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.shif_a_write_security_event(uuid,text,text,jsonb) to service_role;


-- Recovery-code RPCs: callers must already be verified Owner sessions.
-- Verifiers are generated and hashed inside the trusted Edge Function; raw codes
-- are returned once and are never persisted.
create or replace function public.shif_a_replace_recovery_codes(p_user_id uuid, p_codes jsonb)
returns integer
language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare
 v_count integer;
begin
 if p_user_id is null or jsonb_typeof(p_codes) <> 'array'
    or jsonb_array_length(p_codes) <> 8 then
   raise exception 'Exactly eight recovery verifiers are required' using errcode = '22023';
 end if;
 if exists (
   select 1 from jsonb_array_elements(p_codes) e
   where coalesce(e->>'code_hash','') !~ '^[a-f0-9]{64}$'
      or coalesce(e->>'salt','') !~ '^[a-f0-9]{32,64}$'
 ) then
   raise exception 'Invalid recovery verifier' using errcode = '22023';
 end if;
 delete from private.shif_a_owner_recovery_codes
 where user_id = p_user_id and consumed_at is null;
 insert into private.shif_a_owner_recovery_codes(user_id,code_hash,salt,expires_at)
 select p_user_id,e->>'code_hash',e->>'salt',now()+interval '365 days'
 from jsonb_array_elements(p_codes) e;
 get diagnostics v_count = row_count;
 return v_count;
end;
$$;

create or replace function public.shif_a_list_recovery_verifiers(p_user_id uuid)
returns table(id uuid,code_hash text,salt text)
language sql security definer
set search_path = pg_catalog, private
as $$
 select c.id,c.code_hash,c.salt
 from private.shif_a_owner_recovery_codes c
 where c.user_id=p_user_id and c.consumed_at is null and c.expires_at>now()
$$;

create or replace function public.shif_a_consume_recovery_code(p_user_id uuid,p_code_id uuid)
returns boolean
language plpgsql security definer
set search_path = pg_catalog, private
as $$
begin
 update private.shif_a_owner_recovery_codes
 set consumed_at=now()
 where id=p_code_id and user_id=p_user_id
   and consumed_at is null and expires_at>now();
 return found;
end;
$$;

revoke all on function public.shif_a_replace_recovery_codes(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.shif_a_list_recovery_verifiers(uuid) from public,anon,authenticated;
revoke all on function public.shif_a_consume_recovery_code(uuid,uuid) from public,anon,authenticated;
grant execute on function public.shif_a_replace_recovery_codes(uuid,jsonb) to service_role;
grant execute on function public.shif_a_list_recovery_verifiers(uuid) to service_role;
grant execute on function public.shif_a_consume_recovery_code(uuid,uuid) to service_role;


create table if not exists private.shif_a_recovery_rate_limits (
 user_id uuid not null references auth.users(id) on delete cascade,
 action text not null check (action in ('generate','consume')),
 window_started_at timestamptz not null default now(),
 attempt_count integer not null default 0 check (attempt_count >= 0),
 primary key(user_id,action)
);
alter table private.shif_a_recovery_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.shif_a_recovery_rate_limits FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON private.shif_a_recovery_rate_limits TO service_role;

create or replace function public.shif_a_check_recovery_rate(p_user_id uuid,p_action text)
returns boolean language plpgsql security definer
set search_path = pg_catalog, private
as $$
declare v_row private.shif_a_recovery_rate_limits%rowtype;
begin
 if p_action not in ('generate','consume') then return false; end if;
 insert into private.shif_a_recovery_rate_limits(user_id,action)
 values(p_user_id,p_action) on conflict(user_id,action) do nothing;
 select * into v_row from private.shif_a_recovery_rate_limits
 where user_id=p_user_id and action=p_action for update;
 if v_row.window_started_at < now()-interval '15 minutes' then
  update private.shif_a_recovery_rate_limits set window_started_at=now(),attempt_count=1
  where user_id=p_user_id and action=p_action;
  return true;
 end if;
 if v_row.attempt_count >= case when p_action='generate' then 2 else 5 end then
  return false;
 end if;
 update private.shif_a_recovery_rate_limits set attempt_count=attempt_count+1
 where user_id=p_user_id and action=p_action;
 return true;
end;
$$;
revoke all on function public.shif_a_check_recovery_rate(uuid,text) from public,anon,authenticated;
grant execute on function public.shif_a_check_recovery_rate(uuid,text) to service_role;
