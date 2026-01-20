-- Re-apply workspace_entitlements fixes (idempotent)
-- Copied from 20260120_fix_entitlements_value_column.sql

-------------------------------------------------------------------------------
-- 1) Handle legacy 'value' column - make nullable or drop
-------------------------------------------------------------------------------

do $do$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'value'
  ) then
    execute $sql$
      update public.workspace_entitlements
      set payload = value
      where payload = '{}'::jsonb
        and value is not null
        and value != '{}'::jsonb
    $sql$;

    execute 'alter table public.workspace_entitlements alter column value drop not null';
    execute 'alter table public.workspace_entitlements alter column value set default ''{}''::jsonb';

    raise notice 'Patched workspace_entitlements.value column: dropped NOT NULL, set default';
  end if;
exception when others then
  raise notice 'workspace_entitlements.value patch skipped or already applied: %', sqlerrm;
end
$do$;

-------------------------------------------------------------------------------
-- 2) Ensure enabled + payload columns have proper NOT NULL + defaults
-------------------------------------------------------------------------------

do $do$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'enabled'
  ) then
    execute 'update public.workspace_entitlements set enabled = false where enabled is null';
    begin
      execute 'alter table public.workspace_entitlements alter column enabled set default false';
    exception when others then null; end;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_entitlements'
      and column_name = 'payload'
  ) then
    execute 'update public.workspace_entitlements set payload = ''{}''::jsonb where payload is null';
    begin
      execute 'alter table public.workspace_entitlements alter column payload set default ''{}''::jsonb';
    exception when others then null; end;
  end if;
end
$do$;

-------------------------------------------------------------------------------
-- 3) Re-create token delta function with explicit table qualification
-------------------------------------------------------------------------------

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
  v_new_balance int;
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
      select wtb.balance into v_new_balance
      from public.workspace_token_balance wtb
      where wtb.workspace_id = p_workspace_id;
    end if;
    return query select false, null::uuid, v_new_balance;
    return;
  end if;

  if to_regclass('public.workspace_token_balance') is not null then
    insert into public.workspace_token_balance as wtb (workspace_id, balance, updated_at)
    values (p_workspace_id, p_delta, now())
    on conflict (workspace_id) do update
      set balance = wtb.balance + excluded.balance,
          updated_at = now()
    returning wtb.balance into v_new_balance;
  end if;

  return query select true, v_ledger_id, v_new_balance;
end;
$func$ language plpgsql security definer;

grant execute on function public.apply_workspace_token_delta(uuid, int, text, text, text, uuid) to service_role;

-------------------------------------------------------------------------------
-- 4) Verify final state (informational)
-------------------------------------------------------------------------------

do $do$
declare
  col_count int;
begin
  select count(*) into col_count
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'workspace_entitlements'
    and column_name in ('workspace_id', 'key', 'enabled', 'payload');

  if col_count = 4 then
    raise notice 'workspace_entitlements schema verified: all required columns present';
  else
    raise warning 'workspace_entitlements may be missing columns, found % of 4', col_count;
  end if;
end
$do$;
