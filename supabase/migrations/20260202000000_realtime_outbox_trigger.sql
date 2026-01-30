-- =============================================
-- Real-time Outbox Processing with Database Triggers
-- =============================================
-- This migration enables event-driven message processing
-- instead of polling with cron jobs (Vercel Hobby limit workaround)

-- Function: Notify when new outbox message is inserted
CREATE OR REPLACE FUNCTION notify_outbox_insert()
RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  -- Build notification payload
  payload := json_build_object(
    'id', NEW.id,
    'workspace_id', NEW.workspace_id,
    'message_type', NEW.message_type,
    'to_phone', NEW.to_phone,
    'connection_id', NEW.connection_id,
    'attempts', NEW.attempts,
    'created_at', NEW.created_at
  );
  
  -- Send notification via PostgreSQL LISTEN/NOTIFY
  -- This can be picked up by:
  -- 1. Supabase Realtime subscriptions
  -- 2. Database webhooks
  -- 3. Edge functions
  PERFORM pg_notify('outbox_new', payload::text);
  
  -- Log for debugging
  RAISE NOTICE 'Outbox message queued: % (workspace: %)', NEW.id, NEW.workspace_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Fire on INSERT to outbox_messages
DROP TRIGGER IF EXISTS outbox_insert_trigger ON public.outbox_messages;
CREATE TRIGGER outbox_insert_trigger
  AFTER INSERT ON public.outbox_messages
  FOR EACH ROW
  WHEN (NEW.status = 'queued')  -- Only for newly queued messages
  EXECUTE FUNCTION notify_outbox_insert();

-- Function: Notify when queued message needs retry
CREATE OR REPLACE FUNCTION notify_outbox_retry()
RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  -- Only notify if status changed from non-queued to queued (retry scenario)
  IF OLD.status <> 'queued' AND NEW.status = 'queued' THEN
    payload := json_build_object(
      'id', NEW.id,
      'workspace_id', NEW.workspace_id,
      'message_type', NEW.message_type,
      'attempts', NEW.attempts,
      'last_error', NEW.last_error,
      'retry_at', NEW.next_attempt_at
    );
    
    PERFORM pg_notify('outbox_retry', payload::text);
    
    RAISE NOTICE 'Outbox message retry queued: % (attempt %)', NEW.id, NEW.attempts;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Fire on UPDATE when message is requeued
DROP TRIGGER IF EXISTS outbox_retry_trigger ON public.outbox_messages;
CREATE TRIGGER outbox_retry_trigger
  AFTER UPDATE ON public.outbox_messages
  FOR EACH ROW
  WHEN (NEW.status = 'queued' AND OLD.status <> 'queued')
  EXECUTE FUNCTION notify_outbox_retry();

-- Comment for documentation
COMMENT ON FUNCTION notify_outbox_insert() IS 
  'Notifies listeners when a new message is queued in outbox_messages. Used for real-time event-driven processing.';
COMMENT ON FUNCTION notify_outbox_retry() IS 
  'Notifies listeners when a failed message is requeued for retry. Enables immediate retry processing.';
COMMENT ON TRIGGER outbox_insert_trigger ON public.outbox_messages IS 
  'Triggers real-time notification for new outbox messages';
COMMENT ON TRIGGER outbox_retry_trigger ON public.outbox_messages IS 
  'Triggers real-time notification for outbox message retries';

-- Grant execute permissions to authenticated users (via RLS)
GRANT EXECUTE ON FUNCTION notify_outbox_insert() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_outbox_retry() TO authenticated;
