-- Fix ambiguous column reference in set_workspace_entitlement_payload function
-- Error: "column reference 'workspace_id' is ambiguous"
-- Cause: RETURNS TABLE column names clash with table column names in SELECT

-- Re-create the function with table-qualified column references
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
) language plpgsql security definer set search_path = 'public' as $func$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();
  
  -- Check platform admin permission
  if not public.is_platform_admin(v_actor) then
    raise exception 'not_platform_admin';
  end if;

  -- Upsert the entitlement (table-qualified to avoid ambiguity)
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

  -- Log the event (if table exists)
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

  -- Return the updated row with FULLY QUALIFIED column references
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

-- Ensure service_role can execute
grant execute on function public.set_workspace_entitlement_payload(uuid, text, boolean, jsonb, timestamptz, text) to service_role;

-- Also fix apply_workspace_token_delta to be consistent
create or replace function public.apply_workspace_token_delta(
  p_workspace_id uuid,
  p_delta int,
  p_reason text,
  p_ref_type text default 'adjustment',
  p_ref_id text default null,
  p_actor uuid default null
) returns table(applied boolean, ledger_id uuid, balance int) as $func$
declare
  v_ledger_id uuid;
  v_new_balance int;
begin
  -- Validate delta
  if p_delta = 0 then
    raise exception 'delta_must_not_be_zero';
  end if;

  -- Insert ledger entry (with conflict handling for idempotent ref_id)
  insert into public.workspace_token_ledger (
    workspace_id, delta, reason, ref_type, ref_id, created_by
  )
  values (
    p_workspace_id, p_delta, p_reason, p_ref_type, p_ref_id, p_actor
  )
  on conflict (workspace_id, ref_id) where ref_id is not null do nothing
  returning id into v_ledger_id;

  -- If conflict (already applied), return current balance without double-counting
  if v_ledger_id is null then
    if to_regclass('public.workspace_token_balance') is not null then
      select wtb.balance into v_new_balance
      from public.workspace_token_balance wtb
      where wtb.workspace_id = p_workspace_id;
    end if;
    return query select false, null::uuid, v_new_balance;
    return;
  end if;

  -- Upsert balance table (fully qualified to avoid ambiguity)
  if to_regclass('public.workspace_token_balance') is not null then
    insert into public.workspace_token_balance as wtb (workspace_id, balance, updated_at)
    values (p_workspace_id, p_delta, now())
    on conflict (workspace_id) do update
      set balance = wtb.balance + excluded.balance,
          updated_at = now()
    returning wtb.balance into v_new_balance;
  end if;

  return query select true, v_ledger_id, v_new_balance;
end;
$func$ language plpgsql security definer;

-- Grant execute to service role
grant execute on function public.apply_workspace_token_delta(uuid, int, text, text, text, uuid) to service_role;

-- Clean up duplicate unique index (primary key already covers this)
drop index if exists public.workspace_entitlements_workspace_key_idx;
