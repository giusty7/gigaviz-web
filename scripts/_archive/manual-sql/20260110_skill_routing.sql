-- Skill-based routing: categories, team mappings, rules, conversation category
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

create table if not exists routing_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  key text not null,
  label text not null,
  created_at timestamptz not null default now(),
  constraint routing_categories_unique_key unique (workspace_id, key)
);

create table if not exists team_categories (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  category_id uuid not null references routing_categories(id) on delete cascade,
  is_active boolean not null default true,
  constraint team_categories_unique_pair unique (team_id, category_id)
);

alter table conversations
  add column if not exists category_id uuid references routing_categories(id);

create table if not exists routing_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  category_id uuid not null references routing_categories(id) on delete cascade,
  keywords text[] not null,
  created_at timestamptz not null default now()
);

create index if not exists conversations_category_idx
  on conversations (workspace_id, category_id);

create index if not exists team_categories_category_idx
  on team_categories (category_id, is_active);

create index if not exists team_categories_team_idx
  on team_categories (team_id);

create index if not exists routing_rules_workspace_idx
  on routing_rules (workspace_id, category_id);

alter table routing_categories enable row level security;
alter table team_categories enable row level security;
alter table routing_rules enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'routing_categories'
      and policyname = 'admin_select_routing_categories'
  ) then
    create policy admin_select_routing_categories
      on routing_categories for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = routing_categories.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'routing_categories'
      and policyname = 'admin_insert_routing_categories'
  ) then
    create policy admin_insert_routing_categories
      on routing_categories for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = routing_categories.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'routing_categories'
      and policyname = 'admin_update_routing_categories'
  ) then
    create policy admin_update_routing_categories
      on routing_categories for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = routing_categories.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'routing_categories'
      and policyname = 'admin_delete_routing_categories'
  ) then
    create policy admin_delete_routing_categories
      on routing_categories for delete
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = routing_categories.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_categories'
      and policyname = 'admin_select_team_categories'
  ) then
    create policy admin_select_team_categories
      on team_categories for select
      using (
        exists (
          select 1
          from teams t
          join workspace_members wm
            on wm.workspace_id = t.workspace_id
          where t.id = team_categories.team_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_categories'
      and policyname = 'admin_insert_team_categories'
  ) then
    create policy admin_insert_team_categories
      on team_categories for insert with check (
        exists (
          select 1
          from teams t
          join workspace_members wm
            on wm.workspace_id = t.workspace_id
          where t.id = team_categories.team_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_categories'
      and policyname = 'admin_update_team_categories'
  ) then
    create policy admin_update_team_categories
      on team_categories for update
      using (
        exists (
          select 1
          from teams t
          join workspace_members wm
            on wm.workspace_id = t.workspace_id
          where t.id = team_categories.team_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_categories'
      and policyname = 'admin_delete_team_categories'
  ) then
    create policy admin_delete_team_categories
      on team_categories for delete
      using (
        exists (
          select 1
          from teams t
          join workspace_members wm
            on wm.workspace_id = t.workspace_id
          where t.id = team_categories.team_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'routing_rules'
      and policyname = 'admin_select_routing_rules'
  ) then
    create policy admin_select_routing_rules
      on routing_rules for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = routing_rules.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'routing_rules'
      and policyname = 'admin_insert_routing_rules'
  ) then
    create policy admin_insert_routing_rules
      on routing_rules for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = routing_rules.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'routing_rules'
      and policyname = 'admin_update_routing_rules'
  ) then
    create policy admin_update_routing_rules
      on routing_rules for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = routing_rules.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'routing_rules'
      and policyname = 'admin_delete_routing_rules'
  ) then
    create policy admin_delete_routing_rules
      on routing_rules for delete
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = routing_rules.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;
end
$$;

-- Rollback notes:
-- drop policy if exists admin_select_routing_rules on routing_rules;
-- drop policy if exists admin_insert_routing_rules on routing_rules;
-- drop policy if exists admin_update_routing_rules on routing_rules;
-- drop policy if exists admin_delete_routing_rules on routing_rules;
-- drop policy if exists admin_select_team_categories on team_categories;
-- drop policy if exists admin_insert_team_categories on team_categories;
-- drop policy if exists admin_update_team_categories on team_categories;
-- drop policy if exists admin_delete_team_categories on team_categories;
-- drop policy if exists admin_select_routing_categories on routing_categories;
-- drop policy if exists admin_insert_routing_categories on routing_categories;
-- drop policy if exists admin_update_routing_categories on routing_categories;
-- drop policy if exists admin_delete_routing_categories on routing_categories;
-- drop table if exists routing_rules;
-- drop table if exists team_categories;
-- drop table if exists routing_categories;
-- alter table conversations drop column if exists category_id;
