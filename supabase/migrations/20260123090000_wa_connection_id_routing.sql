-- ============================================================================
-- Migration: Add connection_id FK for deterministic outbound routing
-- Purpose: Ensure wa_threads and wa_messages link to wa_phone_numbers.id
--          for consistent multi-tenant routing (no more phone_number_id mismatch)
-- ============================================================================

-- 1) Add connection_id column to wa_threads if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wa_threads'
      AND column_name = 'connection_id'
  ) THEN
    ALTER TABLE public.wa_threads
    ADD COLUMN connection_id uuid REFERENCES public.wa_phone_numbers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2) Add connection_id column to wa_messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wa_messages'
      AND column_name = 'connection_id'
  ) THEN
    ALTER TABLE public.wa_messages
    ADD COLUMN connection_id uuid REFERENCES public.wa_phone_numbers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Create orphan_webhook_events table for unmatched phone_number_id events
CREATE TABLE IF NOT EXISTS public.orphan_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  phone_number_id text NOT NULL,
  event_key text,
  payload_json jsonb,
  error text,
  processed boolean DEFAULT false
);

-- 4) Index for orphan events lookup
CREATE INDEX IF NOT EXISTS idx_orphan_webhook_events_phone_number_id
  ON public.orphan_webhook_events(phone_number_id);

CREATE INDEX IF NOT EXISTS idx_orphan_webhook_events_processed
  ON public.orphan_webhook_events(processed) WHERE processed = false;

-- 5) Index on wa_threads for connection_id lookup
CREATE INDEX IF NOT EXISTS idx_wa_threads_connection_updated
  ON public.wa_threads(connection_id, updated_at DESC)
  WHERE connection_id IS NOT NULL;

-- 6) Index on wa_messages for connection_id lookup
CREATE INDEX IF NOT EXISTS idx_wa_messages_connection_status
  ON public.wa_messages(connection_id, status_updated_at DESC)
  WHERE connection_id IS NOT NULL;

-- 7) Index on wa_messages for thread_id + created_at for message listing
CREATE INDEX IF NOT EXISTS idx_wa_messages_thread_created
  ON public.wa_messages(thread_id, created_at ASC);

-- 8) Backfill existing threads: set connection_id from phone_number_id match
UPDATE public.wa_threads t
SET connection_id = c.id
FROM public.wa_phone_numbers c
WHERE t.connection_id IS NULL
  AND t.phone_number_id IS NOT NULL
  AND t.workspace_id = c.workspace_id
  AND t.phone_number_id = c.phone_number_id;

-- 9) Backfill existing messages: set connection_id from thread's connection_id
UPDATE public.wa_messages m
SET connection_id = t.connection_id
FROM public.wa_threads t
WHERE m.connection_id IS NULL
  AND m.thread_id = t.id
  AND t.connection_id IS NOT NULL;

-- 10) Add RLS policy for orphan_webhook_events (platform admin only)
ALTER TABLE public.orphan_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orphan_webhook_events_platform_admin ON public.orphan_webhook_events;
CREATE POLICY orphan_webhook_events_platform_admin ON public.orphan_webhook_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
    )
  );

-- Also allow service role
DROP POLICY IF EXISTS orphan_webhook_events_service_role ON public.orphan_webhook_events;
CREATE POLICY orphan_webhook_events_service_role ON public.orphan_webhook_events
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.orphan_webhook_events IS 'Stores webhook events with phone_number_id that cannot be mapped to any registered connection';
COMMENT ON COLUMN public.wa_threads.connection_id IS 'FK to wa_phone_numbers - determines which connection to use for outbound messages';
COMMENT ON COLUMN public.wa_messages.connection_id IS 'FK to wa_phone_numbers - audit trail for which connection processed this message';
