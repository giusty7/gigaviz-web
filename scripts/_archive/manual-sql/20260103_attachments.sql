-- Message attachments (normalized)
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

create table if not exists message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  kind text not null,
  mime_type text,
  file_name text,
  size_bytes bigint,
  url text,
  storage_path text,
  thumb_path text,
  created_at timestamptz not null default now(),
  constraint message_attachments_storage_or_url_check
    check (url is not null or storage_path is not null)
);

create index if not exists message_attachments_message_id_idx
  on message_attachments (message_id);

alter table message_attachments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'message_attachments'
      and policyname = 'admin_select_message_attachments'
  ) then
    create policy admin_select_message_attachments
      on message_attachments for select
      using (
        exists (
          select 1
          from messages m
          join workspace_members wm
            on wm.workspace_id = m.workspace_id
          where m.id = message_attachments.message_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'message_attachments'
      and policyname = 'admin_insert_message_attachments'
  ) then
    create policy admin_insert_message_attachments
      on message_attachments for insert with check (
        exists (
          select 1
          from messages m
          join workspace_members wm
            on wm.workspace_id = m.workspace_id
          where m.id = message_attachments.message_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'message_attachments'
      and policyname = 'admin_update_message_attachments'
  ) then
    create policy admin_update_message_attachments
      on message_attachments for update
      using (
        exists (
          select 1
          from messages m
          join workspace_members wm
            on wm.workspace_id = m.workspace_id
          where m.id = message_attachments.message_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'message_attachments'
      and policyname = 'admin_delete_message_attachments'
  ) then
    create policy admin_delete_message_attachments
      on message_attachments for delete
      using (
        exists (
          select 1
          from messages m
          join workspace_members wm
            on wm.workspace_id = m.workspace_id
          where m.id = message_attachments.message_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;
end
$$;

-- Seed example (replace <message_id> and <path> accordingly)
-- insert into message_attachments (message_id, kind, mime_type, file_name, size_bytes, storage_path)
-- values
--   ('<message_id>', 'image', 'image/png', 'sample.png', 12345, 'inbox-attachments/<path>/sample.png'),
--   ('<message_id>', 'video', 'video/mp4', 'sample.mp4', 45678, 'inbox-attachments/<path>/sample.mp4'),
--   ('<message_id>', 'audio', 'audio/mpeg', 'sample.mp3', 23456, 'inbox-attachments/<path>/sample.mp3'),
--   ('<message_id>', 'document', 'application/pdf', 'sample.pdf', 34567, 'inbox-attachments/<path>/sample.pdf');

-- Rollback notes:
-- drop policy if exists admin_select_message_attachments on message_attachments;
-- drop policy if exists admin_insert_message_attachments on message_attachments;
-- drop policy if exists admin_update_message_attachments on message_attachments;
-- drop policy if exists admin_delete_message_attachments on message_attachments;
-- drop table if exists message_attachments;
