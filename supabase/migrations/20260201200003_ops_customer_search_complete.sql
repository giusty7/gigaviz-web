-- ============================================================================
-- Phase 2.1: Customer Lookup - Complete Fix
-- ============================================================================
-- Fix 1: ops_search_customers function (ambiguous user_id + missing w.plan)
-- Fix 2: Grant platform admin to giusty@gigaviz.com
-- ============================================================================

-- ============================================================================
-- FIX 1: Recreate ops_search_customers function with proper table joins
-- ============================================================================

drop function if exists public.ops_search_customers(text, int);

create or replace function public.ops_search_customers(
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
  -- Security check: only platform admins
  if not exists (
    select 1 from public.platform_admins where platform_admins.user_id = auth.uid()
  ) then
    raise exception 'Access denied: platform admin only';
  end if;

  -- Normalize query
  v_normalized_query := lower(trim(p_query));
  
  -- Check if query is UUID format
  v_is_uuid := v_normalized_query ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  return query
  with workspace_matches as (
    select distinct
      case
        when w.id::text = v_normalized_query then 'workspace_id'
        when lower(w.slug) = v_normalized_query then 'workspace_slug'
        when lower(w.name) ilike '%' || v_normalized_query || '%' then 'workspace_name'
        else 'other'
      end as match_type,
      w.id as workspace_id,
      w.slug as workspace_slug,
      w.name as workspace_name,
      w.status as workspace_status,
      coalesce(s.plan_id, 'free') as workspace_plan,
      w.created_at as workspace_created_at,
      null::uuid as user_id,
      null::text as user_email,
      null::text as user_phone,
      (
        select u.email from auth.users u
        join public.workspace_memberships wm on wm.user_id = u.id
        where wm.workspace_id = w.id and wm.role = 'owner'
        limit 1
      ) as owner_email,
      (
        select jsonb_object_agg(we.entitlement_key, we.is_enabled)
        from public.workspace_entitlements we
        where we.workspace_id = w.id
      ) as entitlements,
      (
        select tw.balance from public.token_wallets tw
        where tw.workspace_id = w.id
        limit 1
      ) as token_balance,
      case
        when w.id::text = v_normalized_query then 100.0
        when lower(w.slug) = v_normalized_query then 90.0
        when lower(w.name) = v_normalized_query then 80.0
        when lower(w.name) ilike v_normalized_query || '%' then 70.0
        else 50.0
      end as relevance_score
    from public.workspaces w
    left join public.subscriptions s on s.workspace_id = w.id
    where
      (v_is_uuid and w.id::text = v_normalized_query)
      or lower(w.slug) = v_normalized_query
      or lower(w.slug) ilike '%' || v_normalized_query || '%'
      or lower(w.name) ilike '%' || v_normalized_query || '%'
  ),
  user_matches as (
    select distinct
      case
        when u.id::text = v_normalized_query then 'user_id'
        when lower(u.email) = v_normalized_query then 'email'
        when u.phone = v_normalized_query then 'phone'
        when lower(u.email) ilike '%' || v_normalized_query || '%' then 'email_partial'
        else 'other'
      end as match_type,
      wm.workspace_id,
      w.slug as workspace_slug,
      w.name as workspace_name,
      w.status as workspace_status,
      coalesce(s.plan_id, 'free') as workspace_plan,
      w.created_at as workspace_created_at,
      u.id as user_id,
      u.email as user_email,
      u.phone as user_phone,
      (
        select owner.email from auth.users owner
        join public.workspace_memberships owner_wm on owner_wm.user_id = owner.id
        where owner_wm.workspace_id = w.id and owner_wm.role = 'owner'
        limit 1
      ) as owner_email,
      (
        select jsonb_object_agg(we.entitlement_key, we.is_enabled)
        from public.workspace_entitlements we
        where we.workspace_id = w.id
      ) as entitlements,
      (
        select tw.balance from public.token_wallets tw
        where tw.workspace_id = w.id
        limit 1
      ) as token_balance,
      case
        when u.id::text = v_normalized_query then 100.0
        when lower(u.email) = v_normalized_query then 95.0
        when u.phone = v_normalized_query then 95.0
        when lower(u.email) ilike v_normalized_query || '%' then 70.0
        else 50.0
      end as relevance_score
    from auth.users u
    join public.workspace_memberships wm on wm.user_id = u.id
    join public.workspaces w on w.id = wm.workspace_id
    left join public.subscriptions s on s.workspace_id = w.id
    where
      (v_is_uuid and u.id::text = v_normalized_query)
      or lower(u.email) = v_normalized_query
      or lower(u.email) ilike '%' || v_normalized_query || '%'
      or u.phone = v_normalized_query
      or u.phone ilike '%' || v_normalized_query || '%'
  ),
  all_matches as (
    select * from workspace_matches
    union all
    select * from user_matches
  )
  select
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
  from all_matches am
  order by am.relevance_score desc, am.workspace_created_at desc
  limit p_limit;
end;
$$;

comment on function public.ops_search_customers is 'Search customers by email, phone, workspace slug/id, or user id. Returns ranked results with workspace and user details.';

-- ============================================================================
-- FIX 2: Grant platform admin access to giusty@gigaviz.com
-- ============================================================================

insert into public.platform_admins (user_id, created_by)
select 
  u.id,
  u.id  -- self-granted
from auth.users u
where u.email = 'giusty@gigaviz.com'
on conflict (user_id) do nothing;

-- Verify the insert
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.platform_admins pa
  join auth.users u on u.id = pa.user_id
  where u.email = 'giusty@gigaviz.com';
  
  if v_count > 0 then
    raise notice '✅ Platform admin access granted to giusty@gigaviz.com';
  else
    raise warning '⚠️ User giusty@gigaviz.com not found in auth.users';
  end if;
end $$;
