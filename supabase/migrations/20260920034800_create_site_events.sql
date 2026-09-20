create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(), event_name text not null, page text not null, metadata jsonb, created_at timestamptz not null default now()
);
alter table public.site_events enable row level security;
drop policy if exists "Public can insert site events" on public.site_events;
create policy "Public can insert site events" on public.site_events for insert to anon, authenticated with check (length(event_name) between 1 and 120 and length(page) between 1 and 500 and (metadata is null or jsonb_typeof(metadata) = 'object'));
drop policy if exists "Admins can read site events" on public.site_events;
create policy "Admins can read site events" on public.site_events for select to authenticated using ((select public.is_admin()));
grant insert on table public.site_events to anon, authenticated;
grant select on table public.site_events to authenticated;
