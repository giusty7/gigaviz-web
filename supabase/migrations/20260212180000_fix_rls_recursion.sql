-- ============================================================================
-- Migration: Fix RLS recursion on ~44 tables
-- Date: 2026-02-12
-- Purpose: Replace raw subqueries on workspace_memberships/workspace_members
--          with SECURITY DEFINER functions to prevent RLS recursion.
--          This enables API routes to use supabaseServer() (RLS-enforced)
--          instead of supabaseAdmin() (bypasses RLS).
--
-- Functions used (already exist from 20260203230000):
--   is_workspace_member(uuid) → boolean  (any role)
--   is_workspace_admin(uuid)  → boolean  (owner/admin only)
--   get_my_workspace_ids()    → setof uuid
-- ============================================================================

-- ============================================================================
-- SECTION 1: WhatsApp tables (7 tables, 10 policies)
-- ============================================================================

-- wa_templates
DROP POLICY IF EXISTS "Users access own workspace templates" ON wa_templates;
CREATE POLICY "Users access own workspace templates" ON wa_templates
  FOR ALL USING (is_workspace_member(workspace_id));

-- wa_template_param_defs
DROP POLICY IF EXISTS "Users access own workspace param defs" ON wa_template_param_defs;
CREATE POLICY "Users access own workspace param defs" ON wa_template_param_defs
  FOR ALL USING (is_workspace_member(workspace_id));

-- wa_contacts (may have 2 policies from different migrations)
DROP POLICY IF EXISTS "Users access own workspace contacts" ON wa_contacts;
DROP POLICY IF EXISTS "wa_contacts_workspace_access" ON wa_contacts;
CREATE POLICY "wa_contacts_workspace_access" ON wa_contacts
  FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- wa_contact_segments
DROP POLICY IF EXISTS "wa_contact_segments_workspace_access" ON wa_contact_segments;
CREATE POLICY "wa_contact_segments_workspace_access" ON wa_contact_segments
  FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- wa_send_jobs
DROP POLICY IF EXISTS "Users access own workspace jobs" ON wa_send_jobs;
CREATE POLICY "Users access own workspace jobs" ON wa_send_jobs
  FOR ALL USING (is_workspace_member(workspace_id));

-- wa_send_job_items
DROP POLICY IF EXISTS "Users access own workspace job items" ON wa_send_job_items;
CREATE POLICY "Users access own workspace job items" ON wa_send_job_items
  FOR ALL USING (is_workspace_member(workspace_id));

-- wa_send_logs
DROP POLICY IF EXISTS "Users access own workspace send logs" ON wa_send_logs;
CREATE POLICY "Users access own workspace send logs" ON wa_send_logs
  FOR ALL USING (is_workspace_member(workspace_id));

-- wa_settings (2 policies: member read + admin write)
DROP POLICY IF EXISTS "wa_settings_select_members" ON wa_settings;
DROP POLICY IF EXISTS "wa_settings_write_admins" ON wa_settings;
CREATE POLICY "wa_settings_select_members" ON wa_settings
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "wa_settings_write_admins" ON wa_settings
  FOR ALL
  USING (is_workspace_admin(workspace_id))
  WITH CHECK (is_workspace_admin(workspace_id));


-- ============================================================================
-- SECTION 2: Billing & Token tables (4 tables, 8 policies)
-- ============================================================================

-- billing_requests
DROP POLICY IF EXISTS "billing_requests_insert_own_workspace" ON billing_requests;
DROP POLICY IF EXISTS "billing_requests_select_own_workspace" ON billing_requests;
CREATE POLICY "billing_requests_insert_own_workspace" ON billing_requests
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id));
CREATE POLICY "billing_requests_select_own_workspace" ON billing_requests
  FOR SELECT USING (user_id = auth.uid() AND is_workspace_member(workspace_id));

-- token_settings
DROP POLICY IF EXISTS "token_settings_select_members" ON token_settings;
DROP POLICY IF EXISTS "token_settings_write_admin" ON token_settings;
CREATE POLICY "token_settings_select_members" ON token_settings
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "token_settings_write_admin" ON token_settings
  FOR ALL
  USING (is_workspace_admin(workspace_id))
  WITH CHECK (is_workspace_admin(workspace_id));

-- token_topup_requests
DROP POLICY IF EXISTS "token_topup_requests_select_members" ON token_topup_requests;
DROP POLICY IF EXISTS "token_topup_requests_insert_members" ON token_topup_requests;
DROP POLICY IF EXISTS "token_topup_requests_update_admin" ON token_topup_requests;
CREATE POLICY "token_topup_requests_select_members" ON token_topup_requests
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "token_topup_requests_insert_members" ON token_topup_requests
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "token_topup_requests_update_admin" ON token_topup_requests
  FOR UPDATE
  USING (is_workspace_admin(workspace_id) OR auth.role() = 'service_role')
  WITH CHECK (is_workspace_admin(workspace_id) OR auth.role() = 'service_role');

