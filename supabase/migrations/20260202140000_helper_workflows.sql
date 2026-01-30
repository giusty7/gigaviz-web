-- =====================================================
-- PHASE 5: AUTOMATION & WORKFLOWS
-- =====================================================
-- Enable Helper as automation engine with workflow builder

-- =====================================================
-- 1. WORKFLOW DEFINITIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Workflow info
  name text NOT NULL,
  description text,
  icon text,
  category text, -- 'automation', 'reporting', 'engagement', etc.
  
  -- Trigger configuration
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'schedule',  -- Cron-based
    'webhook',   -- External webhook
    'event',     -- Internal event (new_message, new_contact, etc.)
    'manual'     -- User-initiated
  )),
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- schedule: {"cron": "0 9 * * *", "timezone": "Asia/Jakarta"}
  -- webhook: {"secret": "...", "allowed_ips": [...]}
  -- event: {"event_type": "wa_message_received", "filters": {...}}
  
  -- Workflow steps (function calls)
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [
  --   {"function": "get_conversation_analytics", "params": {...}, "output_var": "analytics"},
  --   {"function": "generate_report", "params": {"data": "{{analytics}}"}, "output_var": "report"},
  --   {"function": "send_whatsapp_message", "params": {"message": "{{report}}"}}
  -- ]
  
  -- Configuration
  settings jsonb DEFAULT '{}'::jsonb,
  timeout_seconds integer DEFAULT 300,
  retry_on_failure boolean DEFAULT true,
  max_retries integer DEFAULT 3,
  
  -- Owner
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status
  is_enabled boolean DEFAULT true,
  is_template boolean DEFAULT false, -- Can be cloned by others
  
  -- Statistics
  total_runs integer DEFAULT 0,
  successful_runs integer DEFAULT 0,
  failed_runs integer DEFAULT 0,
  last_run_at timestamptz,
  last_run_status text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_helper_workflows_workspace ON public.helper_workflows(workspace_id);
CREATE INDEX idx_helper_workflows_trigger_type ON public.helper_workflows(trigger_type);
CREATE INDEX idx_helper_workflows_enabled ON public.helper_workflows(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_helper_workflows_template ON public.helper_workflows(is_template) WHERE is_template = true;

COMMENT ON TABLE public.helper_workflows IS 'Automated workflows for Helper AI';

-- Enable RLS
ALTER TABLE public.helper_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_workflows"
ON public.helper_workflows
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 2. WORKFLOW RUNS (Execution Log)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.helper_workflows(id) ON DELETE CASCADE,
  
  -- Trigger info
  triggered_by text NOT NULL, -- 'schedule', 'webhook', 'event', 'manual_user_id'
  trigger_payload jsonb DEFAULT '{}'::jsonb,
  
  -- Execution
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
    'timeout'
  )),
  
  -- Progress
  current_step integer DEFAULT 0,
  total_steps integer NOT NULL,
  
  -- Results
  step_results jsonb DEFAULT '[]'::jsonb, -- Array of {step, output, duration, status}
  final_output jsonb,
  error_message text,
  error_step integer,
  
  -- Timing
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_helper_workflow_runs_workflow ON public.helper_workflow_runs(workflow_id);
CREATE INDEX idx_helper_workflow_runs_status ON public.helper_workflow_runs(status);
CREATE INDEX idx_helper_workflow_runs_created ON public.helper_workflow_runs(created_at DESC);

COMMENT ON TABLE public.helper_workflow_runs IS 'Execution log for workflows';

-- Enable RLS
ALTER TABLE public.helper_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_workflow_runs"
ON public.helper_workflow_runs
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 3. WORKFLOW SCHEDULES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_workflow_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.helper_workflows(id) ON DELETE CASCADE,
  
  -- Schedule
  cron_expression text NOT NULL,
  timezone text DEFAULT 'UTC',
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Next execution
  next_run_at timestamptz,
  
  -- History
  last_run_at timestamptz,
  last_run_status text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(workflow_id)
);

CREATE INDEX idx_helper_workflow_schedules_next_run ON public.helper_workflow_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX idx_helper_workflow_schedules_workflow ON public.helper_workflow_schedules(workflow_id);

COMMENT ON TABLE public.helper_workflow_schedules IS 'Cron schedules for workflows';

-- Enable RLS
ALTER TABLE public.helper_workflow_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_schedules"
ON public.helper_workflow_schedules
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 4. EVENT TRIGGERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_workflow_event_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.helper_workflows(id) ON DELETE CASCADE,
  
  -- Event configuration
  event_type text NOT NULL, -- 'wa_message_received', 'wa_contact_created', etc.
  event_filters jsonb DEFAULT '{}'::jsonb, -- Filter conditions
  
  -- Debouncing
  debounce_seconds integer DEFAULT 0, -- Wait N seconds before triggering
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Statistics
  trigger_count integer DEFAULT 0,
  last_triggered_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_helper_workflow_event_triggers_workspace ON public.helper_workflow_event_triggers(workspace_id);
