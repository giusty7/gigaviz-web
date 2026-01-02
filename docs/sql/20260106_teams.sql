-- Teams, team members, conversation events, and round-robin assignment
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  member_id uuid not null,
  is_active boolean not null default true,
  last_assigned_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists conversation_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  type text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by text not null default 'system'
);

alter table conversations
  add column if not exists team_id uuid references teams(id),
  add column if not exists assigned_member_id uuid;

create index if not exists team_members_rr_idx
  on team_members (team_id, is_active, last_assigned_at);

create index if not exists conversations_assignment_idx
  on conversations (workspace_id, team_id, assigned_member_id);

alter table teams enable row level security;
alter table team_members enable row level security;
alter table conversation_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'teams'
      and policyname = 'admin_select_teams'
  ) then
    create policy admin_select_teams
      on teams for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = teams.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'teams'
      and policyname = 'admin_insert_teams'
  ) then
    create policy admin_insert_teams
      on teams for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = teams.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'teams'
      and policyname = 'admin_update_teams'
  ) then
    create policy admin_update_teams
      on teams for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = teams.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
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
      and policyname = 'admin_select_team_members'
  ) then
    create policy admin_select_team_members
      on team_members for select
      using (
        exists (
          select 1
          from teams t
          join workspace_members wm
            on wm.workspace_id = t.workspace_id
          where t.id = team_members.team_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_members'
      and policyname = 'admin_insert_team_members'
  ) then
    create policy admin_insert_team_members
      on team_members for insert with check (
        exists (
          select 1
          from teams t
          join workspace_members wm
            on wm.workspace_id = t.workspace_id
          where t.id = team_members.team_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_members'
      and policyname = 'admin_update_team_members'
  ) then
    create policy admin_update_team_members
      on team_members for update
      using (
        exists (
          select 1
          from teams t
          join workspace_members wm
            on wm.workspace_id = t.workspace_id
          where t.id = team_members.team_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
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
      and policyname = 'admin_select_conversation_events'
  ) then
    create policy admin_select_conversation_events
      on conversation_events for select
      using (
        exists (
          select 1
          from conversations c
          join workspace_members wm
            on wm.workspace_id = c.workspace_id
          where c.id = conversation_events.conversation_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversation_events'
      and policyname = 'admin_insert_conversation_events'
  ) then
    create policy admin_insert_conversation_events
      on conversation_events for insert with check (
        exists (
          select 1
          from conversations c
          join workspace_members wm
            on wm.workspace_id = c.workspace_id
          where c.id = conversation_events.conversation_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;
end
$$;

create or replace function assign_conversation_round_robin(
  p_conversation_id uuid,
  p_team_id uuid
)
returns uuid
language plpgsql
as $$
declare
  chosen_member_id uuid;
  prev_member_id uuid;
  now_ts timestamptz := now();
begin
  select assigned_member_id
    into prev_member_id
  from conversations
  where id = p_conversation_id
  for update;

  select id
    into chosen_member_id
  from team_members
  where team_id = p_team_id
    and is_active = true
  order by last_assigned_at nulls first, id
  for update skip locked
  limit 1;

  if chosen_member_id is null then
    return null;
  end if;

  update team_members
    set last_assigned_at = now_ts
  where id = chosen_member_id;

  update conversations
    set team_id = p_team_id,
        assigned_member_id = chosen_member_id,
        assigned_to = chosen_member_id::text
  where id = p_conversation_id;

  insert into conversation_events (conversation_id, type, meta, created_by)
  values (
    p_conversation_id,
    'assigned',
    jsonb_build_object(
      'previous_assignee', prev_member_id,
      'new_assignee', chosen_member_id,
      'team_id', p_team_id
    ),
    'system'
  );

  return chosen_member_id;
end;
$$;

-- Rollback notes:
-- drop function if exists assign_conversation_round_robin(uuid, uuid);
-- drop policy if exists admin_select_conversation_events on conversation_events;
-- drop policy if exists admin_insert_conversation_events on conversation_events;
-- drop policy if exists admin_select_team_members on team_members;
-- drop policy if exists admin_insert_team_members on team_members;
-- drop policy if exists admin_update_team_members on team_members;
-- drop policy if exists admin_select_teams on teams;
-- drop policy if exists admin_insert_teams on teams;
-- drop policy if exists admin_update_teams on teams;
-- drop table if exists conversation_events;
-- drop table if exists team_members;
-- drop table if exists teams;
-- alter table conversations drop column if exists team_id;
-- alter table conversations drop column if exists assigned_member_id;
