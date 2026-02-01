-- Canned responses for support tickets
-- Migration: 20260201231000_ops_canned_responses.sql

CREATE TABLE IF NOT EXISTS ops_canned_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  shortcut text, -- Optional keyboard shortcut like "/welcome"
  category text DEFAULT 'general', -- general, billing, technical, etc
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT ops_canned_responses_workspace_shortcut_unique 
    UNIQUE (workspace_id, shortcut)
);

-- Global platform-wide responses (workspace_id = NULL)
CREATE INDEX IF NOT EXISTS ops_canned_responses_workspace_idx 
  ON ops_canned_responses(workspace_id) 
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ops_canned_responses_global_idx 
  ON ops_canned_responses(workspace_id) 
  WHERE workspace_id IS NULL;

-- RLS: Workspace members can read workspace + global responses
ALTER TABLE ops_canned_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ops_canned_responses_read_policy" ON ops_canned_responses;
DROP POLICY IF EXISTS ops_canned_responses_read_policy ON ops_canned_responses;
CREATE POLICY ops_canned_responses_read_policy ON ops_canned_responses
  FOR SELECT USING (
    workspace_id IS NULL -- Global responses
    OR workspace_id IN (
      SELECT workspace_id 
      FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Platform admins can manage all responses
DROP POLICY IF EXISTS "ops_canned_responses_admin_policy" ON ops_canned_responses;
DROP POLICY IF EXISTS ops_canned_responses_admin_policy ON ops_canned_responses;
CREATE POLICY ops_canned_responses_admin_policy ON ops_canned_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data->>'role' = 'platform_admin'
    )
  );

-- Workspace members can manage workspace-specific responses
DROP POLICY IF EXISTS "ops_canned_responses_workspace_policy" ON ops_canned_responses;
DROP POLICY IF EXISTS ops_canned_responses_workspace_policy ON ops_canned_responses;
CREATE POLICY ops_canned_responses_workspace_policy ON ops_canned_responses
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
DROP TRIGGER IF EXISTS ops_canned_responses_updated_at ON ops_canned_responses;
CREATE TRIGGER ops_canned_responses_updated_at
  BEFORE UPDATE ON ops_canned_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ops_canned_responses IS 'Pre-written response templates for support tickets';
COMMENT ON COLUMN ops_canned_responses.workspace_id IS 'NULL for global platform responses, workspace-specific otherwise';
COMMENT ON COLUMN ops_canned_responses.shortcut IS 'Quick insert shortcut like /welcome, /refund';

-- Insert some default global responses for platform admins
INSERT INTO ops_canned_responses (workspace_id, title, content, shortcut, category, created_by)
VALUES
  (NULL, 'Welcome Message', 'Thank you for contacting support. We''ve received your ticket and will respond shortly.', '/welcome', 'general', '00000000-0000-0000-0000-000000000000'),
  (NULL, 'Under Investigation', 'We''re currently investigating this issue and will update you as soon as we have more information.', '/investigating', 'technical', '00000000-0000-0000-0000-000000000000'),
  (NULL, 'Resolved - Closing', 'This issue has been resolved. I''m marking this ticket as closed. Please reopen if you need further assistance.', '/resolved', 'general', '00000000-0000-0000-0000-000000000000'),
  (NULL, 'Request More Info', 'To help us investigate further, could you please provide: [details needed]? Thank you!', '/moreinfo', 'general', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;
