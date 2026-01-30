-- Phase 2.2: Expand Helper Product Integrations
-- Add more functions for comprehensive product coverage

-- Insert additional Meta Hub functions
INSERT INTO helper_functions (
  function_name,
  display_name,
  description,
  icon,
  product_slug,
  category,
  parameters_schema,
  required_params,
  requires_confirmation,
  handler_type,
  handler_endpoint,
  min_role
) VALUES
-- Broadcast & Templates
(
  'send_broadcast',
  'Send Broadcast Message',
  'Send a WhatsApp broadcast message to multiple contacts',
  '📢',
  'meta-hub',
  'messaging',
  '{"recipientTags": {"type": "array", "items": {"type": "string"}}, "message": {"type": "string"}, "templateId": {"type": "string"}}'::jsonb,
  ARRAY['message'],
  true,
  'api',
  '/api/meta/broadcasts/send',
  'admin'
),
(
  'create_template',
  'Create Message Template',
  'Create a new WhatsApp message template for approval',
  '📝',
  'meta-hub',
  'messaging',
  '{"name": {"type": "string"}, "category": {"type": "string"}, "language": {"type": "string"}, "body": {"type": "string"}, "header": {"type": "string"}, "footer": {"type": "string"}}'::jsonb,
  ARRAY['name', 'category', 'language', 'body'],
  true,
  'api',
  '/api/meta/templates/create',
  'admin'
),
(
  'get_template_analytics',
  'Get Template Analytics',
  'Retrieve performance analytics for message templates',
  '📊',
  'meta-hub',
  'analytics',
  '{"templateId": {"type": "string"}, "startDate": {"type": "string"}, "endDate": {"type": "string"}}'::jsonb,
  ARRAY['templateId'],
  false,
  'api',
  '/api/meta/templates/analytics',
  'member'
),

-- Contact Management Extended
(
  'merge_contacts',
  'Merge Duplicate Contacts',
  'Merge two or more duplicate contacts into one',
  '🔗',
  'meta-hub',
  'crm',
  '{"primaryContactId": {"type": "string"}, "duplicateContactIds": {"type": "array", "items": {"type": "string"}}}'::jsonb,
  ARRAY['primaryContactId', 'duplicateContactIds'],
  true,
  'api',
  '/api/meta/contacts/merge',
  'admin'
),
(
  'export_contacts',
  'Export Contacts',
  'Export contacts to CSV with filters',
  '📤',
  'meta-hub',
  'crm',
  '{"filters": {"type": "object"}, "format": {"type": "string", "enum": ["csv", "xlsx"]}}'::jsonb,
  ARRAY[],
  false,
  'api',
  '/api/meta/contacts/export',
  'member'
),
(
  'import_contacts',
  'Import Contacts',
  'Import contacts from CSV/Excel file',
  '📥',
  'meta-hub',
  'crm',
  '{"fileUrl": {"type": "string"}, "mapping": {"type": "object"}, "skipDuplicates": {"type": "boolean"}}'::jsonb,
  ARRAY['fileUrl'],
  true,
  'api',
  '/api/meta/contacts/import',
  'admin'
),

-- Conversation Management Extended
(
  'bulk_tag_conversations',
  'Bulk Tag Conversations',
  'Apply tags to multiple conversations at once',
  '🏷️',
  'meta-hub',
  'messaging',
  '{"conversationIds": {"type": "array", "items": {"type": "string"}}, "tags": {"type": "array", "items": {"type": "string"}}, "action": {"type": "string", "enum": ["add", "remove", "replace"]}}'::jsonb,
  ARRAY['conversationIds', 'tags', 'action'],
  false,
  'api',
  '/api/meta/conversations/bulk-tag',
  'member'
),
(
  'get_conversation_analytics',
  'Get Conversation Analytics',
  'Retrieve analytics and insights for conversations',
  '📈',
  'meta-hub',
  'analytics',
  '{"startDate": {"type": "string"}, "endDate": {"type": "string"}, "groupBy": {"type": "string", "enum": ["day", "week", "month"]}}'::jsonb,
  ARRAY[],
  false,
  'api',
  '/api/meta/analytics/conversations',
  'member'
),

