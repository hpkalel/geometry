create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view', 'simulation_interaction')),
  page text not null check (
    page in ('cone', 'pyramide', 'patron', 'pave', 'volume', 'pyr', 'cyl', 'prisme')
  ),
  session_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_page_type_created_at_idx
  on public.analytics_events (page, event_type, created_at desc);
create index if not exists analytics_events_session_created_at_idx
  on public.analytics_events (session_id, created_at desc);

alter table public.admin_users enable row level security;
alter table public.analytics_events enable row level security;

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Administrators can verify their own account" on public.admin_users;
create policy "Administrators can verify their own account"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.analytics_events from anon, authenticated;
grant insert (event_type, page, session_id) on public.analytics_events to anon;
grant select on public.analytics_events to authenticated;

drop policy if exists "Visitors can add anonymous analytics events" on public.analytics_events;
create policy "Visitors can add anonymous analytics events"
  on public.analytics_events for insert to anon
  with check (
    event_type in ('page_view', 'simulation_interaction')
    and page in ('cone', 'pyramide', 'patron', 'pave', 'volume', 'pyr', 'cyl', 'prisme')
  );

drop policy if exists "Administrators can read analytics" on public.analytics_events;
create policy "Administrators can read analytics"
  on public.analytics_events for select to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create or replace function public.admin_analytics(p_days integer default 30)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with settings as (
    select
      greatest(1, least(coalesce(p_days, 30), 90)) as days,
      (now() at time zone 'UTC')::date as utc_today,
      (now() at time zone 'UTC')::date
        - (greatest(1, least(coalesce(p_days, 30), 90)) - 1) as start_day
  )
  select jsonb_build_object(
    'visits',
      (select count(*) from public.analytics_events e, settings s
       where e.event_type = 'page_view'
         and e.created_at >= (s.start_day::timestamp at time zone 'UTC')),
    'sessions',
      (select count(distinct e.session_id) from public.analytics_events e, settings s
       where e.event_type = 'page_view'
         and e.created_at >= (s.start_day::timestamp at time zone 'UTC')),
    'interactions',
      (select count(*) from public.analytics_events e, settings s
       where e.event_type = 'simulation_interaction'
         and e.created_at >= (s.start_day::timestamp at time zone 'UTC')),
    'visits_today',
      (select count(*) from public.analytics_events e, settings s
       where e.event_type = 'page_view'
         and e.created_at >= (s.utc_today::timestamp at time zone 'UTC')),
    'unique_visitors_today',
      (select count(distinct e.session_id) from public.analytics_events e, settings s
       where e.event_type = 'page_view'
         and e.created_at >= (s.utc_today::timestamp at time zone 'UTC')),
    'visits_month',
      (select count(*) from public.analytics_events e
       where e.event_type = 'page_view'
         and e.created_at >= (date_trunc('month', now() at time zone 'UTC') at time zone 'UTC')),
    'online_now',
      (select count(distinct e.session_id) from public.analytics_events e
       where e.created_at >= now() - interval '5 minutes'),
    'pages',
      (select coalesce(
        jsonb_agg(jsonb_build_object('page', page, 'visits', visits) order by visits desc),
        '[]'::jsonb
      )
       from (
         select e.page, count(*) as visits
         from public.analytics_events e, settings s
         where e.event_type = 'page_view'
           and e.created_at >= (s.start_day::timestamp at time zone 'UTC')
         group by e.page
       ) page_totals),
    'daily',
      (select coalesce(
        jsonb_agg(
          jsonb_build_object('date', to_char(days.day, 'YYYY-MM-DD'), 'visits', coalesce(totals.visits, 0))
          order by days.day
        ),
        '[]'::jsonb
      )
       from settings s
       cross join lateral generate_series(s.start_day, s.utc_today, interval '1 day') as days(day)
       left join (
         select (e.created_at at time zone 'UTC')::date as event_day, count(*) as visits
         from public.analytics_events e
         where e.event_type = 'page_view'
           and e.created_at >= (select start_day::timestamp at time zone 'UTC' from settings)
         group by (e.created_at at time zone 'UTC')::date
       ) totals on (totals.event_day = days.day::date))
  );
$$;

revoke all on function public.admin_analytics(integer) from public, anon;
grant execute on function public.admin_analytics(integer) to authenticated;

create or replace function public.admin_reset_analytics()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count bigint;
begin
  if not exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  ) then
    raise exception 'Administrator access required.';
  end if;

  delete from public.analytics_events
  where true;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.admin_reset_analytics() from public, anon;
grant execute on function public.admin_reset_analytics() to authenticated;
