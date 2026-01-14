-- Migration: Add streaming support fields to helper_messages

-- Add new columns for streaming/status tracking
ALTER TABLE public.helper_messages
  ADD COLUMN IF NOT EXISTS provider_key text,
  ADD COLUMN IF NOT EXISTS mode_key text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'done'
    CHECK (status IN ('streaming', 'done', 'error', 'cancelled')),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS usage_input_tokens integer,
  ADD COLUMN IF NOT EXISTS usage_output_tokens integer,
  ADD COLUMN IF NOT EXISTS usage_total_tokens integer;

-- Add index for efficient workspace+conversation+created_at queries
CREATE INDEX IF NOT EXISTS helper_messages_ws_conv_created_idx
  ON public.helper_messages (workspace_id, conversation_id, created_at ASC);

-- Add index for streaming status queries (find in-flight messages)
CREATE INDEX IF NOT EXISTS helper_messages_status_idx
  ON public.helper_messages (workspace_id, status)
  WHERE status = 'streaming';

-- Update function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.helper_messages_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS helper_messages_updated_at ON public.helper_messages;
CREATE TRIGGER helper_messages_updated_at
  BEFORE UPDATE ON public.helper_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.helper_messages_update_timestamp();

-- Add comment for documentation
COMMENT ON COLUMN public.helper_messages.status IS 'Message status: streaming (in progress), done (complete), error (failed), cancelled (aborted by user)';
COMMENT ON COLUMN public.helper_messages.provider_key IS 'Provider used: openai, anthropic, gemini, local';
COMMENT ON COLUMN public.helper_messages.mode_key IS 'Mode used: chat, copy, summary';
