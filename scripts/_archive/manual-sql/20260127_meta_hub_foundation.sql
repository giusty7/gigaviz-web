-- Meta Hub foundation schema (Stage 2)
-- Create generic meta tables, unified messaging, and WhatsApp-specific entities.
-- RLS ensures workspace isolation using workspace_members.

create extension if not exists "pgcrypto";

-- =====================
-- A) META GENERIC
-- =====================
create table if not exists meta_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null default 'meta',
  status text not null default 'inactive',
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_meta_connections_workspace on meta_connections(workspace_id);

create table if not exists meta_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null default 'meta',
  token_encrypted text not null,
  expires_at timestamptz null,
  scopes_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_meta_tokens_workspace on meta_tokens(workspace_id);

create table if not exists meta_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  asset_type text not null,
  asset_id text not null,
  display_name text,
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'inactive',
  created_at timestamptz not null default now()
);
create index if not exists idx_meta_assets_workspace on meta_assets(workspace_id);
create index if not exists idx_meta_assets_type_id on meta_assets(workspace_id, asset_type, asset_id);

create table if not exists meta_webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  object text not null,
  fields_json jsonb not null default '[]'::jsonb,
  callback_url text,
  verify_token_ref text,
  created_at timestamptz not null default now()
);
create index if not exists idx_meta_webhook_subscriptions_workspace on meta_webhook_subscriptions(workspace_id);

create table if not exists meta_webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  channel text not null,
  object text,
  event_type text,
  external_event_id text,
  payload_json jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_text text
);
create unique index if not exists uq_meta_webhook_events_ext
  on meta_webhook_events(workspace_id, external_event_id) where external_event_id is not null;
create index if not exists idx_meta_webhook_events_workspace_time
  on meta_webhook_events(workspace_id, received_at desc);

-- =====================
-- B) UNIFIED MESSAGING
-- =====================
create table if not exists msg_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  channel text not null,
  external_user_id text,
  display_name text,
  phone text,
  email text,
  username text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_msg_contacts_workspace_channel on msg_contacts(workspace_id, channel);

create table if not exists msg_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  channel text not null,
  external_thread_id text,
  contact_id uuid references msg_contacts(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_msg_threads_workspace_channel on msg_threads(workspace_id, channel);
create index if not exists idx_msg_threads_contact on msg_threads(contact_id);

create table if not exists msg_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  thread_id uuid references msg_threads(id) on delete set null,
  channel text not null,
  direction text not null,
  external_message_id text,
  content_json jsonb not null default '{}'::jsonb,
  status text,
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_msg_messages_workspace_thread_time
  on msg_messages(workspace_id, channel, thread_id, created_at desc);

-- =====================
-- C) WHATSAPP SPECIFIC
-- =====================
create table if not exists wa_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  phone_number_id text not null,
  waba_id text,
  display_name text,
  status text,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_phone_numbers_workspace on wa_phone_numbers(workspace_id);
create index if not exists idx_wa_phone_numbers_number on wa_phone_numbers(phone_number_id);

create table if not exists wa_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  phone_number_id text,
  name text not null,
  language text,
  status text,
  category text,
  components_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_templates_workspace on wa_templates(workspace_id);
create index if not exists idx_wa_templates_phone on wa_templates(phone_number_id);

create table if not exists wa_campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  phone_number_id text,
  template_name text,
  scheduled_at timestamptz,
  status text,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_campaigns_workspace on wa_campaigns(workspace_id);

create table if not exists wa_campaign_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  campaign_id uuid references wa_campaigns(id) on delete cascade,
  to_phone text,
  status text,
  result_json jsonb not null default '{}'::jsonb,
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_wa_campaign_jobs_workspace on wa_campaign_jobs(workspace_id);
create index if not exists idx_wa_campaign_jobs_campaign on wa_campaign_jobs(campaign_id);

-- =====================
-- RLS POLICIES
-- Pattern:
--   membership exists in workspace_members for auth.uid()
--   owner/admin write on meta registries and phone numbers
--   members can read; members can write on messaging/campaign/template tables
--   service_role full access
-- =====================

-- helper membership checks inline per table

-- Enable RLS
alter table meta_connections enable row level security;
alter table meta_tokens enable row level security;
alter table meta_assets enable row level security;
alter table meta_webhook_subscriptions enable row level security;
alter table meta_webhook_events enable row level security;
alter table msg_contacts enable row level security;
alter table msg_threads enable row level security;
alter table msg_messages enable row level security;
alter table wa_phone_numbers enable row level security;
alter table wa_templates enable row level security;
alter table wa_campaigns enable row level security;
alter table wa_campaign_jobs enable row level security;

