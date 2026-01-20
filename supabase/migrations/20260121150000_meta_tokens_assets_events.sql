-- Ensure Meta token + assets + events tables and RLS for Meta Hub flows

-- meta_tokens
create table if not exists public.meta_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null default 'meta_system_user',
  token_encrypted text not null,
  expires_at timestamptz null,
  scopes_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.meta_tokens
  alter column scopes_json set default '{}'::jsonb;

alter table if exists public.meta_tokens
  alter column provider set default 'meta_system_user';

alter table if exists public.meta_tokens
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_meta_tokens_workspace on public.meta_tokens (workspace_id);
create index if not exists idx_meta_tokens_workspace_provider on public.meta_tokens (workspace_id, provider);

alter table if exists public.meta_tokens enable row level security;

do $policies$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_tokens' and policyname = 'meta_tokens_select_workspace'
  ) then
    execute $$
      create policy meta_tokens_select_workspace on public.meta_tokens
        for select using (
          auth.role() = 'service_role' OR workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid() and role in ('owner','admin')
          )
        )
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_tokens' and policyname = 'meta_tokens_insert_service_role'
  ) then
    execute $$
      create policy meta_tokens_insert_service_role on public.meta_tokens
        for insert
        with check (auth.role() = 'service_role')
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_tokens' and policyname = 'meta_tokens_update_service_role'
  ) then
    execute $$
      create policy meta_tokens_update_service_role on public.meta_tokens
        for update
        using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role')
    $$;
  end if;
end
$policies$;

-- meta_assets_cache
create table if not exists public.meta_assets_cache (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  business_id text null,
  waba_id text null,
  phone_number_id text null,
  display_phone_number text null,
  verified_name text null,
  quality_rating text null,
  updated_at timestamptz not null default now(),
  unique (workspace_id, phone_number_id)
);

create index if not exists idx_meta_assets_cache_workspace on public.meta_assets_cache (workspace_id);
create index if not exists idx_meta_assets_cache_ws_waba on public.meta_assets_cache (workspace_id, waba_id);

alter table if exists public.meta_assets_cache enable row level security;

do $policies$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_assets_cache' and policyname = 'meta_assets_cache_select'
  ) then
    execute $$
      create policy meta_assets_cache_select on public.meta_assets_cache
        for select using (
          auth.role() = 'service_role' OR workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid() and role in ('owner','admin')
          )
        )
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_assets_cache' and policyname = 'meta_assets_cache_insert'
  ) then
    execute $$
      create policy meta_assets_cache_insert on public.meta_assets_cache
        for insert
        with check (auth.role() = 'service_role')
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_assets_cache' and policyname = 'meta_assets_cache_update'
  ) then
    execute $$
      create policy meta_assets_cache_update on public.meta_assets_cache
        for update
        using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role')
    $$;
  end if;
end
$policies$;

-- meta_events_log
create table if not exists public.meta_events_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_type text not null,
  payload_json jsonb null,
  received_at timestamptz not null default now(),
  source text not null,
  referral_hash text null,
  utm_json jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_meta_events_log_workspace_created on public.meta_events_log (workspace_id, received_at desc);

alter table if exists public.meta_events_log enable row level security;

do $policies$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_events_log' and policyname = 'meta_events_log_select'
  ) then
    execute $$
      create policy meta_events_log_select on public.meta_events_log
        for select using (
          auth.role() = 'service_role' OR workspace_id in (
            select workspace_id from public.workspace_memberships where user_id = auth.uid() and role in ('owner','admin')
          )
        )
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_events_log' and policyname = 'meta_events_log_insert'
  ) then
    execute $$
      create policy meta_events_log_insert on public.meta_events_log
        for insert
        with check (auth.role() = 'service_role')
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meta_events_log' and policyname = 'meta_events_log_update'
  ) then
    execute $$
      create policy meta_events_log_update on public.meta_events_log
        for update
        using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role')
    $$;
  end if;
end
$policies$;
