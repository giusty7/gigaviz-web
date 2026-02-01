-- =====================================================
-- OPS CONSOLE: HEALTH MONITORING
-- Phase 3.1: System Health & Monitoring
-- =====================================================

-- Health check types
create type ops_health_check_type as enum (
  'database',
  'api',
  'worker',
  'external_service',
  'storage',
  'cache'
);

-- Health status
create type ops_health_status as enum (
  'healthy',
  'degraded',
  'unhealthy',
  'unknown'
);

-- =====================================================
-- TABLE: ops_health_checks
-- =====================================================
create table if not exists ops_health_checks (
  id uuid primary key default gen_random_uuid(),
  check_type ops_health_check_type not null,
  check_name text not null,
  status ops_health_status not null default 'unknown',
  response_time_ms integer,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  
  constraint unique_check_name unique(check_name, checked_at)
);

-- Index for querying latest checks
create index idx_ops_health_checks_type_status on ops_health_checks(check_type, status);
create index idx_ops_health_checks_checked_at on ops_health_checks(checked_at desc);
create index idx_ops_health_checks_name_checked on ops_health_checks(check_name, checked_at desc);

-- =====================================================
-- TABLE: ops_system_metrics
-- =====================================================
create table if not exists ops_system_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_value numeric not null,
  metric_unit text,
  tags jsonb default '{}'::jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_ops_system_metrics_name_recorded on ops_system_metrics(metric_name, recorded_at desc);
create index idx_ops_system_metrics_recorded on ops_system_metrics(recorded_at desc);