-- Meta connections/tokens/assets/subscriptions/events
do $$
begin
  -- meta_connections
  drop policy if exists meta_connections_select on meta_connections;
  create policy meta_connections_select on meta_connections
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = meta_connections.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists meta_connections_write on meta_connections;
  create policy meta_connections_write on meta_connections
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = meta_connections.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    )
    with check (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = meta_connections.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    );

  -- meta_tokens
  drop policy if exists meta_tokens_select on meta_tokens;
  create policy meta_tokens_select on meta_tokens
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = meta_tokens.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists meta_tokens_write on meta_tokens;
  create policy meta_tokens_write on meta_tokens
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = meta_tokens.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    )
    with check (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = meta_tokens.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    );

  -- meta_assets
  drop policy if exists meta_assets_select on meta_assets;
  create policy meta_assets_select on meta_assets
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = meta_assets.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists meta_assets_write on meta_assets;
  create policy meta_assets_write on meta_assets
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = meta_assets.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    )
    with check (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = meta_assets.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    );

  -- meta_webhook_subscriptions
  drop policy if exists meta_webhook_subscriptions_select on meta_webhook_subscriptions;
  create policy meta_webhook_subscriptions_select on meta_webhook_subscriptions
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = meta_webhook_subscriptions.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists meta_webhook_subscriptions_write on meta_webhook_subscriptions;
  create policy meta_webhook_subscriptions_write on meta_webhook_subscriptions
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = meta_webhook_subscriptions.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    )
    with check (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = meta_webhook_subscriptions.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    );

  -- meta_webhook_events: insert allowed for service_role; select for members; updates admin/owner or service role
  drop policy if exists meta_webhook_events_select on meta_webhook_events;
  create policy meta_webhook_events_select on meta_webhook_events
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = meta_webhook_events.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists meta_webhook_events_insert on meta_webhook_events;
  create policy meta_webhook_events_insert on meta_webhook_events
    for insert with check (auth.role() = 'service_role');
  drop policy if exists meta_webhook_events_update on meta_webhook_events;
  create policy meta_webhook_events_update on meta_webhook_events
    for update using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = meta_webhook_events.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    );
end $$;

-- Messaging (contacts, threads, messages) - members can write
do $$
begin
  drop policy if exists msg_contacts_select on msg_contacts;
  create policy msg_contacts_select on msg_contacts
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = msg_contacts.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists msg_contacts_write on msg_contacts;
  create policy msg_contacts_write on msg_contacts
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = msg_contacts.workspace_id
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
          where wm.workspace_id = msg_contacts.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin','member')
        )
      )
      or auth.role() = 'service_role'
    );

  drop policy if exists msg_threads_select on msg_threads;
  create policy msg_threads_select on msg_threads
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = msg_threads.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists msg_threads_write on msg_threads;
  create policy msg_threads_write on msg_threads
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = msg_threads.workspace_id
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
          where wm.workspace_id = msg_threads.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin','member')
        )
      )
      or auth.role() = 'service_role'
    );

  drop policy if exists msg_messages_select on msg_messages;
  create policy msg_messages_select on msg_messages
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = msg_messages.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists msg_messages_write on msg_messages;
  create policy msg_messages_write on msg_messages
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = msg_messages.workspace_id
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
          where wm.workspace_id = msg_messages.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin','member')
        )
      )
      or auth.role() = 'service_role'
    );
end $$;

-- WhatsApp specific: phone_numbers admin-only writes; templates/campaigns/jobs allow members
do $$
begin
  drop policy if exists wa_phone_numbers_select on wa_phone_numbers;
  create policy wa_phone_numbers_select on wa_phone_numbers
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = wa_phone_numbers.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists wa_phone_numbers_write on wa_phone_numbers;
  create policy wa_phone_numbers_write on wa_phone_numbers
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = wa_phone_numbers.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    )
    with check (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = wa_phone_numbers.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    );

  drop policy if exists wa_templates_select on wa_templates;
  create policy wa_templates_select on wa_templates
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = wa_templates.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists wa_templates_write on wa_templates;
  create policy wa_templates_write on wa_templates
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = wa_templates.workspace_id
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
          where wm.workspace_id = wa_templates.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin','member')
        )
      )
      or auth.role() = 'service_role'
    );

  drop policy if exists wa_campaigns_select on wa_campaigns;
  create policy wa_campaigns_select on wa_campaigns
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = wa_campaigns.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists wa_campaigns_write on wa_campaigns;
  create policy wa_campaigns_write on wa_campaigns
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = wa_campaigns.workspace_id
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
          where wm.workspace_id = wa_campaigns.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin','member')
        )
      )
      or auth.role() = 'service_role'
    );

  drop policy if exists wa_campaign_jobs_select on wa_campaign_jobs;
  create policy wa_campaign_jobs_select on wa_campaign_jobs
    for select using (
      exists (select 1 from workspace_members wm where wm.workspace_id = wa_campaign_jobs.workspace_id and wm.user_id = auth.uid())
      or auth.role() = 'service_role'
    );
  drop policy if exists wa_campaign_jobs_write on wa_campaign_jobs;
  create policy wa_campaign_jobs_write on wa_campaign_jobs
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = wa_campaign_jobs.workspace_id
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
          where wm.workspace_id = wa_campaign_jobs.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin','member')
        )
      )
      or auth.role() = 'service_role'
    );
end $$;

-- =====================
-- Sanity check queries (run manually):
-- select * from meta_connections limit 1;
-- select * from meta_webhook_events order by received_at desc limit 5;
-- select * from msg_messages order by created_at desc limit 5;
-- select * from wa_templates limit 5;
-- =====================
