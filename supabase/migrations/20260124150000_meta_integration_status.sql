-- Meta Hub: Integration Status Tracking for Realtime Overview
-- This migration creates a unified view of integration status for realtime updates
-- Designed to be robust against missing tables/columns

-- 1) Create meta_integration_status view (only uses guaranteed tables)
CREATE OR REPLACE VIEW public.meta_integration_status AS
SELECT 
  w.id as workspace_id,
  w.slug as workspace_slug,
  -- WhatsApp connection status (uses meta_whatsapp_connections which is guaranteed)
  CASE 
    WHEN mwc.id IS NOT NULL THEN 'connected'
    ELSE 'disconnected'
  END as whatsapp_status,
  mwc.verified_name as whatsapp_display_name,
  mwc.phone_number_id as whatsapp_phone_id,
  mwc.waba_id as whatsapp_waba_id,
  mwc.updated_at as whatsapp_last_updated,
  -- Facebook connection status (placeholder for future)
  'disconnected' as facebook_status,
  NULL::text as facebook_display_name,
  NULL::timestamptz as facebook_last_updated,
  -- Webhook status (uses meta_events_log which exists)
  CASE
    WHEN (
      SELECT COUNT(*) FROM meta_events_log mel 
      WHERE mel.workspace_id = w.id 
      AND mel.received_at > NOW() - INTERVAL '24 hours'
    ) > 0 THEN 'active'
    WHEN (
      SELECT COUNT(*) FROM meta_events_log mel 
      WHERE mel.workspace_id = w.id
    ) > 0 THEN 'inactive'
    ELSE 'not_configured'
  END as webhook_status,
  (
    SELECT MAX(received_at) FROM meta_events_log mel WHERE mel.workspace_id = w.id
  ) as webhook_last_event_at,
  (
    SELECT COUNT(*) FROM meta_events_log mel 
    WHERE mel.workspace_id = w.id AND mel.received_at > NOW() - INTERVAL '24 hours'
  ) as webhook_events_24h,
  -- Token configuration
  CASE WHEN mt.id IS NOT NULL THEN true ELSE false END as has_access_token,
  mt.updated_at as token_last_updated,
  NOW() as computed_at
FROM public.workspaces w
LEFT JOIN public.meta_whatsapp_connections mwc ON mwc.workspace_id = w.id
LEFT JOIN public.meta_tokens mt ON mt.workspace_id = w.id AND mt.provider = 'meta_whatsapp';

-- 2) Create a function to get integration status for a workspace
CREATE OR REPLACE FUNCTION public.get_meta_integration_status(p_workspace_id uuid)
RETURNS TABLE (
  workspace_id uuid,
  whatsapp_status text,
  whatsapp_display_name text,
  whatsapp_phone_id text,
  whatsapp_waba_id text,
  whatsapp_last_updated timestamptz,
  facebook_status text,
  facebook_display_name text,
  facebook_last_updated timestamptz,
  webhook_status text,
  webhook_last_event_at timestamptz,
  webhook_events_24h bigint,
  has_access_token boolean,
  token_last_updated timestamptz
) AS $$
BEGIN
  -- Security: Enforce workspace membership using auth.uid()
  IF NOT EXISTS (
    SELECT 1 FROM workspace_memberships
    WHERE workspace_id = p_workspace_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not a member of this workspace';
  END IF;

  RETURN QUERY
  SELECT 
    mis.workspace_id,
    mis.whatsapp_status,
    mis.whatsapp_display_name,
    mis.whatsapp_phone_id,
    mis.whatsapp_waba_id,
    mis.whatsapp_last_updated,
    mis.facebook_status,
    mis.facebook_display_name,
    mis.facebook_last_updated,
    mis.webhook_status,
    mis.webhook_last_event_at,
    mis.webhook_events_24h,
    mis.has_access_token,
    mis.token_last_updated
  FROM public.meta_integration_status mis
  WHERE mis.workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3) Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_meta_integration_status(uuid) TO authenticated;

-- 4) Create indexes for performance (only on guaranteed tables)
CREATE INDEX IF NOT EXISTS idx_meta_whatsapp_connections_workspace_updated 
  ON public.meta_whatsapp_connections(workspace_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_meta_tokens_workspace_provider 
  ON public.meta_tokens(workspace_id, provider);

CREATE INDEX IF NOT EXISTS idx_meta_events_log_workspace_received 
  ON public.meta_events_log(workspace_id, received_at DESC);

COMMENT ON VIEW public.meta_integration_status IS 'Unified view of Meta integration status for realtime overview updates';
COMMENT ON FUNCTION public.get_meta_integration_status(uuid) IS 'Retrieves integration status for a specific workspace with proper RLS enforcement';

-- 5) Add tables to supabase_realtime publication for postgres_changes
-- Using DO block for idempotent addition
DO $$
BEGIN
  -- meta_whatsapp_connections
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'meta_whatsapp_connections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_whatsapp_connections;
  END IF;

  -- meta_tokens
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'meta_tokens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_tokens;
  END IF;

  -- meta_events_log
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'meta_events_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_events_log;
  END IF;
END $$;
