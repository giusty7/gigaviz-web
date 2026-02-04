-- =============================================
-- META HUB EXPANSION - Phase 1 & 2
-- Analytics Pipeline + Instagram + Messenger
-- =============================================

-- 1. USAGE EVENTS - Add missing columns if table exists
-- =============================================
DO $$ 
BEGIN
  -- Add platform column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_events' AND column_name = 'platform') THEN
    ALTER TABLE usage_events ADD COLUMN platform TEXT DEFAULT 'whatsapp';
  END IF;
  
  -- Add user_id column if not exists  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_events' AND column_name = 'user_id') THEN
    ALTER TABLE usage_events ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_usage_events_workspace ON usage_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_platform ON usage_events(platform);
CREATE INDEX IF NOT EXISTS idx_usage_events_created ON usage_events(created_at DESC);

-- RLS for usage_events (if not already enabled)
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_events_workspace_policy ON usage_events;
CREATE POLICY usage_events_workspace_policy ON usage_events
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 2. INSTAGRAM THREADS
-- =============================================
CREATE TABLE IF NOT EXISTS instagram_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ig_thread_id TEXT NOT NULL,
  ig_user_id TEXT NOT NULL,
  ig_username TEXT,
  ig_profile_pic TEXT,
  ig_name TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'spam')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, ig_thread_id)
);

CREATE INDEX IF NOT EXISTS idx_instagram_threads_workspace ON instagram_threads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_instagram_threads_status ON instagram_threads(status);
CREATE INDEX IF NOT EXISTS idx_instagram_threads_assigned ON instagram_threads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_instagram_threads_last_message ON instagram_threads(last_message_at DESC);

-- RLS for instagram_threads
ALTER TABLE instagram_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instagram_threads_workspace_policy ON instagram_threads;
CREATE POLICY instagram_threads_workspace_policy ON instagram_threads
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 3. INSTAGRAM MESSAGES
-- =============================================
CREATE TABLE IF NOT EXISTS instagram_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES instagram_threads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ig_message_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'story_reply', 'story_mention'
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  sender_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'delivered', -- 'sent', 'delivered', 'read', 'failed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_messages_thread ON instagram_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_workspace ON instagram_messages(workspace_id);
-- Use created_at instead of timestamp (in case column name differs)
CREATE INDEX IF NOT EXISTS idx_instagram_messages_created ON instagram_messages(created_at DESC);

-- RLS for instagram_messages
ALTER TABLE instagram_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instagram_messages_workspace_policy ON instagram_messages;
CREATE POLICY instagram_messages_workspace_policy ON instagram_messages
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 4. MESSENGER THREADS
-- =============================================
CREATE TABLE IF NOT EXISTS messenger_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  psid TEXT NOT NULL, -- Page-scoped ID
  page_id TEXT NOT NULL,
  user_name TEXT,
  user_profile_pic TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'spam')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, psid, page_id)
);

CREATE INDEX IF NOT EXISTS idx_messenger_threads_workspace ON messenger_threads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messenger_threads_status ON messenger_threads(status);
CREATE INDEX IF NOT EXISTS idx_messenger_threads_assigned ON messenger_threads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_messenger_threads_last_message ON messenger_threads(last_message_at DESC);

-- RLS for messenger_threads
ALTER TABLE messenger_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messenger_threads_workspace_policy ON messenger_threads;
CREATE POLICY messenger_threads_workspace_policy ON messenger_threads
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 5. MESSENGER MESSAGES
-- =============================================
CREATE TABLE IF NOT EXISTS messenger_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES messenger_threads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  fb_message_id TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'audio', 'file', 'template'
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  sender_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'delivered', -- 'sent', 'delivered', 'read', 'failed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messenger_messages_thread ON messenger_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messenger_messages_workspace ON messenger_messages(workspace_id);
-- Use created_at instead of timestamp
CREATE INDEX IF NOT EXISTS idx_messenger_messages_created ON messenger_messages(created_at DESC);

-- RLS for messenger_messages
ALTER TABLE messenger_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messenger_messages_workspace_policy ON messenger_messages;
CREATE POLICY messenger_messages_workspace_policy ON messenger_messages
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 6. META AD CAMPAIGNS
-- =============================================
CREATE TABLE IF NOT EXISTS meta_ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  account_id TEXT,
  objective TEXT,
  status TEXT DEFAULT 'UNKNOWN', -- 'ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'
  daily_budget NUMERIC(12,2),
  lifetime_budget NUMERIC(12,2),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_ad_campaigns_workspace ON meta_ad_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_campaigns_status ON meta_ad_campaigns(status);

