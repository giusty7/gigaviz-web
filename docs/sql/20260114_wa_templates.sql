-- WhatsApp templates + audit events
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

create table if not exists wa_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  category text not null,
  language text not null,
  status text not null default 'pending',
  body text not null,
  header text,
  footer text,
  buttons jsonb not null default '[]'::jsonb,
  meta_template_id text,
  meta_payload jsonb not null default '{}'::jsonb,
  meta_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists wa_templates_workspace_name_language_key
  on wa_templates (workspace_id, name, language);

create index if not exists wa_templates_workspace_status_idx
  on wa_templates (workspace_id, status);

create index if not exists wa_templates_updated_at_idx
  on wa_templates (workspace_id, updated_at desc);

create table if not exists wa_template_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  template_id uuid not null references wa_templates(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by text not null default 'system'
);

create index if not exists wa_template_events_workspace_idx
  on wa_template_events (workspace_id, created_at desc);

alter table wa_templates enable row level security;
alter table wa_template_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'wa_templates'
      and policyname = 'template_select_workspace'
  ) then
    create policy template_select_workspace
      on wa_templates for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = wa_templates.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor', 'agent')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'wa_templates'
      and policyname = 'template_insert_admin_supervisor'
  ) then
    create policy template_insert_admin_supervisor
      on wa_templates for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = wa_templates.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'wa_templates'
      and policyname = 'template_update_admin_supervisor'
  ) then
    create policy template_update_admin_supervisor
      on wa_templates for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = wa_templates.workspace_id
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
      and tablename = 'wa_template_events'
      and policyname = 'template_events_select_workspace'
  ) then
    create policy template_events_select_workspace
      on wa_template_events for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = wa_template_events.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor', 'agent')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'wa_template_events'
      and policyname = 'template_events_insert_admin_supervisor'
  ) then
    create policy template_events_insert_admin_supervisor
      on wa_template_events for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = wa_template_events.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;
end
$$;

-- Rollback notes:
-- drop policy if exists template_events_insert_admin_supervisor on wa_template_events;
-- drop policy if exists template_events_select_workspace on wa_template_events;
-- drop policy if exists template_update_admin_supervisor on wa_templates;
-- drop policy if exists template_insert_admin_supervisor on wa_templates;
-- drop policy if exists template_select_workspace on wa_templates;
-- drop table if exists wa_template_events;
-- drop index if exists wa_template_events_workspace_idx;
-- drop index if exists wa_templates_updated_at_idx;
-- drop index if exists wa_templates_workspace_status_idx;
-- drop index if exists wa_templates_workspace_name_language_key;
-- drop table if exists wa_templates;
