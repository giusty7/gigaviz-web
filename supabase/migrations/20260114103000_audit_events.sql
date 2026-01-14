create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  actor_email text,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_workspace_id_idx
  on public.audit_events (workspace_id);

create index if not exists audit_events_workspace_created_at_idx
  on public.audit_events (workspace_id, created_at desc);

alter table public.audit_events enable row level security;

drop policy if exists audit_events_select_own_workspace on public.audit_events;
drop policy if exists audit_events_insert_own_workspace on public.audit_events;

create policy audit_events_select_own_workspace
on public.audit_events
for select
using (
  workspace_id in (
    select wm.workspace_id
    from public.workspace_members wm
    where wm.user_id = auth.uid()
  )
);

create policy audit_events_insert_own_workspace
on public.audit_events
for insert
with check (
  workspace_id in (
    select wm.workspace_id
    from public.workspace_members wm
    where wm.user_id = auth.uid()
  )
  and (actor_user_id is null or actor_user_id = auth.uid())
);