-- RLS for meta_ad_campaigns
ALTER TABLE meta_ad_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meta_ad_campaigns_workspace_policy ON meta_ad_campaigns;
CREATE POLICY meta_ad_campaigns_workspace_policy ON meta_ad_campaigns
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 7. META AD INSIGHTS (Daily aggregates)
-- =============================================
CREATE TABLE IF NOT EXISTS meta_ad_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  date_start DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  reach BIGINT DEFAULT 0,
  cpc NUMERIC(10,4),
  cpm NUMERIC(10,4),
  ctr NUMERIC(10,4),
  conversions BIGINT DEFAULT 0,
  cost_per_conversion NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, campaign_id, date_start)
);

CREATE INDEX IF NOT EXISTS idx_meta_ad_insights_workspace ON meta_ad_insights(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_insights_campaign ON meta_ad_insights(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_insights_date ON meta_ad_insights(date_start DESC);

-- RLS for meta_ad_insights
ALTER TABLE meta_ad_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meta_ad_insights_workspace_policy ON meta_ad_insights;
CREATE POLICY meta_ad_insights_workspace_policy ON meta_ad_insights
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 8. INSTAGRAM CONNECTIONS (Link to Page/Business)
-- =============================================
CREATE TABLE IF NOT EXISTS instagram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ig_user_id TEXT NOT NULL,
  ig_username TEXT,
  page_id TEXT, -- Linked Facebook Page
  access_token_encrypted TEXT, -- Encrypted long-lived token
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_webhook_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, ig_user_id)
);

CREATE INDEX IF NOT EXISTS idx_instagram_connections_workspace ON instagram_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_instagram_connections_active ON instagram_connections(is_active);

-- RLS for instagram_connections
ALTER TABLE instagram_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instagram_connections_workspace_policy ON instagram_connections;
CREATE POLICY instagram_connections_workspace_policy ON instagram_connections
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 9. MESSENGER CONNECTIONS (Link to Page)
-- =============================================
CREATE TABLE IF NOT EXISTS messenger_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  page_name TEXT,
  access_token_encrypted TEXT, -- Encrypted page access token
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_webhook_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, page_id)
);

CREATE INDEX IF NOT EXISTS idx_messenger_connections_workspace ON messenger_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messenger_connections_active ON messenger_connections(is_active);

-- RLS for messenger_connections
ALTER TABLE messenger_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messenger_connections_workspace_policy ON messenger_connections;
CREATE POLICY messenger_connections_workspace_policy ON messenger_connections
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 10. AGENT STATUS (Multi-agent collaboration)
-- =============================================
CREATE TABLE IF NOT EXISTS agent_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  current_thread_id UUID, -- Currently viewing/typing in thread
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_status_workspace ON agent_status(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_status_status ON agent_status(status);

-- RLS for agent_status
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_status_workspace_policy ON agent_status;
CREATE POLICY agent_status_workspace_policy ON agent_status
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 11. AUTOMATION SCHEDULED ACTIONS (Time-based triggers)
-- =============================================
CREATE TABLE IF NOT EXISTS automation_scheduled_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rule_id UUID, -- Optional: references automation rule if applicable
  thread_id UUID, -- Can be wa_threads, instagram_threads, or messenger_threads
  thread_type TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'instagram', 'messenger'
  action_type TEXT NOT NULL, -- 'send_message', 'update_status', 'assign_agent', 'add_tag'
  action_payload JSONB NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'failed')),
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_scheduled_workspace ON automation_scheduled_actions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automation_scheduled_status ON automation_scheduled_actions(status);
CREATE INDEX IF NOT EXISTS idx_automation_scheduled_for ON automation_scheduled_actions(scheduled_for) WHERE status = 'pending';

-- RLS for automation_scheduled_actions
ALTER TABLE automation_scheduled_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_scheduled_workspace_policy ON automation_scheduled_actions;
CREATE POLICY automation_scheduled_workspace_policy ON automation_scheduled_actions
FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 12. ANALYTICS MATERIALIZED VIEW (Performance optimization)
-- =============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS meta_hub_daily_stats AS
SELECT 
  workspace_id,
  platform,
  DATE(created_at) as date,
  event_type,
  COUNT(*) as event_count,
  SUM(token_cost) as total_tokens,
  COUNT(DISTINCT user_id) as unique_users
FROM usage_events
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY workspace_id, platform, DATE(created_at), event_type
WITH DATA;

CREATE UNIQUE INDEX idx_meta_hub_daily_stats_unique 
ON meta_hub_daily_stats(workspace_id, platform, date, event_type);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_meta_hub_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY meta_hub_daily_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE usage_events IS 'Tracks all billable/metered events across Meta Hub platforms';
COMMENT ON TABLE instagram_threads IS 'Instagram Direct message conversation threads';
COMMENT ON TABLE messenger_threads IS 'Facebook Messenger conversation threads';
COMMENT ON TABLE meta_ad_campaigns IS 'Synced Meta Ads campaigns for workspace';
COMMENT ON TABLE agent_status IS 'Real-time agent online status for collaboration';
COMMENT ON TABLE automation_scheduled_actions IS 'Delayed/scheduled automation actions queue';
