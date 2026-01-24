-- Fix module keys from dash to underscore (meta-hub → meta_hub)
-- The catalog uses underscore keys, so preferences must match

-- 1) Update existing preferences that have the wrong key
UPDATE public.dashboard_preferences
SET pinned_modules = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem::text = '"meta-hub"' THEN '"meta_hub"'::jsonb
      ELSE elem
    END
  )
  FROM jsonb_array_elements(pinned_modules) AS elem
)
WHERE pinned_modules::text LIKE '%meta-hub%';

-- 2) Update the default value for the column
ALTER TABLE public.dashboard_preferences 
ALTER COLUMN pinned_modules SET DEFAULT '["platform", "meta_hub", "helper"]'::jsonb;

-- 3) Recreate the helper function with correct defaults
CREATE OR REPLACE FUNCTION public.get_dashboard_preferences(
  p_user_id uuid,
  p_workspace_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pinned_modules jsonb;
BEGIN
  SELECT pinned_modules INTO v_pinned_modules
  FROM public.dashboard_preferences
  WHERE user_id = p_user_id AND workspace_id = p_workspace_id;

  IF v_pinned_modules IS NULL THEN
    INSERT INTO public.dashboard_preferences (user_id, workspace_id, pinned_modules)
    VALUES (p_user_id, p_workspace_id, '["platform", "meta_hub", "helper"]'::jsonb)
    ON CONFLICT (user_id, workspace_id) DO NOTHING
    RETURNING pinned_modules INTO v_pinned_modules;
  END IF;

  RETURN COALESCE(v_pinned_modules, '["platform", "meta_hub", "helper"]'::jsonb);
END;
$$;
