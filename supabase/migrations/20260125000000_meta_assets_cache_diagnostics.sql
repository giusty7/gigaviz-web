-- Add diagnostic columns to meta_assets_cache for sync tracking
-- Add notes column to wa_phone_numbers for user annotations
-- Migration: 20260125000000_meta_assets_cache_diagnostics

-- Add last_synced_at and last_error columns to meta_assets_cache if they don't exist
do $migration$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meta_assets_cache'
      and column_name = 'last_synced_at'
  ) then
    alter table public.meta_assets_cache add column last_synced_at timestamptz null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meta_assets_cache'
      and column_name = 'last_error'
  ) then
    alter table public.meta_assets_cache add column last_error text null;
  end if;
end
$migration$;

-- Add notes column to wa_phone_numbers if it doesn't exist
do $notes_migration$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wa_phone_numbers'
      and column_name = 'notes'
  ) then
    alter table public.wa_phone_numbers add column notes text null;
  end if;
end
$notes_migration$;

-- Create index for diagnostic queries
create index if not exists idx_meta_assets_cache_last_synced 
  on public.meta_assets_cache (workspace_id, last_synced_at desc nulls last);
