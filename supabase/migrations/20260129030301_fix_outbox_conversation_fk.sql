-- Fix outbox_messages FK constraint issue
-- conversation_id references public.conversations but inbox uses thread_id for wa_threads
-- Many threads don't exist in conversations table, causing FK violations

-- Drop the foreign key constraint if it exists
alter table public.outbox_messages
  drop constraint if exists outbox_messages_conversation_id_fkey;

-- Make conversation_id nullable (for backwards compatibility with other modules)
alter table public.outbox_messages
  alter column conversation_id drop not null;

-- Add index on thread_id for better query performance
create index if not exists idx_outbox_messages_thread_id
  on public.outbox_messages(thread_id);

-- Add index on workspace_id + status for worker queries
create index if not exists idx_outbox_messages_workspace_status
  on public.outbox_messages(workspace_id, status)
  where status = 'queued';
