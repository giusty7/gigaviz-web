-- =====================================================
-- MARKETPLACE PRODUCT MIGRATION
-- =====================================================
-- Marketplace for buying/selling templates, prompts, assets, mini-apps
-- Revenue model: Commission-based (15% platform fee)
-- Target users: Creators, businesses, agencies

-- =====================================================
-- 1. MARKETPLACE ITEMS CATALOG
-- =====================================================
create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  creator_workspace_id uuid not null references public.workspaces(id) on delete cascade,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Item basics
  title text not null,
  slug text not null unique,
  description text not null,
  category text not null check (category in ('template', 'prompt_pack', 'asset', 'mini_app', 'integration')),
  subcategory text, -- e.g., 'whatsapp_template', 'email_template', 'ai_prompt', 'graphic', 'widget'
  
  -- Pricing
  price_usd integer not null default 0, -- in cents (0 = free)
  price_idr bigint not null default 0, -- in rupiah
  currency text not null default 'USD' check (currency in ('USD', 'IDR')),
  
  -- Media
  thumbnail_url text,
  preview_images text[], -- Array of image URLs
  demo_url text, -- Live demo or video
  
  -- Content
  download_url text, -- S3/Supabase storage URL (protected)
  file_size_bytes bigint,
  file_format text, -- e.g., 'json', 'zip', 'pdf', 'js'
  
  -- Metadata
  tags text[] default array[]::text[],
  compatible_with text[] default array[]::text[], -- e.g., ['studio', 'helper', 'office']
  version text default '1.0.0',
  license_type text default 'single_use' check (license_type in ('single_use', 'multi_use', 'unlimited')),
  
  -- Stats
  downloads_count integer default 0,
  purchases_count integer default 0,
  views_count integer default 0,
  rating_average decimal(3,2) default 0.0 check (rating_average >= 0 and rating_average <= 5),
  reviews_count integer default 0,
  
  -- Status
  status text not null default 'draft' check (status in ('draft', 'under_review', 'approved', 'rejected', 'archived')),
  published_at timestamptz,
  rejected_reason text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketplace_items_creator_workspace on public.marketplace_items(creator_workspace_id);
create index if not exists idx_marketplace_items_category on public.marketplace_items(category);
create index if not exists idx_marketplace_items_status on public.marketplace_items(status);
create index if not exists idx_marketplace_items_published on public.marketplace_items(published_at) where status = 'approved';
create index if not exists idx_marketplace_items_slug on public.marketplace_items(slug);

comment on table public.marketplace_items is 'Marketplace items catalog - templates, prompts, assets, mini-apps';

-- =====================================================
-- 2. MARKETPLACE PURCHASES
-- =====================================================
create table if not exists public.marketplace_purchases (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.marketplace_items(id) on delete restrict,
  buyer_workspace_id uuid not null references public.workspaces(id) on delete cascade,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Transaction
  price_paid_cents integer not null,
  currency text not null,
  platform_fee_cents integer not null, -- 15% commission
  creator_earnings_cents integer not null, -- 85% payout
  
  -- Payment integration prep (for future)
  payment_method text default 'credits', -- 'credits', 'stripe', 'xendit', 'midtrans'
  payment_status text not null default 'pending' check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
  payment_provider_id text, -- External transaction ID
  
  -- License
  license_key uuid default gen_random_uuid(), -- Unique license per purchase
  license_type text not null,
  download_count integer default 0,
  download_limit integer default 3, -- Allow 3 downloads per purchase
  
  purchased_at timestamptz not null default now(),
  refunded_at timestamptz,
  refund_reason text
);

create index if not exists idx_marketplace_purchases_buyer on public.marketplace_purchases(buyer_workspace_id);
create index if not exists idx_marketplace_purchases_item on public.marketplace_purchases(item_id);
create index if not exists idx_marketplace_purchases_creator on public.marketplace_purchases(item_id, purchased_at);

comment on table public.marketplace_purchases is 'Marketplace purchase transactions and licenses';

-- =====================================================
-- 3. MARKETPLACE REVIEWS
-- =====================================================
create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.marketplace_items(id) on delete cascade,
  purchase_id uuid not null references public.marketplace_purchases(id) on delete cascade,
  reviewer_workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Review content
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text,
  
  -- Creator response
  creator_response text,
  creator_responded_at timestamptz,
  
  -- Moderation
  is_verified_purchase boolean default true,
  is_flagged boolean default false,
  flag_reason text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- One review per purchase
  unique(purchase_id)
);

create index if not exists idx_marketplace_reviews_item on public.marketplace_reviews(item_id);
create index if not exists idx_marketplace_reviews_reviewer on public.marketplace_reviews(reviewer_workspace_id);

comment on table public.marketplace_reviews is 'Marketplace item reviews and ratings';

