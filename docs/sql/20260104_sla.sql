-- SLA fields for conversations (tickets)
-- Safe to re-run; uses IF NOT EXISTS guards where possible.

alter table conversations
  add column if not exists next_response_due_at timestamptz,
  add column if not exists resolution_due_at timestamptz,
  add column if not exists sla_status text,
  add column if not exists last_customer_message_at timestamptz;

-- Rollback notes:
-- alter table conversations drop column if exists next_response_due_at;
-- alter table conversations drop column if exists resolution_due_at;
-- alter table conversations drop column if exists sla_status;
-- alter table conversations drop column if exists last_customer_message_at;
