-- ═══════════════════════════════════════════════════════════════════════════
-- WhatsApp Templates System with Jobs, Param Defs, Contacts, and Logs
-- 
-- This migration creates a complete template-based messaging system:
-- 1. wa_templates: stores synced templates from Meta with variable counts
-- 2. wa_template_param_defs: parameter mapping definitions (manual/contact_field/expression)
-- 3. wa_contacts: minimal contact storage (if not already present)
-- 4. wa_send_jobs: batch/campaign jobs
-- 5. wa_send_job_items: individual send items per job
-- 6. wa_send_logs: detailed logs for all sends
-- ═══════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1) wa_templates: Enhanced with variable_count and components_json
-- ────────────────────────────────────────────────────────────────────────────
do $$
begin
  -- Create table if not exists (idempotent)
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'wa_templates') then
    create table public.wa_templates (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      phone_number_id text not null,
      name text not null,
      language text not null default 'id',
      status text not null default 'pending',
      category text,
      body text not null default '',
      header text,
      footer text,
      buttons jsonb default '[]'::jsonb,
      meta_template_id text,
      meta_payload jsonb,
      meta_response jsonb,
      quality_score text,
      rejection_reason text,
      last_synced_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists idx_wa_templates_workspace on public.wa_templates(workspace_id);
    create index if not exists idx_wa_templates_phone on public.wa_templates(phone_number_id);
    create index if not exists idx_wa_templates_status on public.wa_templates(status);
    create unique index if not exists idx_wa_templates_unique on public.wa_templates(workspace_id, phone_number_id, name, language);

    -- RLS
    alter table public.wa_templates enable row level security;
    create policy "Users access own workspace templates" on public.wa_templates
      for all using (workspace_id in (
        select workspace_id from public.workspace_memberships where user_id = auth.uid()
      ));
  end if;

  -- Add variable_count column if missing
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wa_templates' and column_name = 'variable_count'
  ) then
    alter table public.wa_templates add column variable_count int not null default 0;
    create index if not exists idx_wa_templates_var_count on public.wa_templates(variable_count);
  end if;

  -- Add components_json column if missing (stores full Meta component structure)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wa_templates' and column_name = 'components_json'
  ) then
    alter table public.wa_templates add column components_json jsonb;
  end if;

  -- Add has_buttons flag if missing
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wa_templates' and column_name = 'has_buttons'
  ) then
    alter table public.wa_templates add column has_buttons boolean not null default false;
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2) wa_template_param_defs: Parameter mapping definitions
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.wa_template_param_defs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_id uuid not null references public.wa_templates(id) on delete cascade,
  param_index int not null, -- 1-based: {{1}}, {{2}}, ...
  source_type text not null check (source_type in ('manual', 'contact_field', 'expression')),
  source_value text, -- field name or expression string
  default_value text, -- fallback if source fails
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wa_template_param_defs_unique unique (template_id, param_index)
);

create index if not exists idx_wa_template_param_defs_workspace on public.wa_template_param_defs(workspace_id);
create index if not exists idx_wa_template_param_defs_template on public.wa_template_param_defs(template_id);

alter table public.wa_template_param_defs enable row level security;

create policy "Users access own workspace param defs" on public.wa_template_param_defs
  for all using (workspace_id in (
    select workspace_id from public.workspace_memberships where user_id = auth.uid()
  ));

-- ────────────────────────────────────────────────────────────────────────────
-- 3) wa_contacts: Minimal contact storage (if not already present)
-- ────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'wa_contacts') then
    create table public.wa_contacts (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      wa_id text not null, -- WhatsApp ID (phone number without +)
      name text,
      phone text,
      email text,
      tags text[] default '{}',
      data jsonb default '{}'::jsonb, -- additional custom fields
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint wa_contacts_unique unique (workspace_id, wa_id)
    );

    create index if not exists idx_wa_contacts_workspace on public.wa_contacts(workspace_id);
    create index if not exists idx_wa_contacts_wa_id on public.wa_contacts(wa_id);
    create index if not exists idx_wa_contacts_tags on public.wa_contacts using gin(tags);

    alter table public.wa_contacts enable row level security;

    create policy "Users access own workspace contacts" on public.wa_contacts
      for all using (workspace_id in (
        select workspace_id from public.workspace_memberships where user_id = auth.uid()
      ));
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 4) wa_send_jobs: Batch/campaign jobs
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.wa_send_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  connection_id uuid not null, -- references wa_phone_numbers(id) but not FK to avoid cascade issues
  template_id uuid not null references public.wa_templates(id) on delete restrict,
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_count int not null default 0,
  queued_count int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  global_values jsonb default '{}'::jsonb, -- global param values for all items
  rate_limit_per_minute int default 60,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wa_send_jobs_workspace on public.wa_send_jobs(workspace_id);
