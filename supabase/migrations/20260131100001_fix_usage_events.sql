-- Fix existing usage_events table - add missing columns
-- This patches the table to match the new M4 schema
-- Existing columns: id, workspace_id, event_type, amount, metadata, occurred_at

-- Rename 'occurred_at' to 'created_at' if needed (M4 expects created_at)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'occurred_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE usage_events RENAME COLUMN occurred_at TO created_at;
  END IF;
END $$;

-- Add created_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE usage_events ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Check if event_date column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'event_date'
  ) THEN
    ALTER TABLE usage_events ADD COLUMN event_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Rename 'metadata' to 'event_metadata' to match M4 schema
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'metadata'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'event_metadata'
  ) THEN
    ALTER TABLE usage_events RENAME COLUMN metadata TO event_metadata;
  END IF;
END $$;

-- Add event_metadata if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'event_metadata'
  ) THEN
    ALTER TABLE usage_events ADD COLUMN event_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Check if thread_id column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE usage_events ADD COLUMN thread_id uuid REFERENCES wa_threads(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Check if message_id column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'message_id'
  ) THEN
    ALTER TABLE usage_events ADD COLUMN message_id uuid REFERENCES wa_messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Check if automation_rule_id column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'automation_rule_id'
  ) THEN
    ALTER TABLE usage_events ADD COLUMN automation_rule_id uuid REFERENCES automation_rules(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Check if user_id column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE usage_events ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Check if token_cost column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_events' 
    AND column_name = 'token_cost'
  ) THEN
    ALTER TABLE usage_events ADD COLUMN token_cost integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Now create indexes
CREATE INDEX IF NOT EXISTS usage_events_workspace_date_idx 
  ON usage_events(workspace_id, event_date DESC);

CREATE INDEX IF NOT EXISTS usage_events_workspace_type_date_idx 
  ON usage_events(workspace_id, event_type, event_date DESC);

CREATE INDEX IF NOT EXISTS usage_events_thread_idx 
  ON usage_events(thread_id) WHERE thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS usage_events_user_idx 
  ON usage_events(user_id) WHERE user_id IS NOT NULL;

-- Create materialized view
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

CREATE INDEX IF NOT EXISTS usage_stats_daily_workspace_date_idx
  ON usage_stats_daily(workspace_id, event_date DESC);

-- Helper function
CREATE OR REPLACE FUNCTION refresh_usage_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY usage_stats_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS if not already
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS workspace_members_read_usage_events ON usage_events;
CREATE POLICY workspace_members_read_usage_events
ON usage_events
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS service_role_insert_usage_events ON usage_events;
CREATE POLICY service_role_insert_usage_events
ON usage_events
FOR INSERT
WITH CHECK (true);

-- Trigger for event_date
CREATE OR REPLACE FUNCTION set_usage_event_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_date IS NULL THEN
    NEW.event_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usage_events_set_date_trigger ON usage_events;
CREATE TRIGGER usage_events_set_date_trigger
BEFORE INSERT ON usage_events
FOR EACH ROW
EXECUTE FUNCTION set_usage_event_date();

-- Initial refresh
REFRESH MATERIALIZED VIEW usage_stats_daily;
