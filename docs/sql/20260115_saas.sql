-- SaaS App Area schema (profiles, workspaces, subscriptions, tokens)

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key,
  email text unique,
  full_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists workspace_memberships (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')) default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists subscriptions (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  plan_id text not null,
  billing_mode text not null check (billing_mode in ('individual', 'team')),
  seat_limit int not null,
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled')) default 'active',
  current_period_end timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists token_wallets (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  balance_bigint bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists token_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  delta_bigint bigint not null,
  reason text not null,
  feature_key text null,
  ref_type text null,
  ref_id text null,
  note text null,
  created_by uuid null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists usage_counters (
  workspace_id uuid references workspaces(id) on delete cascade,
  key text not null,
  value bigint not null default 0,
  period_start timestamptz not null,
  primary key (workspace_id, key, period_start)
);

create index if not exists idx_workspace_memberships_user_id on workspace_memberships(user_id);
create index if not exists idx_token_ledger_workspace_id on token_ledger(workspace_id);
create index if not exists idx_token_ledger_created_at on token_ledger(created_at desc);
create unique index if not exists workspaces_slug_lower_unique
  on public.workspaces (lower(slug));

create or replace function handle_new_workspace()
returns trigger as $$
begin
  insert into workspace_memberships (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;

  insert into subscriptions (workspace_id, plan_id, billing_mode, seat_limit, status)
  values (new.id, 'free_locked', 'individual', 1, 'active')
  on conflict do nothing;

  insert into token_wallets (workspace_id, balance_bigint)
  values (new.id, 0)
  on conflict do nothing;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_handle_new_workspace on workspaces;
create trigger trg_handle_new_workspace
  after insert on workspaces
  for each row
  execute procedure handle_new_workspace();

create or replace function consume_tokens(
  p_workspace_id uuid,
  p_cost bigint,
  p_reason text,
  p_feature_key text default null,
  p_ref_type text default null,
  p_ref_id text default null,
  p_note text default null,
  p_created_by uuid default null
)
returns bigint as $$
declare
  current_balance bigint;
begin
  if p_cost <= 0 then
    raise exception 'cost_must_be_positive';
  end if;

  select balance_bigint into current_balance
  from token_wallets
  where workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception 'wallet_not_found';
  end if;

  if current_balance < p_cost then
    raise exception 'insufficient_tokens';
  end if;

  update token_wallets
  set balance_bigint = balance_bigint - p_cost,
      updated_at = now()
  where workspace_id = p_workspace_id;

  insert into token_ledger (
    workspace_id,
    delta_bigint,
    reason,
    feature_key,
    ref_type,
    ref_id,
    note,
    created_by
  ) values (
    p_workspace_id,
    -p_cost,
    p_reason,
    p_feature_key,
    p_ref_type,
    p_ref_id,
    p_note,
    p_created_by
  );

  return current_balance - p_cost;
end;
$$ language plpgsql;

create or replace function credit_tokens(
  p_workspace_id uuid,
  p_amount bigint,
  p_reason text,
  p_note text default null,
  p_created_by uuid default null
)
returns bigint as $$
declare
  current_balance bigint;
begin
  if p_amount <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  select balance_bigint into current_balance
  from token_wallets
  where workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception 'wallet_not_found';
  end if;

  update token_wallets
  set balance_bigint = balance_bigint + p_amount,
      updated_at = now()
  where workspace_id = p_workspace_id;

  insert into token_ledger (
    workspace_id,
    delta_bigint,
    reason,
    note,
    created_by
  ) values (
    p_workspace_id,
    p_amount,
    p_reason,
    p_note,
    p_created_by
  );

  return current_balance + p_amount;
end;
$$ language plpgsql;

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_memberships enable row level security;
alter table subscriptions enable row level security;
alter table token_wallets enable row level security;
alter table token_ledger enable row level security;
alter table usage_counters enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "workspaces_select_members" on workspaces
  for select using (
    exists (
      select 1 from workspace_memberships wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
    )
  );

create policy "workspaces_insert_owner" on workspaces
  for insert with check (auth.uid() = owner_id);

create policy "workspaces_update_owner_admin" on workspaces
  for update using (
    exists (
      select 1 from workspace_memberships wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy "memberships_select_own_or_admin" on workspace_memberships
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from workspace_memberships wm
      where wm.workspace_id = workspace_memberships.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy "memberships_insert_admin" on workspace_memberships
  for insert with check (
    exists (
      select 1 from workspace_memberships wm
      where wm.workspace_id = workspace_memberships.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy "memberships_update_admin" on workspace_memberships
  for update using (
    exists (
      select 1 from workspace_memberships wm
      where wm.workspace_id = workspace_memberships.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy "memberships_delete_admin" on workspace_memberships
  for delete using (
    exists (
      select 1 from workspace_memberships wm
      where wm.workspace_id = workspace_memberships.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy "subscriptions_select_members" on subscriptions
  for select using (
    exists (
      select 1 from workspace_memberships wm
      where wm.workspace_id = subscriptions.workspace_id
        and wm.user_id = auth.uid()
    )
  );

create policy "subscriptions_admin_update" on subscriptions
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.is_admin = true
    )
  );

create policy "token_wallets_select_members" on token_wallets
  for select using (
    exists (
      select 1 from workspace_memberships wm
      where wm.workspace_id = token_wallets.workspace_id
        and wm.user_id = auth.uid()
    )
  );

create policy "token_ledger_select_members" on token_ledger
  for select using (
    exists (
      select 1 from workspace_memberships wm
      where wm.workspace_id = token_ledger.workspace_id
        and wm.user_id = auth.uid()
    )
  );

create policy "usage_counters_select_members" on usage_counters
  for select using (
    exists (
      select 1 from workspace_memberships wm
      where wm.workspace_id = usage_counters.workspace_id
        and wm.user_id = auth.uid()
    )
  );
