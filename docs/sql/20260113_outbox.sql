-- Outbox + persistent rate limiting (Stage 0)
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

create table if not exists outbox_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  conversation_id uuid not null references conversations(id) on delete cascade,
  to_phone text not null,
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
  updated_at timestamptz not null default now()
);

alter table outbox_messages
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text;

create unique index if not exists outbox_messages_idempotency_key_key
  on outbox_messages (idempotency_key);

create index if not exists outbox_messages_status_run_idx
  on outbox_messages (status, next_run_at);

create index if not exists outbox_messages_status_attempt_idx
  on outbox_messages (status, next_attempt_at);

create index if not exists outbox_messages_workspace_idx
  on outbox_messages (workspace_id, status);

create table if not exists rate_limit_windows (
  workspace_id uuid primary key,
  window_start timestamptz not null,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function take_rate_limit_slot(
  p_workspace_id uuid,
  p_cap integer
)
returns boolean
language plpgsql
as $$
declare
  now_ts timestamptz := now();
  window_start_ts timestamptz := date_trunc('minute', now_ts);
  current_count integer;
begin
  if p_cap is null or p_cap <= 0 then
    return true;
  end if;

  insert into rate_limit_windows (workspace_id, window_start, count, updated_at)
  values (p_workspace_id, window_start_ts, 0, now_ts)
  on conflict (workspace_id) do update
    set window_start = case
      when rate_limit_windows.window_start = window_start_ts
        then rate_limit_windows.window_start
      else window_start_ts
    end,
    count = case
      when rate_limit_windows.window_start = window_start_ts
        then rate_limit_windows.count
      else 0
    end,
    updated_at = now_ts;

  select count
    into current_count
  from rate_limit_windows
  where workspace_id = p_workspace_id
  for update;

  if current_count >= p_cap then
    update rate_limit_windows
      set updated_at = now_ts
    where workspace_id = p_workspace_id;
    return false;
  end if;

  update rate_limit_windows
    set count = count + 1,
        updated_at = now_ts
  where workspace_id = p_workspace_id;

  return true;
end;
$$;

create or replace function claim_outbox(
  p_batch_size integer,
  p_worker_id text
)
returns setof outbox_messages
language plpgsql
as $$
begin
  return query
  update outbox_messages
     set status = 'processing',
         locked_at = now(),
         locked_by = p_worker_id,
         updated_at = now()
   where id in (
     select id
       from outbox_messages
      where status = 'queued'
        and coalesce(next_attempt_at, next_run_at) <= now()
      order by coalesce(next_attempt_at, next_run_at) asc
      for update skip locked
      limit greatest(1, p_batch_size)
   )
  returning *;
end;
$$;

-- Rollback notes:
-- drop function if exists claim_outbox(integer, text);
-- drop function if exists take_rate_limit_slot(uuid, integer);
-- drop table if exists rate_limit_windows;
-- drop index if exists outbox_messages_workspace_idx;
-- drop index if exists outbox_messages_status_attempt_idx;
-- drop index if exists outbox_messages_status_run_idx;
-- drop index if exists outbox_messages_idempotency_key_key;
-- drop table if exists outbox_messages;
