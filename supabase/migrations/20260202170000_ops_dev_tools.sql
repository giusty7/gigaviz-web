-- =====================================================
-- OPS CONSOLE: DEVELOPER TOOLS
-- Phase 4: Webhook Debugger, Feature Flags, SQL Runner
-- =====================================================

-- =====================================================
-- TABLE: ops_webhook_logs
-- Store incoming webhook payloads for debugging
-- =====================================================
create table if not exists ops_webhook_logs (
  id uuid primary key default gen_random_uuid(),
  webhook_type text not null, -- 'meta_whatsapp', 'meta_instagram', etc.
  method text not null, -- 'GET', 'POST'
  url text not null,
  headers jsonb default '{}'::jsonb,
  query_params jsonb default '{}'::jsonb,
  body jsonb default '{}'::jsonb,
  raw_body text,
  response_status integer,
  response_body jsonb,
  processing_error text,
  ip_address text,
  user_agent text,
  workspace_id uuid references workspaces(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_ops_webhook_logs_type_created on ops_webhook_logs(webhook_type, created_at desc);
create index idx_ops_webhook_logs_workspace on ops_webhook_logs(workspace_id, created_at desc);
create index idx_ops_webhook_logs_created on ops_webhook_logs(created_at desc);

-- RLS: platform admin only
alter table ops_webhook_logs enable row level security;

create policy "platform_admins_view_webhook_logs"
  on ops_webhook_logs for select
  using (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: ops_feature_flags
-- Dynamic feature toggles per workspace
-- =====================================================
create table if not exists ops_feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null unique,
  flag_name text not null,
  description text,
  default_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ops_feature_flags_key on ops_feature_flags(flag_key);

-- =====================================================
-- TABLE: ops_workspace_feature_flags
-- Workspace-specific flag overrides
-- =====================================================
create table if not exists ops_workspace_feature_flags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  flag_key text not null,
  enabled boolean not null,
  reason text,
  set_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(workspace_id, flag_key)
);

create index idx_ops_workspace_flags_workspace on ops_workspace_feature_flags(workspace_id);
create index idx_ops_workspace_flags_key on ops_workspace_feature_flags(flag_key);

-- RLS: platform admin only
alter table ops_feature_flags enable row level security;
alter table ops_workspace_feature_flags enable row level security;

create policy "platform_admins_manage_feature_flags"
  on ops_feature_flags for all
  using (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

create policy "platform_admins_manage_workspace_flags"
  on ops_workspace_feature_flags for all
  using (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: ops_sql_query_logs
-- Audit log for SQL runner
-- =====================================================
create table if not exists ops_sql_query_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id),
  admin_email text not null,
  query_text text not null,
  execution_time_ms integer,
  row_count integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_ops_sql_query_logs_admin on ops_sql_query_logs(admin_id, created_at desc);
create index idx_ops_sql_query_logs_created on ops_sql_query_logs(created_at desc);

-- RLS: platform admin only
alter table ops_sql_query_logs enable row level security;

create policy "platform_admins_view_sql_logs"
  on ops_sql_query_logs for select
  using (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

create policy "platform_admins_insert_sql_logs"
  on ops_sql_query_logs for insert
  with check (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTION: evaluate_feature_flag
-- Check if a feature is enabled for a workspace
-- =====================================================
create or replace function ops_evaluate_feature_flag(
  p_workspace_id uuid,
  p_flag_key text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_workspace_override boolean;
  v_default_enabled boolean;
begin
  -- Check workspace-specific override first
  select enabled into v_workspace_override
  from ops_workspace_feature_flags
  where workspace_id = p_workspace_id
    and flag_key = p_flag_key;
  
  if v_workspace_override is not null then
    return v_workspace_override;
  end if;
  
  -- Fall back to default
  select default_enabled into v_default_enabled
  from ops_feature_flags
  where flag_key = p_flag_key;
  
  return coalesce(v_default_enabled, false);
end;
$$;

grant execute on function ops_evaluate_feature_flag to authenticated;

-- =====================================================
-- SEED: Common Feature Flags
-- =====================================================
insert into ops_feature_flags (flag_key, flag_name, description, default_enabled)
values
  ('meta_hub_automation', 'Meta Hub Automation', 'Enable automation rules for Meta Hub', false),
  ('meta_hub_analytics', 'Meta Hub Analytics', 'Enable analytics dashboard', false),
  ('helper_ai_assistant', 'Helper AI Assistant', 'Enable AI-powered helper', false),
  ('advanced_billing', 'Advanced Billing', 'Enable advanced billing features', false),
  ('beta_features', 'Beta Features', 'Enable beta/experimental features', false)
on conflict (flag_key) do nothing;

-- =====================================================
-- CLEANUP: Auto-delete old webhook logs (keep 30 days)
-- =====================================================
create or replace function cleanup_old_webhook_logs()
returns void
language plpgsql
security definer
as $$
begin
  delete from ops_webhook_logs
  where created_at < now() - interval '30 days';
  
  delete from ops_sql_query_logs
  where created_at < now() - interval '90 days';
end;
$$;

grant execute on function cleanup_old_webhook_logs to service_role;
