-- Enhance wa_messages for WhatsApp inbox MVP
create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_messages' and column_name = 'phone_number_id'
  ) then
    alter table wa_messages add column phone_number_id text not null default 'unknown';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_messages' and column_name = 'from_wa_id'
  ) then
    alter table wa_messages add column from_wa_id text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_messages' and column_name = 'to_wa_id'
  ) then
    alter table wa_messages add column to_wa_id text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_messages' and column_name = 'wa_timestamp'
  ) then
    alter table wa_messages add column wa_timestamp timestamptz null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_messages' and column_name = 'msg_type'
  ) then
    alter table wa_messages add column msg_type text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_messages' and column_name = 'text_body'
  ) then
    alter table wa_messages add column text_body text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_messages' and column_name = 'media_id'
  ) then
    alter table wa_messages add column media_id text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_messages' and column_name = 'media_url'
  ) then
    alter table wa_messages add column media_url text null;
  end if;
end $$;

-- Unique constraint for idempotent inserts per workspace + phone + message id
create unique index if not exists uq_wa_messages_ws_phone_wamid
  on public.wa_messages (workspace_id, phone_number_id, wa_message_id)
  where wa_message_id is not null;

-- Query helper index
create index if not exists idx_wa_messages_ws_thread_time
  on public.wa_messages (workspace_id, thread_id, wa_timestamp, created_at);
