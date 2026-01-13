-- Billing + tokens foundation (idempotent)

create extension if not exists "pgcrypto";

-- Plans: add missing columns for billing metadata
alter table plans add column if not exists type text;
alter table plans add column if not exists monthly_price_idr int not null default 0;
alter table plans add column if not exists seat_limit int;
alter table plans add column if not exists meta jsonb not null default '{}'::jsonb;

-- Seed/normalize plan metadata (safe updates only)
update plans set type = 'individual' where type is null and code in ('free_locked', 'ind');
update plans set type = 'team' where type is null and code in ('team');
update plans set seat_limit = 1 where seat_limit is null and code in ('free_locked', 'ind');
update plans set seat_limit = 5 where seat_limit is null and code in ('team');

-- Subscriptions: add missing billing columns
alter table subscriptions add column if not exists plan_code text;
alter table subscriptions add column if not exists current_period_start timestamptz;
alter table subscriptions add column if not exists current_period_end timestamptz;
alter table subscriptions add column if not exists provider text;
alter table subscriptions add column if not exists provider_ref text;
alter table subscriptions add column if not exists updated_at timestamptz not null default now();

update subscriptions set plan_code = plan_id where plan_code is null;

-- Token wallets: add monthly cap
alter table token_wallets add column if not exists monthly_cap bigint;

-- Token ledger: add idempotency + richer metadata
alter table token_ledger add column if not exists type text;
alter table token_ledger add column if not exists amount bigint;
alter table token_ledger add column if not exists ref text;
alter table token_ledger add column if not exists meta jsonb not null default '{}'::jsonb;

create unique index if not exists token_ledger_ref_unique
  on public.token_ledger (ref)
  where ref is not null;

create index if not exists idx_token_ledger_workspace_created_at
  on public.token_ledger (workspace_id, created_at desc);

-- Payment intents
create table if not exists payment_intents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  kind text not null check (kind in ('topup', 'subscription')),
  amount_idr int not null,
  status text not null check (status in ('pending', 'paid', 'expired', 'failed')) default 'pending',
  provider text not null default 'manual',
  provider_ref text,
  checkout_url text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_intents_workspace_id
  on public.payment_intents (workspace_id);
create index if not exists idx_payment_intents_status
  on public.payment_intents (status);
create index if not exists idx_payment_intents_workspace_created_at
  on public.payment_intents (workspace_id, created_at desc);

-- Payment events
create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create unique index if not exists payment_events_provider_event_key
  on public.payment_events (provider, provider_event_id);

-- RLS for new tables
alter table payment_intents enable row level security;
alter table payment_events enable row level security;

drop policy if exists payment_intents_select_members on payment_intents;
create policy payment_intents_select_members on payment_intents
  for select using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = payment_intents.workspace_id
        and wm.user_id = auth.uid()
    )
    or auth.role() = 'service_role'
  );

drop policy if exists payment_intents_write_service on payment_intents;
create policy payment_intents_write_service on payment_intents
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists payment_events_service_only on payment_events;
create policy payment_events_service_only on payment_events
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
