-- =====================================================
-- PHASE 4: TEAM COLLABORATION
-- =====================================================
-- Enable shared AI workspace for teams

-- =====================================================
-- 1. CONVERSATION SHARING
-- =====================================================

-- Add visibility to conversations
ALTER TABLE public.helper_conversations
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private' CHECK (visibility IN (
  'private',   -- Only creator can see
  'team',      -- All team members can see
  'workspace'  -- All workspace members can see
));

CREATE INDEX idx_helper_conversations_visibility ON public.helper_conversations(visibility);

-- Shared conversations
CREATE TABLE IF NOT EXISTS public.helper_conversation_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Conversation
  conversation_id uuid NOT NULL REFERENCES public.helper_conversations(id) ON DELETE CASCADE,
  
  -- Shared with
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Permission level
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN (
    'view',    -- Can only read
    'comment', -- Can add comments
    'edit'     -- Can modify conversation
  )),
  
  -- Share link
  share_token text UNIQUE, -- For public sharing via link
  share_link_expires_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(conversation_id, shared_with_user_id)
);

CREATE INDEX idx_helper_conversation_shares_conversation ON public.helper_conversation_shares(conversation_id);
CREATE INDEX idx_helper_conversation_shares_user ON public.helper_conversation_shares(shared_with_user_id);
CREATE INDEX idx_helper_conversation_shares_token ON public.helper_conversation_shares(share_token) WHERE share_token IS NOT NULL;

COMMENT ON TABLE public.helper_conversation_shares IS 'Share conversations with team members';

-- Enable RLS
ALTER TABLE public.helper_conversation_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_shares_they_have_access_to"
ON public.helper_conversation_shares
FOR SELECT
USING (
  shared_with_user_id = auth.uid()
  OR shared_by_user_id = auth.uid()
  OR conversation_id IN (
    SELECT id FROM helper_conversations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "users_can_share_their_conversations"
ON public.helper_conversation_shares
FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM helper_conversations WHERE created_by = auth.uid()
  )
);

-- =====================================================
-- 2. COMMENTS & ANNOTATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_message_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Context
  message_id uuid NOT NULL REFERENCES public.helper_messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.helper_conversations(id) ON DELETE CASCADE,
  
  -- Comment
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  
  -- Threading
  parent_comment_id uuid REFERENCES public.helper_message_comments(id) ON DELETE CASCADE,
  
  -- Reactions
  reactions jsonb DEFAULT '{}'::jsonb, -- {"👍": ["user1", "user2"], "❤️": ["user3"]}
  
  -- Status
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_helper_message_comments_message ON public.helper_message_comments(message_id);
CREATE INDEX idx_helper_message_comments_conversation ON public.helper_message_comments(conversation_id);
CREATE INDEX idx_helper_message_comments_user ON public.helper_message_comments(user_id);
CREATE INDEX idx_helper_message_comments_parent ON public.helper_message_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

COMMENT ON TABLE public.helper_message_comments IS 'Team comments on AI responses';

