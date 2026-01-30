-- Migration: Apps Product (Catalog, Requests, Roadmap)
-- Created: 2026-01-31
-- Description: Complete Apps product with catalog, requests system, and public roadmap

-- ============================================================================
-- APPS CATALOG
-- ============================================================================

create table if not exists public.apps_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  category text not null, -- productivity, communication, analytics, etc.
  status text not null default 'coming_soon', -- coming_soon, beta, stable, deprecated
  icon_url text,
  banner_url text,
  pricing_model text, -- free, freemium, paid, enterprise
  pricing_details jsonb, -- flexible pricing structure
  features jsonb, -- array of feature strings
  screenshots jsonb, -- array of screenshot URLs
  integration_points jsonb, -- which products it integrates with
  required_permissions jsonb, -- array of permission strings
  external_url text, -- if app is hosted externally
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  launched_at timestamptz,
  deprecated_at timestamptz,
  
  constraint apps_catalog_category_check check (category in (
    'productivity', 'communication', 'analytics', 'marketing', 
    'sales', 'customer_service', 'integration', 'developer_tools', 'other'
  )),
  constraint apps_catalog_status_check check (status in (
    'coming_soon', 'beta', 'stable', 'deprecated'
  ))
);

create index if not exists idx_apps_catalog_status on public.apps_catalog(status);
create index if not exists idx_apps_catalog_category on public.apps_catalog(category);
create index if not exists idx_apps_catalog_launched on public.apps_catalog(launched_at) where launched_at is not null;

comment on table public.apps_catalog is 'Catalog of all Gigaviz apps (both released and coming soon)';

-- ============================================================================
-- APPS REQUESTS
-- ============================================================================

create table if not exists public.apps_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  app_name text not null,
  description text not null,
  use_case text,
  priority text not null default 'medium', -- low, medium, high, critical
  status text not null default 'pending', -- pending, reviewing, planned, in_progress, completed, rejected
  upvotes int not null default 0,
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint apps_requests_priority_check check (priority in ('low', 'medium', 'high', 'critical')),
  constraint apps_requests_status_check check (status in (
    'pending', 'reviewing', 'planned', 'in_progress', 'completed', 'rejected'
  ))
);

create index if not exists idx_apps_requests_workspace on public.apps_requests(workspace_id);
create index if not exists idx_apps_requests_user on public.apps_requests(user_id);
create index if not exists idx_apps_requests_status on public.apps_requests(status);
create index if not exists idx_apps_requests_priority on public.apps_requests(priority);
create index if not exists idx_apps_requests_upvotes on public.apps_requests(upvotes desc);

comment on table public.apps_requests is 'User requests for new apps or features in existing apps';

-- ============================================================================
-- APPS ROADMAP
-- ============================================================================

create table if not exists public.apps_roadmap (
  id uuid primary key default gen_random_uuid(),
  app_catalog_id uuid references public.apps_catalog(id) on delete set null,
  title text not null,
  description text not null,
  status text not null default 'planned', -- planned, in_progress, shipped, cancelled
  priority text not null default 'medium', -- low, medium, high, critical
  category text not null, -- feature, improvement, bugfix, integration
  quarter text, -- e.g., "Q1 2026", "Q2 2026"
  estimated_release timestamptz,
  shipped_at timestamptz,
  is_public boolean not null default true, -- show on public roadmap
  upvotes int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint apps_roadmap_status_check check (status in ('planned', 'in_progress', 'shipped', 'cancelled')),
  constraint apps_roadmap_priority_check check (priority in ('low', 'medium', 'high', 'critical')),
  constraint apps_roadmap_category_check check (category in ('feature', 'improvement', 'bugfix', 'integration'))
);

create index if not exists idx_apps_roadmap_app on public.apps_roadmap(app_catalog_id);
create index if not exists idx_apps_roadmap_status on public.apps_roadmap(status);
create index if not exists idx_apps_roadmap_quarter on public.apps_roadmap(quarter);
create index if not exists idx_apps_roadmap_public on public.apps_roadmap(is_public) where is_public = true;
create index if not exists idx_apps_roadmap_upvotes on public.apps_roadmap(upvotes desc);

comment on table public.apps_roadmap is 'Public roadmap showing upcoming features and apps';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Apps Catalog (public read, admin write)
alter table public.apps_catalog enable row level security;

create policy "apps_catalog_public_read"
  on public.apps_catalog
  for select
  to authenticated
  using (true);

-- Apps Requests (workspace-scoped)
alter table public.apps_requests enable row level security;

create policy "apps_requests_workspace_read"
  on public.apps_requests
  for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_memberships
      where user_id = auth.uid()
    )
  );

create policy "apps_requests_workspace_insert"
  on public.apps_requests
  for insert
  to authenticated
  with check (
    workspace_id in (
      select workspace_id
      from public.workspace_memberships
      where user_id = auth.uid()
    )
    and user_id = auth.uid()
  );

create policy "apps_requests_workspace_update"
  on public.apps_requests
  for update
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_memberships
      where user_id = auth.uid()
    )
  );

-- Apps Roadmap (public read for is_public=true items)
alter table public.apps_roadmap enable row level security;

create policy "apps_roadmap_public_read"
  on public.apps_roadmap
  for select
  to authenticated
  using (is_public = true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert initial apps catalog entries
insert into public.apps_catalog (slug, name, tagline, category, status, pricing_model, description)
values
  ('studio', 'Gigaviz Studio', 'Create stunning marketing content', 'productivity', 'stable', 'freemium', 'All-in-one content creation suite with Office, Graph, and Tracks modules'),
  ('meta-hub', 'Meta Hub', 'Manage all Meta platforms in one place', 'communication', 'stable', 'freemium', 'Unified inbox and automation for WhatsApp, Instagram, and Messenger'),
  ('helper', 'Helper', 'CRM and lead management', 'sales', 'stable', 'freemium', 'Simple CRM with contact management, leads tracking, and routing'),
  ('marketplace', 'Marketplace', 'Buy and sell digital products', 'integration', 'coming_soon', 'free', 'Digital marketplace for templates, plugins, and integrations'),
  ('arena', 'Arena', 'Tournament and event management', 'productivity', 'coming_soon', 'freemium', 'Organize tournaments, competitions, and community events'),
  ('pay', 'Gigaviz Pay', 'Payment processing', 'sales', 'coming_soon', 'paid', 'Integrated payment gateway for Indonesian businesses'),
  ('community', 'Community', 'Build engaged communities', 'customer_service', 'coming_soon', 'freemium', 'Community management platform with forums and discussions'),
  ('trade', 'Trade', 'E-commerce platform', 'sales', 'coming_soon', 'paid', 'Complete e-commerce solution for online sellers')
on conflict (slug) do nothing;

-- Insert sample roadmap items
insert into public.apps_roadmap (title, description, status, priority, category, quarter, is_public)
values
  ('Marketplace Beta Launch', 'Launch beta version of Marketplace with template marketplace', 'in_progress', 'high', 'feature', 'Q1 2026', true),
  ('Arena MVP', 'Release MVP of Arena with basic tournament management', 'planned', 'high', 'feature', 'Q2 2026', true),
  ('Pay Integration', 'Integrate Gigaviz Pay with Meta Hub for payment links in WhatsApp', 'planned', 'medium', 'integration', 'Q2 2026', true),
  ('Community Forums', 'Add forum functionality to Community product', 'planned', 'medium', 'feature', 'Q2 2026', true),
  ('Trade Catalog Management', 'Product catalog management for Trade', 'planned', 'low', 'feature', 'Q3 2026', true)
on conflict do nothing;
