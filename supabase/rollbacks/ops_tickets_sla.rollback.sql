-- Rollback for 20260201230000_ops_tickets_sla.sql

DROP TRIGGER IF EXISTS trigger_set_ticket_resolved_at ON ops_support_tickets;
DROP TRIGGER IF EXISTS trigger_set_ticket_due_at ON ops_support_tickets;
DROP FUNCTION IF EXISTS set_ticket_resolved_at();
DROP FUNCTION IF EXISTS set_ticket_due_at();

DROP INDEX IF EXISTS ops_support_tickets_due_at_idx;

ALTER TABLE ops_support_tickets
  DROP COLUMN IF EXISTS resolved_at,
  DROP COLUMN IF EXISTS first_response_at,
  DROP COLUMN IF EXISTS due_at;
