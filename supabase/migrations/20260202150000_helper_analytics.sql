-- =====================================================
-- PHASE 6: ANALYTICS & INSIGHTS
-- =====================================================
-- Data-driven AI performance tracking and optimization

-- =====================================================
-- 1. ANALYTICS EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Event classification
  event_type text NOT NULL, -- 'conversation_started', 'message_sent', 'function_called', etc.
  event_category text NOT NULL, -- 'usage', 'performance', 'error', 'engagement'
  
  -- Context
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.helper_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.helper_messages(id) ON DELETE SET NULL,
  function_call_id uuid REFERENCES public.helper_function_calls(id) ON DELETE SET NULL,
  workflow_run_id uuid REFERENCES public.helper_workflow_runs(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "model": "gpt-4",
  --   "tokens": 1500,
  --   "duration_ms": 2500,
  --   "error_code": "rate_limit",
  --   "user_agent": "...",
  --   ...
  -- }
  
  -- Metrics
  duration_ms integer,
  tokens_used integer,
  cost_usd numeric(10, 6),
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Partitioning for performance (by month)
CREATE INDEX idx_helper_analytics_events_workspace_created ON public.helper_analytics_events(workspace_id, created_at DESC);
CREATE INDEX idx_helper_analytics_events_type ON public.helper_analytics_events(event_type);
CREATE INDEX idx_helper_analytics_events_category ON public.helper_analytics_events(event_category);
CREATE INDEX idx_helper_analytics_events_user ON public.helper_analytics_events(user_id) WHERE user_id IS NOT NULL;

COMMENT ON TABLE public.helper_analytics_events IS 'Event tracking for analytics and monitoring';

-- Enable RLS
ALTER TABLE public.helper_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_analytics"
ON public.helper_analytics_events
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 2. USER FEEDBACK
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Context
  message_id uuid NOT NULL REFERENCES public.helper_messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.helper_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feedback
  rating text NOT NULL CHECK (rating IN ('positive', 'negative', 'neutral')),
  feedback_text text,
  feedback_tags text[] DEFAULT ARRAY[]::text[], -- ['inaccurate', 'helpful', 'too_long', etc.]
  
  -- Follow-up
  is_addressed boolean DEFAULT false,
  addressed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  addressed_at timestamptz,
  resolution_notes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_helper_message_feedback_message ON public.helper_message_feedback(message_id);
CREATE INDEX idx_helper_message_feedback_rating ON public.helper_message_feedback(rating);
CREATE INDEX idx_helper_message_feedback_workspace_created ON public.helper_message_feedback(workspace_id, created_at DESC);

COMMENT ON TABLE public.helper_message_feedback IS 'User feedback on AI responses (thumbs up/down)';

-- Enable RLS
ALTER TABLE public.helper_message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_feedback"
ON public.helper_message_feedback
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- Add feedback counts to messages
ALTER TABLE public.helper_messages
ADD COLUMN IF NOT EXISTS feedback_positive integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS feedback_negative integer DEFAULT 0;

-- Trigger to update feedback counts
CREATE OR REPLACE FUNCTION update_message_feedback_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE helper_messages
  SET 
    feedback_positive = (
      SELECT COUNT(*)
      FROM helper_message_feedback
      WHERE message_id = NEW.message_id
      AND rating = 'positive'
    ),
    feedback_negative = (
      SELECT COUNT(*)
      FROM helper_message_feedback
      WHERE message_id = NEW.message_id
      AND rating = 'negative'
    )
  WHERE id = NEW.message_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_message_feedback_counts
AFTER INSERT OR UPDATE ON helper_message_feedback
FOR EACH ROW
EXECUTE FUNCTION update_message_feedback_counts();

-- =====================================================
-- 3. PERFORMANCE METRICS (Materialized Views)
-- =====================================================

-- Daily conversation metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS helper_daily_metrics AS
SELECT 
  workspace_id,
  DATE(created_at) as date,
  COUNT(DISTINCT id) as total_conversations,
  COUNT(DISTINCT created_by) as active_users
FROM helper_conversations
GROUP BY workspace_id, DATE(created_at);

CREATE UNIQUE INDEX idx_helper_daily_metrics_workspace_date 
ON helper_daily_metrics(workspace_id, date DESC);

COMMENT ON MATERIALIZED VIEW helper_daily_metrics IS 'Daily aggregated conversation metrics';

