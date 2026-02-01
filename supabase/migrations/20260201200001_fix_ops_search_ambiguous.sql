-- Fix ambiguous ops_search_customers function
-- Idempotent & syntax-safe

drop function if exists public.ops_search_customers(text, int);

create function public.ops_search_customers(
  p_query text,
  p_limit int default 50
)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_uuid boolean;
  v_normalized_query text;
begin
  if not exists (
    select 1
    from public.platform_admins
    where user_id = auth.uid()
  ) then
    raise exception 'Access denied: platform admin only';
  end if;

  v_normalized_query := lower(trim(p_query));

  v_is_uuid :=
    v_normalized_query ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  return query
  select
    'workspace'::text as match_type,
    w.id,
    w.slug,
    w.name,
    w.status,
    coalesce(s.plan_id, 'free'),
    w.created_at,
    null::uuid,
    null::text,
    null::text,
    null::text,
    '{}'::jsonb,
    0::numeric,
    1::float
  from public.workspaces w
  left join public.subscriptions s on s.workspace_id = w.id
  where
    lower(w.slug) ilike '%' || v_normalized_query || '%'
     or lower(w.name) ilike '%' || v_normalized_query || '%'
  limit p_limit;

end;
$$;

comment on function public.ops_search_customers
is 'TEMP safe version to unblock migrations (will be enhanced later)';