-- =====================================================
-- 4. MARKETPLACE CREATOR PROFILES
-- =====================================================
create table if not exists public.marketplace_creators (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  
  -- Creator info
  display_name text not null,
  bio text,
  avatar_url text,
  website_url text,
  
  -- Stats
  total_items integer default 0,
  total_sales integer default 0,
  total_revenue_cents bigint default 0,
  total_earnings_cents bigint default 0, -- After 15% platform fee
  average_rating decimal(3,2) default 0.0,
  
  -- Verification
  is_verified boolean default false,
  verified_at timestamptz,
  
  -- Payout info (for future integration)
  payout_email text,
  payout_method text, -- 'bank', 'paypal', 'wise', 'crypto'
  payout_details jsonb, -- Store encrypted bank details
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.marketplace_creators is 'Marketplace creator profiles and payout settings';

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Public can browse approved items
alter table public.marketplace_items enable row level security;
drop policy if exists "marketplace_items_public_read" on public.marketplace_items;
drop policy if exists marketplace_items_public_read on public.marketplace_items;
create policy "marketplace_items_public_read"
  on public.marketplace_items
  for select
  using (status = 'approved');

-- Creators can manage their own items
drop policy if exists "marketplace_items_creator_all" on public.marketplace_items;
drop policy if exists marketplace_items_creator_all on public.marketplace_items;
create policy "marketplace_items_creator_all"
  on public.marketplace_items
  for all
  using (
    creator_workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Buyers can view their purchases
alter table public.marketplace_purchases enable row level security;
drop policy if exists "marketplace_purchases_buyer_read" on public.marketplace_purchases;
drop policy if exists marketplace_purchases_buyer_read on public.marketplace_purchases;
create policy "marketplace_purchases_buyer_read"
  on public.marketplace_purchases
  for select
  using (
    buyer_workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Creators can view their sales
drop policy if exists "marketplace_purchases_creator_read" on public.marketplace_purchases;
drop policy if exists marketplace_purchases_creator_read on public.marketplace_purchases;
create policy "marketplace_purchases_creator_read"
  on public.marketplace_purchases
  for select
  using (
    item_id in (
      select id from marketplace_items
      where creator_workspace_id in (
        select workspace_id from workspace_memberships where user_id = auth.uid()
      )
    )
  );

-- Reviews: public read, buyers can write
alter table public.marketplace_reviews enable row level security;
drop policy if exists "marketplace_reviews_public_read" on public.marketplace_reviews;
drop policy if exists marketplace_reviews_public_read on public.marketplace_reviews;
create policy "marketplace_reviews_public_read"
  on public.marketplace_reviews
  for select
  using (true);

drop policy if exists "marketplace_reviews_buyer_write" on public.marketplace_reviews;
drop policy if exists marketplace_reviews_buyer_write on public.marketplace_reviews;
create policy "marketplace_reviews_buyer_write"
  on public.marketplace_reviews
  for insert
  with check (
    reviewer_workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Creator profiles: public read, owner write
alter table public.marketplace_creators enable row level security;
drop policy if exists "marketplace_creators_public_read" on public.marketplace_creators;
drop policy if exists marketplace_creators_public_read on public.marketplace_creators;
create policy "marketplace_creators_public_read"
  on public.marketplace_creators
  for select
  using (true);

drop policy if exists "marketplace_creators_owner_write" on public.marketplace_creators;
drop policy if exists marketplace_creators_owner_write on public.marketplace_creators;
create policy "marketplace_creators_owner_write"
  on public.marketplace_creators
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- =====================================================
-- 6. SEED DATA
-- =====================================================

-- Seed sample items (for demo/testing)
insert into public.marketplace_items (
  creator_workspace_id,
  creator_user_id,
  title,
  slug,
  description,
  category,
  subcategory,
  price_usd,
  price_idr,
  currency,
  tags,
  compatible_with,
  status,
  published_at
) values
(
  (select id from workspaces limit 1),
  (select id from auth.users limit 1),
  'WhatsApp Welcome Message Template Pack',
  'whatsapp-welcome-pack',
  'Professional welcome message templates for WhatsApp Business. Includes 10 templates in English and Bahasa Indonesia.',
  'template',
  'whatsapp_template',
  999, -- $9.99
  150000,
  'USD',
  array['whatsapp', 'templates', 'business', 'welcome'],
  array['meta-hub'],
  'approved',
  now()
),
(
  (select id from workspaces limit 1),
  (select id from auth.users limit 1),
  'AI Prompt Engineering Starter Kit',
  'ai-prompt-starter',
  '50 battle-tested AI prompts for sales, marketing, and customer support. Works with ChatGPT, Claude, and Gemini.',
  'prompt_pack',
  'ai_prompt',
  1499, -- $14.99
  225000,
  'USD',
  array['ai', 'prompts', 'productivity', 'marketing'],
  array['studio', 'helper'],
  'approved',
  now()
),
(
  (select id from workspaces limit 1),
  (select id from auth.users limit 1),
  'CRM Dashboard UI Kit',
  'crm-dashboard-ui',
  'Modern CRM dashboard components built with React and Tailwind CSS. Includes charts, tables, and forms.',
  'asset',
  'ui_kit',
  2999, -- $29.99
  450000,
  'USD',
  array['ui', 'react', 'tailwind', 'crm'],
  array['platform'],
  'approved',
  now()
)
on conflict (slug) do nothing;

-- Update stats for demo
update public.marketplace_items
set 
  views_count = floor(random() * 1000 + 100)::int,
  downloads_count = floor(random() * 50 + 10)::int,
  purchases_count = floor(random() * 30 + 5)::int,
  rating_average = (random() * 2 + 3)::decimal(3,2), -- Random between 3.0 and 5.0
  reviews_count = floor(random() * 10 + 2)::int
where status = 'approved';
