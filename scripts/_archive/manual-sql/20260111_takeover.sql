-- Supervisor takeover: workspace roles + conversation takeover metadata
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

alter table workspace_members
  add column if not exists role text not null default 'agent';

create index if not exists workspace_members_workspace_role_idx
  on workspace_members (workspace_id, role);

alter table conversations
  add column if not exists takeover_by_member_id uuid,
  add column if not exists takeover_prev_assigned_member_id uuid,
  add column if not exists takeover_at timestamptz;

-- Rollback notes:
-- alter table conversations drop column if exists takeover_at;
-- alter table conversations drop column if exists takeover_prev_assigned_member_id;
-- alter table conversations drop column if exists takeover_by_member_id;
-- drop index if exists workspace_members_workspace_role_idx;
-- alter table workspace_members drop column if exists role;
