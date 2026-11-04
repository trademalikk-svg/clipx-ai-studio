-- SHIF-A access foundation draft. NOT applied to production.
-- Apply only after review of project grants, Auth configuration and Edge Functions.
create schema if not exists private;

create table if not exists private.shif_a_memberships (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'customer' check (role in ('owner','invited','customer')),
 enabled_tools text[] not null default '{}',
 unlimited_platform_credits boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint shif_a_unlimited_role_check check (
   not unlimited_platform_credits or role in ('owner','invited')
 )
);

create table if not exists private.shif_a_invitations (
 id uuid primary key default gen_random_uuid(),
 email_normalized text not null check (email_normalized = lower(btrim(email_normalized))),
 token_hash text not null unique,
 invited_by uuid not null references auth.users(id),
 enabled_tools text[] not null default '{}',
 expires_at timestamptz not null,
 accepted_at timestamptz,
 accepted_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 constraint shif_a_invite_acceptance_consistency check (
   (accepted_at is null and accepted_by is null) or
   (accepted_at is not null and accepted_by is not null)
 )
);
create index if not exists shif_a_invites_email_pending
 on private.shif_a_invitations(email_normalized, expires_at)
 where accepted_at is null;

create table if not exists private.shif_a_access_audit (
 id bigint generated always as identity primary key,
 actor_user_id uuid references auth.users(id),
 action text not null,
 target_user_id uuid references auth.users(id),
 invitation_id uuid references private.shif_a_invitations(id),
 outcome text not null check (outcome in ('allowed','denied','error')),
 created_at timestamptz not null default now()
);

alter table private.shif_a_memberships ENABLE ROW LEVEL SECURITY;
alter table private.shif_a_invitations ENABLE ROW LEVEL SECURITY;
alter table private.shif_a_access_audit ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA private FROM PUBLIC, anon, authenticated;
-- No browser-facing RLS policies. Trusted server endpoints must authenticate
-- users, enforce role checks, and use service_role only on the server.
-- Owner bootstrap is intentionally NOT included in this migration.
