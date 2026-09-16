-- VireMarca Official Site — Supabase Schema
-- Project: gwwhnhvcodfedbptteyl
-- Run in SQL Editor. Safe to re-run (IF NOT EXISTS / ON CONFLICT).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('admin', 'editor', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  description text not null default '',
  thumbnail text,
  site_url text,
  display_order int not null default 0,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_admin_or_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id or public.is_admin());
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Admin manage profiles" on public.profiles;
create policy "Admin manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read active projects" on public.portfolio_projects;
create policy "Public read active projects" on public.portfolio_projects for select to anon, authenticated using (active = true or public.is_admin_or_editor());
drop policy if exists "Admin full portfolio" on public.portfolio_projects;
create policy "Admin full portfolio" on public.portfolio_projects for all to authenticated using (public.is_admin_or_editor()) with check (public.is_admin_or_editor());

drop policy if exists "Public read content" on public.site_content;
create policy "Public read content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "Admin full content" on public.site_content;
create policy "Admin full content" on public.site_content for all to authenticated using (public.is_admin_or_editor()) with check (public.is_admin_or_editor());

drop policy if exists "Public read settings" on public.site_settings;
create policy "Public read settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admin full settings" on public.site_settings;
create policy "Admin full settings" on public.site_settings for all to authenticated using (public.is_admin_or_editor()) with check (public.is_admin_or_editor());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.site_content (key, value) values
  ('hero_title', 'Seu negócio merece uma presença digital à altura.'),
  ('hero_subtitle', 'A VireMarca cria sites profissionais pensados para cada segmento — com design, performance e estrutura que realmente vendem.'),
  ('about_title', 'Uma nova marca, construída sobre experiência real.'),
  ('about_body', 'A VireMarca nasce agora, mas não do zero. Mais de duas décadas trabalhando com tecnologia...')
on conflict (key) do nothing;

insert into public.site_settings (key, value) values
  ('whatsapp', '5548999999999'),
  ('email', 'contato@viremarca.com.br'),
  ('instagram', 'viremarca'),
  ('hero_accent_intensity', '100'),
  ('hero_image', ''),
  ('hero_mobile_image', ''),
  ('hero_overlay_intensity', '58'),
  ('logo2', '')
on conflict (key) do nothing;

-- Promote first admin after creating Auth user:
-- update public.profiles set role = 'admin' where email = 'seu@email.com';