-- Marketplace Functions
(
  'search_products',
  'Search Products',
  'Search products in Marketplace catalog',
  '🔍',
  'marketplace',
  'search',
  '{"query": {"type": "string"}, "category": {"type": "string"}, "minPrice": {"type": "number"}, "maxPrice": {"type": "number"}, "limit": {"type": "number"}}'::jsonb,
  ARRAY['query'],
  false,
  'direct',
  NULL,
  'member'
),
(
  'create_product',
  'Create Product',
  'Create a new product in Marketplace',
  '➕',
  'marketplace',
  'productivity',
  '{"name": {"type": "string"}, "description": {"type": "string"}, "price": {"type": "number"}, "category": {"type": "string"}, "images": {"type": "array"}}'::jsonb,
  ARRAY['name', 'description', 'price'],
  true,
  'api',
  '/api/marketplace/products/create',
  'member'
),
(
  'update_product',
  'Update Product',
  'Update an existing product',
  '✏️',
  'marketplace',
  'productivity',
  '{"productId": {"type": "string"}, "updates": {"type": "object"}}'::jsonb,
  ARRAY['productId', 'updates'],
  false,
  'api',
  '/api/marketplace/products/update',
  'member'
),

-- Studio Functions
(
  'create_funnel',
  'Create Funnel',
  'Create a new conversion funnel in Studio',
  '🎯',
  'studio',
  'productivity',
  '{"name": {"type": "string"}, "description": {"type": "string"}, "stages": {"type": "array"}}'::jsonb,
  ARRAY['name', 'stages'],
  false,
  'api',
  '/api/studio/funnels/create',
  'member'
),
(
  'get_funnel_metrics',
  'Get Funnel Metrics',
  'Retrieve conversion metrics for a funnel',
  '📊',
  'studio',
  'analytics',
  '{"funnelId": {"type": "string"}, "startDate": {"type": "string"}, "endDate": {"type": "string"}}'::jsonb,
  ARRAY['funnelId'],
  false,
  'api',
  '/api/studio/funnels/metrics',
  'member'
),

-- Workspace Management
(
  'invite_team_member',
  'Invite Team Member',
  'Invite a new team member to workspace',
  '👥',
  'platform',
  'productivity',
  '{"email": {"type": "string"}, "role": {"type": "string", "enum": ["member", "admin"]}, "message": {"type": "string"}}'::jsonb,
  ARRAY['email', 'role'],
  true,
  'api',
  '/api/workspaces/invite',
  'admin'
),
(
  'get_workspace_usage',
  'Get Workspace Usage',
  'Retrieve current workspace usage stats',
  '💎',
  'platform',
  'analytics',
  '{"metric": {"type": "string", "enum": ["tokens", "messages", "storage", "all"]}}'::jsonb,
  ARRAY[],
  false,
  'api',
  '/api/workspaces/usage',
  'member'
),
(
  'create_workspace_note',
  'Create Workspace Note',
  'Create a shared note for the workspace',
  '📝',
  'platform',
  'productivity',
  '{"title": {"type": "string"}, "content": {"type": "string"}, "tags": {"type": "array"}, "pinned": {"type": "boolean"}}'::jsonb,
  ARRAY['title', 'content'],
  false,
  'direct',
  NULL,
  'member'
),

-- Analytics & Reporting
(
  'generate_report',
  'Generate Report',
  'Generate a comprehensive report for specified metrics',
  '📑',
  'helper',
  'analytics',
  '{"reportType": {"type": "string", "enum": ["daily", "weekly", "monthly", "custom"]}, "metrics": {"type": "array"}, "format": {"type": "string", "enum": ["summary", "detailed"]}, "startDate": {"type": "string"}, "endDate": {"type": "string"}}'::jsonb,
  ARRAY['reportType', 'metrics'],
  false,
  'direct',
  NULL,
  'member'
),
(
  'get_ai_insights',
  'Get AI Insights',
  'Get AI-generated insights from workspace data',
  '🧠',
  'helper',
  'analytics',
  '{"dataSource": {"type": "string", "enum": ["conversations", "contacts", "sales", "all"]}, "period": {"type": "string"}, "focusArea": {"type": "string"}}'::jsonb,
  ARRAY['dataSource'],
  false,
  'direct',
  NULL,
  'member'
),

