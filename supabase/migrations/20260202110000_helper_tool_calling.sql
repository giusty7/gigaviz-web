-- =====================================================
-- HELPER TOOL CALLING & FUNCTION EXECUTION
-- =====================================================
-- Enable Helper to execute actions across Gigaviz products

-- =====================================================
-- 1. FUNCTION REGISTRY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Function identification
  function_name text NOT NULL UNIQUE,
  product_slug text NOT NULL, -- 'meta-hub', 'helper', 'marketplace', 'platform'
  category text NOT NULL, -- 'messaging', 'crm', 'commerce', 'admin'
  
  -- Metadata
  display_name text NOT NULL,
  description text NOT NULL,
  icon text, -- Emoji or icon name
  
  -- Parameters schema (JSON Schema)
  parameters_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_params text[] DEFAULT ARRAY[]::text[],
  
  -- Authorization
  requires_confirmation boolean DEFAULT true,
  required_entitlements text[] DEFAULT ARRAY[]::text[],
  required_roles text[] DEFAULT ARRAY[]::text[],
  
  -- Status
  is_active boolean DEFAULT true,
  is_beta boolean DEFAULT false,
  
  -- Implementation
  handler_type text NOT NULL DEFAULT 'api' CHECK (handler_type IN ('api', 'direct', 'webhook')),
  handler_endpoint text, -- API endpoint to call
  
  -- Usage tracking
  call_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_functions_product ON public.helper_functions(product_slug);
CREATE INDEX IF NOT EXISTS idx_helper_functions_category ON public.helper_functions(category);
CREATE INDEX IF NOT EXISTS idx_helper_functions_active ON public.helper_functions(is_active) WHERE is_active = true;

COMMENT ON TABLE public.helper_functions IS 'Registry of executable functions for Helper AI';
COMMENT ON COLUMN public.helper_functions.parameters_schema IS 'JSON Schema for function parameters';

-- =====================================================
-- 2. FUNCTION CALLS (Execution Log)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_function_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Function info
  function_id uuid NOT NULL REFERENCES public.helper_functions(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  
  -- Context
  conversation_id uuid REFERENCES public.helper_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.helper_messages(id) ON DELETE SET NULL,
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Parameters
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Execution
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting confirmation
    'confirmed',    -- User confirmed
    'executing',    -- In progress
    'completed',    -- Success
    'failed',       -- Error
    'cancelled',    -- User cancelled
    'timeout'       -- Execution timeout
  )),
  
  -- Result
  result jsonb,
  error_message text,
  
  -- Timing
  confirmed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_calls_workspace ON public.helper_function_calls(workspace_id);
CREATE INDEX IF NOT EXISTS idx_helper_calls_function ON public.helper_function_calls(function_id);
CREATE INDEX IF NOT EXISTS idx_helper_calls_conversation ON public.helper_function_calls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_helper_calls_status ON public.helper_function_calls(status);
CREATE INDEX IF NOT EXISTS idx_helper_calls_created ON public.helper_function_calls(workspace_id, created_at DESC);

COMMENT ON TABLE public.helper_function_calls IS 'Execution log of Helper function calls';

-- =====================================================
-- 3. FUNCTION PERMISSIONS (Per-workspace overrides)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_function_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  function_id uuid NOT NULL REFERENCES public.helper_functions(id) ON DELETE CASCADE,
  
  -- Override settings
  is_enabled boolean DEFAULT true,
  requires_confirmation boolean, -- NULL = use function default
  allowed_for_roles text[] DEFAULT ARRAY['owner', 'admin', 'member']::text[],
  
  -- Rate limiting
  max_calls_per_hour integer,
  max_calls_per_day integer,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id, function_id)
);

CREATE INDEX IF NOT EXISTS idx_helper_perms_workspace ON public.helper_function_permissions(workspace_id);

COMMENT ON TABLE public.helper_function_permissions IS 'Per-workspace function permission overrides';

