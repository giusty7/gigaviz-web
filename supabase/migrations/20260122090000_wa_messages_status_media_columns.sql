-- Add status tracking and media metadata columns to wa_messages if missing
-- Migration: 20260122090000_wa_messages_status_media_columns

-- Status tracking columns
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS status_at timestamptz;
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS failed_at timestamptz;
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS error_code text;
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS error_message text;

-- Media metadata columns
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS media_mime_type text;
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS media_filename text;
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS media_size bigint;

-- Backfill status_updated_at from best available timestamp
UPDATE public.wa_messages
SET status_updated_at = COALESCE(
  status_updated_at,
  status_at,
  delivered_at,
  read_at,
  failed_at,
  sent_at,
  wa_timestamp,
  created_at
)
WHERE status_updated_at IS NULL;

-- Backfill media_type from msg_type or type if not set
UPDATE public.wa_messages
SET media_type = COALESCE(media_type, msg_type, type)
WHERE media_type IS NULL AND (msg_type IS NOT NULL OR type IS NOT NULL);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS wa_messages_status_updated_at_idx
  ON public.wa_messages (status_updated_at DESC);

CREATE INDEX IF NOT EXISTS wa_messages_media_type_idx
  ON public.wa_messages (media_type);
