-- Core OS Stage 1: workspaces, members, invites, audit logs
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

create extension if not exists "pgcrypto";

alter table workspaces
  add column if not exists workspace_type text not null default 'team'
    check (workspace_type in ('individual', 'team'));

create table if not exists workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer', 'supervisor', 'agent')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member', 'viewer')),
  token_hash text not null,
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz null,
  revoked_at timestamptz null
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  target_type text null,
  target_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_members_user_id on workspace_members(user_id);
create index if not exists idx_workspace_invites_workspace_email on workspace_invites(workspace_id, lower(email));
create index if not exists idx_workspace_invites_expires_at on workspace_invites(expires_at);
create index if not exists idx_audit_logs_workspace_created on audit_logs(workspace_id, created_at desc);

insert into workspace_members (workspace_id, user_id, role, created_at)
select workspace_id, user_id, role, created_at
from workspace_memberships
on conflict do nothing;

create or replace function handle_new_workspace_members()
returns trigger as $$
begin
  insert into workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_handle_new_workspace_members on workspaces;
create trigger trg_handle_new_workspace_members
  after insert on workspaces
  for each row
  execute procedure handle_new_workspace_members();

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table workspace_invites enable row level security;
alter table audit_logs enable row level security;

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

drop policy if exists workspace_invites_select_admin on workspace_invites;
drop policy if exists workspace_invites_insert_admin on workspace_invites;
drop policy if exists workspace_invites_update_admin on workspace_invites;

create policy workspace_invites_select_admin on workspace_invites
  for select using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_invites.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy workspace_invites_insert_admin on workspace_invites
  for insert with check (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_invites.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy workspace_invites_update_admin on workspace_invites
  for update using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_invites.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

drop policy if exists audit_logs_select_members on audit_logs;
drop policy if exists audit_logs_insert_members on audit_logs;

create policy audit_logs_select_members on audit_logs
  for select using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = audit_logs.workspace_id
        and wm.user_id = auth.uid()
    )
  );

create policy audit_logs_insert_members on audit_logs
  for insert with check (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = audit_logs.workspace_id
        and wm.user_id = auth.uid()
    )
  );
