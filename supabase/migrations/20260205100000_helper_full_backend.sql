-- =====================================================
-- Helper Module Full Backend - AI Settings, Lead Scoring, CRM Insights, Workflow Runs
-- Migration: 20260205100000
-- =====================================================

-- =====================================================
-- 1. EXTEND HELPER_SETTINGS FOR AI CONFIGURATION
-- =====================================================

ALTER TABLE public.helper_settings
ADD COLUMN IF NOT EXISTS ai_provider text DEFAULT 'openai',
ADD COLUMN IF NOT EXISTS model_name text DEFAULT 'gpt-4o-mini',
ADD COLUMN IF NOT EXISTS temperature numeric(2,1) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 2048 CHECK (max_tokens >= 256 AND max_tokens <= 32000),
ADD COLUMN IF NOT EXISTS system_prompt text DEFAULT 'You are a helpful AI assistant for Gigaviz platform. Be concise, professional, and helpful.',
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{"rag_enabled": true, "memory_enabled": true, "tools_enabled": true, "streaming_enabled": true}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_helper_settings_provider ON public.helper_settings(ai_provider);

COMMENT ON COLUMN public.helper_settings.ai_provider IS 'AI provider: openai, anthropic, google';
COMMENT ON COLUMN public.helper_settings.model_name IS 'Model name like gpt-4o, claude-3-opus, etc.';
COMMENT ON COLUMN public.helper_settings.temperature IS 'Generation temperature 0-2';
COMMENT ON COLUMN public.helper_settings.features IS 'Feature flags for Helper AI';

-- =====================================================
-- 2. LEAD SCORING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Contact reference (nullable - can be standalone lead)
  contact_id uuid REFERENCES public.wa_contacts(id) ON DELETE SET NULL,
  
  -- Lead info
  name text NOT NULL,
  email text,
  phone text,
  company text,
  title text,
  source text, -- 'whatsapp', 'website', 'import', 'manual'
  
  -- Scoring
  score integer DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  temperature text DEFAULT 'cold' CHECK (temperature IN ('hot', 'warm', 'cold')),
  qualification_status text DEFAULT 'unqualified' CHECK (qualification_status IN ('unqualified', 'mql', 'sql', 'opportunity', 'customer', 'churned')),
  
  -- AI-generated insights
  ai_summary text,
  ai_recommendations jsonb DEFAULT '[]'::jsonb,
  last_ai_analysis_at timestamptz,
  
  -- Activity metrics
  engagement_score integer DEFAULT 0,
  last_activity_at timestamptz,
  total_interactions integer DEFAULT 0,
  
  -- Value
  estimated_value numeric(12,2),
  currency text DEFAULT 'IDR',
  
  -- Assignment
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'converted', 'lost', 'archived')),
  
  -- Metadata
  custom_fields jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_leads_workspace ON public.helper_leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_helper_leads_score ON public.helper_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_helper_leads_temperature ON public.helper_leads(temperature);
CREATE INDEX IF NOT EXISTS idx_helper_leads_status ON public.helper_leads(status);
CREATE INDEX IF NOT EXISTS idx_helper_leads_assigned ON public.helper_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_helper_leads_contact ON public.helper_leads(contact_id);

ALTER TABLE public.helper_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_workspace_access" ON public.helper_leads
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

COMMENT ON TABLE public.helper_leads IS 'Lead scoring and management for Helper CRM';

