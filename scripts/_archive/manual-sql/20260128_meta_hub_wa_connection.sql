-- Meta Hub WhatsApp connection hardening
-- Add last tested fields, unique constraints, and tighten meta_tokens RLS

-- Ensure wa_phone_numbers has status default, last_tested_at/result, and uniqueness per workspace
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_phone_numbers' and column_name = 'last_tested_at'
  ) then
    alter table wa_phone_numbers add column last_tested_at timestamptz null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_phone_numbers' and column_name = 'last_test_result'
  ) then
    alter table wa_phone_numbers add column last_test_result text null;
  end if;

  -- ensure status has a default
  perform 1 from information_schema.columns
    where table_name = 'wa_phone_numbers'
      and column_name = 'status'
      and column_default is not null;
  if not found then
    alter table wa_phone_numbers alter column status set default 'inactive';
  end if;

  -- unique constraint on workspace_id + phone_number_id
  if not exists (
    select 1 from pg_constraint
    where conname = 'wa_phone_numbers_workspace_phone_key'
  ) then
    alter table wa_phone_numbers
      add constraint wa_phone_numbers_workspace_phone_key
      unique (workspace_id, phone_number_id);
  end if;
end $$;

-- Tighten meta_tokens RLS: service_role only for select/write; remove previous broader policies
alter table meta_tokens enable row level security;

do $$
begin
  drop policy if exists meta_tokens_select on meta_tokens;
  drop policy if exists meta_tokens_write on meta_tokens;
  drop policy if exists meta_tokens_all on meta_tokens;

  create policy meta_tokens_service_only on meta_tokens
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
end $$;

-- Helpful index for meta_tokens workspace/provider
create index if not exists idx_meta_tokens_workspace_provider on meta_tokens(workspace_id, provider);