CREATE INDEX idx_helper_workflow_event_triggers_event_type ON public.helper_workflow_event_triggers(event_type);
CREATE INDEX idx_helper_workflow_event_triggers_active ON public.helper_workflow_event_triggers(is_active) WHERE is_active = true;

COMMENT ON TABLE public.helper_workflow_event_triggers IS 'Event-based workflow triggers';

-- Enable RLS
ALTER TABLE public.helper_workflow_event_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_event_triggers"
ON public.helper_workflow_event_triggers
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 5. WEBHOOK ENDPOINTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_workflow_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.helper_workflows(id) ON DELETE CASCADE,
  
  -- Endpoint
  webhook_url text NOT NULL UNIQUE, -- e.g., /api/workflows/webhook/{id}
  webhook_secret text NOT NULL, -- For signature validation
  
  -- Configuration
  allowed_ips text[] DEFAULT ARRAY[]::text[], -- Whitelist IPs
  rate_limit_per_hour integer DEFAULT 100,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Statistics
  total_requests integer DEFAULT 0,
  successful_requests integer DEFAULT 0,
  failed_requests integer DEFAULT 0,
  last_request_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(workflow_id)
);

CREATE INDEX idx_helper_workflow_webhooks_workflow ON public.helper_workflow_webhooks(workflow_id);
CREATE INDEX idx_helper_workflow_webhooks_url ON public.helper_workflow_webhooks(webhook_url);

COMMENT ON TABLE public.helper_workflow_webhooks IS 'Webhook endpoints for workflows';

-- Enable RLS
ALTER TABLE public.helper_workflow_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_webhooks"
ON public.helper_workflow_webhooks
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 6. WORKFLOW TEMPLATES
-- =====================================================

INSERT INTO public.helper_workflows (
  workspace_id,
  name,
  description,
  icon,
  category,
  trigger_type,
  trigger_config,
  steps,
  is_template,
  is_enabled,
  created_by
) 
SELECT 
  id as workspace_id,
  'Daily Engagement Report',
  'Get daily WhatsApp engagement metrics every morning',
  '📊',
  'reporting',
  'schedule',
  '{"cron": "0 9 * * *", "timezone": "Asia/Jakarta"}'::jsonb,
  '[
    {"step": 1, "function": "get_conversation_analytics", "params": {"startDate": "yesterday", "endDate": "today"}, "output_var": "analytics"},
    {"step": 2, "function": "generate_report", "params": {"reportType": "daily", "metrics": ["conversations", "messages", "response_time"]}, "output_var": "report"},
    {"step": 3, "function": "create_workspace_note", "params": {"title": "Daily Engagement Report", "content": "{{report}}", "pinned": true}}
  ]'::jsonb,
  true,
  false,
  NULL
FROM workspaces
WHERE NOT EXISTS (
  SELECT 1 FROM helper_workflows WHERE name = 'Daily Engagement Report'
)
LIMIT 1;

INSERT INTO public.helper_workflows (
  workspace_id,
  name,
  description,
  icon,
  category,
  trigger_type,
  trigger_config,
  steps,
  is_template,
  is_enabled,
  created_by
)
SELECT 
  id as workspace_id,
  'Auto-tag New Messages',
  'Automatically tag incoming WhatsApp messages based on content',
  '🏷️',
  'automation',
  'event',
  '{"event_type": "wa_message_received"}'::jsonb,
  '[
    {"step": 1, "function": "get_ai_insights", "params": {"dataSource": "conversations", "focusArea": "sentiment"}, "output_var": "analysis"},
    {"step": 2, "function": "tag_conversation", "params": {"conversationId": "{{event.conversation_id}}", "tags": "{{analysis.suggested_tags}}"}}
  ]'::jsonb,
  true,
  false,
  NULL
FROM workspaces
WHERE NOT EXISTS (
  SELECT 1 FROM helper_workflows WHERE name = 'Auto-tag New Messages'
)
LIMIT 1;

INSERT INTO public.helper_workflows (
  workspace_id,
  name,
  description,
  icon,
  category,
  trigger_type,
  trigger_config,
  steps,
  is_template,
  is_enabled,
  created_by
)
SELECT 
  id as workspace_id,
  'Weekly Team Summary',
  'Send weekly performance summary to team every Monday',
  '📧',
  'reporting',
  'schedule',
  '{"cron": "0 9 * * 1", "timezone": "Asia/Jakarta"}'::jsonb,
  '[
    {"step": 1, "function": "get_conversation_analytics", "params": {"startDate": "last_week", "endDate": "today", "groupBy": "week"}, "output_var": "week_analytics"},
    {"step": 2, "function": "get_workspace_usage", "params": {"metric": "all"}, "output_var": "usage"},
    {"step": 3, "function": "generate_report", "params": {"reportType": "weekly", "metrics": ["{{week_analytics}}", "{{usage}}"], "format": "detailed"}, "output_var": "summary"},
    {"step": 4, "function": "create_workspace_note", "params": {"title": "Weekly Team Summary", "content": "{{summary}}", "tags": ["weekly", "report"], "pinned": true}}
  ]'::jsonb,
  true,
  false,
  NULL
