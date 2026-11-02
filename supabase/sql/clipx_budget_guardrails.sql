-- Applied to Supabase project qmoxfzgiwamblpouxitn on 2026-11-02.
-- Reference copy of the live budget guardrail schema/functions.
create table if not exists public.clipx_budget_reservations (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('cloud_processing','ai_highlights','ai_video_generation')),
  idempotency_key text not null unique,
  month_start date not null,
  reserved_paise bigint not null check (reserved_paise > 0),
  actual_paise bigint,
  status text not null default 'reserved' check (status in ('reserved','settled','released')),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  constraint clipx_budget_actual_nonnegative check (actual_paise is null or actual_paise >= 0)
);
create index if not exists clipx_budget_reservations_month_category_idx
  on public.clipx_budget_reservations (month_start, category, status);
alter table public.clipx_budget_reservations enable row level security;
revoke all on public.clipx_budget_reservations from anon, authenticated;
grant all on public.clipx_budget_reservations to service_role;

create or replace function public.clipx_reserve_budget(p_category text, p_estimated_paise bigint, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_month date := date_trunc('month', now() at time zone 'UTC')::date;
  v_category_cap bigint;
  v_total_cap bigint := 100000;
  v_category_used bigint;
  v_total_used bigint;
  v_existing public.clipx_budget_reservations%rowtype;
  v_id uuid;
begin
  if p_category not in ('cloud_processing','ai_highlights','ai_video_generation')
     or p_estimated_paise is null or p_estimated_paise <= 0
     or p_idempotency_key is null or length(btrim(p_idempotency_key)) < 8
     or length(p_idempotency_key) > 160 then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_request');
  end if;
  v_category_cap := case p_category when 'cloud_processing' then 50000 when 'ai_highlights' then 25000 when 'ai_video_generation' then 25000 else 0 end;
  perform pg_advisory_xact_lock(hashtext('clipx-budget-' || v_month::text));
  select * into v_existing from public.clipx_budget_reservations where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('allowed', v_existing.status = 'reserved',
      'reason', case when v_existing.status = 'reserved' then 'already_reserved' else 'already_finalized' end,
      'reservation_id', v_existing.id);
  end if;
  select coalesce(sum(case when status = 'reserved' then reserved_paise else coalesce(actual_paise,0) end),0)
    into v_total_used from public.clipx_budget_reservations where month_start = v_month and status <> 'released';
  select coalesce(sum(case when status = 'reserved' then reserved_paise else coalesce(actual_paise,0) end),0)
    into v_category_used from public.clipx_budget_reservations where month_start = v_month and category = p_category and status <> 'released';
  if p_estimated_paise > v_total_cap - v_total_used then
    return jsonb_build_object('allowed', false, 'reason', 'monthly_total_limit_reached', 'limit_paise', v_total_cap, 'used_or_reserved_paise', v_total_used);
  end if;
  if p_estimated_paise > v_category_cap - v_category_used then
    return jsonb_build_object('allowed', false, 'reason', 'category_limit_reached', 'limit_paise', v_category_cap, 'used_or_reserved_paise', v_category_used);
  end if;
  insert into public.clipx_budget_reservations(category,idempotency_key,month_start,reserved_paise)
    values (p_category,p_idempotency_key,v_month,p_estimated_paise) returning id into v_id;
  return jsonb_build_object('allowed', true, 'reason', 'reserved', 'reservation_id', v_id, 'reserved_paise', p_estimated_paise);
end; $$;

create or replace function public.clipx_settle_budget(p_reservation_id uuid, p_actual_paise bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row public.clipx_budget_reservations%rowtype;
begin
  if p_reservation_id is null or p_actual_paise is null or p_actual_paise < 0 then
    return jsonb_build_object('settled', false, 'reason', 'invalid_request');
  end if;
  select * into v_row from public.clipx_budget_reservations where id = p_reservation_id for update;
  if not found then return jsonb_build_object('settled', false, 'reason', 'reservation_not_found'); end if;
  if v_row.status <> 'reserved' then return jsonb_build_object('settled', false, 'reason', 'already_finalized'); end if;
  update public.clipx_budget_reservations set status = 'settled', actual_paise = p_actual_paise, settled_at = now() where id = p_reservation_id;
  return jsonb_build_object('settled', true, 'actual_paise', p_actual_paise, 'over_reservation', p_actual_paise > v_row.reserved_paise);
end; $$;

create or replace function public.clipx_release_budget(p_reservation_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_status text;
begin
  update public.clipx_budget_reservations set status = 'released', actual_paise = 0, settled_at = now()
    where id = p_reservation_id and status = 'reserved' returning status into v_status;
  if v_status is null then return jsonb_build_object('released', false, 'reason', 'not_found_or_finalized'); end if;
  return jsonb_build_object('released', true);
end; $$;

revoke all on function public.clipx_reserve_budget(text,bigint,text) from public, anon, authenticated;
revoke all on function public.clipx_settle_budget(uuid,bigint) from public, anon, authenticated;
revoke all on function public.clipx_release_budget(uuid) from public, anon, authenticated;
grant execute on function public.clipx_reserve_budget(text,bigint,text) to service_role;
grant execute on function public.clipx_settle_budget(uuid,bigint) to service_role;
grant execute on function public.clipx_release_budget(uuid) to service_role;
