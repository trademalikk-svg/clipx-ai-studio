-- DRAFT ONLY: SHIF-A signup analytics. Do not apply until Owner approval.
-- Stores one row per UTC date and an aggregate count only; no user IDs, emails,
-- IP addresses, user agents, referral tokens, or content are persisted.
create schema if not exists private;

create table if not exists private.shif_a_growth_daily (
  day_utc date primary key,
  signup_count bigint not null default 0 check (signup_count >= 0),
  updated_at timestamptz not null default now()
);

alter table private.shif_a_growth_daily enable row level security;
revoke all on private.shif_a_growth_daily from public, anon, authenticated;
grant select on private.shif_a_growth_daily to service_role;

create or replace function private.shif_a_record_signup_daily()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
begin
  insert into private.shif_a_growth_daily(day_utc, signup_count, updated_at)
  values ((now() at time zone 'UTC')::date, 1, now())
  on conflict (day_utc) do update
    set signup_count = private.shif_a_growth_daily.signup_count + 1,
        updated_at = now();
  return new;
end;
$$;

revoke all on function private.shif_a_record_signup_daily() from public, anon, authenticated;

drop trigger if exists shif_a_auth_signup_daily on auth.users;
create trigger shif_a_auth_signup_daily
after insert on auth.users
for each row execute function private.shif_a_record_signup_daily();

create or replace function public.shif_a_get_growth_daily_counts(p_from date, p_to date)
returns table(day_utc date, signup_count bigint)
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select g.day_utc, g.signup_count
  from private.shif_a_growth_daily g
  where p_from is not null
    and p_to is not null
    and p_from <= p_to
    and p_to - p_from <= 90
    and g.day_utc between p_from and p_to
  order by g.day_utc asc
$$;

revoke all on function public.shif_a_get_growth_daily_counts(date, date) from public, anon, authenticated;
grant execute on function public.shif_a_get_growth_daily_counts(date, date) to service_role;
