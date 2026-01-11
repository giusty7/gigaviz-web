-- WhatsApp messages dedupe index for ON CONFLICT targets

create unique index if not exists wa_messages_dedupe_idx
  on public.wa_messages (workspace_id, phone_number_id, wa_message_id);

create index if not exists idx_wa_messages_ws_thread_time
  on public.wa_messages (workspace_id, thread_id, wa_timestamp desc);
