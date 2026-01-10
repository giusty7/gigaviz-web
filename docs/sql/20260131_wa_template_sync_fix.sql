-- WhatsApp template sync fixes: ensure phone_number_id column and unique index for upsert

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_templates' and column_name = 'phone_number_id'
  ) then
    alter table wa_templates add column phone_number_id text;
  end if;
end $$;

create unique index if not exists uq_wa_templates_workspace_phone_name_lang
  on public.wa_templates (workspace_id, phone_number_id, name, language);
