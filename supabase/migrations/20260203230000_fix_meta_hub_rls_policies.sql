-- ============================================================================
-- Migration: Fix Meta Hub RLS Policies
-- Created: 2026-02-03
-- Purpose: Fix infinite recursion in RLS policies by using SECURITY DEFINER functions
-- ============================================================================

-- ============================================================================
-- 1. CREATE SECURITY DEFINER HELPER FUNCTIONS
-- These functions bypass RLS when checking membership, preventing recursion
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

-- ============================================================================
-- 2. DROP OLD POLICIES (inbox_quick_replies)
-- ============================================================================

DROP POLICY IF EXISTS inbox_quick_replies_select ON inbox_quick_replies;
DROP POLICY IF EXISTS inbox_quick_replies_insert ON inbox_quick_replies;
DROP POLICY IF EXISTS inbox_quick_replies_update ON inbox_quick_replies;
DROP POLICY IF EXISTS inbox_quick_replies_delete ON inbox_quick_replies;

-- ============================================================================
-- 3. CREATE NEW POLICIES FOR inbox_quick_replies (using helper functions)
-- ============================================================================

-- Select: All workspace members can view
CREATE POLICY inbox_quick_replies_select ON inbox_quick_replies
  FOR SELECT USING (
    is_workspace_member(workspace_id)
  );

-- Insert: All workspace members can create
CREATE POLICY inbox_quick_replies_insert ON inbox_quick_replies
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id)
  );

-- Update: All workspace members can update
CREATE POLICY inbox_quick_replies_update ON inbox_quick_replies
  FOR UPDATE USING (
    is_workspace_member(workspace_id)
  );

-- Delete: Only owner/admin can delete
CREATE POLICY inbox_quick_replies_delete ON inbox_quick_replies
  FOR DELETE USING (
    is_workspace_admin(workspace_id)
  );

-- ============================================================================
-- 4. DROP OLD POLICIES (agent_status)
-- ============================================================================

DROP POLICY IF EXISTS agent_status_select ON agent_status;
DROP POLICY IF EXISTS agent_status_upsert ON agent_status;

-- ============================================================================
-- 5. CREATE NEW POLICIES FOR agent_status (using helper functions)
-- ============================================================================

-- Select: All workspace members can view team status
CREATE POLICY agent_status_select ON agent_status
  FOR SELECT USING (
    is_workspace_member(workspace_id)
  );

-- Insert: Members can set their own status
CREATE POLICY agent_status_insert ON agent_status
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id)
    AND user_id = auth.uid()
  );

-- Update: Members can update their own status
CREATE POLICY agent_status_update ON agent_status
  FOR UPDATE USING (
    is_workspace_member(workspace_id)
    AND user_id = auth.uid()
  );

-- Delete: Members can delete their own status, admins can delete any
CREATE POLICY agent_status_delete ON agent_status
  FOR DELETE USING (
    is_workspace_member(workspace_id)
    AND (user_id = auth.uid() OR is_workspace_admin(workspace_id))
  );

-- ============================================================================
-- 6. DROP OLD POLICIES (assignment_rules)
-- ============================================================================

DROP POLICY IF EXISTS assignment_rules_select ON assignment_rules;
DROP POLICY IF EXISTS assignment_rules_modify ON assignment_rules;

-- ============================================================================
-- 7. CREATE NEW POLICIES FOR assignment_rules (using helper functions)
-- ============================================================================

-- Select: All workspace members can view
CREATE POLICY assignment_rules_select ON assignment_rules
  FOR SELECT USING (
    is_workspace_member(workspace_id)
  );

-- Insert: Only owner/admin can create
CREATE POLICY assignment_rules_insert ON assignment_rules
  FOR INSERT WITH CHECK (
    is_workspace_admin(workspace_id)
  );

-- Update: Only owner/admin can update
CREATE POLICY assignment_rules_update ON assignment_rules
  FOR UPDATE USING (
    is_workspace_admin(workspace_id)
  );

-- Delete: Only owner/admin can delete
CREATE POLICY assignment_rules_delete ON assignment_rules
  FOR DELETE USING (
    is_workspace_admin(workspace_id)
  );

-- ============================================================================
-- 8. DROP OLD POLICIES (auto_reply_rules)
-- ============================================================================

DROP POLICY IF EXISTS auto_reply_rules_select ON auto_reply_rules;
DROP POLICY IF EXISTS auto_reply_rules_modify ON auto_reply_rules;

-- ============================================================================
-- 9. CREATE NEW POLICIES FOR auto_reply_rules (using helper functions)
-- ============================================================================

-- Select: All workspace members can view
CREATE POLICY auto_reply_rules_select ON auto_reply_rules
  FOR SELECT USING (
    is_workspace_member(workspace_id)
  );

-- Insert: Only owner/admin can create
CREATE POLICY auto_reply_rules_insert ON auto_reply_rules
  FOR INSERT WITH CHECK (
    is_workspace_admin(workspace_id)
  );

-- Update: Only owner/admin can update
CREATE POLICY auto_reply_rules_update ON auto_reply_rules
  FOR UPDATE USING (
    is_workspace_admin(workspace_id)
  );

-- Delete: Only owner/admin can delete
CREATE POLICY auto_reply_rules_delete ON auto_reply_rules
  FOR DELETE USING (
    is_workspace_admin(workspace_id)
  );

-- ============================================================================
-- 10. DROP OLD POLICIES (auto_reply_cooldowns)
-- ============================================================================

DROP POLICY IF EXISTS auto_reply_cooldowns_select ON auto_reply_cooldowns;
DROP POLICY IF EXISTS auto_reply_cooldowns_modify ON auto_reply_cooldowns;

-- ============================================================================
-- 11. CREATE NEW POLICIES FOR auto_reply_cooldowns (using helper functions)
-- ============================================================================

-- Select: All workspace members can view
CREATE POLICY auto_reply_cooldowns_select ON auto_reply_cooldowns
  FOR SELECT USING (
    is_workspace_member(workspace_id)
  );

-- All operations: System manages cooldowns, members can view
CREATE POLICY auto_reply_cooldowns_insert ON auto_reply_cooldowns
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id)
  );

CREATE POLICY auto_reply_cooldowns_update ON auto_reply_cooldowns
  FOR UPDATE USING (
    is_workspace_member(workspace_id)
  );

CREATE POLICY auto_reply_cooldowns_delete ON auto_reply_cooldowns
  FOR DELETE USING (
    is_workspace_admin(workspace_id)
  );

-- ============================================================================
-- 12. GRANT EXECUTE ON HELPER FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_my_workspace_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID) TO authenticated;

-- ============================================================================
-- Done! RLS policies now use SECURITY DEFINER functions to avoid recursion
-- ============================================================================
