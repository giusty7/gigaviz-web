-- In-app notifications system
-- Stores notifications per user within a workspace

create extension if not exists "pgcrypto";

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  severity text not null default 'info' check (severity in ('info', 'warn', 'critical')),
  title text not null,
  body text null,
  meta jsonb null default '{}'::jsonb,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

-- Indexes for efficient querying
create index if not exists idx_notifications_workspace_user
  on public.notifications (workspace_id, user_id, created_at desc);

create index if not exists idx_notifications_unread
  on public.notifications (workspace_id, user_id, read_at)
  where read_at is null;

create index if not exists idx_notifications_type
  on public.notifications (workspace_id, type, created_at desc);

-- Enable RLS
alter table public.notifications enable row level security;

-- Users can read their own notifications within their workspace memberships
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (
    user_id = auth.uid()
    and exists (
      select 1 from workspace_members wm
      where wm.workspace_id = notifications.workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- Users can update their own notifications (mark as read)
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (
    user_id = auth.uid()
    and exists (
      select 1 from workspace_members wm
      where wm.workspace_id = notifications.workspace_id
        and wm.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
  );

-- Only service role can insert/delete notifications
drop policy if exists notifications_insert_service on public.notifications;
create policy notifications_insert_service on public.notifications
  for insert with check (auth.role() = 'service_role');

drop policy if exists notifications_delete_service on public.notifications;
create policy notifications_delete_service on public.notifications
  for delete using (auth.role() = 'service_role');

-- Dedupe helper: prevent duplicate notifications within a time window
-- Uses (workspace_id, user_id, type, dedupe_key) from meta
create unique index if not exists idx_notifications_dedupe
  on public.notifications (workspace_id, user_id, type, (meta->>'dedupe_key'))
  where meta->>'dedupe_key' is not null;
