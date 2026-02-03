-- ============================================================================
-- Migration: Meta Hub Power-Up (Option D)
-- Created: 2026-02-03
-- Purpose: Add Quick Replies, Multi-Agent Assignment, Campaign Scheduling
-- ============================================================================

-- ============================================================================
-- 1. QUICK REPLIES SYSTEM (Workspace-Scoped)
-- ============================================================================

-- Quick replies table for Meta Hub inbox (separate from ops_canned_responses)
CREATE TABLE IF NOT EXISTS public.inbox_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Quick reply content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT, -- e.g., "price" for /price command
  category TEXT NOT NULL DEFAULT 'general',
  
  -- Variable placeholders support
  -- Use {{contact_name}}, {{contact_phone}}, {{agent_name}} etc.
  has_variables BOOLEAN NOT NULL DEFAULT false,
  
  -- Usage tracking
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique shortcut per workspace
  CONSTRAINT inbox_quick_replies_shortcut_unique UNIQUE (workspace_id, shortcut)
);

-- Indexes for quick replies
CREATE INDEX IF NOT EXISTS idx_inbox_quick_replies_workspace 
ON inbox_quick_replies (workspace_id);

CREATE INDEX IF NOT EXISTS idx_inbox_quick_replies_shortcut 
ON inbox_quick_replies (workspace_id, shortcut) 
WHERE shortcut IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inbox_quick_replies_category 
ON inbox_quick_replies (workspace_id, category);

-- RLS policies for quick replies
ALTER TABLE inbox_quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY inbox_quick_replies_select ON inbox_quick_replies
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY inbox_quick_replies_insert ON inbox_quick_replies
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY inbox_quick_replies_update ON inbox_quick_replies
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY inbox_quick_replies_delete ON inbox_quick_replies
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 2. AGENT STATUS & ASSIGNMENT SYSTEM
-- ============================================================================

-- Agent status tracking (online, away, busy, offline)
CREATE TABLE IF NOT EXISTS public.agent_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  status_message TEXT, -- e.g., "In meeting until 3pm"
  
  -- Availability settings
  max_concurrent_threads INTEGER NOT NULL DEFAULT 10,
  auto_accept_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Assignment stats (updated by triggers)
  active_threads_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One status record per user per workspace
  CONSTRAINT agent_status_unique UNIQUE (workspace_id, user_id)
);

-- Indexes for agent status
CREATE INDEX IF NOT EXISTS idx_agent_status_workspace 
ON agent_status (workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_status_online 
ON agent_status (workspace_id, status) 
WHERE status = 'online';

-- RLS policies for agent status
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_status_select ON agent_status
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY agent_status_upsert ON agent_status
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. ASSIGNMENT RULES (Round-Robin, Load Balancing)
-- ============================================================================

-- Assignment configuration per workspace
CREATE TABLE IF NOT EXISTS public.assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Assignment strategy
  strategy TEXT NOT NULL DEFAULT 'manual' CHECK (strategy IN ('manual', 'round_robin', 'load_balance', 'skill_based')),
  
  -- Round-robin state
  last_assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Load balance settings
  max_threads_per_agent INTEGER NOT NULL DEFAULT 20,
  
  -- Auto-assignment settings
  auto_assign_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_assign_on_new_message BOOLEAN NOT NULL DEFAULT true,
  auto_assign_on_reopen BOOLEAN NOT NULL DEFAULT false,
  
  -- Skill-based routing tags (future)
  skill_tags_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One config per workspace
  CONSTRAINT assignment_rules_workspace_unique UNIQUE (workspace_id)
);

-- RLS policies for assignment rules
ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY assignment_rules_select ON assignment_rules
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY assignment_rules_manage ON assignment_rules
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 4. CAMPAIGN SCHEDULING
-- ============================================================================

-- Add scheduling columns to wa_send_jobs if not exists
DO $$
BEGIN
  -- Add scheduled_at column for campaign scheduling
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wa_send_jobs' 
    AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE public.wa_send_jobs ADD COLUMN scheduled_at TIMESTAMPTZ;
  END IF;
  
  -- Add started_at column for tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wa_send_jobs' 
    AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.wa_send_jobs ADD COLUMN started_at TIMESTAMPTZ;
  END IF;
  
  -- Add completed_at column for tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wa_send_jobs' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.wa_send_jobs ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
  
  -- Add timezone column for scheduling
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wa_send_jobs' 
    AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.wa_send_jobs ADD COLUMN timezone TEXT DEFAULT 'Asia/Jakarta';
  END IF;
END $$;

-- Index for scheduled jobs
CREATE INDEX IF NOT EXISTS idx_wa_send_jobs_scheduled 
ON wa_send_jobs (scheduled_at, status) 
WHERE scheduled_at IS NOT NULL AND status = 'pending';

-- ============================================================================
-- 5. AUTO-REPLY CONFIGURATION
-- ============================================================================

