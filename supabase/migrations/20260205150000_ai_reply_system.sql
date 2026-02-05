-- ============================================================================
-- AI REPLY SYSTEM FOR WHATSAPP
-- Integrates Gigaviz Helper AI with Meta Hub for intelligent auto-replies
-- ============================================================================

-- 1. AI Reply Settings (per workspace)
CREATE TABLE IF NOT EXISTS ai_reply_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Master toggle
  enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- AI Configuration
  ai_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER NOT NULL DEFAULT 500 CHECK (max_tokens >= 50 AND max_tokens <= 2000),
  
  -- Personality & Behavior
  system_prompt TEXT,
  greeting_message TEXT,
  fallback_message TEXT DEFAULT 'Mohon maaf, saya tidak dapat membantu saat ini. Tim kami akan segera menghubungi Anda.',
  
  -- Knowledge Base Integration
  use_knowledge_base BOOLEAN NOT NULL DEFAULT true,
  knowledge_confidence_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.7 CHECK (knowledge_confidence_threshold >= 0 AND knowledge_confidence_threshold <= 1),
  
  -- Operating Hours (optional)
  active_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  active_hours_start TIME,
  active_hours_end TIME,
  active_timezone TEXT DEFAULT 'Asia/Jakarta',
  
  -- Rate Limiting
  cooldown_seconds INTEGER NOT NULL DEFAULT 5 CHECK (cooldown_seconds >= 0),
  max_messages_per_thread INTEGER DEFAULT NULL,
  max_messages_per_day INTEGER DEFAULT 100 CHECK (max_messages_per_day >= 0),
  
  -- Handoff Rules
  handoff_keywords TEXT[] DEFAULT ARRAY['agent', 'human', 'operator', 'manusia', 'cs']::TEXT[],
  handoff_message TEXT DEFAULT 'Baik, saya akan meneruskan percakapan ini ke tim kami. Mohon tunggu sebentar.',
  auto_handoff_after_messages INTEGER DEFAULT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id)
);

-- 2. AI Reply Logs (for analytics and debugging)
CREATE TABLE IF NOT EXISTS ai_reply_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL,
  message_id UUID,
  
  -- Request details
  input_message TEXT NOT NULL,
  context_used JSONB DEFAULT '[]'::JSONB,
  
  -- AI Response
  ai_response TEXT,
  model_used TEXT,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'handoff', 'skipped')),
  error_message TEXT,
  skip_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. AI Reply Thread State (tracks per-thread AI state)
CREATE TABLE IF NOT EXISTS ai_reply_thread_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL,
  
  -- State
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_ai_reply_at TIMESTAMPTZ,
  handed_off BOOLEAN NOT NULL DEFAULT false,
  handed_off_at TIMESTAMPTZ,
  handed_off_reason TEXT,
  
  -- Context memory (last N messages for continuity)
  context_window JSONB DEFAULT '[]'::JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id, thread_id)
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_reply_settings_workspace ON ai_reply_settings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_reply_logs_workspace ON ai_reply_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_reply_logs_thread ON ai_reply_logs(thread_id);
CREATE INDEX IF NOT EXISTS idx_ai_reply_logs_status ON ai_reply_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_reply_logs_created ON ai_reply_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reply_thread_state_lookup ON ai_reply_thread_state(workspace_id, thread_id);

-- 5. RLS Policies
ALTER TABLE ai_reply_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reply_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reply_thread_state ENABLE ROW LEVEL SECURITY;

-- AI Reply Settings policies
CREATE POLICY ai_reply_settings_select ON ai_reply_settings
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY ai_reply_settings_insert ON ai_reply_settings
  FOR INSERT WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY ai_reply_settings_update ON ai_reply_settings
  FOR UPDATE USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY ai_reply_settings_delete ON ai_reply_settings
  FOR DELETE USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- AI Reply Logs policies (read-only for members)
CREATE POLICY ai_reply_logs_select ON ai_reply_logs
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY ai_reply_logs_insert ON ai_reply_logs
  FOR INSERT WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- AI Reply Thread State policies
CREATE POLICY ai_reply_thread_state_select ON ai_reply_thread_state
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY ai_reply_thread_state_all ON ai_reply_thread_state
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- 6. Update timestamp trigger
CREATE OR REPLACE FUNCTION update_ai_reply_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_reply_settings_updated
  BEFORE UPDATE ON ai_reply_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_reply_settings_timestamp();

CREATE TRIGGER ai_reply_thread_state_updated
  BEFORE UPDATE ON ai_reply_thread_state
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_reply_settings_timestamp();

-- 7. Add ai_reply action type to automation_rules if not exists
-- (This extends the existing automation engine)
COMMENT ON TABLE ai_reply_settings IS 'Workspace-level AI reply configuration for WhatsApp';
COMMENT ON TABLE ai_reply_logs IS 'Audit log of AI reply attempts and results';
COMMENT ON TABLE ai_reply_thread_state IS 'Per-thread AI reply state and context';

-- 8. Add is_ai_generated column to wa_messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wa_messages' AND column_name = 'is_ai_generated'
  ) THEN
    ALTER TABLE wa_messages ADD COLUMN is_ai_generated BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 9. Create function for knowledge base vector search (if not exists)
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_workspace_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  source_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    hkc.id,
    hkc.content,
    hks.url as source_url,
    1 - (hkc.embedding <=> query_embedding) as similarity
  FROM helper_knowledge_chunks hkc
  JOIN helper_knowledge_sources hks ON hks.id = hkc.source_id
  WHERE hks.workspace_id = p_workspace_id
    AND hks.status = 'indexed'
    AND 1 - (hkc.embedding <=> query_embedding) > match_threshold
  ORDER BY hkc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
