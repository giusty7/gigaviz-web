-- Stage 0-1 hardening: workspace_members FK + RLS policies (idempotent)
-- Checklist:
-- - FK present: select conname from pg_constraint where conname = 'workspace_members_workspace_id_fkey';
-- - RLS enabled: select relname, relrowsecurity from pg_class where relname in ('workspaces', 'workspace_members');
-- - Policies: select tablename, policyname from pg_policies where tablename in ('workspaces', 'workspace_members');
-- - Indexes: select indexname from pg_indexes where tablename in ('workspaces', 'workspace_members');

create table if not exists workspace_members (
  workspace_id uuid,
  user_id uuid,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer', 'supervisor', 'agent')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Clean orphan workspace members before adding FK
delete from workspace_members wm
where not exists (
  select 1 from workspaces w where w.id = wm.workspace_id
);

-- Add FK to workspaces (safe if already present)
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
    where c.contype = 'f'
      and t.relname = 'workspace_members'
      and n.nspname = 'public'
      and pg_get_constraintdef(c.oid) like 'FOREIGN KEY (workspace_id) REFERENCES workspaces(id)%'
  ) then
    alter table public.workspace_members
      add constraint workspace_members_workspace_id_fkey
      foreign key (workspace_id)
      references public.workspaces(id)
      on delete cascade;
  end if;
end
$$;

-- Indexes for lookup + unique slug
create index if not exists idx_workspace_members_workspace_id on workspace_members(workspace_id);
create index if not exists idx_workspace_members_user_id on workspace_members(user_id);
create unique index if not exists workspaces_slug_lower_unique
  on public.workspaces (lower(slug));

-- RLS enforcement
alter table workspaces enable row level security;
alter table workspace_members enable row level security;

drop policy if exists workspaces_select_members on workspaces;
drop policy if exists workspaces_insert_owner on workspaces;
drop policy if exists workspaces_update_owner_admin on workspaces;

create policy workspaces_select_members on workspaces
  for select using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
    )
  );

create policy workspaces_insert_owner on workspaces
  for insert with check (auth.uid() = owner_id);

create policy workspaces_update_owner_admin on workspaces
  for update using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

drop policy if exists workspace_members_select on workspace_members;
drop policy if exists workspace_members_insert_admin on workspace_members;
drop policy if exists workspace_members_update_admin on workspace_members;
drop policy if exists workspace_members_delete_admin on workspace_members;

create policy workspace_members_select on workspace_members
  for select using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
    )
  );

create policy workspace_members_insert_admin on workspace_members
  for insert with check (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy workspace_members_update_admin on workspace_members
  for update using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy workspace_members_delete_admin on workspace_members
  for delete using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );
