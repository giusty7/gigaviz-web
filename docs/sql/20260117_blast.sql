-- WhatsApp blast/campaign tables + consent flags
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  template_name text not null,
  language text not null,
  status text not null default 'queued',
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create table if not exists campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  to_phone text not null,
  status text not null default 'queued',
  wa_message_id text,
  error_reason text,
  attempted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists campaigns_workspace_created_idx
  on campaigns (workspace_id, created_at desc);

create index if not exists campaign_recipients_campaign_status_idx
  on campaign_recipients (campaign_id, status, created_at asc);

create index if not exists campaign_recipients_contact_idx
  on campaign_recipients (contact_id, created_at desc);

alter table contacts
  add column if not exists opted_in boolean not null default false,
  add column if not exists opted_out boolean not null default false;

alter table campaigns enable row level security;
alter table campaign_recipients enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaigns'
      and policyname = 'campaigns_select_workspace'
  ) then
    create policy campaigns_select_workspace
      on campaigns for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = campaigns.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor', 'agent')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaigns'
      and policyname = 'campaigns_insert_admin_supervisor'
  ) then
    create policy campaigns_insert_admin_supervisor
      on campaigns for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = campaigns.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaigns'
      and policyname = 'campaigns_update_admin_supervisor'
  ) then
    create policy campaigns_update_admin_supervisor
      on campaigns for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = campaigns.workspace_id
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
      and tablename = 'campaign_recipients'
      and policyname = 'campaign_recipients_select_workspace'
  ) then
    create policy campaign_recipients_select_workspace
      on campaign_recipients for select
      using (
        exists (
          select 1
          from campaigns c
          join workspace_members wm
            on wm.workspace_id = c.workspace_id
          where c.id = campaign_recipients.campaign_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor', 'agent')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaign_recipients'
      and policyname = 'campaign_recipients_insert_admin_supervisor'
  ) then
    create policy campaign_recipients_insert_admin_supervisor
      on campaign_recipients for insert with check (
        exists (
          select 1
          from campaigns c
          join workspace_members wm
            on wm.workspace_id = c.workspace_id
          where c.id = campaign_recipients.campaign_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaign_recipients'
      and policyname = 'campaign_recipients_update_admin_supervisor'
  ) then
    create policy campaign_recipients_update_admin_supervisor
      on campaign_recipients for update
      using (
        exists (
          select 1
          from campaigns c
          join workspace_members wm
            on wm.workspace_id = c.workspace_id
          where c.id = campaign_recipients.campaign_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;
end
$$;

-- Rollback notes:
-- drop policy if exists campaign_recipients_update_admin_supervisor on campaign_recipients;
-- drop policy if exists campaign_recipients_insert_admin_supervisor on campaign_recipients;
-- drop policy if exists campaign_recipients_select_workspace on campaign_recipients;
-- drop policy if exists campaigns_update_admin_supervisor on campaigns;
-- drop policy if exists campaigns_insert_admin_supervisor on campaigns;
-- drop policy if exists campaigns_select_workspace on campaigns;
-- alter table contacts drop column if exists opted_in;
-- alter table contacts drop column if exists opted_out;
-- drop index if exists campaign_recipients_contact_idx;
-- drop index if exists campaign_recipients_campaign_status_idx;
-- drop index if exists campaigns_workspace_created_idx;
-- drop table if exists campaign_recipients;
-- drop table if exists campaigns;
