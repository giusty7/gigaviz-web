-- CRM custom fields for contacts
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

create table if not exists crm_fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  key text not null,
  label text not null,
  type text not null,
  options jsonb null,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, key)
);

create table if not exists crm_field_values (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  field_id uuid not null references crm_fields(id) on delete cascade,
  value_text text null,
  value_json jsonb null,
  updated_at timestamptz not null default now(),
  unique (contact_id, field_id)
);

create index if not exists crm_fields_workspace_idx
  on crm_fields (workspace_id, created_at desc);

create index if not exists crm_field_values_contact_idx
  on crm_field_values (contact_id);

alter table crm_fields enable row level security;
alter table crm_field_values enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_fields'
      and policyname = 'admin_select_crm_fields'
  ) then
    create policy admin_select_crm_fields
      on crm_fields for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = crm_fields.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_fields'
      and policyname = 'admin_insert_crm_fields'
  ) then
    create policy admin_insert_crm_fields
      on crm_fields for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = crm_fields.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_fields'
      and policyname = 'admin_update_crm_fields'
  ) then
    create policy admin_update_crm_fields
      on crm_fields for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = crm_fields.workspace_id
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_field_values'
      and policyname = 'admin_select_crm_field_values'
  ) then
    create policy admin_select_crm_field_values
      on crm_field_values for select
      using (
        exists (
          select 1
          from crm_fields f
          join workspace_members wm
            on wm.workspace_id = f.workspace_id
          where f.id = crm_field_values.field_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_field_values'
      and policyname = 'admin_insert_crm_field_values'
  ) then
    create policy admin_insert_crm_field_values
      on crm_field_values for insert with check (
        exists (
          select 1
          from crm_fields f
          join contacts c
            on c.id = crm_field_values.contact_id
          join workspace_members wm
            on wm.workspace_id = f.workspace_id
          where f.id = crm_field_values.field_id
            and c.workspace_id = f.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_field_values'
      and policyname = 'admin_update_crm_field_values'
  ) then
    create policy admin_update_crm_field_values
      on crm_field_values for update
      using (
        exists (
          select 1
          from crm_fields f
          join contacts c
            on c.id = crm_field_values.contact_id
          join workspace_members wm
            on wm.workspace_id = f.workspace_id
          where f.id = crm_field_values.field_id
            and c.workspace_id = f.workspace_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;
end
$$;

-- Rollback notes:
-- drop policy if exists admin_select_crm_field_values on crm_field_values;
-- drop policy if exists admin_insert_crm_field_values on crm_field_values;
-- drop policy if exists admin_update_crm_field_values on crm_field_values;
-- drop policy if exists admin_select_crm_fields on crm_fields;
-- drop policy if exists admin_insert_crm_fields on crm_fields;
-- drop policy if exists admin_update_crm_fields on crm_fields;
-- drop table if exists crm_field_values;
-- drop table if exists crm_fields;
