-- Dashboard preferences per user per workspace
-- Allows users to customize their pinned modules in Quick Access section

-- 1) Create dashboard_preferences table
create table if not exists public.dashboard_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  pinned_modules jsonb not null default '["platform", "meta-hub", "helper"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, workspace_id)
);

-- 2) Create index for faster lookups
create index if not exists idx_dashboard_preferences_user_workspace 
  on public.dashboard_preferences(user_id, workspace_id);

-- 3) RLS policy: users can only access their own preferences
alter table public.dashboard_preferences enable row level security;

create policy "users_access_own_dashboard_preferences"
  on public.dashboard_preferences
  for all
  using (user_id = auth.uid());

-- 4) Updated_at trigger
create or replace function public.update_dashboard_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger dashboard_preferences_updated_at
  before update on public.dashboard_preferences
  for each row
  execute function public.update_dashboard_preferences_updated_at();

-- 5) Helper function to get or create default preferences
create or replace function public.get_dashboard_preferences(
  p_user_id uuid,
  p_workspace_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_pinned_modules jsonb;
begin
  -- Try to get existing preferences
  select pinned_modules into v_pinned_modules
  from public.dashboard_preferences
  where user_id = p_user_id and workspace_id = p_workspace_id;

  -- If not found, create default and return
  if v_pinned_modules is null then
    insert into public.dashboard_preferences (user_id, workspace_id, pinned_modules)
    values (p_user_id, p_workspace_id, '["platform", "meta-hub", "helper"]'::jsonb)
    on conflict (user_id, workspace_id) do nothing
    returning pinned_modules into v_pinned_modules;
  end if;

  return coalesce(v_pinned_modules, '["platform", "meta-hub", "helper"]'::jsonb);
end;
$$;

-- 6) Grant permissions
grant select, insert, update on public.dashboard_preferences to authenticated;
grant execute on function public.get_dashboard_preferences to authenticated;
