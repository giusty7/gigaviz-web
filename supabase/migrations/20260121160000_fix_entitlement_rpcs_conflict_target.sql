-- Fix entitlement RPC ambiguity by binding conflict target to the actual constraint
set check_function_bodies = off;

do $$
declare
  v_conflict_constraint text;
begin
  -- Prefer primary key on (workspace_id, key); fallback to unique with same columns.
  select con.conname
  into v_conflict_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'workspace_entitlements'
    and con.contype in ('p', 'u')
    and conkey = (
      select array_agg(att.attnum order by att.attnum)
      from pg_attribute att
      where att.attrelid = rel.oid
        and att.attname in ('workspace_id', 'key')
        and att.attnum = any(con.conkey)
    )
  order by case when con.contype = 'p' then 0 else 1 end
  limit 1;

  if v_conflict_constraint is null then
    -- Last resort, fall back to primary key name if present
    select con.conname
    into v_conflict_constraint
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'workspace_entitlements'
      and con.contype = 'p'
    limit 1;
  end if;

  if v_conflict_constraint is null then
    raise exception 'workspace_entitlements constraint for (workspace_id, key) not found';
  end if;

  -- set_workspace_entitlement (slug-based)
  execute format($body$
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
      on conflict on constraint %I do update
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
  $body$, v_conflict_constraint);

  -- set_workspace_entitlement_payload (uuid-based)
  execute format($body$
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
      on conflict on constraint %I do update
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
  $body$, v_conflict_constraint);
end$$;

revoke all on function public.set_workspace_entitlement(text, text, boolean, timestamptz, text) from public;
revoke all on function public.set_workspace_entitlement_payload(uuid, text, boolean, jsonb, timestamptz, text) from public;

grant execute on function public.set_workspace_entitlement(
  text,
  text,
  boolean,
  timestamptz,
  text
) to authenticated;

grant execute on function public.set_workspace_entitlement_payload(
  uuid,
  text,
  boolean,
  jsonb,
  timestamptz,
  text
) to authenticated;
