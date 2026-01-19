-- Platform admin panel helpers (idempotent)
set check_function_bodies = off;

create or replace function public.admin_search_workspaces(p_query text default null)
returns table(id uuid, slug text, name text, created_at timestamptz)
language sql
security definer
set search_path = public
as $func$
  select w.id, w.slug, w.name, w.created_at
  from public.workspaces w
  where public.is_platform_admin(auth.uid())
    and (
      p_query is null
      or p_query = ''
      or w.slug ilike '%' || p_query || '%'
      or w.name ilike '%' || p_query || '%'
    )
  order by w.created_at desc
  limit 50;
$func$;

grant execute on function public.admin_search_workspaces(text) to authenticated;

create or replace function public.admin_get_workspace_entitlements(p_workspace_id uuid)
returns table(
  workspace_id uuid,
  key text,
  enabled boolean,
  payload jsonb,
  expires_at timestamptz,
  reason text,
  granted_by uuid,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $func$
  select workspace_id, key, enabled, payload, expires_at, reason, granted_by, updated_at
  from public.workspace_entitlements
  where public.is_platform_admin(auth.uid())
    and workspace_id = p_workspace_id
  order by key asc;
$func$;

grant execute on function public.admin_get_workspace_entitlements(uuid) to authenticated;

create or replace function public.admin_get_workspace_entitlement_events(p_workspace_id uuid)
returns table(
  id uuid,
  entitlement_key text,
  granted boolean,
  expires_at timestamptz,
  reason text,
  granted_by uuid,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $func$
  select id, entitlement_key, granted, expires_at, reason, granted_by, created_at
  from public.workspace_entitlement_events
  where public.is_platform_admin(auth.uid())
    and workspace_id = p_workspace_id
  order by created_at desc
  limit 50;
$func$;

grant execute on function public.admin_get_workspace_entitlement_events(uuid) to authenticated;

