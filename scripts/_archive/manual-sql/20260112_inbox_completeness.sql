-- Inbox completeness: message search FTS, conversation notes, ticketing constraints, first response, supervisor RLS
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

alter table conversations
  add column if not exists ticket_status text default 'open',
  add column if not exists priority text default 'low',
  add column if not exists first_response_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_ticket_status_check'
  ) then
    alter table conversations
      add constraint conversations_ticket_status_check
      check (ticket_status in ('open', 'pending', 'solved', 'spam'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_priority_check'
  ) then
    alter table conversations
      add constraint conversations_priority_check
      check (priority in ('low', 'med', 'high', 'urgent'));
  end if;
end
$$;

create index if not exists conversations_ticket_status_idx
  on conversations (workspace_id, ticket_status);

create index if not exists conversations_priority_idx
  on conversations (workspace_id, priority);

-- Optional backfill (safe): ensure existing rows have defaults.
-- update conversations
--   set ticket_status = 'open'
--   where ticket_status is null;
-- update conversations
--   set priority = 'low'
--   where priority is null;

alter table messages
  add column if not exists search_tsv tsvector
    generated always as (to_tsvector('simple', coalesce(text, ''))) stored;

create index if not exists messages_search_tsv_idx
  on messages using gin (search_tsv);

create table if not exists conversation_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  author_user_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversation_notes_workspace_idx
  on conversation_notes (workspace_id);

create index if not exists conversation_notes_conversation_idx
  on conversation_notes (conversation_id, created_at desc);

alter table conversation_notes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversations'
      and policyname = 'supervisor_select_conversations'
  ) then
    create policy supervisor_select_conversations
      on conversations for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
            and wm.workspace_id = conversations.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversations'
      and policyname = 'supervisor_update_conversations'
  ) then
    create policy supervisor_update_conversations
      on conversations for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
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
      and policyname = 'supervisor_select_messages'
  ) then
    create policy supervisor_select_messages
      on messages for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
            and wm.workspace_id = messages.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'supervisor_insert_messages'
  ) then
    create policy supervisor_insert_messages
      on messages for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
            and wm.workspace_id = messages.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'supervisor_update_messages'
  ) then
    create policy supervisor_update_messages
      on messages for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
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
      and policyname = 'supervisor_select_message_events'
  ) then
    create policy supervisor_select_message_events
      on message_events for select
      using (
        exists (
          select 1
          from messages m
          join workspace_members wm
            on wm.workspace_id = m.workspace_id
          where m.id = message_events.message_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'message_events'
      and policyname = 'supervisor_insert_message_events'
  ) then
    create policy supervisor_insert_message_events
      on message_events for insert with check (
        exists (
          select 1
          from messages m
          join workspace_members wm
            on wm.workspace_id = m.workspace_id
          where m.id = message_events.message_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
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
      and tablename = 'conversation_events'
      and policyname = 'supervisor_select_conversation_events'
  ) then
    create policy supervisor_select_conversation_events
      on conversation_events for select
      using (
        exists (
          select 1
          from conversations c
          join workspace_members wm
            on wm.workspace_id = c.workspace_id
          where c.id = conversation_events.conversation_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversation_events'
      and policyname = 'supervisor_insert_conversation_events'
  ) then
    create policy supervisor_insert_conversation_events
      on conversation_events for insert with check (
        exists (
          select 1
          from conversations c
          join workspace_members wm
            on wm.workspace_id = c.workspace_id
          where c.id = conversation_events.conversation_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
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
      and tablename = 'teams'
      and policyname = 'supervisor_select_teams'
  ) then
    create policy supervisor_select_teams
      on teams for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = teams.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
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
      and tablename = 'team_members'
      and policyname = 'supervisor_select_team_members'
  ) then
    create policy supervisor_select_team_members
      on team_members for select
      using (
        exists (
          select 1
          from teams t
          join workspace_members wm
            on wm.workspace_id = t.workspace_id
          where t.id = team_members.team_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_members'
      and policyname = 'supervisor_update_team_members'
  ) then
    create policy supervisor_update_team_members
      on team_members for update
      using (
        exists (
          select 1
          from teams t
          join workspace_members wm
            on wm.workspace_id = t.workspace_id
          where t.id = team_members.team_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
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
      and tablename = 'conversation_notes'
      and policyname = 'supervisor_select_conversation_notes'
  ) then
    create policy supervisor_select_conversation_notes
      on conversation_notes for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = conversation_notes.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversation_notes'
      and policyname = 'supervisor_insert_conversation_notes'
  ) then
    create policy supervisor_insert_conversation_notes
      on conversation_notes for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = conversation_notes.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;
end
$$;

-- Rollback notes:
-- Middleware verification note:
-- - Ensure workspace_members row exists for the user; missing membership should still fail RLS.
-- drop policy if exists supervisor_select_conversation_notes on conversation_notes;
-- drop policy if exists supervisor_insert_conversation_notes on conversation_notes;
-- drop policy if exists supervisor_select_team_members on team_members;
-- drop policy if exists supervisor_update_team_members on team_members;
-- drop policy if exists supervisor_select_teams on teams;
-- drop policy if exists supervisor_select_conversation_events on conversation_events;
-- drop policy if exists supervisor_insert_conversation_events on conversation_events;
-- drop policy if exists supervisor_select_message_events on message_events;
-- drop policy if exists supervisor_insert_message_events on message_events;
-- drop policy if exists supervisor_select_messages on messages;
-- drop policy if exists supervisor_insert_messages on messages;
-- drop policy if exists supervisor_update_messages on messages;
-- drop policy if exists supervisor_select_conversations on conversations;
-- drop policy if exists supervisor_update_conversations on conversations;
-- drop table if exists conversation_notes;
-- drop index if exists conversation_notes_conversation_idx;
-- drop index if exists conversation_notes_workspace_idx;
-- drop index if exists messages_search_tsv_idx;
-- alter table messages drop column if exists search_tsv;
-- drop index if exists conversations_priority_idx;
-- drop index if exists conversations_ticket_status_idx;
-- alter table conversations drop constraint if exists conversations_priority_check;
-- alter table conversations drop constraint if exists conversations_ticket_status_check;
-- alter table conversations drop column if exists first_response_at;
-- alter table conversations drop column if exists priority;
-- alter table conversations drop column if exists ticket_status;
