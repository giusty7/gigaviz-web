-- Fix ambiguous workspace_id references in entitlement RPCs
set check_function_bodies = off;

-- RPC: set entitlement by slug (platform admins only)
create or replace function public.set_workspace_entitlement(
  p_workspace_slug text,
  p_entitlement_key text,
  p_granted boolean,
  p_expires_at timestamptz default null,
  p_reason text default null
) returns table(
  workspace_id uuid,
  entitlement_key text,
  granted boolean,
  expires_at timestamptz,
  reason text,
  granted_by uuid,
  updated_at timestamptz
) language plpgsql
security definer
set search_path = public
as $func$
declare
  v_workspace_id uuid;
  v_actor uuid;
begin
  v_actor := auth.uid();
  if not public.is_platform_admin(v_actor) then
    raise exception 'not_platform_admin';
  end if;

  select w.id into v_workspace_id
  from public.workspaces w
  where w.slug = p_workspace_slug
  limit 1;

  if v_workspace_id is null then
    raise exception 'workspace_not_found';
  end if;

  insert into public.workspace_entitlements as we (
    workspace_id,
    key,
    enabled,
    expires_at,
    reason,
    granted_by,
    updated_at,
    updated_by
  ) values (
    v_workspace_id,
    p_entitlement_key,
    p_granted,
    p_expires_at,
    p_reason,
    v_actor,
    now(),
    v_actor
  )
  on conflict (workspace_id, key) do update
    set enabled = excluded.enabled,
        expires_at = excluded.expires_at,
        reason = excluded.reason,
        granted_by = excluded.granted_by,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;

  if to_regclass('public.workspace_entitlement_events') is not null then
    insert into public.workspace_entitlement_events (
      workspace_id,
      entitlement_key,
      granted,
      expires_at,
      reason,
      granted_by
    ) values (
      v_workspace_id,
      p_entitlement_key,
      p_granted,
      p_expires_at,
      p_reason,
      v_actor
    );
  end if;

  return query
  select
    we.workspace_id,
    we.key as entitlement_key,
    we.enabled as granted,
    we.expires_at,
    we.reason,
    we.granted_by,
    we.updated_at
  from public.workspace_entitlements we
  where we.workspace_id = v_workspace_id
    and we.key = p_entitlement_key;
end;
$func$;

grant execute on function public.set_workspace_entitlement(
  text,
  text,
  boolean,
  timestamptz,
  text
) to authenticated;

-- RPC: set entitlement with payload (platform admins only)
create or replace function public.set_workspace_entitlement_payload(
  p_workspace_id uuid,
  p_entitlement_key text,
  p_enabled boolean,
  p_payload jsonb,
  p_expires_at timestamptz default null,
  p_reason text default null
) returns table(
  workspace_id uuid,
  entitlement_key text,
  enabled boolean,
  payload jsonb,
  expires_at timestamptz,
  reason text,
  granted_by uuid,
  updated_at timestamptz
) language plpgsql
security definer
set search_path = public
as $func$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();
  if not public.is_platform_admin(v_actor) then
    raise exception 'not_platform_admin';
  end if;

  insert into public.workspace_entitlements as we (
    workspace_id,
    key,
    enabled,
    payload,
    expires_at,
    reason,
    granted_by,
    updated_at,
    updated_by
  ) values (
    p_workspace_id,
    p_entitlement_key,
    p_enabled,
    coalesce(p_payload, '{}'::jsonb),
    p_expires_at,
    p_reason,
    v_actor,
    now(),
    v_actor
  )
  on conflict (workspace_id, key) do update
    set enabled = excluded.enabled,
        payload = excluded.payload,
        expires_at = excluded.expires_at,
        reason = excluded.reason,
        granted_by = excluded.granted_by,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;

  if to_regclass('public.workspace_entitlement_events') is not null then
    insert into public.workspace_entitlement_events (
      workspace_id,
      entitlement_key,
      granted,
      expires_at,
      reason,
      granted_by
    ) values (
      p_workspace_id,
      p_entitlement_key,
      p_enabled,
      p_expires_at,
      p_reason,
      v_actor
    );
  end if;

  return query
  select
    we.workspace_id,
    we.key as entitlement_key,
    we.enabled,
    we.payload,
    we.expires_at,
    we.reason,
    we.granted_by,
    we.updated_at
  from public.workspace_entitlements we
  where we.workspace_id = p_workspace_id
    and we.key = p_entitlement_key;
end;
$func$;

grant execute on function public.set_workspace_entitlement_payload(
  uuid,
  text,
  boolean,
  jsonb,
  timestamptz,
  text
) to authenticated;
