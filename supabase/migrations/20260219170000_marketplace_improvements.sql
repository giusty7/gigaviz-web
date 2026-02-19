-- =====================================================
-- MARKETPLACE IMPROVEMENTS MIGRATION
-- =====================================================
-- Phase 1: INSERT policy for purchases, helper RPCs
-- Phase 2: Creator stats update, review system support

-- =====================================================
-- 1. INSERT POLICY FOR MARKETPLACE PURCHASES
-- =====================================================
-- Buyers can create purchases (missing from original migration)
drop policy if exists "marketplace_purchases_buyer_insert" on public.marketplace_purchases;
create policy "marketplace_purchases_buyer_insert"
  on public.marketplace_purchases
  for insert
  with check (
    buyer_workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
    and buyer_user_id = auth.uid()
  );

-- =====================================================
-- 2. UPDATE POLICY FOR MARKETPLACE PURCHASES (download_count)
-- =====================================================
drop policy if exists "marketplace_purchases_buyer_update" on public.marketplace_purchases;
create policy "marketplace_purchases_buyer_update"
  on public.marketplace_purchases
  for update
  using (
    buyer_workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  )
  with check (
    buyer_workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. UPDATE POLICY FOR MARKETPLACE REVIEWS (creator response)
-- =====================================================
drop policy if exists "marketplace_reviews_creator_update" on public.marketplace_reviews;
create policy "marketplace_reviews_creator_update"
  on public.marketplace_reviews
  for update
  using (
    item_id in (
      select id from marketplace_items
      where creator_workspace_id in (
        select workspace_id from workspace_memberships where user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 4. HELPER RPC: INCREMENT CREATOR STATS
-- =====================================================
create or replace function public.increment_marketplace_creator_stats(
  p_workspace_id uuid,
  p_sales integer default 0,
  p_revenue integer default 0,
  p_earnings integer default 0
)
returns void
language plpgsql
security definer
as $$
begin
  update marketplace_creators
  set
    total_sales = total_sales + p_sales,
    total_revenue_cents = total_revenue_cents + p_revenue,
    total_earnings_cents = total_earnings_cents + p_earnings,
    updated_at = now()
  where workspace_id = p_workspace_id;
end;
$$;

-- =====================================================
-- 5. HELPER RPC: INCREMENT DOWNLOAD COUNT
-- =====================================================
create or replace function public.increment_marketplace_download_count(
  p_item_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update marketplace_items
  set
    downloads_count = downloads_count + 1,
    updated_at = now()
  where id = p_item_id;
end;
$$;

-- =====================================================
-- 6. HELPER RPC: UPDATE ITEM RATING AVERAGE
-- =====================================================
create or replace function public.update_marketplace_item_rating(
  p_item_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update marketplace_items
  set
    rating_average = coalesce(
      (select avg(rating)::decimal(3,2) from marketplace_reviews where item_id = p_item_id),
      0.0
    ),
    reviews_count = (select count(*) from marketplace_reviews where item_id = p_item_id),
    updated_at = now()
  where id = p_item_id;
end;
$$;

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================
create index if not exists idx_marketplace_purchases_buyer_item
  on public.marketplace_purchases(buyer_workspace_id, item_id);

create index if not exists idx_marketplace_purchases_license
  on public.marketplace_purchases(license_key);

create index if not exists idx_marketplace_reviews_rating
  on public.marketplace_reviews(item_id, rating);
