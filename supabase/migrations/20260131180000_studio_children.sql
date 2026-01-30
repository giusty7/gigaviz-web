-- =====================================================
-- STUDIO CHILDREN PRODUCTS MIGRATION
-- =====================================================
-- Office: Document templates, formula assistant, workflow automation
-- Graph: Visual and analytics generation with AI
-- Tracks: Workflow orchestration and journey builder

-- =====================================================
-- 1. OFFICE PRODUCT
-- =====================================================

-- Office Templates (documents, spreadsheets, presentations)
create table if not exists public.office_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  
  -- Template info
  title text not null,
  slug text not null,
  description text,
  category text not null check (category in ('document', 'spreadsheet', 'presentation', 'form', 'workflow')),
  
  -- Content
  template_json jsonb not null default '{}'::jsonb, -- Template structure
  preview_url text, -- Screenshot or preview
  
  -- Meta
  tags text[] default array[]::text[],
  is_public boolean default false, -- Share with other workspaces
  usage_count integer default 0,
  
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(workspace_id, slug)
);

create index idx_office_templates_workspace on public.office_templates(workspace_id);
create index idx_office_templates_category on public.office_templates(category);

-- Office Documents (user-created instances)
create table if not exists public.office_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_id uuid references public.office_templates(id) on delete set null,
  
  -- Document info
  title text not null,
  category text not null check (category in ('document', 'spreadsheet', 'presentation', 'form', 'workflow')),
  
  -- Content
  content_json jsonb not null default '{}'::jsonb,
  
  -- Collaboration
  created_by uuid references auth.users(id) on delete set null,
  last_edited_by uuid references auth.users(id) on delete set null,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_office_documents_workspace on public.office_documents(workspace_id);
create index idx_office_documents_template on public.office_documents(template_id);

comment on table public.office_templates is 'Office product: reusable document templates';
comment on table public.office_documents is 'Office product: user-created documents';

-- =====================================================
-- 2. GRAPH PRODUCT
-- =====================================================

-- Graph Charts (visualizations)
create table if not exists public.graph_charts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  
  -- Chart info
  title text not null,
  description text,
  chart_type text not null check (chart_type in ('line', 'bar', 'pie', 'scatter', 'area', 'funnel', 'table')),
  
  -- Configuration
  config_json jsonb not null default '{}'::jsonb, -- Chart.js or similar config
  data_source text check (data_source in ('manual', 'query', 'api', 'supabase')),
  data_query text, -- SQL or API query
  data_json jsonb, -- Manual data or cached results
  
  -- Styling
  theme text default 'default',
  color_palette text[] default array['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']::text[],
  
  -- Meta
  is_public boolean default false,
  tags text[] default array[]::text[],
  
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_graph_charts_workspace on public.graph_charts(workspace_id);
create index idx_graph_charts_type on public.graph_charts(chart_type);

-- Graph Dashboards (collections of charts)
create table if not exists public.graph_dashboards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  
  -- Dashboard info
  title text not null,
  slug text not null,
  description text,
  
  -- Layout
  layout_json jsonb not null default '[]'::jsonb, -- Grid layout with chart positions
  
  -- Sharing
  is_public boolean default false,
  
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(workspace_id, slug)
);

create index idx_graph_dashboards_workspace on public.graph_dashboards(workspace_id);

comment on table public.graph_charts is 'Graph product: data visualizations and charts';
comment on table public.graph_dashboards is 'Graph product: dashboard collections';

-- =====================================================
-- 3. TRACKS PRODUCT
-- =====================================================

-- Tracks Workflows (journey definitions)
create table if not exists public.tracks_workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  
  -- Workflow info
  title text not null,
  slug text not null,
  description text,
  
  -- Configuration
  steps_json jsonb not null default '[]'::jsonb, -- Array of step definitions
  triggers_json jsonb default '[]'::jsonb, -- Trigger conditions
  
  -- State
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  
  -- Token cost
  estimated_tokens_per_run integer default 0,
  
  -- Stats
  runs_count integer default 0,
  success_count integer default 0,
  failure_count integer default 0,
  
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(workspace_id, slug)
);

create index idx_tracks_workflows_workspace on public.tracks_workflows(workspace_id);
create index idx_tracks_workflows_status on public.tracks_workflows(status);