-- Automation Helpers
(
  'schedule_message',
  'Schedule Message',
  'Schedule a WhatsApp message for later delivery',
  '⏰',
  'meta-hub',
  'messaging',
  '{"contactId": {"type": "string"}, "message": {"type": "string"}, "scheduledFor": {"type": "string"}, "timezone": {"type": "string"}}'::jsonb,
  ARRAY['contactId', 'message', 'scheduledFor'],
  false,
  'api',
  '/api/meta/messages/schedule',
  'member'
),
(
  'create_reminder',
  'Create Reminder',
  'Create a reminder for follow-up action',
  '⏰',
  'helper',
  'productivity',
  '{"title": {"type": "string"}, "description": {"type": "string"}, "dueAt": {"type": "string"}, "relatedTo": {"type": "object"}}'::jsonb,
  ARRAY['title', 'dueAt'],
  false,
  'direct',
  NULL,
  'member'
);

-- Add function permission groups for easier management
CREATE TABLE IF NOT EXISTS helper_function_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  group_name text NOT NULL,
  description text,
  function_names text[] NOT NULL,
  allowed_roles text[] DEFAULT ARRAY['admin', 'member']::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, group_name)
);

-- Enable RLS
ALTER TABLE helper_function_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_own_workspace_function_groups"
ON helper_function_groups
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- Insert default function groups
INSERT INTO helper_function_groups (
  workspace_id,
  group_name,
  description,
  function_names,
  allowed_roles
)
SELECT
  id as workspace_id,
  'messaging_advanced',
  'Advanced messaging capabilities including broadcasts and scheduling',
  ARRAY['send_broadcast', 'create_template', 'schedule_message', 'get_template_analytics']::text[],
  ARRAY['admin']::text[]
FROM workspaces
ON CONFLICT DO NOTHING;

INSERT INTO helper_function_groups (
  workspace_id,
  group_name,
  description,
  function_names,
  allowed_roles
)
SELECT
  id as workspace_id,
  'crm_essentials',
  'Core CRM functions for contact management',
  ARRAY['create_contact', 'update_contact', 'tag_contact', 'search_contacts', 'export_contacts']::text[],
  ARRAY['admin', 'member']::text[]
FROM workspaces
ON CONFLICT DO NOTHING;

INSERT INTO helper_function_groups (
  workspace_id,
  group_name,
  description,
  function_names,
  allowed_roles
)
SELECT
  id as workspace_id,
  'analytics',
  'Analytics and reporting functions',
  ARRAY['get_conversation_analytics', 'get_funnel_metrics', 'get_workspace_usage', 'generate_report', 'get_ai_insights']::text[],
  ARRAY['admin', 'member']::text[]
FROM workspaces
ON CONFLICT DO NOTHING;

-- Create helper function to get functions by group
CREATE OR REPLACE FUNCTION get_functions_by_group(
  p_workspace_id uuid,
  p_group_name text
) RETURNS TABLE (
  function_name text,
  display_name text,
  description text,
  icon text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hf.function_name,
    hf.display_name,
    hf.description,
    hf.icon
  FROM helper_functions hf
  WHERE hf.function_name = ANY(
    SELECT unnest(function_names)
    FROM helper_function_groups
    WHERE workspace_id = p_workspace_id
    AND group_name = p_group_name
  )
  ORDER BY hf.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for faster function lookups by product
CREATE INDEX IF NOT EXISTS idx_helper_functions_product_slug 
ON helper_functions(product_slug);

CREATE INDEX IF NOT EXISTS idx_helper_functions_category 
ON helper_functions(category);

-- Track function popularity
ALTER TABLE helper_functions
ADD COLUMN IF NOT EXISTS total_calls bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_calls bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_calls bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_duration_ms numeric(10,2);

-- Create materialized view for function analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS helper_function_analytics AS
SELECT 
  hf.function_name,
  hf.display_name,
  hf.product_slug,
  hf.category,
  COUNT(hfc.id) as total_executions,
  COUNT(CASE WHEN hfc.status = 'completed' THEN 1 END) as successful_executions,
  COUNT(CASE WHEN hfc.status = 'failed' THEN 1 END) as failed_executions,
  AVG(hfc.duration_ms) as avg_duration_ms,
  MAX(hfc.created_at) as last_used_at,
  COUNT(DISTINCT hfc.workspace_id) as workspace_count
FROM helper_functions hf
LEFT JOIN helper_function_calls hfc ON hf.id = hfc.function_id
GROUP BY hf.function_name, hf.display_name, hf.product_slug, hf.category;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_helper_function_analytics_function_name 
ON helper_function_analytics(function_name);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_helper_function_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY helper_function_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON TABLE helper_function_groups IS 'Group functions for easier permission management and discoverability';
COMMENT ON MATERIALIZED VIEW helper_function_analytics IS 'Analytics for function usage across all workspaces';
