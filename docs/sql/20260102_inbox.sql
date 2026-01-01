-- Inbox + WhatsApp status support
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

alter table messages
  add column if not exists wa_message_id text,
  add column if not exists status text,
  add column if not exists error_reason text,
  add column if not exists media_url text,
  add column if not exists media_mime text,
  add column if not exists media_sha256 text;

alter table conversations
  add column if not exists is_archived boolean default false,
  add column if not exists pinned boolean default false,
  add column if not exists snoozed_until timestamptz,
  add column if not exists last_read_at timestamptz;

create table if not exists message_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references messages(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  ts timestamptz not null default now()
);

create unique index if not exists messages_wa_message_id_key
  on messages (wa_message_id);

create index if not exists messages_conversation_ts_idx
  on messages (conversation_id, ts desc);

create index if not exists conversations_state_idx
  on conversations (is_archived, pinned, snoozed_until, last_message_at desc);

alter table messages enable row level security;
alter table conversations enable row level security;
alter table message_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversations'
      and policyname = 'admin_select_conversations'
  ) then
    create policy admin_select_conversations
      on conversations for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = conversations.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversations'
      and policyname = 'admin_insert_conversations'
  ) then
    create policy admin_insert_conversations
      on conversations for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = conversations.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversations'
      and policyname = 'admin_update_conversations'
  ) then
    create policy admin_update_conversations
      on conversations for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = conversations.workspace_id
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'admin_select_messages'
  ) then
    create policy admin_select_messages
      on messages for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = messages.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'admin_insert_messages'
  ) then
    create policy admin_insert_messages
      on messages for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = messages.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'admin_update_messages'
  ) then
    create policy admin_update_messages
      on messages for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = messages.workspace_id
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'message_events'
      and policyname = 'admin_select_message_events'
  ) then
    create policy admin_select_message_events
      on message_events for select
      using (
        exists (
          select 1
          from messages m
          join workspace_members wm
            on wm.workspace_id = m.workspace_id
          where m.id = message_events.message_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'message_events'
      and policyname = 'admin_insert_message_events'
  ) then
    create policy admin_insert_message_events
      on message_events for insert with check (
        exists (
          select 1
          from messages m
          join workspace_members wm
            on wm.workspace_id = m.workspace_id
          where m.id = message_events.message_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'message_events'
      and policyname = 'admin_update_message_events'
  ) then
    create policy admin_update_message_events
      on message_events for update
      using (
        exists (
          select 1
          from messages m
          join workspace_members wm
            on wm.workspace_id = m.workspace_id
          where m.id = message_events.message_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;
end
$$;
