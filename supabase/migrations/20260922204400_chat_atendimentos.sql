-- VireMarca Core Chat: atendimentos, leads e aprendizado supervisionado
-- Aplicada somente em gwwhnhvcodfedbptteyl. Não coleta IP, geolocalização precisa ou user-agent.

alter table public.chat_leads
  alter column name drop not null,
  alter column contact drop not null,
  add column if not exists conversation_id uuid,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists business_name text,
  add column if not exists business_segment text,
  add column if not exists city text,
  add column if not exists has_website boolean,
  add column if not exists current_site_url text,
  add column if not exists demand_summary text,
  add column if not exists services_interest text[],
  add column if not exists urgency text,
  add column if not exists preferred_contact_time text,
  add column if not exists lead_score integer,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  page_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text,
  status text not null default 'novo' check (status in ('novo','em_atendimento','convertido','perdido','arquivado')),
  has_lead boolean not null default false,
  whatsapp_clicked boolean not null default false,
  message_count integer not null default 0,
  summary text,
  admin_notes text,
  consent_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now(),
  model text
);

create table if not exists public.chat_kb_suggestions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  suggested_answer text not null,
  source_conversation_id uuid references public.chat_conversations(id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente','aprovada','descartada')),
  created_at timestamptz not null default now()
);

alter table public.chat_leads
  add constraint chat_leads_conversation_id_fkey
  foreign key (conversation_id) references public.chat_conversations(id) on delete cascade;

alter table public.chat_leads
  add constraint chat_leads_lead_score_check
  check (lead_score is null or (lead_score between 0 and 100));

create unique index if not exists chat_leads_conversation_id_key
  on public.chat_leads(conversation_id);

create index if not exists chat_messages_conversation_id_created_at_idx
  on public.chat_messages(conversation_id, created_at);

create index if not exists chat_conversations_last_message_at_idx
  on public.chat_conversations(last_message_at desc);

create index if not exists chat_conversations_status_idx
  on public.chat_conversations(status);

create index if not exists chat_conversations_visitor_id_idx
  on public.chat_conversations(visitor_id);

create index if not exists chat_kb_suggestions_status_idx
  on public.chat_kb_suggestions(status, created_at desc);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_leads enable row level security;
alter table public.chat_kb_suggestions enable row level security;

drop policy if exists "Admins manage chat conversations" on public.chat_conversations;
create policy "Admins manage chat conversations" on public.chat_conversations for all to authenticated using (public.is_admin_or_editor()) with check (public.is_admin_or_editor());

drop policy if exists "Admins manage chat messages" on public.chat_messages;
create policy "Admins manage chat messages" on public.chat_messages for all to authenticated using (public.is_admin_or_editor()) with check (public.is_admin_or_editor());

drop policy if exists "Admins manage chat leads" on public.chat_leads;
create policy "Admins manage chat leads" on public.chat_leads for all to authenticated using (public.is_admin_or_editor()) with check (public.is_admin_or_editor());

drop policy if exists "Admins manage chat kb suggestions" on public.chat_kb_suggestions;
create policy "Admins manage chat kb suggestions" on public.chat_kb_suggestions for all to authenticated using (public.is_admin_or_editor()) with check (public.is_admin_or_editor());

grant all on public.chat_conversations to authenticated;
grant all on public.chat_messages to authenticated;
grant all on public.chat_leads to authenticated;
grant all on public.chat_kb_suggestions to authenticated;

create or replace function public.append_approved_chat_kb_suggestion(p_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare suggestion public.chat_kb_suggestions; current_kb text;
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  select * into suggestion from public.chat_kb_suggestions where id = p_id and status = 'pendente' for update;
  if not found then raise exception 'Sugestão não encontrada ou já processada'; end if;
  select value into current_kb from public.site_settings where key = 'assistant_knowledge_base';
  current_kb := coalesce(current_kb, '');
  current_kb := current_kb || case when right(current_kb, 1) = E'\\n' or current_kb = '' then '' else E'\\n\\n' end
    || '## Perguntas frequentes aprendidas' || E'\\n- Pergunta: ' || suggestion.question || E'\\n  Resposta: ' || suggestion.suggested_answer;
  insert into public.site_settings (key, value, updated_at) values ('assistant_knowledge_base', current_kb, now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
  update public.chat_kb_suggestions set status = 'aprovada' where id = p_id;
end;
$$;

revoke all on function public.append_approved_chat_kb_suggestion(uuid) from public, anon, authenticated;
grant execute on function public.append_approved_chat_kb_suggestion(uuid) to authenticated;
