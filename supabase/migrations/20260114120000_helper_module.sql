-- Helper module core tables

-- Conversations
create table if not exists public.helper_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists helper_conversations_workspace_idx
  on public.helper_conversations (workspace_id, updated_at desc);

-- Messages
create table if not exists public.helper_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.helper_conversations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists helper_messages_conversation_idx
  on public.helper_messages (conversation_id, created_at asc);

-- Tool runs
create table if not exists public.helper_tool_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid references public.helper_conversations(id) on delete set null,
  message_id uuid references public.helper_messages(id) on delete set null,
  intent text not null,
  params jsonb not null default '{}'::jsonb,
  status text not null check (status in ('queued', 'running', 'success', 'error')),
  correlation_id text,
  idempotency_key text not null,
  result jsonb,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.helper_tool_runs
  add constraint helper_tool_runs_idem_uniq unique (workspace_id, idempotency_key);

create index if not exists helper_tool_runs_workspace_idx
  on public.helper_tool_runs (workspace_id, created_at desc);

-- Usage tracking
create table if not exists public.helper_usage_daily (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  date date not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cost_estimate numeric(12, 4) not null default 0,
  provider_breakdown jsonb not null default '{}'::jsonb,
  primary key (workspace_id, date)
);

-- Helper settings (automation toggle, budget caps)
create table if not exists public.helper_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  allow_automation boolean not null default true,
  monthly_cap numeric(12, 2) not null default 0
);

-- RLS policies
alter table public.helper_conversations enable row level security;
alter table public.helper_messages enable row level security;
alter table public.helper_tool_runs enable row level security;
alter table public.helper_usage_daily enable row level security;
alter table public.helper_settings enable row level security;

-- Generic workspace membership predicate
create or replace function public.helper_is_member(workspace uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace
      and wm.user_id = auth.uid()
  );
$$;

-- Conversations policies
create policy "helper_conversations_select" on public.helper_conversations
  for select using (helper_is_member(workspace_id));
create policy "helper_conversations_insert" on public.helper_conversations
  for insert with check (helper_is_member(workspace_id));
create policy "helper_conversations_update" on public.helper_conversations
  for update using (helper_is_member(workspace_id));
create policy "helper_conversations_delete" on public.helper_conversations
  for delete using (helper_is_member(workspace_id));

-- Messages policies
create policy "helper_messages_select" on public.helper_messages
  for select using (helper_is_member(workspace_id));
create policy "helper_messages_insert" on public.helper_messages
  for insert with check (helper_is_member(workspace_id));
create policy "helper_messages_update" on public.helper_messages
  for update using (helper_is_member(workspace_id));
create policy "helper_messages_delete" on public.helper_messages
  for delete using (helper_is_member(workspace_id));

-- Tool runs policies
create policy "helper_tool_runs_select" on public.helper_tool_runs
  for select using (helper_is_member(workspace_id));
create policy "helper_tool_runs_insert" on public.helper_tool_runs
  for insert with check (helper_is_member(workspace_id));
create policy "helper_tool_runs_update" on public.helper_tool_runs
  for update using (helper_is_member(workspace_id));
create policy "helper_tool_runs_delete" on public.helper_tool_runs
  for delete using (helper_is_member(workspace_id));

-- Usage policies
create policy "helper_usage_select" on public.helper_usage_daily
  for select using (helper_is_member(workspace_id));
create policy "helper_usage_upsert" on public.helper_usage_daily
  for insert with check (helper_is_member(workspace_id));
create policy "helper_usage_update" on public.helper_usage_daily
  for update using (helper_is_member(workspace_id));

-- Settings policies
create policy "helper_settings_select" on public.helper_settings
  for select using (helper_is_member(workspace_id));
create policy "helper_settings_upsert" on public.helper_settings
  for insert with check (helper_is_member(workspace_id));
create policy "helper_settings_update" on public.helper_settings
  for update using (helper_is_member(workspace_id));

-- Ensure helper_is_member is immutable within txn scope
comment on function public.helper_is_member is 'Checks workspace membership for helper tables.';
