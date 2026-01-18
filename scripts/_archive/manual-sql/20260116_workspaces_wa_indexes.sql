-- Ensure WhatsApp workspace mapping indexes exist.

create unique index if not exists workspaces_wa_phone_number_id_key
  on workspaces (wa_phone_number_id)
  where wa_phone_number_id is not null;

create index if not exists workspaces_wa_waba_id_idx
  on workspaces (wa_waba_id);
