-- ============================================================================
-- Migration: Ensure UNIQUE constraint on meta_assets_cache (workspace_id, phone_number_id)
-- Purpose: Enable safe upsert operations with ON CONFLICT(workspace_id, phone_number_id)
-- Date: 2026-01-25
-- ============================================================================

-- WHY THIS MIGRATION?
-- The initial table creation included a unique constraint, but we want to ensure
-- it exists and handle any potential duplicates before enforcing uniqueness.
-- Without this constraint, ON CONFLICT upserts will fail with:
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 1: Deduplicate any existing rows (safety measure)
-- ────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete older duplicates using ROW_NUMBER() window function
  -- Keep the newest record per (workspace_id, phone_number_id)
  -- Priority: updated_at DESC NULLS LAST > last_synced_at DESC NULLS LAST > ctid DESC
  WITH ranked_rows AS (
    SELECT 
      ctid,
      ROW_NUMBER() OVER (
        PARTITION BY workspace_id, phone_number_id
        ORDER BY 
          updated_at DESC NULLS LAST,
          last_synced_at DESC NULLS LAST,
          ctid DESC
      ) as row_num
    FROM public.meta_assets_cache
  )
  DELETE FROM public.meta_assets_cache
  WHERE ctid IN (
    SELECT ctid FROM ranked_rows WHERE row_num > 1
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deduplication complete. Deleted % older duplicate record(s).', deleted_count;
  ELSE
    RAISE NOTICE 'No duplicates found. Proceeding with constraint creation.';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 2: Create UNIQUE index if not exists
-- ────────────────────────────────────────────────────────────────────────────

-- Using a unique index instead of a constraint provides better performance
-- and allows for more flexible naming
CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_assets_cache_ws_phone_unique
  ON public.meta_assets_cache (workspace_id, phone_number_id);

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 3: Verify constraint exists (for documentation)
-- ────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Check if unique constraint/index exists
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'meta_assets_cache'
      AND indexdef LIKE '%UNIQUE%'
      AND indexdef LIKE '%workspace_id%'
      AND indexdef LIKE '%phone_number_id%'
  ) THEN
    RAISE NOTICE '✓ UNIQUE constraint verified on (workspace_id, phone_number_id)';
  ELSE
    RAISE WARNING '✗ UNIQUE constraint verification failed! Upsert operations may fail.';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERY (run manually after migration):
-- ────────────────────────────────────────────────────────────────────────────
-- 
-- SELECT 
--   indexname, 
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename = 'meta_assets_cache'
--   AND indexname LIKE '%unique%';
--
-- Expected output: idx_meta_assets_cache_ws_phone_unique with UNIQUE keyword
-- ────────────────────────────────────────────────────────────────────────────

COMMENT ON INDEX idx_meta_assets_cache_ws_phone_unique IS 
  'Unique constraint for (workspace_id, phone_number_id) - enables ON CONFLICT upsert in embedded signup and sync endpoints';
