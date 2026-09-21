-- Escolhemos uma tabela dedicada, e não site_settings, porque Groq API keys são segredos de infraestrutura:
-- a tabela pode ter RLS/grants próprios e nenhum fluxo de conteúdo/configuração precisa tocar no ciphertext.
create table if not exists public.assistant_secrets (
  id uuid primary key default gen_random_uuid(),
  secret_name text not null unique,
  ciphertext text not null,
  iv text not null,
  auth_tag text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assistant_secrets enable row level security;
revoke all on public.assistant_secrets from anon, authenticated;
grant select, insert, update, delete on public.assistant_secrets to service_role;
create index if not exists assistant_secrets_secret_name_idx on public.assistant_secrets (secret_name);
