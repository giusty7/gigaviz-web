/**
 * Beta Program Management
 * Database schema for managing beta testers and feature flags
 */

-- ========================================
-- 1. beta_programs table
-- ========================================
CREATE TABLE IF NOT EXISTS beta_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_slug text NOT NULL UNIQUE,
  module_name text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('open', 'closed', 'full')) DEFAULT 'open',
  max_participants integer,
  current_participants integer NOT NULL DEFAULT 0,
  requirements text, -- JSON string of requirements
  benefits text, -- JSON string of benefits
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- 2. beta_participants table
-- ========================================
CREATE TABLE IF NOT EXISTS beta_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_slug text NOT NULL,
  program_id uuid REFERENCES beta_programs(id) ON DELETE CASCADE,
  
  -- Application
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'removed')) DEFAULT 'pending',
  application_reason text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  
  -- Approval
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  
  -- Activity
  last_active_at timestamptz,
  feedback_submitted boolean NOT NULL DEFAULT false,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT beta_participants_unique_workspace_module UNIQUE (workspace_id, module_slug)
);

-- ========================================
-- 3. beta_feedback table
-- ========================================
CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES beta_participants(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_slug text NOT NULL,
  
  -- Feedback content
  feedback_type text NOT NULL CHECK (feedback_type IN ('bug', 'feature_request', 'general', 'praise', 'complaint')),
  title text NOT NULL,
  description text NOT NULL,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Status
  status text NOT NULL CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'wont_fix')) DEFAULT 'open',
  resolved_at timestamptz,
  resolution_notes text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- Indexes
-- ========================================
CREATE INDEX IF NOT EXISTS beta_participants_workspace_idx ON beta_participants(workspace_id);
CREATE INDEX IF NOT EXISTS beta_participants_module_status_idx ON beta_participants(module_slug, status);
CREATE INDEX IF NOT EXISTS beta_participants_user_idx ON beta_participants(user_id);
CREATE INDEX IF NOT EXISTS beta_feedback_participant_idx ON beta_feedback(participant_id);
CREATE INDEX IF NOT EXISTS beta_feedback_module_idx ON beta_feedback(module_slug);
CREATE INDEX IF NOT EXISTS beta_feedback_status_idx ON beta_feedback(status);

-- ========================================
-- Row Level Security
-- ========================================
ALTER TABLE beta_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Beta Programs: Public read, admin write
CREATE POLICY "public_read_beta_programs"
ON beta_programs FOR SELECT
TO authenticated
USING (true);

-- Beta Participants: Users can see their own workspace participations
CREATE POLICY "users_read_own_workspace_beta_participants"
ON beta_participants FOR SELECT
TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "users_insert_own_workspace_beta_participants"
ON beta_participants FOR INSERT
TO authenticated
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Beta Feedback: Users can manage their own feedback
CREATE POLICY "users_manage_own_beta_feedback"
ON beta_feedback FOR ALL
TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- ========================================
-- Auto-update triggers
-- ========================================
CREATE OR REPLACE FUNCTION update_beta_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER beta_programs_updated_at_trigger
BEFORE UPDATE ON beta_programs
FOR EACH ROW
EXECUTE FUNCTION update_beta_programs_updated_at();

CREATE OR REPLACE FUNCTION update_beta_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER beta_participants_updated_at_trigger
BEFORE UPDATE ON beta_participants
FOR EACH ROW
EXECUTE FUNCTION update_beta_participants_updated_at();

CREATE OR REPLACE FUNCTION update_beta_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER beta_feedback_updated_at_trigger
BEFORE UPDATE ON beta_feedback
FOR EACH ROW
EXECUTE FUNCTION update_beta_feedback_updated_at();

-- ========================================
-- Seed initial beta programs
-- ========================================
INSERT INTO beta_programs (module_slug, module_name, description, status, requirements, benefits)
VALUES 
  ('studio', 'Gigaviz Studio', 'Creative suite for content generation and workflow automation', 'open', '["Active workspace", "At least 10 WhatsApp messages sent"]', '["Early access to AI-powered content tools", "Direct feedback channel", "Influence product development"]'),
  ('apps', 'Gigaviz Apps', 'Custom app marketplace and integration platform', 'open', '["Team plan or higher", "Technical integration experience"]', '["Build custom integrations", "Access beta API documentation", "Priority support"]'),
  ('marketplace', 'Gigaviz Marketplace', 'Buy and sell digital products and services', 'open', '["Verified workspace", "Payment method on file"]', '["Early seller access", "Reduced commission rates", "Beta marketplace badge"]'),
  ('arena', 'Gigaviz Arena', 'Competitive insights and benchmarking tools', 'closed', '["Team plan", "100+ contacts"]', '["Compare performance metrics", "Industry benchmarks", "Competitive analysis tools"]')
ON CONFLICT (module_slug) DO NOTHING;

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE beta_programs IS 'Beta testing programs for unreleased modules';
COMMENT ON TABLE beta_participants IS 'Workspaces participating in beta programs';
COMMENT ON TABLE beta_feedback IS 'Feedback and bug reports from beta testers';
