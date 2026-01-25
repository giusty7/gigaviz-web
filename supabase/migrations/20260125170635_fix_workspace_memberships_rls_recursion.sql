-- Fix: workspace_memberships RLS recursion (migration-safe)
begin;

-- 0) Pastikan RLS aktif (tidak FORCE)
alter table public.workspace_memberships enable row level security;

-- 1) Helper function anti-recursion (SECURITY DEFINER)
create or replace function public.is_workspace_admin(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  );
$$;

-- rapihin privilege function
revoke all on function public.is_workspace_admin(uuid) from public;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

-- 2) Drop policy lama yang bikin recursion (idempotent)
drop policy if exists "memberships_select_own_or_admin" on public.workspace_memberships;
drop policy if exists "memberships_insert_admin" on public.workspace_memberships;
drop policy if exists "memberships_update_admin" on public.workspace_memberships;
drop policy if exists "memberships_delete_admin" on public.workspace_memberships;

-- 3) Recreate policy versi anti-recursion (lebih ketat: authenticated only)

-- SELECT: user boleh lihat row dia sendiri; admin boleh lihat semua di workspace itu
create policy "memberships_select_own_or_admin"
on public.workspace_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_workspace_admin(workspace_id)
);

-- INSERT: admin-only
create policy "memberships_insert_admin"
on public.workspace_memberships
for insert
to authenticated
with check (
  public.is_workspace_admin(workspace_id)
);

-- UPDATE: admin-only
create policy "memberships_update_admin"
on public.workspace_memberships
for update
to authenticated
using (
  public.is_workspace_admin(workspace_id)
)
with check (
  public.is_workspace_admin(workspace_id)
);

-- DELETE: admin-only
create policy "memberships_delete_admin"
on public.workspace_memberships
for delete
to authenticated
using (
  public.is_workspace_admin(workspace_id)
);

commit;
