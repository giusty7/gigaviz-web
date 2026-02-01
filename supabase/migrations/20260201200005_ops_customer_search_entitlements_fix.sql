-- Final correction: entitlements + token balance columns
-- Run this in Supabase SQL Editor (Production)

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
      CAST(
        CASE
          WHEN w.id::text = v_normalized_query THEN 'workspace_id'
          WHEN lower(w.slug) = v_normalized_query THEN 'workspace_slug'
          WHEN lower(w.name) ILIKE '%' || v_normalized_query || '%' THEN 'workspace_name'
          ELSE 'other'
        END AS text
      ) AS match_type,
      w.id AS workspace_id,
      w.slug AS workspace_slug,
      w.name AS workspace_name,
      w.status AS workspace_status,
      COALESCE(s.plan_id, 'free')::text AS workspace_plan,
      w.created_at AS workspace_created_at,
      NULL::uuid AS user_id,
      NULL::text AS user_email,
      NULL::text AS user_phone,
      (
        SELECT u.email::text FROM auth.users u
        JOIN public.workspace_memberships wm_owner ON wm_owner.user_id = u.id
        WHERE wm_owner.workspace_id = w.id AND wm_owner.role = 'owner'
        LIMIT 1
      ) AS owner_email,
      (
        SELECT jsonb_object_agg(we.key, we.enabled)::jsonb
        FROM public.workspace_entitlements we
        WHERE we.workspace_id = w.id
      ) AS entitlements,
      (
        SELECT tw.balance_bigint::numeric FROM public.token_wallets tw
        WHERE tw.workspace_id = w.id
        LIMIT 1
      ) AS token_balance,
      CAST(
        CASE
          WHEN w.id::text = v_normalized_query THEN 100.0
          WHEN lower(w.slug) = v_normalized_query THEN 90.0
          WHEN lower(w.name) = v_normalized_query THEN 80.0
          WHEN lower(w.name) ILIKE v_normalized_query || '%' THEN 70.0
          ELSE 50.0
        END AS float
      ) AS relevance_score
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
      CAST(
        CASE
          WHEN u.id::text = v_normalized_query THEN 'user_id'
          WHEN lower(u.email) = v_normalized_query THEN 'email'
          WHEN u.phone = v_normalized_query THEN 'phone'
          WHEN lower(u.email) ILIKE '%' || v_normalized_query || '%' THEN 'email_partial'
          ELSE 'other'
        END AS text
      ) AS match_type,
      wm.workspace_id,
      w.slug AS workspace_slug,
      w.name AS workspace_name,
      w.status AS workspace_status,
      COALESCE(s.plan_id, 'free')::text AS workspace_plan,
      w.created_at AS workspace_created_at,
      u.id AS user_id,
      u.email AS user_email,
      u.phone AS user_phone,
      (
        SELECT owner.email::text FROM auth.users owner
        JOIN public.workspace_memberships owner_wm ON owner_wm.user_id = owner.id
        WHERE owner_wm.workspace_id = w.id AND owner_wm.role = 'owner'
        LIMIT 1
      ) AS owner_email,
      (
        SELECT jsonb_object_agg(we.key, we.enabled)::jsonb
        FROM public.workspace_entitlements we
        WHERE we.workspace_id = w.id
      ) AS entitlements,
      (
        SELECT tw.balance_bigint::numeric FROM public.token_wallets tw
        WHERE tw.workspace_id = w.id
        LIMIT 1
      ) AS token_balance,
      CAST(
        CASE
          WHEN u.id::text = v_normalized_query THEN 100.0
          WHEN lower(u.email) = v_normalized_query THEN 95.0
          WHEN u.phone = v_normalized_query THEN 95.0
          WHEN lower(u.email) ILIKE v_normalized_query || '%' THEN 70.0
          ELSE 50.0
        END AS float
      ) AS relevance_score
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