-- Enable RLS
ALTER TABLE public.helper_message_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_own_workspace_comments"
ON public.helper_message_comments
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 3. CONVERSATION TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Template info
  name text NOT NULL,
  description text,
  icon text,
  category text, -- 'sales', 'support', 'research', etc.
  
  -- Content
  initial_messages jsonb NOT NULL, -- Array of {role, content} messages
  suggested_mode text REFERENCES public.helper_modes(mode_slug),
  
  -- Configuration
  settings jsonb DEFAULT '{}'::jsonb,
  
  -- Access
  visibility text DEFAULT 'workspace' CHECK (visibility IN ('private', 'workspace', 'public')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Usage tracking
  use_count integer DEFAULT 0,
  
  -- Status
  is_active boolean DEFAULT true,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_helper_templates_workspace ON public.helper_templates(workspace_id);
CREATE INDEX idx_helper_templates_category ON public.helper_templates(category);
CREATE INDEX idx_helper_templates_active ON public.helper_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE public.helper_templates IS 'Reusable conversation templates for teams';

-- Enable RLS
ALTER TABLE public.helper_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_templates"
ON public.helper_templates
FOR SELECT
USING (
  visibility = 'public'
  OR (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "users_manage_own_templates"
ON public.helper_templates
FOR ALL
USING (
  created_by = auth.uid()
  OR workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Insert default templates
INSERT INTO public.helper_templates (
  name,
  description,
  icon,
  category,
  initial_messages,
  suggested_mode,
  visibility
) VALUES
(
  'Sales Outreach',
  'Generate personalized sales messages',
  '💼',
  'sales',
  '[{"role": "user", "content": "Help me create a personalized outreach message for a potential client in the {industry} industry. Their pain points are: {pain_points}"}]'::jsonb,
  'copy',
  'public'
),
(
  'Customer Support',
  'Draft helpful support responses',
  '🎧',
  'support',
  '[{"role": "user", "content": "A customer is asking about: {issue}. Help me draft a helpful and empathetic response."}]'::jsonb,
  'chat',
  'public'
),
(
  'Content Research',
  'Research topics and generate insights',
  '🔍',
  'research',
  '[{"role": "user", "content": "I need to research {topic}. Please provide key insights, statistics, and actionable information."}]'::jsonb,
  'research',
  'public'
),
(
  'Data Analysis',
  'Analyze data and generate reports',
  '📊',
  'analytics',
  '[{"role": "user", "content": "Analyze this data and provide insights: {data_description}"}]'::jsonb,
  'analyst',
  'public'
),
(
  'Meeting Summary',
  'Summarize meeting notes',
  '📝',
  'productivity',
  '[{"role": "user", "content": "Summarize these meeting notes into key points, action items, and decisions: {notes}"}]'::jsonb,
  'summary',
  'public'
);

-- =====================================================
-- 4. CONVERSATION FOLDERS & ORGANIZATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Folder info
  name text NOT NULL,
  description text,
  icon text,
  color text, -- Hex color code
  
  -- Hierarchy
  parent_folder_id uuid REFERENCES public.helper_folders(id) ON DELETE CASCADE,
  
  -- Owner
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Sharing
  is_shared boolean DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id, name, parent_folder_id)
);

CREATE INDEX idx_helper_folders_workspace ON public.helper_folders(workspace_id);
CREATE INDEX idx_helper_folders_parent ON public.helper_folders(parent_folder_id) WHERE parent_folder_id IS NOT NULL;

COMMENT ON TABLE public.helper_folders IS 'Organize conversations into folders';

-- Enable RLS
ALTER TABLE public.helper_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_workspace_folders"
ON public.helper_folders
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- Add folder to conversations
ALTER TABLE public.helper_conversations
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.helper_folders(id) ON DELETE SET NULL;

CREATE INDEX idx_helper_conversations_folder ON public.helper_conversations(folder_id);

-- =====================================================
-- 5. MENTIONS & NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Context
  message_id uuid REFERENCES public.helper_messages(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.helper_message_comments(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.helper_conversations(id) ON DELETE CASCADE,
  
  -- Users
  mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content preview
  content_preview text,
  
  -- Status
  is_read boolean DEFAULT false,
  read_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT mention_has_context CHECK (
    message_id IS NOT NULL OR comment_id IS NOT NULL
  )
);

CREATE INDEX idx_helper_mentions_user ON public.helper_mentions(mentioned_user_id, is_read);
CREATE INDEX idx_helper_mentions_conversation ON public.helper_mentions(conversation_id);

COMMENT ON TABLE public.helper_mentions IS 'Track @mentions in conversations';

-- Enable RLS
ALTER TABLE public.helper_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_own_mentions"
ON public.helper_mentions
FOR ALL
USING (
  mentioned_user_id = auth.uid()
  OR mentioned_by_user_id = auth.uid()
);

-- =====================================================
-- 6. BULK OPERATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.helper_bulk_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Operation
  operation_type text NOT NULL CHECK (operation_type IN (
    'delete',
    'archive',
    'move_to_folder',
    'change_visibility',
    'export'
  )),
  
  -- Target
  conversation_ids uuid[] NOT NULL,
  
  -- Parameters
  parameters jsonb DEFAULT '{}'::jsonb,
  
  -- Execution
  initiated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )),
  
  -- Progress
  total_items integer NOT NULL,
  processed_items integer DEFAULT 0,
  failed_items integer DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  
  -- Timing
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX idx_helper_bulk_operations_workspace ON public.helper_bulk_operations(workspace_id);
CREATE INDEX idx_helper_bulk_operations_user ON public.helper_bulk_operations(initiated_by);
CREATE INDEX idx_helper_bulk_operations_status ON public.helper_bulk_operations(status);

COMMENT ON TABLE public.helper_bulk_operations IS 'Track bulk operations on conversations';

-- Enable RLS
ALTER TABLE public.helper_bulk_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_own_workspace_bulk_ops"
ON public.helper_bulk_operations
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has access to conversation
CREATE OR REPLACE FUNCTION can_access_conversation(
  p_conversation_id uuid,
  p_user_id uuid
) RETURNS boolean AS $$
DECLARE
  v_result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM helper_conversations c
    WHERE c.id = p_conversation_id
    AND (
      c.created_by = p_user_id
      OR c.visibility = 'workspace'
      OR EXISTS (
        SELECT 1 FROM helper_conversation_shares s
        WHERE s.conversation_id = c.id
        AND s.shared_with_user_id = p_user_id
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation with access check
CREATE OR REPLACE FUNCTION get_shared_conversations(
  p_workspace_id uuid,
  p_user_id uuid
) RETURNS TABLE (
  id uuid,
  title text,
  visibility text,
  created_by uuid,
  shared_with_permission text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.visibility,
    c.created_by,
    COALESCE(s.permission, 'owner'::text) as shared_with_permission
  FROM helper_conversations c
  LEFT JOIN helper_conversation_shares s ON s.conversation_id = c.id AND s.shared_with_user_id = p_user_id
  WHERE c.workspace_id = p_workspace_id
  AND (
    c.created_by = p_user_id
    OR c.visibility IN ('team', 'workspace')
    OR s.shared_with_user_id = p_user_id
  )
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS for conversations to respect sharing
DROP POLICY IF EXISTS "users_access_own_workspace_conversations" ON public.helper_conversations;

CREATE POLICY "users_access_own_and_shared_conversations"
ON public.helper_conversations
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
  AND (
    created_by = auth.uid()
    OR visibility IN ('team', 'workspace')
    OR id IN (
      SELECT conversation_id
      FROM helper_conversation_shares
      WHERE shared_with_user_id = auth.uid()
    )
  )
);

-- =====================================================
-- DONE: PHASE 4 - TEAM COLLABORATION
-- =====================================================
-- Features enabled:
-- ✅ Conversation sharing with permissions
-- ✅ Comments and annotations
-- ✅ @ mentions and notifications
-- ✅ Reusable templates (5 defaults)
-- ✅ Folder organization
-- ✅ Bulk operations
-- ✅ Share links with expiration
-- ✅ Team and workspace visibility
