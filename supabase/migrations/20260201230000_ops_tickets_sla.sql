-- Add SLA tracking columns to ops_support_tickets
-- Migration: 20260201230000_ops_tickets_sla.sql

ALTER TABLE ops_support_tickets
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Add index for overdue tickets query
CREATE INDEX IF NOT EXISTS ops_support_tickets_due_at_idx 
  ON ops_support_tickets(due_at) 
  WHERE status IN ('open', 'in_progress');

-- Function to auto-set due_at on ticket creation (24h for urgent, 72h for high, 7d for medium/low)
CREATE OR REPLACE FUNCTION set_ticket_due_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_at IS NULL THEN
    NEW.due_at := CASE
      WHEN NEW.priority = 'urgent' THEN NEW.created_at + INTERVAL '24 hours'
      WHEN NEW.priority = 'high' THEN NEW.created_at + INTERVAL '3 days'
      WHEN NEW.priority = 'medium' THEN NEW.created_at + INTERVAL '7 days'
      ELSE NEW.created_at + INTERVAL '14 days' -- low priority
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_due_at ON ops_support_tickets;
CREATE TRIGGER trigger_set_ticket_due_at
  BEFORE INSERT ON ops_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_due_at();

-- Function to auto-set resolved_at when status changes to resolved/closed
CREATE OR REPLACE FUNCTION set_ticket_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
    NEW.resolved_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_resolved_at ON ops_support_tickets;
CREATE TRIGGER trigger_set_ticket_resolved_at
  BEFORE UPDATE OF status ON ops_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_resolved_at();

COMMENT ON COLUMN ops_support_tickets.due_at IS 'SLA deadline for ticket resolution';
COMMENT ON COLUMN ops_support_tickets.first_response_at IS 'Timestamp when admin first responded to ticket';
COMMENT ON COLUMN ops_support_tickets.resolved_at IS 'Timestamp when ticket was resolved';
