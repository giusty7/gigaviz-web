-- Phase 5: Business Analytics + Phase 6: Advanced Operations
-- Migration: ops_analytics_and_bulk

-- ============================================================================
-- PHASE 5: BUSINESS ANALYTICS
-- ============================================================================

-- Aggregated metrics snapshots (daily/weekly/monthly)
create table if not exists ops_metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  period_type text not null check (period_type in ('daily', 'weekly', 'monthly')),
  
  -- Revenue metrics
  total_mrr numeric(12,2) default 0,
  new_mrr numeric(12,2) default 0,
  churned_mrr numeric(12,2) default 0,
  expansion_mrr numeric(12,2) default 0,
  
  -- Workspace metrics
  total_workspaces int default 0,
  active_workspaces int default 0,
  new_workspaces int default 0,
  churned_workspaces int default 0,
  
  -- User metrics
  total_users int default 0,
  active_users int default 0,
  new_users int default 0,
  
  -- Plan distribution (jsonb for flexibility)
  plan_distribution jsonb default '{}',
  
  -- Usage metrics
  total_messages_sent int default 0,
  total_api_calls int default 0,
  total_tokens_used bigint default 0,
  
  created_at timestamptz not null default now(),
  
  unique (snapshot_date, period_type)
);

-- Saved reports for quick access
create table if not exists ops_saved_reports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  report_type text not null, -- 'revenue', 'users', 'usage', 'custom'
  query_config jsonb not null, -- date range, filters, grouping
  created_by uuid references auth.users(id),
  is_shared boolean default false,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Export jobs tracking
create table if not exists ops_export_jobs (
  id uuid primary key default gen_random_uuid(),
  export_type text not null, -- 'workspaces', 'users', 'subscriptions', 'usage', 'custom'
  format text not null check (format in ('csv', 'json', 'xlsx')),
  filters jsonb default '{}',
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  file_url text,
  row_count int,
  error_message text,
  created_by uuid references auth.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz, -- auto-delete after expiry
  created_at timestamptz not null default now()
);

-- ============================================================================
-- PHASE 6: ADVANCED OPERATIONS
-- ============================================================================

-- Bulk operation jobs
create table if not exists ops_bulk_jobs (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null, -- 'email', 'plan_change', 'feature_toggle', 'notification'
  target_type text not null, -- 'workspaces', 'users', 'subscriptions'
  target_filter jsonb not null, -- criteria to select targets
  target_count int,
  
  payload jsonb not null, -- operation-specific data
  
  status text not null default 'draft' check (status in ('draft', 'pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress_current int default 0,
  progress_total int default 0,
  
  error_count int default 0,
  error_log jsonb default '[]',
  
  scheduled_for timestamptz, -- null = immediate
  started_at timestamptz,
  completed_at timestamptz,
  
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id), -- require approval for sensitive ops
  cancelled_by uuid references auth.users(id),
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Scheduled actions (future changes)
create table if not exists ops_scheduled_actions (
  id uuid primary key default gen_random_uuid(),
  action_type text not null, -- 'plan_change', 'feature_toggle', 'suspension', 'notification'
  target_type text not null, -- 'workspace', 'user', 'subscription'
  target_id uuid not null,
  
  payload jsonb not null,
  reason text,
  
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'executed', 'cancelled', 'failed')),
  
  executed_at timestamptz,
  execution_result jsonb,
  
  created_by uuid references auth.users(id),
  cancelled_by uuid references auth.users(id),
  
  created_at timestamptz not null default now()
);

-- Workspace templates for cloning
create table if not exists ops_workspace_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  
  -- Template configuration
  default_plan text,
  default_entitlements jsonb default '{}',
  default_settings jsonb default '{}',
  default_modules jsonb default '[]',
  
  is_active boolean default true,
  use_count int default 0,
  
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Saved filters/views for ops console
create table if not exists ops_saved_filters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  
  page text not null, -- 'workspaces', 'customers', 'tickets', etc
  filters jsonb not null,
  columns jsonb, -- visible columns
  sort_config jsonb, -- sort field and direction
  
  is_default boolean default false,
  is_shared boolean default false,
  
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_ops_metrics_snapshots_date 
  on ops_metrics_snapshots(snapshot_date desc);

create index if not exists idx_ops_metrics_snapshots_period 
  on ops_metrics_snapshots(period_type, snapshot_date desc);