-- =====================================================
-- 4. FUNCTION CALL CONFIRMATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_call_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.helper_function_calls(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Confirmation request
  requested_at timestamptz NOT NULL DEFAULT now(),
  requested_from uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Response
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  responded_at timestamptz,
  responded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timeout
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_confirmations_call ON public.helper_call_confirmations(call_id);
CREATE INDEX IF NOT EXISTS idx_helper_confirmations_status ON public.helper_call_confirmations(status);

COMMENT ON TABLE public.helper_call_confirmations IS 'User confirmations for function calls';

-- =====================================================
-- 5. SEED FUNCTIONS (Meta Hub Actions)
-- =====================================================

INSERT INTO public.helper_functions (
  function_name,
  product_slug,
  category,
  display_name,
  description,
  icon,
  parameters_schema,
  required_params,
  requires_confirmation,
  handler_type,
  handler_endpoint,
  is_active
) VALUES
-- WhatsApp Actions
(
  'send_whatsapp_message',
  'meta-hub',
  'messaging',
  'Send WhatsApp Message',
  'Send a WhatsApp message to a contact',
  '💬',
  '{"type":"object","properties":{"phoneNumber":{"type":"string","description":"Contact phone number with country code"},"message":{"type":"string","description":"Message text to send"}}}'::jsonb,
  ARRAY['phoneNumber', 'message'],
  true,
  'api',
  '/api/meta/whatsapp/send-text',
  true
),
(
  'send_whatsapp_template',
  'meta-hub',
  'messaging',
  'Send WhatsApp Template',
  'Send a pre-approved WhatsApp template message',
  '📋',
  '{"type":"object","properties":{"phoneNumber":{"type":"string"},"templateName":{"type":"string"},"parameters":{"type":"object"}}}'::jsonb,
  ARRAY['phoneNumber', 'templateName'],
  true,
  'api',
  '/api/meta/whatsapp/reply-template',
  true
),

-- Contact Management
(
  'create_contact',
  'meta-hub',
  'crm',
  'Create Contact',
  'Create a new contact in CRM',
  '👤',
  '{"type":"object","properties":{"phoneNumber":{"type":"string"},"name":{"type":"string"},"email":{"type":"string"},"tags":{"type":"array","items":{"type":"string"}}}}'::jsonb,
  ARRAY['phoneNumber'],
  false,
  'api',
  '/api/meta/whatsapp/contacts',
  true
),
(
  'update_contact',
  'meta-hub',
  'crm',
  'Update Contact',
  'Update contact information',
  '✏️',
  '{"type":"object","properties":{"contactId":{"type":"string"},"name":{"type":"string"},"email":{"type":"string"},"tags":{"type":"array"}}}'::jsonb,
  ARRAY['contactId'],
  false,
  'api',
  '/api/meta/whatsapp/contacts',
  true
),
(
  'tag_contact',
  'meta-hub',
  'crm',
  'Tag Contact',
  'Add or remove tags from contact',
  '🏷️',
  '{"type":"object","properties":{"contactId":{"type":"string"},"addTags":{"type":"array"},"removeTags":{"type":"array"}}}'::jsonb,
  ARRAY['contactId'],
  false,
  'api',
  '/api/meta/whatsapp/contacts',
  true
),

-- Conversation Management
(
  'tag_conversation',
  'meta-hub',
  'messaging',
  'Tag Conversation',
  'Add tags to WhatsApp conversation',
  '🏷️',
  '{"type":"object","properties":{"threadId":{"type":"string"},"tags":{"type":"array","items":{"type":"string"}}}}'::jsonb,
  ARRAY['threadId', 'tags'],
  false,
  'api',
  '/api/meta/whatsapp/thread/tags',
  true
),
(
  'close_conversation',
  'meta-hub',
  'messaging',
  'Close Conversation',
  'Mark conversation as closed',
  '✅',
  '{"type":"object","properties":{"threadId":{"type":"string"}}}'::jsonb,
  ARRAY['threadId'],
  false,
  'api',
  '/api/meta/whatsapp/thread/update',
  true
),
(
  'assign_conversation',
  'meta-hub',
  'messaging',
  'Assign Conversation',
  'Assign conversation to team member',
  '👥',
  '{"type":"object","properties":{"threadId":{"type":"string"},"assignToUserId":{"type":"string"}}}'::jsonb,
  ARRAY['threadId', 'assignToUserId'],
  false,
  'api',
  '/api/meta/whatsapp/thread/update',
  true
),

-- Analytics & Search
(
  'search_contacts',
  'meta-hub',
  'crm',
  'Search Contacts',
  'Search contacts by name, phone, or tags',
  '🔍',
  '{"type":"object","properties":{"query":{"type":"string"},"tags":{"type":"array"},"limit":{"type":"number"}}}'::jsonb,
  ARRAY['query'],
  false,
  'api',
  '/api/meta/whatsapp/contacts',
  true
),
(
  'get_conversation_history',
  'meta-hub',
  'messaging',
  'Get Conversation History',
  'Retrieve message history for a contact',
  '📜',
  '{"type":"object","properties":{"phoneNumber":{"type":"string"},"limit":{"type":"number"}}}'::jsonb,
  ARRAY['phoneNumber'],
  false,
  'api',
  '/api/meta/whatsapp/threads',
  true
),

-- Helper-specific
(
  'create_note',
  'helper',
  'productivity',
  'Create Note',
  'Create a note in Helper conversation',
  '📝',
  '{"type":"object","properties":{"title":{"type":"string"},"content":{"type":"string"},"tags":{"type":"array"}}}'::jsonb,
  ARRAY['content'],
  false,
  'direct',
  NULL,
  true
),
(
  'search_knowledge',
  'helper',
  'search',
  'Search Knowledge Base',
  'Search workspace knowledge base',
  '🔎',
  '{"type":"object","properties":{"query":{"type":"string"},"maxResults":{"type":"number"}}}'::jsonb,
  ARRAY['query'],
  false,
  'direct',
  NULL,
  true
)
on conflict (function_name) do nothing;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- Function Calls
ALTER TABLE public.helper_function_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "helper_calls_workspace_access" ON public.helper_function_calls;
DROP POLICY IF EXISTS helper_calls_workspace_access ON public.helper_function_calls;
CREATE POLICY "helper_calls_workspace_access"
  ON public.helper_function_calls
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- Function Permissions
ALTER TABLE public.helper_function_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "helper_perms_workspace_access" ON public.helper_function_permissions;
DROP POLICY IF EXISTS helper_perms_workspace_access ON public.helper_function_permissions;
CREATE POLICY "helper_perms_workspace_access"
  ON public.helper_function_permissions
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- Call Confirmations
ALTER TABLE public.helper_call_confirmations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "helper_confirmations_workspace_access" ON public.helper_call_confirmations;
DROP POLICY IF EXISTS helper_confirmations_workspace_access ON public.helper_call_confirmations;
CREATE POLICY "helper_confirmations_workspace_access"
  ON public.helper_call_confirmations
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Get available functions for workspace
CREATE OR REPLACE FUNCTION get_available_functions(p_workspace_id uuid, p_user_role text DEFAULT 'member')
RETURNS TABLE (
  function_name text,
  display_name text,
  description text,
  parameters_schema jsonb,
  requires_confirmation boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.function_name,
    f.display_name,
    f.description,
    f.parameters_schema,
    COALESCE(p.requires_confirmation, f.requires_confirmation) AS requires_confirmation
  FROM helper_functions f
  LEFT JOIN helper_function_permissions p ON p.function_id = f.id AND p.workspace_id = p_workspace_id
  WHERE 
    f.is_active = true
    AND (p.is_enabled IS NULL OR p.is_enabled = true)
    AND (p.allowed_for_roles IS NULL OR p_user_role = ANY(p.allowed_for_roles))
  ORDER BY f.category, f.display_name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_available_functions IS 'Get functions available for workspace and user role';

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Update function call counts
CREATE OR REPLACE FUNCTION update_function_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE helper_functions
    SET 
      call_count = call_count + 1,
      success_count = success_count + 1
    WHERE id = NEW.function_id;
  ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    UPDATE helper_functions
    SET 
      call_count = call_count + 1,
      error_count = error_count + 1
    WHERE id = NEW.function_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS helper_calls_update_stats ON public.helper_function_calls;
CREATE TRIGGER helper_calls_update_stats
  AFTER UPDATE ON public.helper_function_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_function_stats();

COMMENT ON SCHEMA public IS 'Gigaviz Helper with Tool Calling capabilities';
