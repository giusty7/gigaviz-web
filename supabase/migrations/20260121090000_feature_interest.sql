-- 20260121090000_feature_interest.sql
-- Idempotent + backward compatible migration for feature_interest

create table if not exists public.feature_interest (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- legacy installs may have module_key; we standardize on module_slug
  module_slug text,
  notes text,
  created_at timestamptz not null default now()
);

-- Legacy compatibility: some DBs created module_key first
alter table public.feature_interest
  add column if not exists module_key text;

-- Ensure module_slug exists (for older schema)
alter table public.feature_interest
  add column if not exists module_slug text;

-- Backfill module_slug from legacy module_key if needed
update public.feature_interest
set module_slug = coalesce(module_slug, module_key)
where module_slug is null;

-- Prefer module_slug going forward
alter table public.feature_interest
  alter column module_slug set not null;

-- module_key is legacy; keep it nullable (so new inserts can omit it)
alter table public.feature_interest
  alter column module_key drop not null;

create index if not exists feature_interest_workspace_idx
  on public.feature_interest (workspace_id);

create index if not exists feature_interest_user_idx
  on public.feature_interest (user_id);

create index if not exists feature_interest_module_idx
  on public.feature_interest (module_slug);

alter table public.feature_interest enable row level security;

drop policy if exists feature_interest_select_own_workspace on public.feature_interest;
drop policy if exists feature_interest_insert_own_workspace on public.feature_interest;

create policy feature_interest_select_own_workspace
on public.feature_interest
for select
using (
  workspace_id in (
    select wm.workspace_id
    from public.workspace_members wm
    where wm.user_id = auth.uid()
  )
);

create policy feature_interest_insert_own_workspace
on public.feature_interest
for insert
with check (
  workspace_id in (
    select wm.workspace_id
    from public.workspace_members wm
    where wm.user_id = auth.uid()
  )
  and user_id = auth.uid()
);
