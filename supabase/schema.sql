-- VireMarca Official Site — Supabase Schema
-- Run this in the SQL Editor of your Supabase project.

-- Portfolio projects
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

-- Editable site content (key-value)
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- Contact / settings
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.portfolio_projects enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;

-- Public read for active projects and content
create policy "Public read active projects"
  on public.portfolio_projects for select
  using (active = true);

create policy "Public read content"
  on public.site_content for select
  using (true);

create policy "Public read settings"
  on public.site_settings for select
  using (true);

-- Authenticated full access (admin)
create policy "Admin full portfolio"
  on public.portfolio_projects for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admin full content"
  on public.site_content for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admin full settings"
  on public.site_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage bucket for portfolio thumbnails
-- Create bucket "portfolio" in Supabase Dashboard → Storage (public)
-- Then:
-- insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true);

-- Seed example content (optional)
insert into public.site_content (key, value) values
  ('hero_title', 'Seu negócio merece uma presença digital à altura.'),
  ('hero_subtitle', 'A VireMarca cria sites profissionais pensados para cada segmento — com design, performance e estrutura que realmente vendem.'),
  ('about_title', 'Uma nova marca, construída sobre experiência real.'),
  ('about_body', 'A VireMarca nasce agora, mas não do zero. Mais de duas décadas trabalhando com tecnologia...')
on conflict (key) do nothing;

insert into public.site_settings (key, value) values
  ('whatsapp', '5548999999999'),
  ('email', 'contato@viremarca.com.br'),
  ('instagram', 'viremarca')
on conflict (key) do nothing;