-- Tracks Runs (workflow executions)
create table if not exists public.tracks_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.tracks_workflows(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  
  -- Run info
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'cancelled')),
  current_step integer default 0,
  
  -- Execution data
  input_data jsonb default '{}'::jsonb,
  output_data jsonb default '{}'::jsonb,
  error_message text,
  
  -- Token usage
  tokens_used integer default 0,
  
  -- Timing
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer
);

create index idx_tracks_runs_workflow on public.tracks_runs(workflow_id);
create index idx_tracks_runs_workspace on public.tracks_runs(workspace_id);
create index idx_tracks_runs_status on public.tracks_runs(status);

comment on table public.tracks_workflows is 'Tracks product: workflow orchestration definitions';
comment on table public.tracks_runs is 'Tracks product: workflow execution history';

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Office Templates
alter table public.office_templates enable row level security;
create policy "office_templates_workspace_all"
  on public.office_templates
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Office Documents
alter table public.office_documents enable row level security;
create policy "office_documents_workspace_all"
  on public.office_documents
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Graph Charts
alter table public.graph_charts enable row level security;
create policy "graph_charts_workspace_all"
  on public.graph_charts
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Graph Dashboards
alter table public.graph_dashboards enable row level security;
create policy "graph_dashboards_workspace_all"
  on public.graph_dashboards
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Tracks Workflows
alter table public.tracks_workflows enable row level security;
create policy "tracks_workflows_workspace_all"
  on public.tracks_workflows
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- Tracks Runs
alter table public.tracks_runs enable row level security;
create policy "tracks_runs_workspace_all"
  on public.tracks_runs
  for all
  using (
    workspace_id in (
      select workspace_id from workspace_memberships where user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. SEED DATA
-- =====================================================

-- Seed sample Office templates
insert into public.office_templates (
  workspace_id,
  title,
  slug,
  description,
  category,
  template_json,
  tags,
  is_public,
  created_by
) values
(
  (select id from workspaces limit 1),
  'Sales Report Template',
  'sales-report',
  'Monthly sales performance report with charts and metrics',
  'document',
  '{"sections": ["Executive Summary", "Sales Metrics", "Top Performers", "Recommendations"]}'::jsonb,
  array['sales', 'report', 'monthly'],
  true,
  (select id from auth.users limit 1)
),
(
  (select id from workspaces limit 1),
  'Budget Tracker',
  'budget-tracker',
  'Simple budget tracking spreadsheet with expense categories',
  'spreadsheet',
  '{"columns": ["Category", "Budgeted", "Actual", "Variance", "Notes"]}'::jsonb,
  array['finance', 'budget', 'tracking'],
  true,
  (select id from auth.users limit 1)
)
on conflict (workspace_id, slug) do nothing;

-- Seed sample Graph charts
insert into public.graph_charts (
  workspace_id,
  title,
  description,
  chart_type,
  config_json,
  data_source,
  tags,
  created_by
) values
(
  (select id from workspaces limit 1),
  'Monthly Revenue Trend',
  'Revenue performance over the last 12 months',
  'line',
  '{"labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], "datasets": [{"label": "Revenue", "data": [12000, 15000, 14500, 18000, 21000, 19500]}]}'::jsonb,
  'manual',
  array['revenue', 'trend', 'monthly'],
  (select id from auth.users limit 1)
),
(
  (select id from workspaces limit 1),
  'Lead Sources Breakdown',
  'Distribution of leads by source channel',
  'pie',
  '{"labels": ["Organic", "Paid Ads", "Referral", "Direct"], "datasets": [{"data": [35, 25, 20, 20]}]}'::jsonb,
  'manual',
  array['leads', 'marketing', 'channels'],
  (select id from auth.users limit 1)
)
on conflict do nothing;

-- Seed sample Tracks workflow
insert into public.tracks_workflows (
  workspace_id,
  title,
  slug,
  description,
  steps_json,
  status,
  estimated_tokens_per_run,
  created_by
) values
(
  (select id from workspaces limit 1),
  'New Lead Onboarding',
  'new-lead-onboarding',
  'Automated workflow for qualifying and routing new leads',
  '[
    {"id": "1", "type": "trigger", "name": "New Lead Created"},
    {"id": "2", "type": "ai_classify", "name": "Qualify Lead", "prompt": "Classify lead quality"},
    {"id": "3", "type": "condition", "name": "Check Quality"},
    {"id": "4", "type": "notify", "name": "Alert Sales Team"},
    {"id": "5", "type": "complete", "name": "End"}
  ]'::jsonb,
  'active',
  500,
  (select id from auth.users limit 1)
)
on conflict (workspace_id, slug) do nothing;
