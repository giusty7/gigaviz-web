-- Automation Rules for WhatsApp Inbox
-- M3.1: Core schema for user-defined automation workflows

-- ========================================
-- 1. automation_rules table
-- ========================================
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  
  -- Trigger configuration
  trigger_type text NOT NULL CHECK (trigger_type IN ('new_message', 'tag_added', 'status_changed', 'assigned')),
  trigger_config jsonb DEFAULT '{}'::jsonb,
  
  -- Conditions (all must match - AND logic)
  conditions jsonb DEFAULT '[]'::jsonb,
  
  -- Actions to execute
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Execution settings
  enabled boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0, -- Higher priority runs first
  
  -- Audit fields
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_executed_at timestamptz,
  execution_count integer NOT NULL DEFAULT 0,
  
  -- Constraints
  CONSTRAINT automation_rules_name_length CHECK (char_length(name) <= 100),
  CONSTRAINT automation_rules_priority_range CHECK (priority >= 0 AND priority <= 100)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS automation_rules_workspace_enabled_idx 
  ON automation_rules(workspace_id, enabled) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS automation_rules_trigger_type_idx 
  ON automation_rules(trigger_type) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS automation_rules_priority_idx 
  ON automation_rules(workspace_id, priority DESC) WHERE enabled = true;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_automation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automation_rules_updated_at_trigger
BEFORE UPDATE ON automation_rules
FOR EACH ROW
EXECUTE FUNCTION update_automation_rules_updated_at();

-- Comments
COMMENT ON TABLE automation_rules IS 'User-defined automation rules for inbox workflows';
COMMENT ON COLUMN automation_rules.trigger_type IS 'Event that triggers the rule: new_message, tag_added, status_changed, assigned';
COMMENT ON COLUMN automation_rules.trigger_config IS 'Optional trigger-specific configuration (e.g., specific tags to watch)';
COMMENT ON COLUMN automation_rules.conditions IS 'Array of conditions that must ALL be true (AND logic). Format: [{"field":"tag","operator":"equals","value":"urgent"}]';
COMMENT ON COLUMN automation_rules.actions IS 'Array of actions to execute. Format: [{"type":"add_tag","params":{"tag":"auto-processed"}}]';
COMMENT ON COLUMN automation_rules.priority IS 'Execution order (0-100, higher = runs first)';

-- ========================================
-- 2. automation_executions table (audit log)
-- ========================================
CREATE TABLE IF NOT EXISTS automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES automation_rules(id) ON DELETE SET NULL,
  
  -- Execution context
  thread_id uuid REFERENCES wa_threads(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  trigger_data jsonb DEFAULT '{}'::jsonb,
  
  -- Result
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed', 'skipped')),
  actions_attempted integer NOT NULL DEFAULT 0,
  actions_succeeded integer NOT NULL DEFAULT 0,
  error_message text,
  error_details jsonb,
  
  -- Timing
  executed_at timestamptz NOT NULL DEFAULT now(),
  execution_duration_ms integer,
  
  -- Constraints
  CONSTRAINT automation_executions_actions_range CHECK (actions_succeeded <= actions_attempted)
);

-- Indexes for querying execution history
CREATE INDEX IF NOT EXISTS automation_executions_workspace_executed_idx 
  ON automation_executions(workspace_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS automation_executions_rule_executed_idx 
  ON automation_executions(rule_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS automation_executions_thread_executed_idx 
  ON automation_executions(thread_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS automation_executions_status_idx 
  ON automation_executions(status) WHERE status IN ('failed', 'partial');

-- Comments
COMMENT ON TABLE automation_executions IS 'Audit log of automation rule executions';
COMMENT ON COLUMN automation_executions.status IS 'success: all actions OK, partial: some failed, failed: all failed, skipped: conditions not met';
COMMENT ON COLUMN automation_executions.trigger_data IS 'Context data from the trigger event (e.g., message_id, added_tags)';

-- ========================================
-- 3. Row-Level Security (RLS)
-- ========================================
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- automation_rules: workspace members can read/write their own workspace rules
CREATE POLICY "workspace_members_access_automation_rules"
ON automation_rules
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- automation_executions: workspace members can read execution logs
CREATE POLICY "workspace_members_read_automation_executions"
ON automation_executions
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- Service role can insert execution logs (worker process)
-- Note: This policy allows INSERT for authenticated users who are workspace members
-- The actual insertion will be done by service role in the automation engine
CREATE POLICY "workspace_members_insert_automation_executions"
ON automation_executions
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- ========================================
-- 4. Helper function: increment execution count
-- ========================================
CREATE OR REPLACE FUNCTION increment_rule_execution_count(p_rule_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE automation_rules
  SET 
    execution_count = execution_count + 1,
    last_executed_at = now()
  WHERE id = p_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_rule_execution_count IS 'Atomically increment execution count and update last_executed_at timestamp';
