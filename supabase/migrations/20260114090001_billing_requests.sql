create table if not exists billing_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  plan_id text not null,
  seats integer not null default 1 check (seats > 0),
  notes text null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists billing_requests_workspace_id_idx on billing_requests (workspace_id);
create index if not exists billing_requests_user_id_idx on billing_requests (user_id);

alter table billing_requests enable row level security;

create policy billing_requests_insert_own_workspace on billing_requests
  for insert
  with check (
    user_id = auth.uid()
    and workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy billing_requests_select_own_workspace on billing_requests
  for select
  using (
    user_id = auth.uid()
    and workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );
