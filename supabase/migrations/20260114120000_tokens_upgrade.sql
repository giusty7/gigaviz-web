-- Tokens upgrade: settings, topup requests, richer ledger
create extension if not exists "pgcrypto";

-- Token settings per workspace
create table if not exists token_settings (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  monthly_cap bigint null,
  alert_threshold integer not null default 80 check (alert_threshold >= 0 and alert_threshold <= 100),
  hard_cap boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into token_settings (workspace_id, monthly_cap)
select workspace_id, monthly_cap
from token_wallets
on conflict (workspace_id) do nothing;

alter table token_settings enable row level security;

drop policy if exists token_settings_select_members on token_settings;
create policy token_settings_select_members on token_settings
  for select using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = token_settings.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists token_settings_write_admin on token_settings;
create policy token_settings_write_admin on token_settings
  for all using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = token_settings.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = token_settings.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

-- Token topup requests
create table if not exists token_topup_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  package_key text not null,
  tokens bigint not null check (tokens > 0),
  notes text null,
  status text not null default 'pending' check (status in ('pending','paid','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_token_topup_requests_workspace on token_topup_requests (workspace_id);
create index if not exists idx_token_topup_requests_status on token_topup_requests (status);
create index if not exists idx_token_topup_requests_created on token_topup_requests (workspace_id, created_at desc);

alter table token_topup_requests enable row level security;

drop policy if exists token_topup_requests_select_members on token_topup_requests;
create policy token_topup_requests_select_members on token_topup_requests
  for select using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = token_topup_requests.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists token_topup_requests_insert_members on token_topup_requests;
create policy token_topup_requests_insert_members on token_topup_requests
  for insert with check (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = token_topup_requests.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists token_topup_requests_update_admin on token_topup_requests;
create policy token_topup_requests_update_admin on token_topup_requests
  for update using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = token_topup_requests.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner','admin')
    )
    or auth.role() = 'service_role'
  )
  with check (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = token_topup_requests.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner','admin')
    )
    or auth.role() = 'service_role'
  );

-- Token ledger enrichment
alter table token_ledger add column if not exists user_id uuid;
alter table token_ledger add column if not exists entry_type text;
alter table token_ledger add column if not exists tokens bigint not null default 0;
alter table token_ledger add column if not exists ref_table text;
alter table token_ledger add column if not exists ref_id uuid;
alter table token_ledger add column if not exists status text;

update token_ledger
set tokens = coalesce(tokens, amount, delta_bigint, 0)
where tokens is null or tokens = 0;

update token_ledger
set entry_type = coalesce(
  entry_type,
  type,
  case
    when coalesce(delta_bigint, 0) < 0 then 'spend'
    when coalesce(delta_bigint, 0) > 0 then 'topup'
    else 'adjust'
  end,
  'adjust'
);

update token_ledger
set status = coalesce(status, 'posted')
where status is null;

update token_ledger
set ref_table = case when ref_table is null and ref is not null then split_part(ref, ':', 1) else ref_table end,
    ref_id = case when ref_id is null and ref is not null then nullif(split_part(ref, ':', 2), '')::uuid else ref_id end
where (ref_table is null and ref is not null) or (ref_id is null and ref is not null);

alter table token_ledger alter column entry_type set default 'adjust';
alter table token_ledger alter column entry_type set not null;
alter table token_ledger alter column status set default 'posted';
alter table token_ledger alter column status set not null;

drop constraint if exists token_ledger_entry_type_check;
alter table token_ledger add constraint token_ledger_entry_type_check
  check (entry_type in ('topup','spend','adjust'));

drop constraint if exists token_ledger_status_check;
alter table token_ledger add constraint token_ledger_status_check
  check (status in ('posted','pending','void'));

create index if not exists idx_token_ledger_workspace_status_created
  on public.token_ledger (workspace_id, status, created_at desc);

create or replace function token_ledger_defaults()
returns trigger as $$
begin
  if new.tokens is null or new.tokens = 0 then
    new.tokens := coalesce(new.delta_bigint, new.amount, 0);
  end if;

  if new.entry_type is null then
    if coalesce(new.delta_bigint, new.tokens, 0) < 0 then
      new.entry_type := 'spend';
    elsif coalesce(new.delta_bigint, new.tokens, 0) > 0 then
      new.entry_type := 'topup';
    else
      new.entry_type := 'adjust';
    end if;
  end if;

  if new.status is null then
    new.status := 'posted';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_token_ledger_defaults on token_ledger;
create trigger trg_token_ledger_defaults
  before insert on token_ledger
  for each row
  execute procedure token_ledger_defaults();

-- Atomic topup activation: mark paid, credit wallet, ledger entry
create or replace function process_token_topup(
  p_workspace_id uuid,
  p_request_id uuid,
  p_actor uuid default null
) returns table(new_balance bigint, ledger_id uuid) as $$
declare
  v_tokens bigint;
  v_status text;
  v_pending_ledger uuid;
begin
  select tokens, status into v_tokens, v_status
  from token_topup_requests
  where id = p_request_id
    and workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception 'topup_request_not_found';
  end if;

  if v_status <> 'pending' then
    raise exception 'topup_request_not_pending';
  end if;

  update token_topup_requests
  set status = 'paid', updated_at = now()
  where id = p_request_id;

  update token_wallets
  set balance_bigint = balance_bigint + v_tokens,
      updated_at = now()
  where workspace_id = p_workspace_id
  returning balance_bigint into new_balance;

  select id into v_pending_ledger
  from token_ledger
  where ref_table = 'token_topup_requests'
    and ref_id = p_request_id
  order by created_at desc
  limit 1;

  if found then
    update token_ledger
    set tokens = v_tokens,
        delta_bigint = v_tokens,
        entry_type = 'topup',
        status = 'posted',
        reason = 'topup',
        note = coalesce(note, 'Top up activation'),
        user_id = coalesce(user_id, p_actor),
        created_by = coalesce(created_by, p_actor)
    where id = v_pending_ledger
    returning id into ledger_id;
  else
    insert into token_ledger (
      workspace_id, user_id, tokens, delta_bigint, entry_type, status,
      reason, ref_table, ref_id, note, created_by, created_at
    ) values (
      p_workspace_id, p_actor, v_tokens, v_tokens, 'topup', 'posted',
      'topup', 'token_topup_requests', p_request_id, 'Top up activation', p_actor, now()
    )
    returning id into ledger_id;
  end if;

  return;
end;
$$ language plpgsql security definer;