-- =====================================================
-- 3. CRM INSIGHTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_crm_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Insight type
  insight_type text NOT NULL CHECK (insight_type IN ('trend', 'anomaly', 'opportunity', 'risk', 'recommendation')),
  category text, -- 'engagement', 'conversion', 'churn', 'revenue', etc.
  
  -- Content
  title text NOT NULL,
  description text NOT NULL,
  summary text,
  
  -- AI analysis
  confidence_score numeric(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ai_model text,
  analysis_data jsonb DEFAULT '{}'::jsonb,
  
  -- Impact
  impact_level text DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  affected_leads integer DEFAULT 0,
  potential_value numeric(12,2),
  
  -- Actions
  suggested_actions jsonb DEFAULT '[]'::jsonb,
  action_taken boolean DEFAULT false,
  action_result text,
  
  -- Validity
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  
  -- Tracking
  viewed_count integer DEFAULT 0,
  dismissed_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_crm_insights_workspace ON public.helper_crm_insights(workspace_id);
CREATE INDEX IF NOT EXISTS idx_helper_crm_insights_type ON public.helper_crm_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_helper_crm_insights_active ON public.helper_crm_insights(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_helper_crm_insights_impact ON public.helper_crm_insights(impact_level);

ALTER TABLE public.helper_crm_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insights_workspace_access" ON public.helper_crm_insights
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

COMMENT ON TABLE public.helper_crm_insights IS 'AI-generated CRM insights and recommendations';

-- =====================================================
-- 4. WORKFLOW RUNS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.helper_workflows(id) ON DELETE CASCADE,
  
  -- Execution info
  trigger_type text NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'schedule', 'webhook', 'event')),
  trigger_data jsonb DEFAULT '{}'::jsonb,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Progress
  current_step integer DEFAULT 0,
  total_steps integer DEFAULT 0,
  steps_completed jsonb DEFAULT '[]'::jsonb, -- Array of {step_id, status, output, duration_ms}
  
  -- Timing
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  
  -- Results
  output jsonb DEFAULT '{}'::jsonb,
  error_message text,
  error_details jsonb,
  
  -- Resources
  tokens_used integer DEFAULT 0,
  api_calls integer DEFAULT 0,
  
  -- Initiated by
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_workflow_runs_workspace ON public.helper_workflow_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_helper_workflow_runs_workflow ON public.helper_workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_helper_workflow_runs_status ON public.helper_workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_helper_workflow_runs_created ON public.helper_workflow_runs(created_at DESC);

ALTER TABLE public.helper_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_runs_workspace_access" ON public.helper_workflow_runs
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

COMMENT ON TABLE public.helper_workflow_runs IS 'Execution history for Helper workflows';

-- =====================================================
-- 5. KNOWLEDGE SYNC JOBS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_knowledge_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.helper_knowledge_sources(id) ON DELETE CASCADE,
  
  -- Job info
  job_type text NOT NULL DEFAULT 'full' CHECK (job_type IN ('full', 'incremental', 'reindex')),
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Progress
  total_documents integer DEFAULT 0,
  processed_documents integer DEFAULT 0,
  failed_documents integer DEFAULT 0,
  
  -- Timing
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Results
  chunks_created integer DEFAULT 0,
  chunks_updated integer DEFAULT 0,
  chunks_deleted integer DEFAULT 0,
  error_message text,
  
  -- Schedule
  scheduled_at timestamptz,
  next_run_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_kb_sync_workspace ON public.helper_knowledge_sync_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_helper_kb_sync_status ON public.helper_knowledge_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_helper_kb_sync_source ON public.helper_knowledge_sync_jobs(source_id);

ALTER TABLE public.helper_knowledge_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_sync_workspace_access" ON public.helper_knowledge_sync_jobs
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

COMMENT ON TABLE public.helper_knowledge_sync_jobs IS 'Knowledge base sync job tracking';

-- =====================================================
-- 6. UPDATE HELPER_TEMPLATES SCHEMA (add prompt field)
-- =====================================================

ALTER TABLE public.helper_templates
ADD COLUMN IF NOT EXISTS prompt text,
ADD COLUMN IF NOT EXISTS variables text[] DEFAULT '{}';

-- =====================================================
-- 7. TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_helper_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS helper_leads_updated_at ON public.helper_leads;
CREATE TRIGGER helper_leads_updated_at
  BEFORE UPDATE ON public.helper_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_helper_updated_at();

DROP TRIGGER IF EXISTS helper_crm_insights_updated_at ON public.helper_crm_insights;
CREATE TRIGGER helper_crm_insights_updated_at
  BEFORE UPDATE ON public.helper_crm_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_helper_updated_at();

DROP TRIGGER IF EXISTS helper_workflow_runs_updated_at ON public.helper_workflow_runs;
CREATE TRIGGER helper_workflow_runs_updated_at
  BEFORE UPDATE ON public.helper_workflow_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_helper_updated_at();

DROP TRIGGER IF EXISTS helper_settings_updated_at ON public.helper_settings;
CREATE TRIGGER helper_settings_updated_at
  BEFORE UPDATE ON public.helper_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_helper_updated_at();
