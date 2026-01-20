-- Meta WhatsApp Conversions API support

create table if not exists public.meta_whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  waba_id text not null,
  phone_number_id text null,
  display_phone_number text null,
  verified_name text null,
  dataset_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, waba_id)
);

create table if not exists public.meta_capi_event_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  waba_id text null,
  dataset_id text null,
  event_name text not null,
  event_time timestamptz not null,
  currency text null,
  value numeric null,
  ctwa_clid_hash text null,
  request_payload_json jsonb null,
  response_json jsonb null,
  status text not null,
  error_message text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_meta_capi_event_logs_workspace_created_at
  on public.meta_capi_event_logs (workspace_id, created_at desc);

create table if not exists public.meta_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wa_id text not null,
  last_message_at timestamptz null,
  ctwa_clid_hash text null,
  referral_source_id text null,
  referral_source_type text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, wa_id)
);

-- RLS
alter table public.meta_whatsapp_connections enable row level security;
alter table public.meta_capi_event_logs enable row level security;
alter table public.meta_conversations enable row level security;

do $policies$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_whatsapp_connections' and policyname = 'meta_whatsapp_connections_select'
  ) then
    execute $$
      create policy "meta_whatsapp_connections_select" on public.meta_whatsapp_connections
        for select using (
          workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid()
          )
        )
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_whatsapp_connections' and policyname = 'meta_whatsapp_connections_modify'
  ) then
    execute $$
      create policy "meta_whatsapp_connections_modify" on public.meta_whatsapp_connections
        for all using (
          workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid()
          )
        ) with check (
          workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid()
          )
        )
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_capi_event_logs' and policyname = 'meta_capi_event_logs_select'
  ) then
    execute $$
      create policy "meta_capi_event_logs_select" on public.meta_capi_event_logs
        for select using (
          workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid()
          )
        )
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_capi_event_logs' and policyname = 'meta_capi_event_logs_insert'
  ) then
    execute $$
      create policy "meta_capi_event_logs_insert" on public.meta_capi_event_logs
        for insert with check (
          workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid()
          )
        )
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_conversations' and policyname = 'meta_conversations_select'
  ) then
    execute $$
      create policy "meta_conversations_select" on public.meta_conversations
        for select using (
          workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid()
          )
        )
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_conversations' and policyname = 'meta_conversations_modify'
  ) then
    execute $$
      create policy "meta_conversations_modify" on public.meta_conversations
        for all using (
          workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid()
          )
        ) with check (
          workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid()
          )
        )
    $$;
  end if;
end
$policies$;
