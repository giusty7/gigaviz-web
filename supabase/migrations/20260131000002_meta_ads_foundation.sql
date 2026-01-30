-- Meta Ads Tables
-- Migration: meta_ads_foundation.sql
-- Description: Foundation tables for Meta Advertising integration

-- Ad Accounts table
CREATE TABLE IF NOT EXISTS public.meta_ad_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ad_account_id TEXT NOT NULL, -- Meta's Ad Account ID
  account_name TEXT,
  account_status TEXT, -- ACTIVE, DISABLED, UNSETTLED
  currency TEXT,
  timezone_name TEXT,
  access_token TEXT, -- Encrypted token
  token_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, ad_account_id)
);

-- Ad Campaigns table
CREATE TABLE IF NOT EXISTS public.meta_ad_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ad_account_id UUID NOT NULL REFERENCES public.meta_ad_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL, -- Meta's Campaign ID
  campaign_name TEXT NOT NULL,
  objective TEXT, -- OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, etc.
  status TEXT, -- ACTIVE, PAUSED, DELETED, ARCHIVED
  daily_budget BIGINT, -- In cents
  lifetime_budget BIGINT, -- In cents
  start_time TIMESTAMPTZ,
  stop_time TIMESTAMPTZ,
  created_time TIMESTAMPTZ,
  updated_time TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, campaign_id)
);

-- Ad Sets table
CREATE TABLE IF NOT EXISTS public.meta_ad_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.meta_ad_campaigns(id) ON DELETE CASCADE,
  ad_set_id TEXT NOT NULL, -- Meta's Ad Set ID
  ad_set_name TEXT NOT NULL,
  status TEXT, -- ACTIVE, PAUSED, DELETED, ARCHIVED
  billing_event TEXT, -- IMPRESSIONS, LINK_CLICKS, etc.
  optimization_goal TEXT, -- REACH, IMPRESSIONS, LINK_CLICKS, etc.
  bid_amount BIGINT, -- In cents
  daily_budget BIGINT,
  lifetime_budget BIGINT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  targeting JSONB, -- Targeting spec
  created_time TIMESTAMPTZ,
  updated_time TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, ad_set_id)
);

-- Ads table
CREATE TABLE IF NOT EXISTS public.meta_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ad_set_id UUID NOT NULL REFERENCES public.meta_ad_sets(id) ON DELETE CASCADE,
  ad_id TEXT NOT NULL, -- Meta's Ad ID
  ad_name TEXT NOT NULL,
  status TEXT, -- ACTIVE, PAUSED, DELETED, ARCHIVED
  creative_id TEXT, -- Meta's Creative ID
  creative_json JSONB, -- Creative details
  tracking_specs JSONB, -- Tracking pixels/events
  created_time TIMESTAMPTZ,
  updated_time TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, ad_id)
);

-- Ad Insights/Performance table (time-series data)
CREATE TABLE IF NOT EXISTS public.meta_ad_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES public.meta_ad_accounts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.meta_ad_campaigns(id) ON DELETE CASCADE,
  ad_set_id UUID REFERENCES public.meta_ad_sets(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES public.meta_ads(id) ON DELETE CASCADE,
  date_start DATE NOT NULL,
  date_stop DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend BIGINT DEFAULT 0, -- In cents
  reach BIGINT DEFAULT 0,
  frequency NUMERIC(10,2) DEFAULT 0,
  ctr NUMERIC(10,4) DEFAULT 0, -- Click-through rate
  cpc NUMERIC(10,2) DEFAULT 0, -- Cost per click (cents)
  cpm NUMERIC(10,2) DEFAULT 0, -- Cost per mille (cents)
  conversions BIGINT DEFAULT 0,
  conversion_values BIGINT DEFAULT 0, -- In cents
  actions JSONB DEFAULT '[]'::jsonb, -- Array of action types
  insights_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, ad_account_id, campaign_id, ad_set_id, ad_id, date_start, date_stop)
);

-- Indexes
CREATE INDEX IF NOT EXISTS meta_ad_campaigns_account_idx ON public.meta_ad_campaigns(ad_account_id);
CREATE INDEX IF NOT EXISTS meta_ad_campaigns_status_idx ON public.meta_ad_campaigns(workspace_id, status);
CREATE INDEX IF NOT EXISTS meta_ad_sets_campaign_idx ON public.meta_ad_sets(campaign_id);
CREATE INDEX IF NOT EXISTS meta_ad_sets_status_idx ON public.meta_ad_sets(workspace_id, status);
CREATE INDEX IF NOT EXISTS meta_ads_ad_set_idx ON public.meta_ads(ad_set_id);
CREATE INDEX IF NOT EXISTS meta_ads_status_idx ON public.meta_ads(workspace_id, status);
CREATE INDEX IF NOT EXISTS meta_ad_insights_workspace_date_idx ON public.meta_ad_insights(workspace_id, date_start DESC);
CREATE INDEX IF NOT EXISTS meta_ad_insights_campaign_idx ON public.meta_ad_insights(campaign_id, date_start DESC);
CREATE INDEX IF NOT EXISTS meta_ad_insights_ad_set_idx ON public.meta_ad_insights(ad_set_id, date_start DESC);

-- RLS Policies
ALTER TABLE public.meta_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ad_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Users access own workspace data
CREATE POLICY meta_ad_accounts_workspace_policy ON public.meta_ad_accounts
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY meta_ad_campaigns_workspace_policy ON public.meta_ad_campaigns
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY meta_ad_sets_workspace_policy ON public.meta_ad_sets
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY meta_ads_workspace_policy ON public.meta_ads
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY meta_ad_insights_workspace_policy ON public.meta_ad_insights
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_meta_ad_accounts_updated_at
  BEFORE UPDATE ON public.meta_ad_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_meta_ad_campaigns_updated_at
  BEFORE UPDATE ON public.meta_ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_meta_ad_sets_updated_at
  BEFORE UPDATE ON public.meta_ad_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_meta_ads_updated_at
  BEFORE UPDATE ON public.meta_ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_meta_ad_insights_updated_at
  BEFORE UPDATE ON public.meta_ad_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.meta_ad_accounts IS 'Meta Ad Accounts connected to workspace';
COMMENT ON TABLE public.meta_ad_campaigns IS 'Meta Ad Campaigns';
COMMENT ON TABLE public.meta_ad_sets IS 'Meta Ad Sets';
COMMENT ON TABLE public.meta_ads IS 'Meta Ads';
COMMENT ON TABLE public.meta_ad_insights IS 'Meta Ad performance insights (time-series)';