-- payment_intents
DROP POLICY IF EXISTS "payment_intents_select_members" ON payment_intents;
CREATE POLICY "payment_intents_select_members" ON payment_intents
  FOR SELECT USING (is_workspace_member(workspace_id) OR auth.role() = 'service_role');


-- ============================================================================
-- SECTION 3: Helper Knowledge & RAG tables (7 tables, 7 policies)
-- ============================================================================

-- helper_knowledge_sources
DROP POLICY IF EXISTS "helper_knowledge_workspace_access" ON helper_knowledge_sources;
CREATE POLICY "helper_knowledge_workspace_access" ON helper_knowledge_sources
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_knowledge_chunks
DROP POLICY IF EXISTS "helper_chunks_workspace_access" ON helper_knowledge_chunks;
CREATE POLICY "helper_chunks_workspace_access" ON helper_knowledge_chunks
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_context_usage
DROP POLICY IF EXISTS "helper_context_workspace_access" ON helper_context_usage;
CREATE POLICY "helper_context_workspace_access" ON helper_context_usage
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_rag_settings
DROP POLICY IF EXISTS "helper_rag_settings_workspace_access" ON helper_rag_settings;
CREATE POLICY "helper_rag_settings_workspace_access" ON helper_rag_settings
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_knowledge_sync_jobs
DROP POLICY IF EXISTS "kb_sync_workspace_access" ON helper_knowledge_sync_jobs;
CREATE POLICY "kb_sync_workspace_access" ON helper_knowledge_sync_jobs
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_function_calls
DROP POLICY IF EXISTS "helper_calls_workspace_access" ON helper_function_calls;
CREATE POLICY "helper_calls_workspace_access" ON helper_function_calls
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_function_permissions
DROP POLICY IF EXISTS "helper_perms_workspace_access" ON helper_function_permissions;
CREATE POLICY "helper_perms_workspace_access" ON helper_function_permissions
  FOR ALL USING (is_workspace_member(workspace_id));


-- ============================================================================
-- SECTION 4: Helper Core tables (16 tables, ~20 policies)
-- ============================================================================

-- helper_call_confirmations
DROP POLICY IF EXISTS "helper_confirmations_workspace_access" ON helper_call_confirmations;
CREATE POLICY "helper_confirmations_workspace_access" ON helper_call_confirmations
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_function_groups
DROP POLICY IF EXISTS "users_access_own_workspace_function_groups" ON helper_function_groups;
CREATE POLICY "users_access_own_workspace_function_groups" ON helper_function_groups
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_attachments
DROP POLICY IF EXISTS "users_access_own_workspace_attachments" ON helper_attachments;
CREATE POLICY "users_access_own_workspace_attachments" ON helper_attachments
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_processing_queue
DROP POLICY IF EXISTS "users_access_own_workspace_processing" ON helper_processing_queue;
CREATE POLICY "users_access_own_workspace_processing" ON helper_processing_queue
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_reasoning_steps
DROP POLICY IF EXISTS "users_access_own_workspace_reasoning" ON helper_reasoning_steps;
CREATE POLICY "users_access_own_workspace_reasoning" ON helper_reasoning_steps
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_message_comments
DROP POLICY IF EXISTS "users_access_own_workspace_comments" ON helper_message_comments;
CREATE POLICY "users_access_own_workspace_comments" ON helper_message_comments
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_templates (2 policies: public visibility + manage)
DROP POLICY IF EXISTS "users_access_workspace_templates" ON helper_templates;
DROP POLICY IF EXISTS "users_manage_own_templates" ON helper_templates;
CREATE POLICY "users_access_workspace_templates" ON helper_templates
  FOR SELECT USING (
    visibility = 'public' OR is_workspace_member(workspace_id)
  );
CREATE POLICY "users_manage_own_templates" ON helper_templates
  FOR ALL USING (
    created_by = auth.uid() OR is_workspace_admin(workspace_id)
  );

