-- Owner Ops: entitlements + token ledger (safe to re-run)
create extension if not exists "pgcrypto";

-- Workspace entitlements
create table if not exists public.workspace_entitlements (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key text not null,
  enabled boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid null,
  primary key (workspace_id, key)
);

-- Add missing columns if table pre-existed with different schema
alter table if exists public.workspace_entitlements
  add column if not exists enabled boolean default false;
alter table if exists public.workspace_entitlements
  add column if not exists payload jsonb default '{}'::jsonb;
alter table if exists public.workspace_entitlements
  add column if not exists updated_at timestamptz default now();
alter table if exists public.workspace_entitlements
  add column if not exists updated_by uuid;

-- Backfill null values
update public.workspace_entitlements
set enabled = false
where enabled is null;

update public.workspace_entitlements
set payload = '{}'::jsonb
where payload is null;

-- Handle legacy schemas: rename is_enabled -> enabled, is_active -> enabled
do $do$
begin
  -- Rename is_enabled to enabled if exists
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'is_enabled'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'enabled'
  ) then
    execute 'alter table public.workspace_entitlements rename column is_enabled to enabled';
  end if;
  
  -- Rename is_active to enabled if exists
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'is_active'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'enabled'
  ) then
    execute 'alter table public.workspace_entitlements rename column is_active to enabled';
  end if;
end
$do$;

-- Handle legacy 'value' column migration
do $do$
declare
  has_value_column boolean;
  value_type text;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'value'
  ) into has_value_column;

  if has_value_column then
    select data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'value'
    into value_type;

    if value_type = 'jsonb' then
      execute $sql$
        update public.workspace_entitlements
        set payload = value
        where payload = '{}'::jsonb and value is not null
      $sql$;

      execute $sql$
        update public.workspace_entitlements
        set enabled = value::boolean
        where enabled is null and jsonb_typeof(value) = 'boolean'
      $sql$;
    end if;
  end if;
end
$do$;

-- Set NOT NULL constraints if no nulls exist
do $do$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'enabled'
  ) then
    if not exists (select 1 from public.workspace_entitlements where enabled is null) then
      execute $sql$alter table public.workspace_entitlements alter column enabled set not null$sql$;
    end if;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'payload'
  ) then
    if not exists (select 1 from public.workspace_entitlements where payload is null) then
      execute $sql$alter table public.workspace_entitlements alter column payload set not null$sql$;
    end if;
  end if;
end
$do$;

-- Ensure primary key exists (handle case where table was created without PK)
do $do$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'workspace_entitlements'
      and c.contype = 'p'
  ) then
    -- Check if unique constraint exists and promote to primary key
    if exists (
      select 1 from pg_constraint c
      join pg_class t on c.conrelid = t.oid
      join pg_namespace n on t.relnamespace = n.oid
      where n.nspname = 'public'
        and t.relname = 'workspace_entitlements'
        and c.contype = 'u'
        and c.conname like '%workspace%key%'
    ) then
      -- Drop existing unique constraint and add primary key
      execute 'alter table public.workspace_entitlements drop constraint if exists workspace_entitlements_workspace_id_key_key';
      execute 'alter table public.workspace_entitlements add primary key (workspace_id, key)';
    else
      execute 'alter table public.workspace_entitlements add primary key (workspace_id, key)';
    end if;
  end if;
exception when others then
  -- Ignore if already exists or other issues
  null;
end
$do$;

-- Create indexes (idempotent)
create unique index if not exists workspace_entitlements_workspace_key_idx
  on public.workspace_entitlements (workspace_id, key);

create index if not exists workspace_entitlements_updated_at_idx
  on public.workspace_entitlements (workspace_id, updated_at desc);

alter table if exists public.workspace_entitlements enable row level security;
drop policy if exists workspace_entitlements_service_role on public.workspace_entitlements;
create policy workspace_entitlements_service_role
on public.workspace_entitlements
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Workspace token ledger (internal)
create table if not exists public.workspace_token_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  delta int not null,
  reason text not null,
  ref_type text not null default 'adjustment',
  ref_id text null,
  created_at timestamptz not null default now(),
  created_by uuid null
);

create index if not exists workspace_token_ledger_workspace_idx
  on public.workspace_token_ledger (workspace_id, created_at desc);

create unique index if not exists workspace_token_ledger_workspace_ref_idx
  on public.workspace_token_ledger (workspace_id, ref_id)
  where ref_id is not null;

alter table if exists public.workspace_token_ledger enable row level security;
drop policy if exists workspace_token_ledger_service_role on public.workspace_token_ledger;
create policy workspace_token_ledger_service_role
on public.workspace_token_ledger
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Optional balance table for fast reads
create table if not exists public.workspace_token_balance (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  balance int not null default 0,
  updated_at timestamptz not null default now()
);

alter table if exists public.workspace_token_balance enable row level security;
drop policy if exists workspace_token_balance_service_role on public.workspace_token_balance;
create policy workspace_token_balance_service_role
on public.workspace_token_balance
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Transaction-safe token adjustment
create or replace function public.apply_workspace_token_delta(
  p_workspace_id uuid,
  p_delta int,
  p_reason text,
  p_ref_type text default 'adjustment',
  p_ref_id text default null,
  p_actor uuid default null
) returns table(applied boolean, ledger_id uuid, balance int) as $func$
declare
  v_ledger_id uuid;
  v_balance int;
begin
  if p_delta = 0 then
    raise exception 'delta_must_not_be_zero';
  end if;

  insert into public.workspace_token_ledger (
    workspace_id, delta, reason, ref_type, ref_id, created_by
  )
  values (
    p_workspace_id, p_delta, p_reason, p_ref_type, p_ref_id, p_actor
  )
  on conflict (workspace_id, ref_id) where ref_id is not null do nothing
  returning id into v_ledger_id;

  if v_ledger_id is null then
    if to_regclass('public.workspace_token_balance') is not null then
      select balance into v_balance
      from public.workspace_token_balance
      where workspace_id = p_workspace_id;
    end if;
    return query select false, null::uuid, v_balance;
    return;
  end if;

  if to_regclass('public.workspace_token_balance') is not null then
    insert into public.workspace_token_balance (workspace_id, balance, updated_at)
    values (p_workspace_id, p_delta, now())
    on conflict (workspace_id) do update
      set balance = public.workspace_token_balance.balance + excluded.balance,
          updated_at = now()
    returning balance into v_balance;
  end if;

  return query select true, v_ledger_id, v_balance;
end;
$func$ language plpgsql;
