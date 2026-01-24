-- ============================================================================
-- Workspace Quotas & Metrics for Dashboard Gauges
-- ============================================================================

-- 1. Workspace quotas (limits per plan, usage tracking)
CREATE TABLE IF NOT EXISTS workspace_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  quota_key text NOT NULL,
  quota_limit bigint NOT NULL DEFAULT 0,
  quota_used bigint NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  period_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, quota_key, period_start)
);

-- 2. Product metrics snapshots (for sparklines/trends)
CREATE TABLE IF NOT EXISTS workspace_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  metric_value bigint NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_quotas_lookup 
  ON workspace_quotas(workspace_id, quota_key);

CREATE INDEX IF NOT EXISTS idx_workspace_quotas_period 
  ON workspace_quotas(workspace_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_metrics_trend 
  ON workspace_metrics(workspace_id, metric_key, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_metrics_recent 
  ON workspace_metrics(workspace_id, recorded_at DESC);

-- 4. RLS Policies
ALTER TABLE workspace_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_metrics ENABLE ROW LEVEL SECURITY;

-- Quotas: members can read, service role can write
CREATE POLICY "workspace_quotas_select" ON workspace_quotas
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_quotas_insert" ON workspace_quotas
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_quotas_update" ON workspace_quotas
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Metrics: members can read, service role can write
CREATE POLICY "workspace_metrics_select" ON workspace_metrics
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_metrics_insert" ON workspace_metrics
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- 5. Function to increment quota usage atomically
CREATE OR REPLACE FUNCTION increment_quota_usage(
  p_workspace_id uuid,
  p_quota_key text,
  p_amount bigint DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE workspace_quotas
  SET 
    quota_used = quota_used + p_amount,
    updated_at = now()
  WHERE workspace_id = p_workspace_id
    AND quota_key = p_quota_key
    AND period_start <= now()
    AND period_end > now();
END;
$$;

-- 6. Function to record a metric snapshot
CREATE OR REPLACE FUNCTION record_metric(
  p_workspace_id uuid,
  p_metric_key text,
  p_metric_value bigint,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO workspace_metrics (workspace_id, metric_key, metric_value, metadata)
  VALUES (p_workspace_id, p_metric_key, p_metric_value, p_metadata);
END;
$$;

-- 7. Function to get current quota status
CREATE OR REPLACE FUNCTION get_quota_status(
  p_workspace_id uuid,
  p_quota_key text
)
RETURNS TABLE(quota_limit bigint, quota_used bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.quota_limit,
    q.quota_used,
    CASE 
      WHEN q.quota_limit > 0 THEN ROUND((q.quota_used::numeric / q.quota_limit::numeric) * 100, 1)
      ELSE 0
    END as percentage
  FROM workspace_quotas q
  WHERE q.workspace_id = p_workspace_id
    AND q.quota_key = p_quota_key
    AND q.period_start <= now()
    AND q.period_end > now()
  LIMIT 1;
END;
$$;

-- 8. Function to get metric trend (last 7 days)
CREATE OR REPLACE FUNCTION get_metric_trend(
  p_workspace_id uuid,
  p_metric_key text,
  p_days int DEFAULT 7
)
RETURNS TABLE(day date, total_value bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(m.recorded_at) as day,
    SUM(m.metric_value)::bigint as total_value
  FROM workspace_metrics m
  WHERE m.workspace_id = p_workspace_id
    AND m.metric_key = p_metric_key
    AND m.recorded_at >= now() - (p_days || ' days')::interval
  GROUP BY DATE(m.recorded_at)
  ORDER BY day ASC;
END;
$$;
