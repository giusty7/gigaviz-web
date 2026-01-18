-- Meta Connect audit + contact consent metadata
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

alter table contacts
  add column if not exists opted_in boolean not null default false,
  add column if not exists opted_in_at timestamptz,
  add column if not exists opt_in_source text,
  add column if not exists opted_out boolean not null default false,
  add column if not exists opted_out_at timestamptz,
  add column if not exists opt_out_reason text;

create table if not exists meta_admin_audit (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  action text not null,
  ok boolean not null default false,
  detail jsonb,
  error text,
  created_by text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists meta_admin_audit_workspace_created_idx
  on meta_admin_audit (workspace_id, created_at desc);

alter table meta_admin_audit enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'meta_admin_audit'
      and policyname = 'meta_admin_audit_select_workspace'
  ) then
    create policy meta_admin_audit_select_workspace
      on meta_admin_audit for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = meta_admin_audit.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'meta_admin_audit'
      and policyname = 'meta_admin_audit_insert_admin_supervisor'
  ) then
    create policy meta_admin_audit_insert_admin_supervisor
      on meta_admin_audit for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.workspace_id = meta_admin_audit.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('admin', 'supervisor')
        )
      );
  end if;
end
$$;

-- Rollback notes:
-- drop policy if exists meta_admin_audit_insert_admin_supervisor on meta_admin_audit;
-- drop policy if exists meta_admin_audit_select_workspace on meta_admin_audit;
-- drop index if exists meta_admin_audit_workspace_created_idx;
-- drop table if exists meta_admin_audit;
-- alter table contacts drop column if exists opt_out_reason;
-- alter table contacts drop column if exists opted_out_at;
-- alter table contacts drop column if exists opted_out;
-- alter table contacts drop column if exists opt_in_source;
-- alter table contacts drop column if exists opted_in_at;
-- alter table contacts drop column if exists opted_in;
