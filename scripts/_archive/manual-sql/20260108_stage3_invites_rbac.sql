-- Stage 3: workspace_invites + RLS + indexes (idempotent)
-- File: docs/sql/20260108_stage3_invites_rbac.sql
-- Notes:
-- - Safe to run multiple times.
-- - If table already existed from an earlier run, this migration will ADD missing columns/constraints safely.
-- - Accept flow (mark accepted_by/accepted_at + add workspace_members) should be executed with Service Role.

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- 1) Create table (first-time only)
create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  email text not null,
  role text not null,
  token text not null,
  invited_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz null,
  accepted_by uuid null,
  revoked_at timestamptz null
);

-- 2) Backfill/patch for older deployments (ADD missing columns if table existed)
-- (This is what fixes your current error: accepted_by didn't exist yet.)
alter table public.workspace_invites
  add column if not exists accepted_by uuid null;

alter table public.workspace_invites
  add column if not exists accepted_at timestamptz null;

alter table public.workspace_invites
  add column if not exists revoked_at timestamptz null;

-- (Optional safety: if older table somehow missed invited_by)
alter table public.workspace_invites
  add column if not exists invited_by uuid;

-- 3) Constraints & FKs (idempotent)
do $$
begin
  -- FK to workspaces
  begin
    alter table public.workspace_invites
      add constraint workspace_invites_workspace_id_fkey
      foreign key (workspace_id)
      references public.workspaces(id)
      on delete cascade;
  exception when duplicate_object then null; end;

  -- Role check constraint (admins/members only)
  begin
    alter table public.workspace_invites
      add constraint workspace_invites_role_check
      check (role in ('admin','member'));
  exception when duplicate_object then null; end;

  -- Token uniqueness (use unique index for idempotency)
  -- (If you already have duplicates, this will fail—normally should be clean.)
end
$$;

-- Token unique index (idempotent)
create unique index if not exists uq_workspace_invites_token
  on public.workspace_invites(token);

-- 4) Normalize stored email to lower-case using trigger
create or replace function public.workspace_invites_lower_email()
returns trigger as $$
begin
  if new.email is not null then
    new.email := lower(trim(new.email));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_workspace_invites_lower_email on public.workspace_invites;
create trigger trg_workspace_invites_lower_email
  before insert or update on public.workspace_invites
  for each row
  execute procedure public.workspace_invites_lower_email();

-- 5) Indexes
create index if not exists idx_invites_workspace_id
  on public.workspace_invites(workspace_id);

create index if not exists idx_invites_email_lower
  on public.workspace_invites (lower(email));

-- Partial unique: only one active invite per workspace+email
create unique index if not exists uq_invites_workspace_email_active
  on public.workspace_invites (workspace_id, lower(email))
  where accepted_at is null and revoked_at is null;

-- 6) FK to auth.users (guarded, and now safe because accepted_by column is ensured above)
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'auth') then
    -- invited_by -> auth.users(id)
    begin
      alter table public.workspace_invites
        add constraint workspace_invites_invited_by_fkey
        foreign key (invited_by)
        references auth.users(id)
        on delete cascade;
    exception when duplicate_object then null; end;

    -- accepted_by -> auth.users(id)
    begin
      alter table public.workspace_invites
        add constraint workspace_invites_accepted_by_fkey
        foreign key (accepted_by)
        references auth.users(id)
        on delete set null;
    exception when duplicate_object then null; end;
  end if;
end;
$$;

-- 7) Enable RLS
alter table public.workspace_invites enable row level security;

-- 8) Policies
-- Select: members of workspace can view invites (optional: you can restrict to owner/admin only)
drop policy if exists workspace_invites_select_workspace_members on public.workspace_invites;
create policy workspace_invites_select_workspace_members on public.workspace_invites
  for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- Insert: only owner/admin can create invites
drop policy if exists workspace_invites_insert_workspace_admins on public.workspace_invites;
create policy workspace_invites_insert_workspace_admins on public.workspace_invites
  for insert
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner','admin')
    )
    and invited_by = auth.uid()
    and revoked_at is null
    and accepted_at is null
  );

-- Update (revoke): only owner/admin can update invites
drop policy if exists workspace_invites_update_workspace_admins on public.workspace_invites;
create policy workspace_invites_update_workspace_admins on public.workspace_invites
  for update
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner','admin')
    )
  );

-- Optional: block deletes for safety (recommended)
drop policy if exists workspace_invites_delete_none on public.workspace_invites;
create policy workspace_invites_delete_none on public.workspace_invites
  for delete
  using (false);

-- IMPORTANT:
-- Accept flow should be done with Service Role in a server Route Handler:
-- - validate token + expiry + not revoked + not accepted
-- - set accepted_at, accepted_by
-- - insert into workspace_members if not exists