-- =====================================================
-- TABLE: ops_worker_heartbeats
-- =====================================================
create table if not exists ops_worker_heartbeats (
  id uuid primary key default gen_random_uuid(),
  worker_name text not null,
  worker_type text not null,
  status text not null default 'running',
  last_run_at timestamptz,
  next_run_at timestamptz,
  error_count integer default 0,
  last_error text,
  metadata jsonb default '{}'::jsonb,
  heartbeat_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_ops_worker_heartbeats_name on ops_worker_heartbeats(worker_name);
create index idx_ops_worker_heartbeats_type on ops_worker_heartbeats(worker_type);
create index idx_ops_worker_heartbeats_heartbeat on ops_worker_heartbeats(heartbeat_at desc);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Health checks - platform admin only
alter table ops_health_checks enable row level security;

create policy "platform_admins_view_health_checks"
  on ops_health_checks for select
  using (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

create policy "platform_admins_insert_health_checks"
  on ops_health_checks for insert
  with check (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

-- System metrics - platform admin only
alter table ops_system_metrics enable row level security;

create policy "platform_admins_view_metrics"
  on ops_system_metrics for select
  using (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

create policy "platform_admins_insert_metrics"
  on ops_system_metrics for insert
  with check (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

-- Worker heartbeats - platform admin only
alter table ops_worker_heartbeats enable row level security;

create policy "platform_admins_view_heartbeats"
  on ops_worker_heartbeats for select
  using (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

create policy "platform_admins_manage_heartbeats"
  on ops_worker_heartbeats for all
  using (
    exists (
      select 1 from platform_admins
      where user_id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get latest health status for all check types
create or replace function ops_get_latest_health_status()
returns table (
  check_type ops_health_check_type,
  check_name text,
  status ops_health_status,
  response_time_ms integer,
  error_message text,
  checked_at timestamptz
)
language plpgsql
security definer
as $$
begin
  -- Require platform admin
  if not exists (
    select 1 from platform_admins
    where user_id = auth.uid()
  ) then
    raise exception 'unauthorized';
  end if;

  return query
  select distinct on (h.check_name)
    h.check_type,
    h.check_name,
    h.status,
    h.response_time_ms,
    h.error_message,
    h.checked_at
  from ops_health_checks h
  order by h.check_name, h.checked_at desc;
end;
$$;

-- Get system overview
create or replace function ops_get_system_overview()
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
  total_workspaces integer;
  active_workspaces_24h integer;
  total_users integer;
  active_users_24h integer;
  total_tickets integer;
  open_tickets integer;
  db_size bigint;
begin
  -- Require platform admin
  if not exists (
    select 1 from platform_admins
    where user_id = auth.uid()
  ) then
    raise exception 'unauthorized';
  end if;

  -- Get workspace stats
  select count(*) into total_workspaces from workspaces;
  select count(distinct workspace_id) into active_workspaces_24h
  from workspace_memberships
  where updated_at > now() - interval '24 hours';

  -- Get user stats
  select count(*) into total_users from auth.users;
  select count(*) into active_users_24h
  from auth.users
  where last_sign_in_at > now() - interval '24 hours';

  -- Get ticket stats (if table exists)
  begin
    select count(*) into total_tickets from ops_support_tickets;
    select count(*) into open_tickets from ops_support_tickets where status in ('open', 'in_progress');
  exception when undefined_table then
    total_tickets := 0;
    open_tickets := 0;
  end;

  -- Get database size
  select pg_database_size(current_database()) into db_size;

  result := jsonb_build_object(
    'workspaces', jsonb_build_object(
      'total', total_workspaces,
      'active_24h', active_workspaces_24h
    ),
    'users', jsonb_build_object(
      'total', total_users,
      'active_24h', active_users_24h
    ),
    'tickets', jsonb_build_object(
      'total', total_tickets,
      'open', open_tickets
    ),
    'database', jsonb_build_object(
      'size_bytes', db_size,
      'size_mb', round(db_size / 1024.0 / 1024.0, 2)
    ),
    'timestamp', now()
  );

  return result;
end;
$$;

-- Get stale workers (no heartbeat in last 10 minutes)
create or replace function ops_get_stale_workers()
returns table (
  worker_name text,
  worker_type text,
  status text,
  last_heartbeat timestamptz,
  minutes_since_heartbeat numeric
)
language plpgsql
security definer
as $$
begin
  -- Require platform admin
  if not exists (
    select 1 from platform_admins
    where user_id = auth.uid()
  ) then
    raise exception 'unauthorized';
  end if;

  return query
  select distinct on (w.worker_name)
    w.worker_name,
    w.worker_type,
    w.status,
    w.heartbeat_at as last_heartbeat,
    extract(epoch from (now() - w.heartbeat_at)) / 60.0 as minutes_since_heartbeat
  from ops_worker_heartbeats w
  where w.heartbeat_at < now() - interval '10 minutes'
  order by w.worker_name, w.heartbeat_at desc;
end;
$$;

-- Record health check
create or replace function ops_record_health_check(
  p_check_type ops_health_check_type,
  p_check_name text,
  p_status ops_health_status,
  p_response_time_ms integer default null,
  p_error_message text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  check_id uuid;
begin
  -- No auth check - allow service role to record checks
  
  insert into ops_health_checks (
    check_type,
    check_name,
    status,
    response_time_ms,
    error_message,
    metadata,
    checked_at
  ) values (
    p_check_type,
    p_check_name,
    p_status,
    p_response_time_ms,
    p_error_message,
    p_metadata,
    now()
  )
  returning id into check_id;

  return check_id;
end;
$$;

-- Update worker heartbeat
create or replace function ops_update_worker_heartbeat(
  p_worker_name text,
  p_worker_type text,
  p_status text default 'running',
  p_last_run_at timestamptz default null,
  p_next_run_at timestamptz default null,
  p_error_count integer default 0,
  p_last_error text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  heartbeat_id uuid;
begin
  -- No auth check - allow service role to update heartbeats
  
  insert into ops_worker_heartbeats (
    worker_name,
    worker_type,
    status,
    last_run_at,
    next_run_at,
    error_count,
    last_error,
    metadata,
    heartbeat_at
  ) values (
    p_worker_name,
    p_worker_type,
    p_status,
    p_last_run_at,
    p_next_run_at,
    p_error_count,
    p_last_error,
    p_metadata,
    now()
  )
  returning id into heartbeat_id;

  return heartbeat_id;
end;
$$;

-- Grant execute permissions
grant execute on function ops_get_latest_health_status() to authenticated;
grant execute on function ops_get_system_overview() to authenticated;
grant execute on function ops_get_stale_workers() to authenticated;
grant execute on function ops_record_health_check to service_role;
grant execute on function ops_update_worker_heartbeat to service_role;

-- =====================================================
-- CLEANUP POLICY (Keep only last 7 days)
-- =====================================================

-- Auto-cleanup old health checks (keep last 7 days)
create or replace function cleanup_old_health_checks()
returns void
language plpgsql
security definer
as $$
begin
  delete from ops_health_checks
  where checked_at < now() - interval '7 days';
  
  delete from ops_system_metrics
  where recorded_at < now() - interval '7 days';
  
  delete from ops_worker_heartbeats
  where heartbeat_at < now() - interval '7 days';
end;
$$;

-- Can be called via cron or manually
grant execute on function cleanup_old_health_checks to service_role;
