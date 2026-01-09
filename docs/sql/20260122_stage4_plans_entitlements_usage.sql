-- Stage 4 foundation: plans, entitlements, usage events/aggregation, subscription extensibility
-- Idempotent and backward-compatible with existing Stage 3 schema.

-- Ensure UUID generator is available
create extension if not exists "pgcrypto";

-- 1) Plans (DB source of truth)
create table if not exists plans (
  code text primary key,
  name text not null,
  price_cents int not null default 0,
  currency text not null default 'IDR',
  is_active boolean not null default true,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed default plans (align with entitlements.ts)
insert into plans (code, name, price_cents, currency, is_active)
values
  ('free_locked', 'Free (Locked)', 0, 'IDR', true),
  ('ind', 'Individual', 0, 'IDR', true),
  ('team', 'Team', 0, 'IDR', true)
on conflict (code) do update
set
  name = excluded.name,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  is_active = excluded.is_active;

-- 2) Workspace entitlements (overrides per workspace)
create table if not exists workspace_entitlements (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, key)
);

-- 3) Usage events (raw)
create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  event_type text not null,
  amount bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_usage_events_workspace_id on usage_events(workspace_id);
create index if not exists idx_usage_events_type_time on usage_events(event_type, occurred_at desc);

-- 4) Usage monthly aggregation (optional)
create table if not exists usage_monthly (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  yyyymm int not null,
  counters jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, yyyymm)
);

create index if not exists idx_usage_monthly_workspace_id on usage_monthly(workspace_id);

-- 5) Extend subscriptions (non-breaking)
-- Add nullable columns if missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'subscriptions' and column_name = 'current_period_start'
  ) then
    alter table subscriptions add column current_period_start timestamptz null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'subscriptions' and column_name = 'provider'
  ) then
    alter table subscriptions add column provider text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'subscriptions' and column_name = 'provider_ref'
  ) then
    alter table subscriptions add column provider_ref text null;
  end if;
end
$$;

-- Relax NOT NULL on status to allow external providers to manage lifecycle (check constraint still applies)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'subscriptions' and column_name = 'status' and is_nullable = 'NO'
  ) then
    alter table subscriptions alter column status drop not null;
  end if;
end
$$;

-- Add FK plan_id -> plans.code after seeding plans (safe if already present)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_plan_id_fkey'
      and conrelid = 'subscriptions'::regclass
  ) then
    alter table subscriptions
      add constraint subscriptions_plan_id_fkey
      foreign key (plan_id) references plans(code) not valid;
    alter table subscriptions validate constraint subscriptions_plan_id_fkey;
  end if;
end
$$;

-- =========================
-- RLS ENABLE + POLICIES
-- =========================

-- Plans: readable by authenticated users; writes only service_role
alter table plans enable row level security;
drop policy if exists plans_select_auth on plans;
drop policy if exists plans_write_service on plans;
create policy plans_select_auth on plans
  for select
  using (auth.role() in ('authenticated', 'service_role'));
create policy plans_write_service on plans
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Workspace entitlements: members can read; write reserved for service_role
alter table workspace_entitlements enable row level security;
drop policy if exists workspace_entitlements_select_members on workspace_entitlements;
drop policy if exists workspace_entitlements_write_service on workspace_entitlements;
create policy workspace_entitlements_select_members on workspace_entitlements
  for select
  using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_entitlements.workspace_id
        and wm.user_id = auth.uid()
    )
    or auth.role() = 'service_role'
  );
create policy workspace_entitlements_write_service on workspace_entitlements
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Usage events: members can read; only service_role can write/update/delete
alter table usage_events enable row level security;
drop policy if exists usage_events_select_members on usage_events;
drop policy if exists usage_events_write_service on usage_events;
create policy usage_events_select_members on usage_events
  for select
  using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = usage_events.workspace_id
        and wm.user_id = auth.uid()
    )
    or auth.role() = 'service_role'
  );
create policy usage_events_write_service on usage_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Usage monthly: members can read; only service_role can write/update
alter table usage_monthly enable row level security;
drop policy if exists usage_monthly_select_members on usage_monthly;
drop policy if exists usage_monthly_write_service on usage_monthly;
create policy usage_monthly_select_members on usage_monthly
  for select
  using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = usage_monthly.workspace_id
        and wm.user_id = auth.uid()
    )
    or auth.role() = 'service_role'
  );
create policy usage_monthly_write_service on usage_monthly
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
