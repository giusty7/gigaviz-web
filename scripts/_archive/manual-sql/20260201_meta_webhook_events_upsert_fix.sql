-- Meta webhook events upsert fix: add deterministic event_key and matching unique index

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'meta_webhook_events' and column_name = 'event_key'
  ) then
    alter table meta_webhook_events add column event_key text;
  end if;
end $$;

-- Backfill event_key for existing rows
update meta_webhook_events
set event_key = coalesce(external_event_id, md5(payload_json::text), id::text)
where event_key is null;

-- Enforce NOT NULL
alter table meta_webhook_events
  alter column event_key set not null;

-- Unique index to match ON CONFLICT (workspace_id, event_key)
create unique index if not exists uq_meta_webhook_events_workspace_event_key
  on public.meta_webhook_events (workspace_id, event_key);