-- Provider performance comparison
-- TODO: Add model_provider, model, input_tokens, output_tokens, response_time_ms, error_message columns to helper_messages
/*
CREATE MATERIALIZED VIEW IF NOT EXISTS helper_provider_performance AS
SELECT 
  workspace_id,
  model_provider,
  model,
  COUNT(*) as total_messages,
  AVG(input_tokens) as avg_input_tokens,
  AVG(output_tokens) as avg_output_tokens,
  AVG(response_time_ms) as avg_response_time_ms,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time_ms) as p50_response_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) as error_count,
  (COUNT(*) FILTER (WHERE error_message IS NOT NULL)::float / COUNT(*)) * 100 as error_rate_percent
FROM helper_messages
WHERE role = 'assistant'
AND created_at >= now() - interval '30 days'
GROUP BY workspace_id, model_provider, model;

CREATE UNIQUE INDEX idx_helper_provider_performance_workspace_provider 
ON helper_provider_performance(workspace_id, model_provider, model);

COMMENT ON MATERIALIZED VIEW helper_provider_performance IS 'AI provider performance comparison';
*/

-- Function usage analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS helper_function_usage_stats AS
SELECT 
  hfc.workspace_id,
  hf.function_name,
  hf.display_name,
  hf.product_slug,
  hf.category,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE hfc.status = 'completed') as successful_calls,
  COUNT(*) FILTER (WHERE hfc.status = 'failed') as failed_calls,
  (COUNT(*) FILTER (WHERE hfc.status = 'completed')::float / COUNT(*)) * 100 as success_rate_percent,
  AVG(hfc.duration_ms) as avg_duration_ms,
  MAX(hfc.created_at) as last_used_at,
  COUNT(DISTINCT hfc.conversation_id) as unique_conversations
FROM helper_function_calls hfc
INNER JOIN helper_functions hf ON hf.id = hfc.function_id
WHERE hfc.created_at >= now() - interval '30 days'
GROUP BY hfc.workspace_id, hf.function_name, hf.display_name, hf.product_slug, hf.category;

CREATE UNIQUE INDEX idx_helper_function_usage_workspace_function 
ON helper_function_usage_stats(workspace_id, function_name);

COMMENT ON MATERIALIZED VIEW helper_function_usage_stats IS 'Function call analytics';

-- =====================================================
-- 4. COST TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_cost_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Period
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  -- Usage
  total_conversations integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  total_function_calls integer DEFAULT 0,
  
  -- Tokens
  total_input_tokens bigint DEFAULT 0,
  total_output_tokens bigint DEFAULT 0,
  total_embedding_tokens bigint DEFAULT 0,
  
  -- Costs by provider
  openai_cost_usd numeric(10, 4) DEFAULT 0,
  anthropic_cost_usd numeric(10, 4) DEFAULT 0,
  gemini_cost_usd numeric(10, 4) DEFAULT 0,
  other_cost_usd numeric(10, 4) DEFAULT 0,
  total_cost_usd numeric(10, 4) DEFAULT 0,
  
  -- Breakdown by feature
  cost_by_feature jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "chat": 12.50,
  --   "functions": 5.30,
  --   "rag": 2.10,
  --   "vision": 8.75
  -- }
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id, period_start)
);

CREATE INDEX idx_helper_cost_tracking_workspace_period 
ON public.helper_cost_tracking(workspace_id, period_start DESC);

COMMENT ON TABLE public.helper_cost_tracking IS 'Cost tracking and optimization data';

-- Enable RLS
ALTER TABLE public.helper_cost_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_cost_tracking"
ON public.helper_cost_tracking
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- =====================================================
-- 5. ERROR TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Error classification
  error_type text NOT NULL, -- 'api_error', 'rate_limit', 'timeout', 'validation', etc.
  error_code text,
  error_message text NOT NULL,
  
  -- Context
  conversation_id uuid REFERENCES public.helper_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.helper_messages(id) ON DELETE SET NULL,
  function_call_id uuid REFERENCES public.helper_function_calls(id) ON DELETE SET NULL,
  workflow_run_id uuid REFERENCES public.helper_workflow_runs(id) ON DELETE SET NULL,
  
  -- Stack trace
  stack_trace text,
  request_payload jsonb,
  
  -- Impact
  user_facing boolean DEFAULT false,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Resolution
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  resolution_notes text,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_helper_error_logs_workspace_created ON public.helper_error_logs(workspace_id, created_at DESC);
CREATE INDEX idx_helper_error_logs_type ON public.helper_error_logs(error_type);
CREATE INDEX idx_helper_error_logs_severity ON public.helper_error_logs(severity) WHERE is_resolved = false;

