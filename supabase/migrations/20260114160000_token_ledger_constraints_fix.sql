-- Token ledger constraints fix
-- Previous migration used incorrect syntax. This migration properly handles constraints.

-- Safely drop constraints if they exist using correct ALTER TABLE syntax
DO $$
BEGIN
  -- Drop entry_type constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'token_ledger_entry_type_check'
    AND conrelid = 'public.token_ledger'::regclass
  ) THEN
    ALTER TABLE public.token_ledger DROP CONSTRAINT token_ledger_entry_type_check;
  END IF;

  -- Drop status constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'token_ledger_status_check'
    AND conrelid = 'public.token_ledger'::regclass
  ) THEN
    ALTER TABLE public.token_ledger DROP CONSTRAINT token_ledger_status_check;
  END IF;
END $$;

-- Add columns if they don't exist (idempotent)
ALTER TABLE public.token_ledger ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.token_ledger ADD COLUMN IF NOT EXISTS entry_type text;
ALTER TABLE public.token_ledger ADD COLUMN IF NOT EXISTS tokens bigint NOT NULL DEFAULT 0;
ALTER TABLE public.token_ledger ADD COLUMN IF NOT EXISTS ref_table text;
ALTER TABLE public.token_ledger ADD COLUMN IF NOT EXISTS ref_id uuid;
ALTER TABLE public.token_ledger ADD COLUMN IF NOT EXISTS status text;

-- Backfill tokens column from existing data
UPDATE public.token_ledger
SET tokens = COALESCE(
  NULLIF(tokens, 0),
  delta_bigint,
  (meta->>'amount')::bigint,
  0
)
WHERE tokens = 0 OR tokens IS NULL;

-- Backfill entry_type from existing data
UPDATE public.token_ledger
SET entry_type = COALESCE(
  entry_type,
  type,
  CASE
    WHEN COALESCE(delta_bigint, tokens, 0) < 0 THEN 'spend'
    WHEN COALESCE(delta_bigint, tokens, 0) > 0 THEN 'topup'
    ELSE 'adjust'
  END
)
WHERE entry_type IS NULL;

-- Backfill status
UPDATE public.token_ledger
SET status = 'posted'
WHERE status IS NULL;

-- Backfill ref_table and ref_id from ref column if available
UPDATE public.token_ledger
SET
  ref_table = CASE
    WHEN ref_table IS NULL AND ref IS NOT NULL AND position(':' in ref) > 0
    THEN split_part(ref, ':', 1)
    ELSE ref_table
  END,
  ref_id = CASE
    WHEN ref_id IS NULL AND ref IS NOT NULL AND position(':' in ref) > 0
    THEN NULLIF(split_part(ref, ':', 2), '')::uuid
    ELSE ref_id
  END
WHERE ref IS NOT NULL AND (ref_table IS NULL OR ref_id IS NULL);

-- Now set defaults and NOT NULL after backfill
ALTER TABLE public.token_ledger ALTER COLUMN entry_type SET DEFAULT 'adjust';
ALTER TABLE public.token_ledger ALTER COLUMN entry_type SET NOT NULL;
ALTER TABLE public.token_ledger ALTER COLUMN status SET DEFAULT 'posted';
ALTER TABLE public.token_ledger ALTER COLUMN status SET NOT NULL;

-- Add constraints with proper syntax
ALTER TABLE public.token_ledger
  ADD CONSTRAINT token_ledger_entry_type_check
  CHECK (entry_type IN ('topup', 'spend', 'adjust'));

ALTER TABLE public.token_ledger
  ADD CONSTRAINT token_ledger_status_check
  CHECK (status IN ('posted', 'pending', 'void'));

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_token_ledger_workspace_status_created
  ON public.token_ledger (workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_token_ledger_workspace_entry_type
  ON public.token_ledger (workspace_id, entry_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_token_ledger_ref
  ON public.token_ledger (ref_table, ref_id)
  WHERE ref_table IS NOT NULL;

-- Create or replace the defaults trigger function
CREATE OR REPLACE FUNCTION token_ledger_defaults()
RETURNS trigger AS $$
BEGIN
  -- Auto-populate tokens from delta_bigint if not set
  IF NEW.tokens IS NULL OR NEW.tokens = 0 THEN
    NEW.tokens := COALESCE(NEW.delta_bigint, 0);
  END IF;

  -- Auto-determine entry_type based on sign
  IF NEW.entry_type IS NULL THEN
    IF COALESCE(NEW.delta_bigint, NEW.tokens, 0) < 0 THEN
      NEW.entry_type := 'spend';
    ELSIF COALESCE(NEW.delta_bigint, NEW.tokens, 0) > 0 THEN
      NEW.entry_type := 'topup';
    ELSE
      NEW.entry_type := 'adjust';
    END IF;
  END IF;

  -- Default status to posted
  IF NEW.status IS NULL THEN
    NEW.status := 'posted';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_token_ledger_defaults ON public.token_ledger;
CREATE TRIGGER trg_token_ledger_defaults
  BEFORE INSERT ON public.token_ledger
  FOR EACH ROW
  EXECUTE PROCEDURE token_ledger_defaults();
