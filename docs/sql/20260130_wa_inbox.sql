-- WhatsApp Inbox foundation
-- Add thread metadata, tags/notes, and idempotency helpers

create extension if not exists "pgcrypto";

-- msg_threads columns
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'msg_threads' and column_name = 'assigned_to'
  ) then
    alter table msg_threads add column assigned_to uuid null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'msg_threads' and column_name = 'status'
  ) then
    alter table msg_threads add column status text not null default 'open';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'msg_threads' and column_name = 'unread_count'
  ) then
    alter table msg_threads add column unread_count int not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'msg_threads' and column_name = 'last_inbound_at'
  ) then
    alter table msg_threads add column last_inbound_at timestamptz null;
  end if;
end $$;

-- msg_thread_tags
create table if not exists msg_thread_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  thread_id uuid not null references msg_threads(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, thread_id, tag)
);

-- msg_thread_notes
create table if not exists msg_thread_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  thread_id uuid not null references msg_threads(id) on delete cascade,
  author_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Optional status events table for WA outbound/inbound
create table if not exists wa_message_status_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  external_message_id text not null,
  status text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_status_workspace_msg on wa_message_status_events(workspace_id, external_message_id);

-- Idempotency helper for messages
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'msg_messages_workspace_external_key'
  ) then
    alter table msg_messages
      add constraint msg_messages_workspace_external_key
      unique (workspace_id, external_message_id);
  end if;
end $$;

-- RLS policies for new tables
alter table msg_thread_tags enable row level security;
alter table msg_thread_notes enable row level security;
alter table wa_message_status_events enable row level security;

do $$
begin
  -- tags
  drop policy if exists msg_thread_tags_select on msg_thread_tags;
  create policy msg_thread_tags_select on msg_thread_tags
    for select using (
      exists (
        select 1 from workspace_members wm
        where wm.workspace_id = msg_thread_tags.workspace_id
          and wm.user_id = auth.uid()
      )
      or auth.role() = 'service_role'
    );
  drop policy if exists msg_thread_tags_write on msg_thread_tags;
  create policy msg_thread_tags_write on msg_thread_tags
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = msg_thread_tags.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin','member')
        )
      )
      or auth.role() = 'service_role'
    )
    with check (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = msg_thread_tags.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin','member')
        )
      )
      or auth.role() = 'service_role'
    );

  -- notes
  drop policy if exists msg_thread_notes_select on msg_thread_notes;
  create policy msg_thread_notes_select on msg_thread_notes
    for select using (
      exists (
        select 1 from workspace_members wm
        where wm.workspace_id = msg_thread_notes.workspace_id
          and wm.user_id = auth.uid()
      )
      or auth.role() = 'service_role'
    );
  drop policy if exists msg_thread_notes_write on msg_thread_notes;
  create policy msg_thread_notes_write on msg_thread_notes
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = msg_thread_notes.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin','member')
        )
      )
      or auth.role() = 'service_role'
    )
    with check (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = msg_thread_notes.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin','member')
        )
      )
      or auth.role() = 'service_role'
    );

  -- status events
  drop policy if exists wa_status_select on wa_message_status_events;
  create policy wa_status_select on wa_message_status_events
    for select using (
      exists (
        select 1 from workspace_members wm
        where wm.workspace_id = wa_message_status_events.workspace_id
          and wm.user_id = auth.uid()
      )
      or auth.role() = 'service_role'
    );
  drop policy if exists wa_status_write on wa_message_status_events;
  create policy wa_status_write on wa_message_status_events
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
end $$;
