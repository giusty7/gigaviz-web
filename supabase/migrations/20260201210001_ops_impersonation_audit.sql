-- Add impersonation audit to ops_audit_log
-- Run after: 20260201210000_ops_impersonation.sql

-- Add action types for impersonation (only if audit table exists)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'ops_audit_log'
  ) then
    execute 'comment on table public.ops_audit_log is ''Platform operations audit log - tracks all ops actions including impersonation''';
  else
    raise notice 'Skipping audit comment: public.ops_audit_log not found';
  end if;
end $$;

-- Insert audit entry when impersonation starts (called from app code via insert)
-- Insert audit entry when impersonation ends (called from app code via insert)

-- No schema changes needed - ops_audit_log already supports:
-- - action: text (can store 'impersonation_started', 'impersonation_ended')
-- - actor_user_id: uuid (platform admin)
-- - target_user_id: uuid (customer being impersonated)
-- - workspace_id: uuid
-- - metadata: jsonb (can store reason, duration, impersonation_id)
