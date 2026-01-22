-- Meta Hub WhatsApp sandbox hardening (per-workspace)
-- Ensures each workspace has its own wa_settings row + RLS + uniqueness.

-- 1) Table + columns (idempotent)
create table if not exists public.wa_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  sandbox_enabled boolean not null default true,
  test_whitelist jsonb not null default '[]'::jsonb,
  waba_id text,
  phone_number_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wa_settings'
      and column_name = 'sandbox_enabled'
  ) then
    alter table public.wa_settings add column sandbox_enabled boolean not null default true;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wa_settings'
      and column_name = 'test_whitelist'
  ) then
    alter table public.wa_settings add column test_whitelist jsonb not null default '[]'::jsonb;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wa_settings'
      and column_name = 'waba_id'
  ) then
    alter table public.wa_settings add column waba_id text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wa_settings'
      and column_name = 'phone_number_id'
  ) then
    alter table public.wa_settings add column phone_number_id text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wa_settings'
      and column_name = 'created_at'
  ) then
    alter table public.wa_settings add column created_at timestamptz not null default now();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wa_settings'
      and column_name = 'updated_at'
  ) then
    alter table public.wa_settings add column updated_at timestamptz not null default now();
  end if;

  -- enforce defaults and not-null
  alter table public.wa_settings alter column sandbox_enabled set default true;
  alter table public.wa_settings alter column sandbox_enabled set not null;
  alter table public.wa_settings alter column test_whitelist set default '[]'::jsonb;
  alter table public.wa_settings alter column test_whitelist set not null;
  alter table public.wa_settings alter column created_at set default now();
  alter table public.wa_settings alter column updated_at set default now();
end $$;

-- 2) Uniqueness on workspace_id (skip if already primary/unique)
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'wa_settings'
      and c.contype in ('p', 'u')
      and (
        select array_agg(att.attname order by att.attnum)
        from unnest(c.conkey) as colnum
        join pg_attribute att on att.attrelid = t.oid and att.attnum = colnum
      ) = array['workspace_id']
  ) then
    alter table public.wa_settings add constraint wa_settings_workspace_id_key unique (workspace_id);
  end if;
end $$;

-- 3) Backfill missing rows per workspace
insert into public.wa_settings (workspace_id)
select w.id
from public.workspaces w
where not exists (
  select 1 from public.wa_settings s where s.workspace_id = w.id
);

-- 4) Trigger to auto-create default row for new workspaces
create or replace function public.ensure_wa_settings_row()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.wa_settings (workspace_id)
  values (new.id)
  on conflict (workspace_id) do nothing;
  return new;
end;
$$;

drop trigger if exists wa_settings_default_row on public.workspaces;
create trigger wa_settings_default_row
after insert on public.workspaces
for each row
execute function public.ensure_wa_settings_row();

-- 5) RLS hardening
alter table public.wa_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wa_settings' and policyname = 'wa_settings_select_members'
  ) then
    create policy wa_settings_select_members on public.wa_settings
      for select
      using (
        workspace_id in (
          select workspace_id from public.workspace_memberships where user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wa_settings' and policyname = 'wa_settings_write_admins'
  ) then
    create policy wa_settings_write_admins on public.wa_settings
      for all
      using (
        exists (
          select 1
          from public.workspace_memberships wm
          where wm.workspace_id = wa_settings.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner', 'admin')
        )
      )
      with check (
        exists (
          select 1
          from public.workspace_memberships wm
          where wm.workspace_id = wa_settings.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner', 'admin')
        )
      );
  end if;
end $$;
