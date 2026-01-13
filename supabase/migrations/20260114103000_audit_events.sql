create table audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  actor_email text,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_workspace_id_created_at_idx
  on audit_events (workspace_id, created_at desc);

alter table audit_events enable row level security;

create policy "audit_events_select_members"
  on audit_events
  for select
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "audit_events_insert_service_or_member"
  on audit_events
  for insert
  with check (
    auth.role() = 'service_role'
    or (
      actor_user_id = auth.uid()
      and workspace_id in (
        select workspace_id from workspace_members where user_id = auth.uid()
      )
    )
  );