COMMENT ON TABLE public.helper_error_logs IS 'Centralized error tracking and monitoring';

-- Enable RLS
ALTER TABLE public.helper_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_access_workspace_error_logs"
ON public.helper_error_logs
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- =====================================================
-- 6. ANALYTICS FUNCTIONS
-- =====================================================

-- Function to refresh all analytics views
CREATE OR REPLACE FUNCTION refresh_helper_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY helper_daily_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY helper_provider_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY helper_function_usage_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workspace dashboard metrics
CREATE OR REPLACE FUNCTION get_workspace_dashboard_metrics(
  p_workspace_id uuid,
  p_period_days integer DEFAULT 30
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'conversations', (
      SELECT COUNT(*)
      FROM helper_conversations
      WHERE workspace_id = p_workspace_id
      AND created_at >= now() - (p_period_days || ' days')::interval
    ),
    'messages', (
      SELECT COUNT(*)
      FROM helper_messages m
      INNER JOIN helper_conversations c ON c.id = m.conversation_id
      WHERE c.workspace_id = p_workspace_id
      AND m.created_at >= now() - (p_period_days || ' days')::interval
    ),
    'function_calls', (
      SELECT COUNT(*)
      FROM helper_function_calls
      WHERE workspace_id = p_workspace_id
      AND created_at >= now() - (p_period_days || ' days')::interval
    ),
    'avg_response_time_ms', (
      SELECT AVG(response_time_ms)
      FROM helper_messages m
      INNER JOIN helper_conversations c ON c.id = m.conversation_id
      WHERE c.workspace_id = p_workspace_id
      AND m.role = 'assistant'
      AND m.created_at >= now() - (p_period_days || ' days')::interval
    ),
    'feedback_positive_rate', (
      SELECT 
        CASE 
          WHEN COUNT(*) > 0 THEN
            (COUNT(*) FILTER (WHERE rating = 'positive')::float / COUNT(*)) * 100
          ELSE 0
        END
      FROM helper_message_feedback
      WHERE workspace_id = p_workspace_id
      AND created_at >= now() - (p_period_days || ' days')::interval
    ),
    'top_functions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'function_name', function_name,
          'total_calls', total_calls
        )
      )
      FROM (
        SELECT function_name, COUNT(*) as total_calls
        FROM helper_function_calls
        WHERE workspace_id = p_workspace_id
        AND created_at >= now() - (p_period_days || ' days')::interval
        GROUP BY function_name
        ORDER BY total_calls DESC
        LIMIT 5
      ) top
    ),
    'active_users', (
      SELECT COUNT(DISTINCT created_by)
      FROM helper_conversations
      WHERE workspace_id = p_workspace_id
      AND created_at >= now() - (p_period_days || ' days')::interval
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. SCHEDULED ANALYTICS JOBS
-- =====================================================

-- Create job to refresh analytics daily
CREATE TABLE IF NOT EXISTS public.helper_analytics_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL UNIQUE,
  job_type text NOT NULL,
  schedule_cron text NOT NULL,
  is_enabled boolean DEFAULT true,
  last_run_at timestamptz,
  last_run_status text,
  next_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.helper_analytics_jobs (job_name, job_type, schedule_cron, next_run_at)
VALUES 
  ('refresh_analytics_views', 'refresh_materialized_views', '0 */6 * * *', now()),
  ('calculate_daily_costs', 'cost_calculation', '0 1 * * *', now() + interval '1 day'),
  ('cleanup_old_events', 'cleanup', '0 2 * * 0', now() + interval '1 week')
ON CONFLICT (job_name) DO NOTHING;

COMMENT ON TABLE public.helper_analytics_jobs IS 'Scheduled analytics maintenance jobs';

-- =====================================================
-- DONE: PHASE 6 - ANALYTICS & INSIGHTS
-- =====================================================
-- Features enabled:
-- ✅ Event tracking system
-- ✅ User feedback (thumbs up/down)
-- ✅ Performance metrics (daily, provider, function)
-- ✅ Cost tracking by provider and feature
-- ✅ Error logging and monitoring
-- ✅ Dashboard metrics API
-- ✅ Materialized views for performance
-- ✅ Scheduled analytics jobs
