-- Platform owner entitlements + audit (idempotent)
create extension if not exists "pgcrypto";

-- Platform admins (who can grant/revoke)
create table if not exists public.platform_admins (
  user_id uuid primary key,
  created_at timestamptz not null default now(),
  created_by uuid null
);

alter table if exists public.platform_admins enable row level security;
drop policy if exists platform_admins_select_self on public.platform_admins;
create policy platform_admins_select_self
on public.platform_admins
for select
using (user_id = auth.uid());

-- Current state entitlements (extend existing table if present)
alter table if exists public.workspace_entitlements
  add column if not exists expires_at timestamptz,
  add column if not exists reason text,
  add column if not exists granted_by uuid;

-- Audit log (append-only)
create table if not exists public.workspace_entitlement_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entitlement_key text not null,
  granted boolean not null,
  expires_at timestamptz null,
  reason text null,
  granted_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists workspace_entitlement_events_workspace_idx
  on public.workspace_entitlement_events (workspace_id, created_at desc);

alter table if exists public.workspace_entitlement_events enable row level security;

-- Helper: platform admin check
create or replace function public.is_platform_admin(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = p_uid
  );
$$;

-- RLS policies (read-only for members/admins; no write policies)
drop policy if exists workspace_entitlements_service_role on public.workspace_entitlements;
drop policy if exists workspace_entitlements_select_members on public.workspace_entitlements;
create policy workspace_entitlements_select_members
on public.workspace_entitlements
for select
using (
  exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = workspace_entitlements.workspace_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists workspace_entitlement_events_select_admins on public.workspace_entitlement_events;
create policy workspace_entitlement_events_select_admins
on public.workspace_entitlement_events
for select
using (public.is_platform_admin(auth.uid()));

-- RPC: set entitlement (platform admins only)
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

  select id into v_workspace_id
  from public.workspaces
  where slug = p_workspace_slug
  limit 1;

  if v_workspace_id is null then
    raise exception 'workspace_not_found';
  end if;

  insert into public.workspace_entitlements (
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

  return query
  select
    workspace_id,
    key as entitlement_key,
    enabled as granted,
    expires_at,
    reason,
    granted_by,
    updated_at
  from public.workspace_entitlements
  where workspace_id = v_workspace_id
    and key = p_entitlement_key;
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

  insert into public.workspace_entitlements (
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

  return query
  select
    workspace_id,
    key as entitlement_key,
    enabled,
    payload,
    expires_at,
    reason,
    granted_by,
    updated_at
  from public.workspace_entitlements
  where workspace_id = p_workspace_id
    and key = p_entitlement_key;
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