create index if not exists idx_ops_bulk_jobs_status 
  on ops_bulk_jobs(status);

create index if not exists idx_ops_bulk_jobs_scheduled 
  on ops_bulk_jobs(scheduled_for) 
  where status = 'pending' and scheduled_for is not null;

create index if not exists idx_ops_scheduled_actions_pending 
  on ops_scheduled_actions(scheduled_for) 
  where status = 'pending';

create index if not exists idx_ops_export_jobs_status 
  on ops_export_jobs(status);

create index if not exists idx_ops_saved_filters_page 
  on ops_saved_filters(page, created_by);

-- ============================================================================
-- RLS POLICIES (platform_admins only)
-- ============================================================================

alter table ops_metrics_snapshots enable row level security;
alter table ops_saved_reports enable row level security;
alter table ops_export_jobs enable row level security;
alter table ops_bulk_jobs enable row level security;
alter table ops_scheduled_actions enable row level security;
alter table ops_workspace_templates enable row level security;
alter table ops_saved_filters enable row level security;

-- Platform admins can do everything
create policy "platform_admins_metrics" on ops_metrics_snapshots
  for all using (
    exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "platform_admins_reports" on ops_saved_reports
  for all using (
    exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "platform_admins_exports" on ops_export_jobs
  for all using (
    exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "platform_admins_bulk" on ops_bulk_jobs
  for all using (
    exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "platform_admins_scheduled" on ops_scheduled_actions
  for all using (
    exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "platform_admins_templates" on ops_workspace_templates
  for all using (
    exists (select 1 from platform_admins where user_id = auth.uid())
  );

create policy "platform_admins_filters" on ops_saved_filters
  for all using (
    exists (select 1 from platform_admins where user_id = auth.uid())
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

grant all on ops_metrics_snapshots to authenticated;
grant all on ops_saved_reports to authenticated;
grant all on ops_export_jobs to authenticated;
grant all on ops_bulk_jobs to authenticated;
grant all on ops_scheduled_actions to authenticated;
grant all on ops_workspace_templates to authenticated;
grant all on ops_saved_filters to authenticated;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate daily metrics snapshot
create or replace function ops_generate_daily_snapshot(target_date date default current_date - 1)
returns uuid
language plpgsql
security definer
as $$
declare
  snapshot_id uuid;
  plan_dist jsonb;
begin
  -- Calculate plan distribution
  select jsonb_object_agg(
    coalesce(s.plan_id, 'free'),
    count(*)
  ) into plan_dist
  from workspaces w
  left join subscriptions s on s.workspace_id = w.id and s.status = 'active';

  insert into ops_metrics_snapshots (
    snapshot_date,
    period_type,
    total_workspaces,
    active_workspaces,
    new_workspaces,
    total_users,
    new_users,
    plan_distribution
  )
  select
    target_date,
    'daily',
    (select count(*) from workspaces),
    (select count(*) from workspaces where updated_at > target_date - interval '30 days'),
    (select count(*) from workspaces where created_at::date = target_date),
    (select count(*) from profiles),
    (select count(*) from profiles where created_at::date = target_date),
    plan_dist
  on conflict (snapshot_date, period_type) 
  do update set
    total_workspaces = excluded.total_workspaces,
    active_workspaces = excluded.active_workspaces,
    new_workspaces = excluded.new_workspaces,
    total_users = excluded.total_users,
    new_users = excluded.new_users,
    plan_distribution = excluded.plan_distribution
  returning id into snapshot_id;

  return snapshot_id;
end;
$$;

-- Execute scheduled actions that are due
create or replace function ops_execute_due_scheduled_actions()
returns int
language plpgsql
security definer
as $$
declare
  executed_count int := 0;
  action record;
begin
  for action in 
    select * from ops_scheduled_actions 
    where status = 'pending' 
      and scheduled_for <= now()
    order by scheduled_for
    limit 100
  loop
    -- Mark as executed (actual execution would be handled by application code)
    update ops_scheduled_actions
    set 
      status = 'executed',
      executed_at = now()
    where id = action.id;
    
    executed_count := executed_count + 1;
  end loop;

  return executed_count;
end;
$$;

-- Cleanup old export files
create or replace function ops_cleanup_expired_exports()
returns int
language plpgsql
security definer
as $$
declare
  deleted_count int;
begin
  delete from ops_export_jobs
  where expires_at < now()
    and status = 'completed';
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
