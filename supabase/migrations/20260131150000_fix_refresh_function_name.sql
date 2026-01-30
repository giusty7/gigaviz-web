-- Fix: Rename refresh_usage_stats to match cron RPC call
-- This fixes the function name mismatch between migration and cron endpoint

DROP FUNCTION IF EXISTS refresh_usage_stats();

CREATE OR REPLACE FUNCTION refresh_usage_stats_daily()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY usage_stats_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_usage_stats_daily IS 'Refresh usage_stats_daily materialized view (called from cron hourly)';
