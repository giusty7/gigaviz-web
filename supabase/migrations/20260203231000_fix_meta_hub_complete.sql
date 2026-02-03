-- ============================================================================
-- Migration: Fix Meta Hub Power-Up Tables & RLS
-- Created: 2026-02-03
-- Purpose: 
--   1. Add missing columns to assignment_rules
--   2. Fix all RLS policies to use SECURITY DEFINER functions
-- ============================================================================

-- ============================================================================
-- 1. CREATE SECURITY DEFINER HELPER FUNCTIONS (if not exist)
-- ============================================================================

-- Function to get workspace IDs for current user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_workspace_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id 
  FROM workspace_members 
  WHERE user_id = auth.uid()
$$;

-- Function to check if current user is member of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = p_workspace_id 
    AND user_id = auth.uid()
  )
$$;

-- Function to check if current user is owner/admin of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = p_workspace_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.get_my_workspace_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID) TO authenticated;

-- ============================================================================
-- 2. ADD MISSING COLUMNS TO assignment_rules
-- ============================================================================

-- Add name column
ALTER TABLE assignment_rules ADD COLUMN IF NOT EXISTS name TEXT;

-- Add agent_ids column (array of user IDs for this rule)
ALTER TABLE assignment_rules ADD COLUMN IF NOT EXISTS agent_ids UUID[] DEFAULT '{}';

-- Add is_active column
ALTER TABLE assignment_rules ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add max_chats_per_agent column
ALTER TABLE assignment_rules ADD COLUMN IF NOT EXISTS max_chats_per_agent INTEGER;

-- Add priority column
ALTER TABLE assignment_rules ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;

-- Add conditions column (JSON for advanced filtering)
ALTER TABLE assignment_rules ADD COLUMN IF NOT EXISTS conditions JSONB;

-- Remove the workspace unique constraint (allow multiple rules per workspace)
ALTER TABLE assignment_rules DROP CONSTRAINT IF EXISTS assignment_rules_workspace_unique;

-- Add index for priority ordering
CREATE INDEX IF NOT EXISTS idx_assignment_rules_priority 
ON assignment_rules (workspace_id, priority DESC, created_at);

-- ============================================================================
-- 3. FIX RLS POLICIES FOR assignment_rules
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS assignment_rules_select ON assignment_rules;
DROP POLICY IF EXISTS assignment_rules_manage ON assignment_rules;
DROP POLICY IF EXISTS assignment_rules_insert ON assignment_rules;
DROP POLICY IF EXISTS assignment_rules_update ON assignment_rules;
DROP POLICY IF EXISTS assignment_rules_delete ON assignment_rules;

-- Create new policies using helper functions
CREATE POLICY assignment_rules_select ON assignment_rules
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY assignment_rules_insert ON assignment_rules
  FOR INSERT WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY assignment_rules_update ON assignment_rules
  FOR UPDATE USING (is_workspace_admin(workspace_id));

CREATE POLICY assignment_rules_delete ON assignment_rules
  FOR DELETE USING (is_workspace_admin(workspace_id));

-- ============================================================================
-- 4. FIX RLS POLICIES FOR auto_reply_rules
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS auto_reply_rules_select ON auto_reply_rules;
DROP POLICY IF EXISTS auto_reply_rules_manage ON auto_reply_rules;
DROP POLICY IF EXISTS auto_reply_rules_insert ON auto_reply_rules;
DROP POLICY IF EXISTS auto_reply_rules_update ON auto_reply_rules;
DROP POLICY IF EXISTS auto_reply_rules_delete ON auto_reply_rules;

-- Create new policies using helper functions
CREATE POLICY auto_reply_rules_select ON auto_reply_rules
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY auto_reply_rules_insert ON auto_reply_rules
  FOR INSERT WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY auto_reply_rules_update ON auto_reply_rules
  FOR UPDATE USING (is_workspace_admin(workspace_id));

CREATE POLICY auto_reply_rules_delete ON auto_reply_rules
  FOR DELETE USING (is_workspace_admin(workspace_id));

-- ============================================================================
-- 5. FIX RLS POLICIES FOR auto_reply_cooldowns
-- ============================================================================

-- Drop old policies  
DROP POLICY IF EXISTS auto_reply_cooldowns_select ON auto_reply_cooldowns;
DROP POLICY IF EXISTS auto_reply_cooldowns_manage ON auto_reply_cooldowns;
DROP POLICY IF EXISTS auto_reply_cooldowns_insert ON auto_reply_cooldowns;
DROP POLICY IF EXISTS auto_reply_cooldowns_update ON auto_reply_cooldowns;
DROP POLICY IF EXISTS auto_reply_cooldowns_delete ON auto_reply_cooldowns;

-- Create new policies
CREATE POLICY auto_reply_cooldowns_select ON auto_reply_cooldowns
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY auto_reply_cooldowns_insert ON auto_reply_cooldowns
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY auto_reply_cooldowns_update ON auto_reply_cooldowns
  FOR UPDATE USING (is_workspace_member(workspace_id));

CREATE POLICY auto_reply_cooldowns_delete ON auto_reply_cooldowns
  FOR DELETE USING (is_workspace_admin(workspace_id));

-- ============================================================================
-- Done!
-- ============================================================================
