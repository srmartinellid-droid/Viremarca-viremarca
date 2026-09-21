-- AGUARDA project ref confirmado da VireMarca — não aplicar antes disso.
-- A configuração continua no site_settings existente; leads têm tabela própria para isolamento e RLS.

create table if not exists public.chat_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  transcript_summary text,
  created_at timestamptz not null default now(),
  source text not null default 'core-chat'
);

alter table public.chat_leads enable row level security;
revoke all on public.chat_leads from anon, authenticated;
grant select, insert, update, delete on public.chat_leads to service_role;
create index if not exists chat_leads_created_at_idx on public.chat_leads (created_at desc);