-- helper_folders
DROP POLICY IF EXISTS "users_access_workspace_folders" ON helper_folders;
CREATE POLICY "users_access_workspace_folders" ON helper_folders
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_bulk_operations
DROP POLICY IF EXISTS "users_access_own_workspace_bulk_ops" ON helper_bulk_operations;
CREATE POLICY "users_access_own_workspace_bulk_ops" ON helper_bulk_operations
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_conversations (updated sharing policy)
DROP POLICY IF EXISTS "users_access_own_and_shared_conversations" ON helper_conversations;
CREATE POLICY "users_access_own_and_shared_conversations" ON helper_conversations
  FOR SELECT USING (
    is_workspace_member(workspace_id) AND (
      created_by = auth.uid()
      OR visibility IN ('team', 'workspace')
      OR id IN (
        SELECT conversation_id FROM helper_conversation_shares
        WHERE shared_with_user_id = auth.uid()
      )
    )
  );

-- helper_workflows
DROP POLICY IF EXISTS "users_access_workspace_workflows" ON helper_workflows;
CREATE POLICY "users_access_workspace_workflows" ON helper_workflows
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_workflow_runs (drop BOTH conflicting policies, create single clean one)
DROP POLICY IF EXISTS "users_access_workspace_workflow_runs" ON helper_workflow_runs;
DROP POLICY IF EXISTS "workflow_runs_workspace_access" ON helper_workflow_runs;
CREATE POLICY "workflow_runs_workspace_access" ON helper_workflow_runs
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_workflow_schedules
DROP POLICY IF EXISTS "users_access_workspace_schedules" ON helper_workflow_schedules;
CREATE POLICY "users_access_workspace_schedules" ON helper_workflow_schedules
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_workflow_event_triggers
DROP POLICY IF EXISTS "users_access_workspace_event_triggers" ON helper_workflow_event_triggers;
CREATE POLICY "users_access_workspace_event_triggers" ON helper_workflow_event_triggers
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_workflow_webhooks
DROP POLICY IF EXISTS "users_access_workspace_webhooks" ON helper_workflow_webhooks;
CREATE POLICY "users_access_workspace_webhooks" ON helper_workflow_webhooks
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_analytics_events
DROP POLICY IF EXISTS "users_access_workspace_analytics" ON helper_analytics_events;
CREATE POLICY "users_access_workspace_analytics" ON helper_analytics_events
  FOR SELECT USING (is_workspace_member(workspace_id));

-- helper_message_feedback
DROP POLICY IF EXISTS "users_access_workspace_feedback" ON helper_message_feedback;
CREATE POLICY "users_access_workspace_feedback" ON helper_message_feedback
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_cost_tracking (admin-only read)
DROP POLICY IF EXISTS "users_access_workspace_cost_tracking" ON helper_cost_tracking;
CREATE POLICY "users_access_workspace_cost_tracking" ON helper_cost_tracking
  FOR SELECT USING (is_workspace_admin(workspace_id));

-- helper_error_logs (admin-only read)
DROP POLICY IF EXISTS "admins_access_workspace_error_logs" ON helper_error_logs;
CREATE POLICY "admins_access_workspace_error_logs" ON helper_error_logs
  FOR SELECT USING (is_workspace_admin(workspace_id));

-- helper_leads
DROP POLICY IF EXISTS "leads_workspace_access" ON helper_leads;
CREATE POLICY "leads_workspace_access" ON helper_leads
  FOR ALL USING (is_workspace_member(workspace_id));

-- helper_crm_insights
DROP POLICY IF EXISTS "insights_workspace_access" ON helper_crm_insights;
CREATE POLICY "insights_workspace_access" ON helper_crm_insights
  FOR ALL USING (is_workspace_member(workspace_id));


-- ============================================================================
-- SECTION 5: Automation & Usage tables (3 tables, 4 policies)
-- ============================================================================

-- automation_rules
DROP POLICY IF EXISTS "workspace_members_access_automation_rules" ON automation_rules;
CREATE POLICY "workspace_members_access_automation_rules" ON automation_rules
  FOR ALL USING (is_workspace_member(workspace_id));

-- automation_executions
DROP POLICY IF EXISTS "workspace_members_read_automation_executions" ON automation_executions;
DROP POLICY IF EXISTS "workspace_members_insert_automation_executions" ON automation_executions;
CREATE POLICY "workspace_members_read_automation_executions" ON automation_executions
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "workspace_members_insert_automation_executions" ON automation_executions
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

-- usage_events
DROP POLICY IF EXISTS "workspace_members_read_usage_events" ON usage_events;
CREATE POLICY "workspace_members_read_usage_events" ON usage_events
  FOR SELECT USING (is_workspace_member(workspace_id));


-- ============================================================================
-- Done! 44 tables, ~55 policies rewritten to use SECURITY DEFINER functions.
-- This eliminates RLS recursion and allows supabaseServer() (RLS-enforced)
-- to be used in API routes instead of supabaseAdmin().
-- ============================================================================
