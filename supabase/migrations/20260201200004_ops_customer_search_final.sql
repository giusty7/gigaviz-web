-- Final fix: ops customer search + platform admin grant (minimal columns)
-- Run this in Supabase SQL Editor (single execution)

-- 1) Recreate RPC with correct joins and aliases
DROP FUNCTION IF EXISTS public.ops_search_customers(text, int);

CREATE OR REPLACE FUNCTION public.ops_search_customers(
  p_query text,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  match_type text,
  workspace_id uuid,
  workspace_slug text,
  workspace_name text,
  workspace_status text,
  workspace_plan text,
  workspace_created_at timestamptz,
  user_id uuid,
  user_email text,
  user_phone text,
  owner_email text,
  entitlements jsonb,
  token_balance numeric,
  relevance_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_uuid boolean;
  v_normalized_query text;
BEGIN
  -- Security: platform admin only
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE platform_admins.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: platform admin only';
  END IF;

  v_normalized_query := lower(trim(p_query));
  v_is_uuid := v_normalized_query ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  RETURN QUERY
  WITH workspace_matches AS (
    SELECT DISTINCT
      CASE
        WHEN w.id::text = v_normalized_query THEN 'workspace_id'
        WHEN lower(w.slug) = v_normalized_query THEN 'workspace_slug'
        WHEN lower(w.name) ILIKE '%' || v_normalized_query || '%' THEN 'workspace_name'
        ELSE 'other'
      END AS match_type,
      w.id AS workspace_id,
      w.slug AS workspace_slug,
      w.name AS workspace_name,
      w.status AS workspace_status,
      COALESCE(s.plan_id, 'free') AS workspace_plan,
      w.created_at AS workspace_created_at,
      NULL::uuid AS user_id,
      NULL::text AS user_email,
      NULL::text AS user_phone,
      (
        SELECT u.email FROM auth.users u
        JOIN public.workspace_memberships wm_owner ON wm_owner.user_id = u.id
        WHERE wm_owner.workspace_id = w.id AND wm_owner.role = 'owner'
        LIMIT 1
      ) AS owner_email,
      (
        SELECT jsonb_object_agg(we.entitlement_key, we.is_enabled)
        FROM public.workspace_entitlements we
        WHERE we.workspace_id = w.id
      ) AS entitlements,
      (
        SELECT tw.balance FROM public.token_wallets tw
        WHERE tw.workspace_id = w.id
        LIMIT 1
      ) AS token_balance,
      CASE
        WHEN w.id::text = v_normalized_query THEN 100.0
        WHEN lower(w.slug) = v_normalized_query THEN 90.0
        WHEN lower(w.name) = v_normalized_query THEN 80.0
        WHEN lower(w.name) ILIKE v_normalized_query || '%' THEN 70.0
        ELSE 50.0
      END AS relevance_score
    FROM public.workspaces w
    LEFT JOIN public.subscriptions s ON s.workspace_id = w.id
    WHERE
      (v_is_uuid AND w.id::text = v_normalized_query)
      OR lower(w.slug) = v_normalized_query
      OR lower(w.slug) ILIKE '%' || v_normalized_query || '%'
      OR lower(w.name) ILIKE '%' || v_normalized_query || '%'
  ),
  user_matches AS (
    SELECT DISTINCT
      CASE
        WHEN u.id::text = v_normalized_query THEN 'user_id'
        WHEN lower(u.email) = v_normalized_query THEN 'email'
        WHEN u.phone = v_normalized_query THEN 'phone'
        WHEN lower(u.email) ILIKE '%' || v_normalized_query || '%' THEN 'email_partial'
        ELSE 'other'
      END AS match_type,
      wm.workspace_id,
      w.slug AS workspace_slug,
      w.name AS workspace_name,
      w.status AS workspace_status,
      COALESCE(s.plan_id, 'free') AS workspace_plan,
      w.created_at AS workspace_created_at,
      u.id AS user_id,
      u.email AS user_email,
      u.phone AS user_phone,
      (
        SELECT owner.email FROM auth.users owner
        JOIN public.workspace_memberships owner_wm ON owner_wm.user_id = owner.id
        WHERE owner_wm.workspace_id = w.id AND owner_wm.role = 'owner'
        LIMIT 1
      ) AS owner_email,
      (
        SELECT jsonb_object_agg(we.entitlement_key, we.is_enabled)
        FROM public.workspace_entitlements we
        WHERE we.workspace_id = w.id
      ) AS entitlements,
      (
        SELECT tw.balance FROM public.token_wallets tw
        WHERE tw.workspace_id = w.id
        LIMIT 1
      ) AS token_balance,
      CASE
        WHEN u.id::text = v_normalized_query THEN 100.0
        WHEN lower(u.email) = v_normalized_query THEN 95.0
        WHEN u.phone = v_normalized_query THEN 95.0
        WHEN lower(u.email) ILIKE v_normalized_query || '%' THEN 70.0
        ELSE 50.0
      END AS relevance_score
    FROM auth.users u
    JOIN public.workspace_memberships wm ON wm.user_id = u.id
    JOIN public.workspaces w ON w.id = wm.workspace_id
    LEFT JOIN public.subscriptions s ON s.workspace_id = w.id
    WHERE
      (v_is_uuid AND u.id::text = v_normalized_query)
      OR lower(u.email) = v_normalized_query
      OR lower(u.email) ILIKE '%' || v_normalized_query || '%'
      OR u.phone = v_normalized_query
      OR u.phone ILIKE '%' || v_normalized_query || '%'
  ),
  all_matches AS (
    SELECT * FROM workspace_matches
    UNION ALL
    SELECT * FROM user_matches
  )
  SELECT
    am.match_type,
    am.workspace_id,
    am.workspace_slug,
    am.workspace_name,
    am.workspace_status,
    am.workspace_plan,
    am.workspace_created_at,
    am.user_id,
    am.user_email,
    am.user_phone,
    am.owner_email,
    am.entitlements,
    am.token_balance,
    am.relevance_score
  FROM all_matches am
  ORDER BY am.relevance_score DESC, am.workspace_created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.ops_search_customers IS 'Search customers by email, phone, workspace slug/id, or user id. Returns ranked results with workspace and user details.';

-- 2) Grant platform admin (table only has user_id)
INSERT INTO public.platform_admins (user_id)
SELECT u.id
FROM auth.users u
WHERE u.email = 'giusty@gigaviz.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify
DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.platform_admins pa
  JOIN auth.users u ON u.id = pa.user_id
  WHERE u.email = 'giusty@gigaviz.com';

  IF v_count > 0 THEN
    RAISE NOTICE 'Platform admin access granted to giusty@gigaviz.com';
  ELSE
    RAISE WARNING 'User giusty@gigaviz.com not found in auth.users';
  END IF;
END $$;