-- Auto-reply rules (OOO, keyword triggers)
CREATE TABLE IF NOT EXISTS public.auto_reply_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.wa_phone_numbers(id) ON DELETE CASCADE,
  
  -- Rule info
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  
  -- Trigger type
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'always',           -- Always reply (e.g., OOO)
    'first_message',    -- Only on first message from contact
    'keyword',          -- Contains specific keywords
    'outside_hours',    -- Outside business hours
    'no_agent_online'   -- When no agents are online
  )),
  
  -- Trigger conditions (JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- For keyword: { "keywords": ["price", "harga", "berapa"] }
  -- For outside_hours: { "business_hours": { "start": "09:00", "end": "17:00", "days": [1,2,3,4,5] } }
  
  -- Reply content
  reply_type TEXT NOT NULL DEFAULT 'text' CHECK (reply_type IN ('text', 'template', 'quick_reply')),
  reply_content TEXT, -- For text type
  template_id UUID REFERENCES public.wa_templates(id) ON DELETE SET NULL, -- For template type
  quick_reply_id UUID REFERENCES public.inbox_quick_replies(id) ON DELETE SET NULL, -- For quick_reply type
  
  -- Rate limiting to prevent spam
  cooldown_minutes INTEGER NOT NULL DEFAULT 60, -- Don't auto-reply to same contact within this period
  
  -- Tracking
  trigger_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  
  -- Timestamps
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for auto-reply rules
CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_workspace 
ON auto_reply_rules (workspace_id);

CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_enabled 
ON auto_reply_rules (workspace_id, enabled, priority DESC) 
WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_connection 
ON auto_reply_rules (connection_id) 
WHERE connection_id IS NOT NULL;

-- Auto-reply cooldown tracking
CREATE TABLE IF NOT EXISTS public.auto_reply_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.auto_reply_rules(id) ON DELETE CASCADE,
  contact_wa_id TEXT NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT auto_reply_cooldowns_unique UNIQUE (rule_id, contact_wa_id)
);

-- Index for cooldown lookup
CREATE INDEX IF NOT EXISTS idx_auto_reply_cooldowns_lookup 
ON auto_reply_cooldowns (rule_id, contact_wa_id, last_sent_at);

-- RLS policies for auto-reply rules
ALTER TABLE auto_reply_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY auto_reply_rules_select ON auto_reply_rules
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY auto_reply_rules_manage ON auto_reply_rules
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

ALTER TABLE auto_reply_cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY auto_reply_cooldowns_all ON auto_reply_cooldowns
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. INSTAGRAM IMPROVEMENTS
-- ============================================================================

-- Add missing columns to instagram_threads if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instagram_threads') THEN
    -- Add unread_count if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'instagram_threads' AND column_name = 'unread_count'
    ) THEN
      ALTER TABLE instagram_threads ADD COLUMN unread_count INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add last_message_at if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'instagram_threads' AND column_name = 'last_message_at'
    ) THEN
      ALTER TABLE instagram_threads ADD COLUMN last_message_at TIMESTAMPTZ;
    END IF;
    
    -- Add tags if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'instagram_threads' AND column_name = 'tags'
    ) THEN
      ALTER TABLE instagram_threads ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get next agent for round-robin assignment
CREATE OR REPLACE FUNCTION get_next_round_robin_agent(
  p_workspace_id UUID
) RETURNS UUID AS $$
DECLARE
  v_last_assigned UUID;
  v_next_agent UUID;
BEGIN
  -- Get last assigned user from assignment rules
  SELECT last_assigned_user_id INTO v_last_assigned
  FROM assignment_rules
  WHERE workspace_id = p_workspace_id;
  
  -- Find next online agent after the last assigned
  SELECT ast.user_id INTO v_next_agent
  FROM agent_status ast
  JOIN workspace_members wm ON wm.user_id = ast.user_id AND wm.workspace_id = ast.workspace_id
  WHERE ast.workspace_id = p_workspace_id
    AND ast.status = 'online'
    AND ast.active_threads_count < ast.max_concurrent_threads
    AND (v_last_assigned IS NULL OR ast.user_id > v_last_assigned)
  ORDER BY ast.user_id
  LIMIT 1;
  
  -- If no agent found after last, wrap around to first
  IF v_next_agent IS NULL THEN
    SELECT ast.user_id INTO v_next_agent
    FROM agent_status ast
    JOIN workspace_members wm ON wm.user_id = ast.user_id AND wm.workspace_id = ast.workspace_id
    WHERE ast.workspace_id = p_workspace_id
      AND ast.status = 'online'
      AND ast.active_threads_count < ast.max_concurrent_threads
    ORDER BY ast.user_id
    LIMIT 1;
  END IF;
  
  -- Update last assigned if we found someone
  IF v_next_agent IS NOT NULL THEN
    UPDATE assignment_rules
    SET last_assigned_user_id = v_next_agent, updated_at = now()
    WHERE workspace_id = p_workspace_id;
  END IF;
  
  RETURN v_next_agent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get agent with least load
CREATE OR REPLACE FUNCTION get_least_loaded_agent(
  p_workspace_id UUID
) RETURNS UUID AS $$
DECLARE
  v_agent UUID;
BEGIN
  SELECT ast.user_id INTO v_agent
  FROM agent_status ast
  JOIN workspace_members wm ON wm.user_id = ast.user_id AND wm.workspace_id = ast.workspace_id
  WHERE ast.workspace_id = p_workspace_id
    AND ast.status = 'online'
    AND ast.active_threads_count < ast.max_concurrent_threads
  ORDER BY ast.active_threads_count ASC, ast.last_active_at DESC
  LIMIT 1;
  
  RETURN v_agent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. CAMPAIGN ANALYTICS VIEW
-- ============================================================================

-- Create view for campaign analytics
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT 
  j.id AS job_id,
  j.workspace_id,
  j.name AS campaign_name,
  j.status,
  j.scheduled_at,
  j.started_at,
  j.completed_at,
  j.total_count,
  j.sent_count,
  j.failed_count,
  t.name AS template_name,
  t.language AS template_language,
  CASE 
    WHEN j.total_count > 0 THEN ROUND((j.sent_count::numeric / j.total_count) * 100, 2)
    ELSE 0
  END AS delivery_rate,
  CASE 
    WHEN j.completed_at IS NOT NULL AND j.started_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (j.completed_at - j.started_at))
    ELSE NULL
  END AS duration_seconds,
  j.created_at
FROM wa_send_jobs j
LEFT JOIN wa_templates t ON t.id = j.template_id;

-- ============================================================================
-- DONE
-- ============================================================================
