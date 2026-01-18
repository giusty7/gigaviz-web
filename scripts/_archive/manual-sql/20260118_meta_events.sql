-- Meta events logging table + RLS
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

create table if not exists meta_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  recorded_by uuid,
  contact_id uuid references contacts(id) on delete set null,
  phone_e164 text,
  source text not null default 'inbox',
  event_name text not null,
  event_time timestamptz not null default now(),
  status text not null default 'recorded',
  meta_request jsonb,
  meta_response jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists meta_events_workspace_created_idx
  on meta_events (workspace_id, created_at desc);

create index if not exists meta_events_workspace_status_idx
  on meta_events (workspace_id, status);

create index if not exists meta_events_workspace_event_idx
  on meta_events (workspace_id, event_name);

alter table meta_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'meta_events'
      and policyname = 'meta_events_select_workspace'
  ) then
    create policy meta_events_select_workspace
      on meta_events for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = meta_events.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'meta_events'
      and policyname = 'meta_events_insert_admin_supervisor'
  ) then
    create policy meta_events_insert_admin_supervisor
      on meta_events for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = meta_events.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'meta_events'
      and policyname = 'meta_events_update_admin_supervisor'
  ) then
    create policy meta_events_update_admin_supervisor
      on meta_events for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = meta_events.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;
end
$$;

-- Rollback notes:
-- drop policy if exists meta_events_update_admin_supervisor on meta_events;
-- drop policy if exists meta_events_insert_admin_supervisor on meta_events;
-- drop policy if exists meta_events_select_workspace on meta_events;
-- drop index if exists meta_events_workspace_event_idx;
-- drop index if exists meta_events_workspace_status_idx;
-- drop index if exists meta_events_workspace_created_idx;
-- drop table if exists meta_events;