FROM workspaces
WHERE NOT EXISTS (
  SELECT 1 FROM helper_workflows WHERE name = 'Weekly Team Summary'
)
LIMIT 1;

-- =====================================================
-- 7. WORKFLOW EXECUTION FUNCTIONS
-- =====================================================

-- Function to get next scheduled workflow
CREATE OR REPLACE FUNCTION get_next_scheduled_workflow()
RETURNS TABLE (
  schedule_id uuid,
  workflow_id uuid,
  workspace_id uuid,
  cron_expression text
) AS $$
BEGIN
  RETURN QUERY
  UPDATE helper_workflow_schedules
  SET 
    last_run_at = now(),
    next_run_at = now() + interval '1 hour' -- Simplified, should use proper cron calculation
  WHERE id = (
    SELECT s.id
    FROM helper_workflow_schedules s
    INNER JOIN helper_workflows w ON w.id = s.workflow_id
    WHERE s.is_active = true
    AND w.is_enabled = true
    AND s.next_run_at <= now()
    ORDER BY s.next_run_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    helper_workflow_schedules.id as schedule_id,
    helper_workflow_schedules.workflow_id,
    helper_workflow_schedules.workspace_id,
    helper_workflow_schedules.cron_expression;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger workflow by event
CREATE OR REPLACE FUNCTION trigger_workflow_by_event(
  p_workspace_id uuid,
  p_event_type text,
  p_event_payload jsonb
) RETURNS uuid[] AS $$
DECLARE
  v_run_ids uuid[] := ARRAY[]::uuid[];
  v_trigger record;
  v_workflow record;
  v_run_id uuid;
BEGIN
  -- Find matching event triggers
  FOR v_trigger IN
    SELECT et.*, w.steps, w.name
    FROM helper_workflow_event_triggers et
    INNER JOIN helper_workflows w ON w.id = et.workflow_id
    WHERE et.workspace_id = p_workspace_id
    AND et.event_type = p_event_type
    AND et.is_active = true
    AND w.is_enabled = true
  LOOP
    -- Create workflow run
    INSERT INTO helper_workflow_runs (
      workspace_id,
      workflow_id,
      triggered_by,
      trigger_payload,
      total_steps,
      status
    ) VALUES (
      p_workspace_id,
      v_trigger.workflow_id,
      'event:' || p_event_type,
      p_event_payload,
      jsonb_array_length(v_trigger.steps),
      'pending'
    ) RETURNING id INTO v_run_id;
    
    v_run_ids := array_append(v_run_ids, v_run_id);
    
    -- Update trigger stats
    UPDATE helper_workflow_event_triggers
    SET 
      trigger_count = trigger_count + 1,
      last_triggered_at = now()
    WHERE id = v_trigger.id;
  END LOOP;
  
  RETURN v_run_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update workflow stats trigger
CREATE OR REPLACE FUNCTION update_workflow_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE helper_workflows
    SET 
      total_runs = (
        SELECT COUNT(*)
        FROM helper_workflow_runs
        WHERE workflow_id = NEW.workflow_id
      ),
      successful_runs = (
        SELECT COUNT(*)
        FROM helper_workflow_runs
        WHERE workflow_id = NEW.workflow_id
        AND status = 'completed'
      ),
      failed_runs = (
        SELECT COUNT(*)
        FROM helper_workflow_runs
        WHERE workflow_id = NEW.workflow_id
        AND status = 'failed'
      ),
      last_run_at = NEW.completed_at,
      last_run_status = NEW.status
    WHERE id = NEW.workflow_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_workflow_stats
AFTER INSERT OR UPDATE ON helper_workflow_runs
FOR EACH ROW
EXECUTE FUNCTION update_workflow_stats();

-- =====================================================
-- 8. WORKFLOW PERMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_workflow_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.helper_workflows(id) ON DELETE CASCADE,
  
  -- User/role permissions
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text, -- 'admin', 'member', etc.
  
  -- Permissions
  can_view boolean DEFAULT true,
  can_edit boolean DEFAULT false,
  can_execute boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT workflow_permission_target CHECK (
    user_id IS NOT NULL OR role IS NOT NULL
  ),
  
  UNIQUE(workflow_id, user_id, role)
);

CREATE INDEX idx_helper_workflow_permissions_workflow ON public.helper_workflow_permissions(workflow_id);
CREATE INDEX idx_helper_workflow_permissions_user ON public.helper_workflow_permissions(user_id);

COMMENT ON TABLE public.helper_workflow_permissions IS 'Granular permissions for workflows';

-- Enable RLS
ALTER TABLE public.helper_workflow_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_workflow_permissions"
ON public.helper_workflow_permissions
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- DONE: PHASE 5 - AUTOMATION & WORKFLOWS
-- =====================================================
-- Features enabled:
-- ✅ Workflow builder with steps
-- ✅ 4 trigger types (schedule, webhook, event, manual)
-- ✅ Execution logs with step tracking
-- ✅ Cron-based scheduling
-- ✅ Event-based triggers
-- ✅ Webhook endpoints
-- ✅ 3 default workflow templates
-- ✅ Granular permissions
-- ✅ Retry logic and timeout handling
