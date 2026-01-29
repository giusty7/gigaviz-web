-- ============================================================================
-- WhatsApp Inbox Saved Views
-- Migration: 20260130000000_wa_saved_views.sql
-- Purpose: Allow users to save custom filter configurations for quick access
-- ============================================================================

-- Create wa_saved_views table
CREATE TABLE IF NOT EXISTS public.wa_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- filters format: { status: "open", assigned: "all", tag: "urgent", q: "" }
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  CONSTRAINT wa_saved_views_workspace_user_name_unique UNIQUE (workspace_id, user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS wa_saved_views_user_idx 
  ON public.wa_saved_views(user_id, workspace_id);

CREATE INDEX IF NOT EXISTS wa_saved_views_workspace_idx 
  ON public.wa_saved_views(workspace_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_wa_saved_views_updated_at ON public.wa_saved_views;
CREATE TRIGGER set_wa_saved_views_updated_at
  BEFORE UPDATE ON public.wa_saved_views
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Enable Row Level Security
ALTER TABLE public.wa_saved_views ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own saved views in workspaces they're members of
DROP POLICY IF EXISTS wa_saved_views_user_policy ON public.wa_saved_views;
CREATE POLICY wa_saved_views_user_policy ON public.wa_saved_views
  FOR ALL
  USING (
    user_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE public.wa_saved_views IS 'User-defined saved filter views for WhatsApp inbox';
COMMENT ON COLUMN public.wa_saved_views.filters IS 'JSON object containing filter configuration: status, assigned, tag, q';
COMMENT ON COLUMN public.wa_saved_views.name IS 'User-friendly name for the saved view';

-- ============================================================================
-- Smoke Test
-- ============================================================================
-- 1. Insert test saved view:
--    INSERT INTO wa_saved_views (workspace_id, user_id, name, filters)
--    VALUES ('<workspace_uuid>', '<user_uuid>', 'Urgent Open', '{"status":"open","tag":"urgent","assigned":"all","q":""}'::jsonb);
--
-- 2. Query with RLS:
--    SELECT * FROM wa_saved_views WHERE workspace_id = '<workspace_uuid>';
--
-- 3. Test unique constraint (should fail):
--    INSERT INTO wa_saved_views (workspace_id, user_id, name, filters)
--    VALUES ('<workspace_uuid>', '<user_uuid>', 'Urgent Open', '{}'::jsonb);
-- ============================================================================
