-- Usage Events & Analytics for WhatsApp Inbox
-- M4.1: Granular event tracking for analytics and billing

-- ========================================
-- 1. usage_events table
-- ========================================
CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Event details
  event_type text NOT NULL CHECK (event_type IN (
    'message_sent',
    'template_sent', 
    'automation_triggered',
    'tag_added',
    'note_created',
    'status_changed'
  )),
  event_metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Resource references
  thread_id uuid REFERENCES wa_threads(id) ON DELETE SET NULL,
  message_id uuid REFERENCES wa_messages(id) ON DELETE SET NULL,
  automation_rule_id uuid REFERENCES automation_rules(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Token tracking
  token_cost integer NOT NULL DEFAULT 0,
  
  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Constraints
  CONSTRAINT usage_events_token_cost_range CHECK (token_cost >= 0)
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS usage_events_workspace_date_idx 
  ON usage_events(workspace_id, event_date DESC);

CREATE INDEX IF NOT EXISTS usage_events_workspace_type_date_idx 
  ON usage_events(workspace_id, event_type, event_date DESC);

CREATE INDEX IF NOT EXISTS usage_events_thread_idx 
  ON usage_events(thread_id) WHERE thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS usage_events_user_idx 
  ON usage_events(user_id) WHERE user_id IS NOT NULL;

-- Partition by month for scalability (optional, can be added later)
-- CREATE TABLE usage_events_2026_01 PARTITION OF usage_events
-- FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Comments
COMMENT ON TABLE usage_events IS 'Granular event tracking for analytics, reporting, and token billing';
COMMENT ON COLUMN usage_events.event_type IS 'Type of event: message_sent, template_sent, automation_triggered, etc.';
COMMENT ON COLUMN usage_events.event_metadata IS 'Additional context (e.g., template_id, automation_rule_name, message_type)';
COMMENT ON COLUMN usage_events.token_cost IS 'Number of tokens deducted for this event';
COMMENT ON COLUMN usage_events.event_date IS 'Date partition key for efficient querying';

-- ========================================
-- 2. Materialized view for daily stats
-- ========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS usage_stats_daily AS
SELECT
  workspace_id,
  event_date,
  event_type,
  COUNT(*) as event_count,
  SUM(token_cost) as total_tokens,
  COUNT(DISTINCT thread_id) as unique_threads,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as first_event_at,
  MAX(created_at) as last_event_at
FROM usage_events
GROUP BY workspace_id, event_date, event_type;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS usage_stats_daily_unique_idx
  ON usage_stats_daily(workspace_id, event_date, event_type);

-- Index for fast workspace queries
CREATE INDEX IF NOT EXISTS usage_stats_daily_workspace_date_idx
  ON usage_stats_daily(workspace_id, event_date DESC);

-- Comments
COMMENT ON MATERIALIZED VIEW usage_stats_daily IS 'Daily aggregated usage statistics (refresh hourly via cron)';

-- ========================================
-- 3. Helper function to refresh stats
-- ========================================
CREATE OR REPLACE FUNCTION refresh_usage_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY usage_stats_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_usage_stats IS 'Refresh usage_stats_daily materialized view (call from cron hourly)';

-- ========================================
-- 4. Row-Level Security (RLS)
-- ========================================
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Workspace members can read their usage events
CREATE POLICY "workspace_members_read_usage_events"
ON usage_events
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- Service role can insert usage events (tracking happens server-side)
CREATE POLICY "service_role_insert_usage_events"
ON usage_events
FOR INSERT
WITH CHECK (true); -- Service role bypasses RLS anyway, but explicit policy for clarity

-- Note: Materialized views don't have RLS, but access is controlled via API endpoints

-- ========================================
-- 5. Trigger for event_date auto-fill
-- ========================================
-- Event_date is already set via DEFAULT CURRENT_DATE, but this ensures consistency
CREATE OR REPLACE FUNCTION set_usage_event_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_date IS NULL THEN
    NEW.event_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usage_events_set_date_trigger
BEFORE INSERT ON usage_events
FOR EACH ROW
EXECUTE FUNCTION set_usage_event_date();

-- ========================================
-- 6. Initial materialized view refresh
-- ========================================
-- Refresh the view to populate initial data (if any events already exist)
-- This is safe to run even if the view is empty
REFRESH MATERIALIZED VIEW usage_stats_daily;
