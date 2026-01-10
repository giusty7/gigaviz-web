-- WhatsApp Template Center enhancements
-- Add template metadata columns and workspace settings for sandbox/whitelist

-- Ensure wa_templates has metadata columns
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_templates' and column_name = 'last_synced_at'
  ) then
    alter table wa_templates add column last_synced_at timestamptz null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_templates' and column_name = 'quality_score'
  ) then
    alter table wa_templates add column quality_score text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'wa_templates' and column_name = 'rejection_reason'
  ) then
    alter table wa_templates add column rejection_reason text null;
  end if;

  -- ensure updated_at has default
  perform 1 from information_schema.columns
    where table_name = 'wa_templates'
      and column_name = 'updated_at'
      and column_default is not null;
  if not found then
    alter table wa_templates alter column updated_at set default now();
  end if;

  -- uniqueness per workspace + name + language for upsert
  if not exists (
    select 1 from pg_constraint
    where conname = 'wa_templates_workspace_name_lang_key'
  ) then
    alter table wa_templates
      add constraint wa_templates_workspace_name_lang_key
      unique (workspace_id, name, language);
  end if;
end $$;

-- Workspace WhatsApp settings (sandbox + whitelist)
create table if not exists wa_settings (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  sandbox_enabled boolean not null default true,
  test_whitelist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table wa_settings enable row level security;
do $$
begin
  drop policy if exists wa_settings_select on wa_settings;
  create policy wa_settings_select on wa_settings
    for select using (
      exists (
        select 1 from workspace_members wm
        where wm.workspace_id = wa_settings.workspace_id
          and wm.user_id = auth.uid()
      )
      or auth.role() = 'service_role'
    );

  drop policy if exists wa_settings_write on wa_settings;
  create policy wa_settings_write on wa_settings
    for all using (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = wa_settings.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    )
    with check (
      (
        exists (
          select 1 from workspace_members wm
          where wm.workspace_id = wa_settings.workspace_id
            and wm.user_id = auth.uid()
            and wm.role in ('owner','admin')
        )
      )
      or auth.role() = 'service_role'
    );
end $$;