create index if not exists idx_wa_send_jobs_status on public.wa_send_jobs(status);
create index if not exists idx_wa_send_jobs_connection on public.wa_send_jobs(connection_id);
create index if not exists idx_wa_send_jobs_template on public.wa_send_jobs(template_id);

alter table public.wa_send_jobs enable row level security;

create policy "Users access own workspace jobs" on public.wa_send_jobs
  for all using (workspace_id in (
    select workspace_id from public.workspace_memberships where user_id = auth.uid()
  ));

-- ────────────────────────────────────────────────────────────────────────────
-- 5) wa_send_job_items: Individual send items per job
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.wa_send_job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.wa_send_jobs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid references public.wa_contacts(id) on delete set null,
  to_phone text not null, -- normalized phone number
  params jsonb not null default '[]'::jsonb, -- computed parameters array
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'skipped')),
  wa_message_id text, -- returned by Meta API
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wa_send_job_items_job on public.wa_send_job_items(job_id);
create index if not exists idx_wa_send_job_items_workspace on public.wa_send_job_items(workspace_id);
create index if not exists idx_wa_send_job_items_status on public.wa_send_job_items(status);
create index if not exists idx_wa_send_job_items_contact on public.wa_send_job_items(contact_id);

alter table public.wa_send_job_items enable row level security;

create policy "Users access own workspace job items" on public.wa_send_job_items
  for all using (workspace_id in (
    select workspace_id from public.workspace_memberships where user_id = auth.uid()
  ));

-- ────────────────────────────────────────────────────────────────────────────
-- 6) wa_send_logs: Detailed logs for all sends (test + job sends)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.wa_send_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  connection_id uuid, -- references wa_phone_numbers(id)
  template_id uuid references public.wa_templates(id) on delete set null,
  job_id uuid references public.wa_send_jobs(id) on delete set null,
  job_item_id uuid references public.wa_send_job_items(id) on delete set null,
  to_phone_hash text, -- SHA256 hash of phone for privacy
  template_name text,
  template_language text,
  params jsonb default '[]'::jsonb,
  success boolean not null default false,
  wa_message_id text,
  http_status int,
  error_message text,
  response_json jsonb,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_wa_send_logs_workspace on public.wa_send_logs(workspace_id);
create index if not exists idx_wa_send_logs_connection on public.wa_send_logs(connection_id);
create index if not exists idx_wa_send_logs_template on public.wa_send_logs(template_id);
create index if not exists idx_wa_send_logs_job on public.wa_send_logs(job_id);
create index if not exists idx_wa_send_logs_success on public.wa_send_logs(success);
create index if not exists idx_wa_send_logs_sent_at on public.wa_send_logs(sent_at desc);

alter table public.wa_send_logs enable row level security;

create policy "Users access own workspace send logs" on public.wa_send_logs
  for all using (workspace_id in (
    select workspace_id from public.workspace_memberships where user_id = auth.uid()
  ));

-- ────────────────────────────────────────────────────────────────────────────
-- Helper function: Hash phone number for privacy in logs
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.hash_phone(phone text)
returns text
language plpgsql
security definer
as $$
begin
  return encode(digest(phone, 'sha256'), 'hex');
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Updated at trigger function (reuse if exists)
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
drop trigger if exists set_wa_templates_updated_at on public.wa_templates;
create trigger set_wa_templates_updated_at
  before update on public.wa_templates
  for each row execute function public.set_updated_at();

drop trigger if exists set_wa_template_param_defs_updated_at on public.wa_template_param_defs;
create trigger set_wa_template_param_defs_updated_at
  before update on public.wa_template_param_defs
  for each row execute function public.set_updated_at();

drop trigger if exists set_wa_contacts_updated_at on public.wa_contacts;
create trigger set_wa_contacts_updated_at
  before update on public.wa_contacts
  for each row execute function public.set_updated_at();

drop trigger if exists set_wa_send_jobs_updated_at on public.wa_send_jobs;
create trigger set_wa_send_jobs_updated_at
  before update on public.wa_send_jobs
  for each row execute function public.set_updated_at();

drop trigger if exists set_wa_send_job_items_updated_at on public.wa_send_job_items;
create trigger set_wa_send_job_items_updated_at
  before update on public.wa_send_job_items
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- Migration complete
-- ═══════════════════════════════════════════════════════════════════════════
