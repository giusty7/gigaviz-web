-- Contact dedup & merge support
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

alter table contacts
  add column if not exists phone_norm text,
  add column if not exists merged_into_contact_id uuid references contacts(id),
  add column if not exists deleted_at timestamptz;

create index if not exists contacts_phone_norm_idx
  on contacts (workspace_id, phone_norm)
  where deleted_at is null;

create table if not exists contact_aliases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  primary_contact_id uuid not null references contacts(id) on delete cascade,
  alias_phone_norm text null,
  alias_external_id text null,
  created_at timestamptz not null default now()
);

create unique index if not exists contact_aliases_phone_unique
  on contact_aliases (workspace_id, primary_contact_id, alias_phone_norm)
  where alias_phone_norm is not null;

create unique index if not exists contact_aliases_external_unique
  on contact_aliases (workspace_id, primary_contact_id, alias_external_id)
  where alias_external_id is not null;

create table if not exists contact_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  contact_id uuid not null,
  type text not null,
  meta jsonb not null,
  created_at timestamptz not null default now(),
  created_by text not null default 'system'
);

alter table contact_aliases enable row level security;
alter table contact_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_aliases'
      and policyname = 'admin_select_contact_aliases'
  ) then
    create policy admin_select_contact_aliases
      on contact_aliases for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = contact_aliases.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_aliases'
      and policyname = 'admin_insert_contact_aliases'
  ) then
    create policy admin_insert_contact_aliases
      on contact_aliases for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = contact_aliases.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_aliases'
      and policyname = 'admin_update_contact_aliases'
  ) then
    create policy admin_update_contact_aliases
      on contact_aliases for update
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = contact_aliases.workspace_id
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
      and tablename = 'contact_events'
      and policyname = 'admin_select_contact_events'
  ) then
    create policy admin_select_contact_events
      on contact_events for select
      using (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = contact_events.workspace_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_events'
      and policyname = 'admin_insert_contact_events'
  ) then
    create policy admin_insert_contact_events
      on contact_events for insert with check (
        exists (
          select 1
          from workspace_members wm
          where wm.user_id = auth.uid()
            and wm.role = 'admin'
            and wm.workspace_id = contact_events.workspace_id
        )
      );
  end if;
end
$$;

create or replace function merge_contacts(
  p_workspace_id uuid,
  p_primary_contact_id uuid,
  p_duplicate_contact_ids uuid[],
  p_actor text default 'system'
)
returns jsonb
language plpgsql
as $$
declare
  dup_id uuid;
  now_ts timestamptz := now();
  alias_phone text;
  existing_merge uuid;
begin
  if p_primary_contact_id is null then
    raise exception 'primary_required';
  end if;

  if not exists (
    select 1
    from contacts
    where id = p_primary_contact_id
      and workspace_id = p_workspace_id
      and deleted_at is null
  ) then
    raise exception 'primary_not_found';
  end if;

  foreach dup_id in array p_duplicate_contact_ids loop
    if dup_id is null or dup_id = p_primary_contact_id then
      continue;
    end if;

    select merged_into_contact_id
      into existing_merge
    from contacts
    where id = dup_id
      and workspace_id = p_workspace_id;

    if not found then
      raise exception 'duplicate_not_found';
    end if;

    if existing_merge = p_primary_contact_id then
      continue;
    end if;

    if existing_merge is not null and existing_merge <> p_primary_contact_id then
      raise exception 'duplicate_already_merged';
    end if;

    update conversations
      set contact_id = p_primary_contact_id
    where workspace_id = p_workspace_id
      and contact_id = dup_id;

    insert into crm_field_values (contact_id, field_id, value_text, value_json, updated_at)
    select p_primary_contact_id, field_id, value_text, value_json, updated_at
    from crm_field_values
    where contact_id = dup_id
    on conflict (contact_id, field_id) do nothing;

    delete from crm_field_values where contact_id = dup_id;

    select phone_norm
      into alias_phone
    from contacts
    where id = dup_id;

    if alias_phone is not null then
      insert into contact_aliases (
        workspace_id,
        primary_contact_id,
        alias_phone_norm,
        created_at
      )
      values (
        p_workspace_id,
        p_primary_contact_id,
        alias_phone,
        now_ts
      )
      on conflict do nothing;
    end if;

    update contacts
      set merged_into_contact_id = p_primary_contact_id,
          deleted_at = now_ts
    where id = dup_id;

    insert into contact_events (
      workspace_id,
      contact_id,
      type,
      meta,
      created_at,
      created_by
    )
    values (
      p_workspace_id,
      dup_id,
      'merged',
      jsonb_build_object('from', dup_id, 'to', p_primary_contact_id),
      now_ts,
      coalesce(p_actor, 'system')
    );
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

-- Rollback notes:
-- drop function if exists merge_contacts(uuid, uuid, uuid[], text);
-- drop policy if exists admin_select_contact_events on contact_events;
-- drop policy if exists admin_insert_contact_events on contact_events;
-- drop policy if exists admin_select_contact_aliases on contact_aliases;
-- drop policy if exists admin_insert_contact_aliases on contact_aliases;
-- drop policy if exists admin_update_contact_aliases on contact_aliases;
-- drop table if exists contact_events;
-- drop index if exists contact_aliases_phone_unique;
-- drop index if exists contact_aliases_external_unique;
-- drop table if exists contact_aliases;
-- drop index if exists contacts_phone_norm_idx;
-- alter table contacts drop column if exists deleted_at;
-- alter table contacts drop column if exists merged_into_contact_id;
-- alter table contacts drop column if exists phone_norm;
