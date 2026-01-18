-- Owner/Internal Ops Console foundation
create extension if not exists "pgcrypto";

-- Workspace status + suspension fields
alter table if exists public.workspaces add column if not exists status text default 'active';
update public.workspaces set status = 'active' where status is null;

do $do$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspaces'
      and column_name = 'status'
  ) then
    if not exists (
      select 1 from pg_constraint
      where conname = 'workspaces_status_check'
        and conrelid = 'public.workspaces'::regclass
    ) then
      execute $sql$alter table public.workspaces
        add constraint workspaces_status_check check (status in ('active', 'suspended'))$sql$;
    end if;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'workspaces' and column_name = 'status' and is_nullable = 'YES'
    ) then
      if not exists (select 1 from public.workspaces where status is null) then
        execute 'alter table public.workspaces alter column status set not null';
      end if;
    end if;
  end if;
end
$do$;

alter table if exists public.workspaces add column if not exists suspended_at timestamptz;
alter table if exists public.workspaces add column if not exists suspended_reason text;
alter table if exists public.workspaces add column if not exists suspended_by uuid references auth.users(id);

create index if not exists workspaces_status_idx on public.workspaces (status);

-- Owner allowlist
create table if not exists owner_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'owner' check (role in ('owner', 'ops', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  notes text
);

create index if not exists owner_members_email_idx on owner_members (lower(email));

alter table owner_members enable row level security;
drop policy if exists owner_members_service_role on owner_members;
create policy owner_members_service_role
on owner_members
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Owner workspace notes
create table if not exists owner_workspace_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_user_id uuid references auth.users(id),
  author_email text,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists owner_workspace_notes_workspace_idx
  on owner_workspace_notes (workspace_id, created_at desc);

alter table owner_workspace_notes enable row level security;
drop policy if exists owner_workspace_notes_service_role on owner_workspace_notes;
create policy owner_workspace_notes_service_role
on owner_workspace_notes
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Feature flags (owner-controlled)
create table if not exists owner_feature_flags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  flag_key text not null,
  enabled boolean not null default true,
  value jsonb,
  notes text,
  updated_by uuid references auth.users(id),
  updated_email text,
  updated_at timestamptz not null default now(),
  constraint owner_feature_flags_key_unique unique (workspace_id, flag_key)
);

create index if not exists owner_feature_flags_workspace_idx
  on owner_feature_flags (workspace_id);
create index if not exists owner_feature_flags_key_idx
  on owner_feature_flags (flag_key);

alter table owner_feature_flags enable row level security;
drop policy if exists owner_feature_flags_service_role on owner_feature_flags;
create policy owner_feature_flags_service_role
on owner_feature_flags
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Owner audit log
create table if not exists owner_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_user_id uuid references auth.users(id),
  actor_email text,
  actor_role text,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  target_table text,
  target_id text,
  before_data jsonb,
  after_data jsonb,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists owner_audit_log_workspace_created_idx
  on owner_audit_log (workspace_id, created_at desc);
create index if not exists owner_audit_log_actor_idx
  on owner_audit_log (actor_user_id);
create index if not exists owner_audit_log_action_idx
  on owner_audit_log (action);

alter table owner_audit_log enable row level security;
drop policy if exists owner_audit_log_service_role on owner_audit_log;
create policy owner_audit_log_service_role
on owner_audit_log
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
