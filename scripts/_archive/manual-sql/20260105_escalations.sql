-- Escalations on SLA breach
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

create table if not exists conversation_escalations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  breach_type text not null,
  due_at timestamptz not null,
  reason text not null,
  created_at timestamptz not null default now(),
  created_by text not null default 'system',
  constraint conversation_escalations_unique_key
    unique (conversation_id, breach_type, due_at)
);

create index if not exists conversation_escalations_conversation_id_idx
  on conversation_escalations (conversation_id);

alter table conversation_escalations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversation_escalations'
      and policyname = 'admin_select_conversation_escalations'
  ) then
    create policy admin_select_conversation_escalations
      on conversation_escalations for select
      using (
        exists (
          select 1
          from conversations c
          join workspace_members wm
            on wm.workspace_id = c.workspace_id
          where c.id = conversation_escalations.conversation_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversation_escalations'
      and policyname = 'admin_insert_conversation_escalations'
  ) then
    create policy admin_insert_conversation_escalations
      on conversation_escalations for insert with check (
        exists (
          select 1
          from conversations c
          join workspace_members wm
            on wm.workspace_id = c.workspace_id
          where c.id = conversation_escalations.conversation_id
            and wm.user_id = auth.uid()
            and wm.role = 'admin'
        )
      );
  end if;
end
$$;

-- Rollback notes:
-- drop policy if exists admin_select_conversation_escalations on conversation_escalations;
-- drop policy if exists admin_insert_conversation_escalations on conversation_escalations;
-- drop table if exists conversation_escalations;
