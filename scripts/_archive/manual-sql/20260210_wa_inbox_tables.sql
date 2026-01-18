-- WhatsApp inbox tables (threads/messages/tags/notes)
-- Create dedicated wa_* tables with required indexes.

create extension if not exists "pgcrypto";

create table if not exists wa_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  phone_number_id text not null,
  contact_wa_id text not null,
  contact_name text null,
  status text not null default 'open',
  assigned_to uuid null,
  unread_count int not null default 0,
  last_message_preview text null,
  last_message_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_wa_threads_ws_phone_contact
  on public.wa_threads (workspace_id, phone_number_id, contact_wa_id);
create index if not exists idx_wa_threads_workspace_last_message
  on public.wa_threads (workspace_id, last_message_at desc);
create index if not exists idx_wa_threads_assigned
  on public.wa_threads (workspace_id, assigned_to);

create table if not exists wa_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  thread_id uuid not null references wa_threads(id) on delete cascade,
  wa_message_id text null,
  direction text not null,
  message_type text null,
  body text null,
  content_json jsonb not null default '{}'::jsonb,
  status text null,
  sent_at timestamptz null,
  received_at timestamptz null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_wa_messages_ws_wa_message_id
  on public.wa_messages (workspace_id, wa_message_id)
  where wa_message_id is not null;
create index if not exists idx_wa_messages_thread_time
  on public.wa_messages (thread_id, created_at desc);

create table if not exists wa_thread_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  thread_id uuid not null references wa_threads(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, thread_id, tag)
);

create table if not exists wa_thread_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  thread_id uuid not null references wa_threads(id) on delete cascade,
  author_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table wa_threads enable row level security;
alter table wa_messages enable row level security;
alter table wa_thread_tags enable row level security;
alter table wa_thread_notes enable row level security;

do $$
begin
  -- Threads: members read; service_role writes
  drop policy if exists wa_threads_select on wa_threads;
  create policy wa_threads_select on wa_threads
    for select using (
      exists (
        select 1 from workspace_members wm
        where wm.workspace_id = wa_threads.workspace_id
          and wm.user_id = auth.uid()
      )
      or auth.role() = 'service_role'
    );
  drop policy if exists wa_threads_write on wa_threads;
  create policy wa_threads_write on wa_threads
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

  -- Messages: members read; service_role writes
  drop policy if exists wa_messages_select on wa_messages;
  create policy wa_messages_select on wa_messages
    for select using (
      exists (
        select 1 from workspace_members wm
        where wm.workspace_id = wa_messages.workspace_id
          and wm.user_id = auth.uid()
      )
      or auth.role() = 'service_role'
    );
  drop policy if exists wa_messages_write on wa_messages;
  create policy wa_messages_write on wa_messages
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

  -- Tags: members read; service_role writes
  drop policy if exists wa_thread_tags_select on wa_thread_tags;
  create policy wa_thread_tags_select on wa_thread_tags
    for select using (
      exists (
        select 1 from workspace_members wm
        where wm.workspace_id = wa_thread_tags.workspace_id
          and wm.user_id = auth.uid()
      )
      or auth.role() = 'service_role'
    );
  drop policy if exists wa_thread_tags_write on wa_thread_tags;
  create policy wa_thread_tags_write on wa_thread_tags
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

  -- Notes: members read; service_role writes
  drop policy if exists wa_thread_notes_select on wa_thread_notes;
  create policy wa_thread_notes_select on wa_thread_notes
    for select using (
      exists (
        select 1 from workspace_members wm
        where wm.workspace_id = wa_thread_notes.workspace_id
          and wm.user_id = auth.uid()
      )
      or auth.role() = 'service_role'
    );
  drop policy if exists wa_thread_notes_write on wa_thread_notes;
  create policy wa_thread_notes_write on wa_thread_notes
    for all using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
end $$;
