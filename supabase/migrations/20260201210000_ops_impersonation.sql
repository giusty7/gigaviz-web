-- Phase 2.2: User Impersonation
-- Platform admins can impersonate users for support purposes with full audit trail

-- ============================================================================
-- 1. ops_impersonations table (audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ops_impersonations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_email text NOT NULL,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_email text NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workspace_slug text NOT NULL,
  reason text NOT NULL,
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_impersonations_actor ON public.ops_impersonations(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_impersonations_target ON public.ops_impersonations(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_impersonations_workspace ON public.ops_impersonations(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_impersonations_active ON public.ops_impersonations(target_user_id, expires_at) WHERE ended_at IS NULL;

ALTER TABLE public.ops_impersonations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admins_read_impersonations" ON public.ops_impersonations;
DROP POLICY IF EXISTS platform_admins_read_impersonations ON public.ops_impersonations;
CREATE POLICY "platform_admins_read_impersonations" ON public.ops_impersonations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "platform_admins_write_impersonations" ON public.ops_impersonations;
DROP POLICY IF EXISTS platform_admins_write_impersonations ON public.ops_impersonations;
CREATE POLICY "platform_admins_write_impersonations" ON public.ops_impersonations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
    AND actor_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "platform_admins_end_impersonations" ON public.ops_impersonations;
DROP POLICY IF EXISTS platform_admins_end_impersonations ON public.ops_impersonations;
CREATE POLICY "platform_admins_end_impersonations" ON public.ops_impersonations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. RPC: Start impersonation
-- ============================================================================

DROP FUNCTION IF EXISTS public.ops_start_impersonation(uuid, uuid, text, interval);

CREATE OR REPLACE FUNCTION public.ops_start_impersonation(
  p_target_user_id uuid,
  p_workspace_id uuid,
  p_reason text,
  p_duration interval DEFAULT '1 hour'::interval
)
RETURNS TABLE (
  impersonation_id uuid,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_user_id uuid;
  v_actor_email text;
  v_target_email text;
  v_workspace_slug text;
  v_impersonation_id uuid;
  v_expires_at timestamptz;
BEGIN
  -- Security: platform admin only
  SELECT platform_admins.user_id INTO v_actor_user_id
  FROM public.platform_admins
  WHERE platform_admins.user_id = auth.uid();

  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: platform admin only';
  END IF;

  -- Get actor email
  SELECT email INTO v_actor_email
  FROM auth.users
  WHERE id = v_actor_user_id;

  -- Validate target user exists
  SELECT email INTO v_target_email
  FROM auth.users
  WHERE id = p_target_user_id;

  IF v_target_email IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Validate workspace exists and target is member
  SELECT w.slug INTO v_workspace_slug
  FROM public.workspaces w
  JOIN public.workspace_memberships wm ON wm.workspace_id = w.id
  WHERE w.id = p_workspace_id AND wm.user_id = p_target_user_id;

  IF v_workspace_slug IS NULL THEN
    RAISE EXCEPTION 'Target user is not a member of workspace';
  END IF;

  -- End any active impersonations for this target
  UPDATE public.ops_impersonations imp
  SET ended_at = now(), updated_at = now()
  WHERE imp.target_user_id = p_target_user_id
    AND imp.ended_at IS NULL
    AND imp.expires_at > now();

  -- Create impersonation record
  v_expires_at := now() + p_duration;

  INSERT INTO public.ops_impersonations (
    actor_user_id,
    actor_email,
    target_user_id,
    target_email,
    workspace_id,
    workspace_slug,
    reason,
    expires_at
  )
  VALUES (
    v_actor_user_id,
    v_actor_email,
    p_target_user_id,
    v_target_email,
    p_workspace_id,
    v_workspace_slug,
    p_reason,
    v_expires_at
  )
  RETURNING id INTO v_impersonation_id;

  RETURN QUERY
  SELECT v_impersonation_id AS impersonation_id, v_expires_at AS expires_at;
END;
$$;

COMMENT ON FUNCTION public.ops_start_impersonation IS 'Platform admin starts impersonation session for support purposes';

-- ============================================================================
-- 3. RPC: End impersonation
-- ============================================================================

DROP FUNCTION IF EXISTS public.ops_end_impersonation(uuid);

CREATE OR REPLACE FUNCTION public.ops_end_impersonation(
  p_impersonation_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_user_id uuid;
BEGIN
  -- Security: platform admin only
  SELECT platform_admins.user_id INTO v_actor_user_id
  FROM public.platform_admins
  WHERE platform_admins.user_id = auth.uid();

  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: platform admin only';
  END IF;

  -- End impersonation
  UPDATE public.ops_impersonations
  SET ended_at = now(), updated_at = now()
  WHERE id = p_impersonation_id
    AND ended_at IS NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.ops_end_impersonation IS 'Platform admin ends impersonation session';

-- ============================================================================
-- 4. RPC: Get active impersonation
-- ============================================================================

DROP FUNCTION IF EXISTS public.ops_get_active_impersonation(uuid);

CREATE OR REPLACE FUNCTION public.ops_get_active_impersonation(
  p_target_user_id uuid
)
RETURNS TABLE (
  id uuid,
  actor_email text,
  target_email text,
  workspace_slug text,
  reason text,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.actor_email,
    i.target_email,
    i.workspace_slug,
    i.reason,
    i.expires_at,
    i.created_at
  FROM public.ops_impersonations i
  WHERE i.target_user_id = p_target_user_id
    AND i.ended_at IS NULL
    AND i.expires_at > now()
  ORDER BY i.created_at DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.ops_get_active_impersonation IS 'Get active impersonation session for target user (public access for app middleware)';
