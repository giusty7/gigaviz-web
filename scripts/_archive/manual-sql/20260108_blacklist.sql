-- Contact comms status (blacklist/whitelist)
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

alter table contacts
  add column if not exists comms_status text not null default 'normal',
  add column if not exists comms_status_updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contacts_comms_status_check'
  ) then
    alter table contacts
      add constraint contacts_comms_status_check
      check (comms_status in ('normal', 'blacklisted', 'whitelisted'));
  end if;
end
$$;

create index if not exists contacts_comms_status_idx
  on contacts (workspace_id, comms_status);

-- Rollback notes:
-- alter table contacts drop constraint if exists contacts_comms_status_check;
-- drop index if exists contacts_comms_status_idx;
-- alter table contacts drop column if exists comms_status_updated_at;
-- alter table contacts drop column if exists comms_status;
