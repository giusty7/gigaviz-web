-- Phase 2.1: Customer Lookup - Database Schema
-- Migration: ops_customer_searches table + RPC search function

-- ============================================================================
-- 1. Create ops_customer_searches table
-- ============================================================================

create table if not exists public.ops_customer_searches (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  actor_email text,
  query text not null,
  query_type text, -- 'email', 'phone', 'workspace_slug', 'workspace_id', 'user_id'
  result_count int default 0,
  results_preview jsonb, -- Store first few results for quick view
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_ops_customer_searches_actor on public.ops_customer_searches(actor_user_id, created_at desc);
create index if not exists idx_ops_customer_searches_created on public.ops_customer_searches(created_at desc);
create index if not exists idx_ops_customer_searches_query on public.ops_customer_searches using gin(to_tsvector('english', query));

-- RLS: Only platform admins can access
alter table public.ops_customer_searches enable row level security;

drop policy if exists "Platform admins can view search history" on public.ops_customer_searches;
drop policy if exists platform_admins_can_view_search_history on public.ops_customer_searches;
create policy "Platform admins can view search history"
  on public.ops_customer_searches
  for select
  using (
    exists (
      select 1 from public.platform_admins
      where user_id = auth.uid()
    )
  );

drop policy if exists "Platform admins can insert searches" on public.ops_customer_searches;
drop policy if exists platform_admins_can_insert_searches on public.ops_customer_searches;
create policy "Platform admins can insert searches"
  on public.ops_customer_searches
  for insert
  with check (
    exists (
      select 1 from public.platform_admins
      where user_id = auth.uid()
    )
    and actor_user_id = auth.uid()
  );

-- ============================================================================
-- 2. Create RPC function for customer search
-- ============================================================================

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
    select 1 from public.platform_admins where user_id = auth.uid()
  ) then
    raise exception 'Access denied: platform admin only';
  end if;

  -- Normalize query
  v_normalized_query := lower(trim(p_query));
  
  -- Check if query is UUID format
  v_is_uuid := v_normalized_query ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  -- Search strategy:
  -- 1. Exact UUID match (workspace_id or user_id)
  -- 2. Workspace slug match
  -- 3. Email match (user or workspace owner)
  -- 4. Phone match (normalized)
  -- 5. Fuzzy name match

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
      coalesce(w.plan, 'free') as workspace_plan,
      w.created_at as workspace_created_at,
      null::uuid as user_id,
      null::text as user_email,
      null::text as user_phone,
      (
        select email from auth.users u
        join public.workspace_memberships wm on wm.user_id = u.id
        where wm.workspace_id = w.id and wm.role = 'owner'
        limit 1
      ) as owner_email,
      (
        select jsonb_object_agg(entitlement_key, is_enabled)
        from public.workspace_entitlements
        where workspace_id = w.id
      ) as entitlements,
      (
        select balance from public.token_wallets
        where workspace_id = w.id
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
      coalesce(w.plan, 'free') as workspace_plan,
      w.created_at as workspace_created_at,
      u.id as user_id,
      u.email as user_email,
      u.phone as user_phone,
      (
        select email from auth.users owner
        join public.workspace_memberships owner_wm on owner_wm.user_id = owner.id
        where owner_wm.workspace_id = w.id and owner_wm.role = 'owner'
        limit 1
      ) as owner_email,
      (
        select jsonb_object_agg(entitlement_key, is_enabled)
        from public.workspace_entitlements
        where workspace_id = w.id
      ) as entitlements,
      (
        select balance from public.token_wallets
        where workspace_id = w.id
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

-- Grant execute to authenticated users (RLS + platform_admin check inside function handles security)
grant execute on function public.ops_search_customers to authenticated;

-- ============================================================================
-- 3. Comments for documentation
-- ============================================================================

comment on table public.ops_customer_searches is 'Logs all customer search queries performed by platform admins in ops console';
comment on function public.ops_search_customers is 'Search customers by email, phone, workspace slug/id, or user id. Returns ranked results with workspace and user details.';
