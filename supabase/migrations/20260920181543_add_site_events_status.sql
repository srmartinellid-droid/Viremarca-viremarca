alter table public.site_events
  add column if not exists status text not null default 'production';

alter table public.site_events
  drop constraint if exists site_events_status_check;

alter table public.site_events
  add constraint site_events_status_check check (status in ('production', 'lab'));

update public.site_events
set status = 'production'
where status is null;
