-- Milestone 1: Reliability foundation (env/idempotency/rate-limit/outbox)

-- 1) Meta webhook events (idempotent store)
create table if not exists public.meta_webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel text,
  object text,
  event_type text,
  external_event_id text,
  event_key text not null,
  payload_json jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_text text,
  created_at timestamptz not null default now(),
  unique (workspace_id, event_key)
);

create index if not exists meta_webhook_events_ws_received_idx
  on public.meta_webhook_events (workspace_id, received_at desc);
create index if not exists meta_webhook_events_channel_idx
  on public.meta_webhook_events (channel);

alter table public.meta_webhook_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='meta_webhook_events' and policyname='meta_webhook_events_ws_select'
  ) then
    execute 'create policy meta_webhook_events_ws_select on public.meta_webhook_events
      for select using (
        workspace_id in (select workspace_id from public.workspace_memberships where user_id = auth.uid())
        or workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
        or auth.role() = ''service_role''
      )';
  end if;
  
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='meta_webhook_events' and policyname='meta_webhook_events_ws_all'
  ) then
    execute 'create policy meta_webhook_events_ws_all on public.meta_webhook_events
      for all using (
        workspace_id in (select workspace_id from public.workspace_memberships where user_id = auth.uid())
        or workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
        or auth.role() = ''service_role''
      ) with check (
        workspace_id in (select workspace_id from public.workspace_memberships where user_id = auth.uid())
        or workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
        or auth.role() = ''service_role''
      )';
  end if;
end $$;

-- 2) Durable rate limiting table + function
create table if not exists public.rate_limit_counters (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.take_rate_limit_slot(
  p_key text,
  p_cap integer,
  p_window_seconds integer default 60
) returns boolean
language plpgsql
as $$
declare
  now_ts timestamptz := now();
  window_start_ts timestamptz := to_timestamp(floor(extract(epoch from now_ts) / p_window_seconds) * p_window_seconds);
  current_count integer;
begin
  if p_cap is null or p_cap <= 0 then
    return true;
  end if;

  insert into public.rate_limit_counters(key, window_start, count, updated_at)
  values (p_key, window_start_ts, 0, now_ts)
  on conflict (key) do update
    set window_start = case
      when public.rate_limit_counters.window_start = window_start_ts then public.rate_limit_counters.window_start
      else window_start_ts
    end,
    count = case
      when public.rate_limit_counters.window_start = window_start_ts then public.rate_limit_counters.count
      else 0
    end,
    updated_at = now_ts;

  select count into current_count from public.rate_limit_counters where key = p_key for update;
  if current_count >= p_cap then
    update public.rate_limit_counters set updated_at = now_ts where key = p_key;
    return false;
  end if;

  update public.rate_limit_counters
    set count = count + 1, updated_at = now_ts
    where key = p_key;

  return true;
end;
$$;

comment on function public.take_rate_limit_slot(text, integer, integer) is 'Atomic sliding-window counter for rate limits (per key).';

-- 3) Outbox queue (idempotent)
create table if not exists public.outbox_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid null,
  thread_id uuid null,
  connection_id uuid null references public.wa_phone_numbers(id) on delete set null,
  to_phone text not null,
  message_type text not null default 'text',
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  status text not null default 'queued',
  attempts integer not null default 0,
  next_run_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

-- Backward compatible alters
alter table public.outbox_messages
  add column if not exists thread_id uuid,
  add column if not exists connection_id uuid references public.wa_phone_numbers(id) on delete set null,
  add column if not exists message_type text not null default 'text',
  add column if not exists next_run_at timestamptz not null default now(),
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text;

create index if not exists outbox_messages_status_next_idx
  on public.outbox_messages (status, coalesce(next_attempt_at, next_run_at));
create index if not exists outbox_messages_workspace_status_idx
  on public.outbox_messages (workspace_id, status);
create index if not exists outbox_messages_connection_idx
  on public.outbox_messages (connection_id);

alter table public.outbox_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='outbox_messages' and policyname='outbox_messages_ws_all'
  ) then
    execute 'create policy outbox_messages_ws_all on public.outbox_messages
      for all using (
        workspace_id in (select workspace_id from public.workspace_memberships where user_id = auth.uid())
        or workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
        or auth.role() = ''service_role''
      ) with check (
        workspace_id in (select workspace_id from public.workspace_memberships where user_id = auth.uid())
        or workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
        or auth.role() = ''service_role''
      )';
  end if;
end $$;

-- Worker claim function with skip locked
create or replace function public.claim_outbox(
  p_batch_size integer,
  p_worker_id text
) returns setof public.outbox_messages
language plpgsql
as $$
begin
  return query
  update public.outbox_messages
     set status = 'processing',
         locked_at = now(),
         locked_by = p_worker_id,
         updated_at = now()
   where id in (
     select id
       from public.outbox_messages
      where status = 'queued'
        and coalesce(next_attempt_at, next_run_at) <= now()
      order by coalesce(next_attempt_at, next_run_at) asc
      for update skip locked
      limit greatest(1, p_batch_size)
   )
  returning *;
end;
$$;

comment on function public.claim_outbox(integer, text) is 'Atomically claims queued outbox rows for a worker (skip locked).';

-- Touch trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_outbox_messages_updated_at on public.outbox_messages;
create trigger set_outbox_messages_updated_at
  before update on public.outbox_messages
  for each row execute function public.set_updated_at();