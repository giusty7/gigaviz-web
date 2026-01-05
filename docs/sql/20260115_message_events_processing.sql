-- Add processing tracking for webhook events.

alter table message_events
  add column if not exists processing_status text,
  add column if not exists processing_error text,
  add column if not exists processed_at timestamptz,
  add column if not exists processing_error_at timestamptz;
