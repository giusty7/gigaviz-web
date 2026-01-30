-- Create outbox_messages table for reliable message delivery
-- This table stores messages to be sent via WhatsApp API using the outbox pattern

create table if not exists public.outbox_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  
  -- Thread/Conversation reference (nullable for flexibility)
  thread_id uuid,
  conversation_id uuid,
  
  -- Connection and recipient
  connection_id uuid references public.wa_phone_numbers(id) on delete set null,
  to_phone text not null,
  
  -- Message content
  message_type text not null default 'text',
  payload jsonb not null default '{}'::jsonb,
  
  -- Idempotency
  idempotency_key text not null unique,
  
  -- Processing status
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'failed')),
  attempts integer not null default 0,
  
  -- Scheduling
  next_run_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  
  -- Worker locking
  locked_at timestamptz,
  locked_by text,
  
  -- Error tracking
  last_error text,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add columns if table already exists (backward compatibility)
do $$ 
begin
  alter table public.outbox_messages add column if not exists thread_id uuid;
  alter table public.outbox_messages add column if not exists connection_id uuid;
  alter table public.outbox_messages add column if not exists message_type text not null default 'text';
  alter table public.outbox_messages add column if not exists next_run_at timestamptz not null default now();
  alter table public.outbox_messages add column if not exists next_attempt_at timestamptz not null default now();
  alter table public.outbox_messages add column if not exists locked_at timestamptz;
  alter table public.outbox_messages add column if not exists locked_by text;
exception
  when others then null;
end $$;

-- Indexes for efficient querying
create index if not exists outbox_messages_status_next_idx
  on public.outbox_messages (status, coalesce(next_attempt_at, next_run_at));
  
create index if not exists outbox_messages_workspace_status_idx
  on public.outbox_messages (workspace_id, status);
  
create index if not exists outbox_messages_connection_idx
  on public.outbox_messages (connection_id);
  
create index if not exists outbox_messages_thread_idx
  on public.outbox_messages (thread_id);

-- Enable RLS
alter table public.outbox_messages enable row level security;

-- RLS Policy: Users can only access their workspace's outbox
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='outbox_messages' and policyname='outbox_messages_ws_all'
  ) then
    execute 'create policy outbox_messages_ws_all on public.outbox_messages
      for all using (
        workspace_id in (
          select workspace_id
          from workspace_memberships
          where user_id = auth.uid()
        )
      )';
  end if;
end $$;

-- Function to claim outbox messages for processing
create or replace function public.claim_outbox(
  p_batch_size int default 10,
  p_worker_id text default 'worker'
)
returns setof outbox_messages
language plpgsql
security definer
as $$
declare
  v_now timestamptz := now();
  v_stale_threshold timestamptz := v_now - interval '5 minutes';
begin
  return query
  update outbox_messages
  set
    status = 'processing',
    locked_at = v_now,
    locked_by = p_worker_id,
    updated_at = v_now
  where id in (
    select id
    from outbox_messages
    where status = 'queued'
      and coalesce(next_attempt_at, next_run_at) <= v_now
      and (locked_at is null or locked_at < v_stale_threshold)
    order by coalesce(next_attempt_at, next_run_at) asc
    limit p_batch_size
    for update skip locked
  )
  returning *;
end;
$$;

-- Grant permissions
grant execute on function public.claim_outbox(int, text) to authenticated;
grant execute on function public.claim_outbox(int, text) to service_role;

-- Comments
comment on table public.outbox_messages is 'Outbox pattern for reliable WhatsApp message delivery with retries';
comment on function public.claim_outbox(int, text) is 'Atomically claim a batch of queued messages for processing';
