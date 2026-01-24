# Meta Assets Cache UNIQUE Constraint Migration

## Problem Solved
Ensures that `meta_assets_cache` table has a UNIQUE constraint on `(workspace_id, phone_number_id)` to enable safe upsert operations.

## Migration File
**File:** `supabase/migrations/20260125100000_meta_assets_cache_unique_ws_phone.sql`

## What It Does

### 1. Deduplication (Safety Step)
- Checks for duplicate `(workspace_id, phone_number_id)` pairs
- If duplicates exist, keeps the newest record based on:
  - `updated_at` (primary)
  - `last_synced_at` (secondary)
  - `ctid` system column (tie-breaker)
- Deletes older duplicates

### 2. Creates UNIQUE Index
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_assets_cache_ws_phone_unique
  ON public.meta_assets_cache (workspace_id, phone_number_id);
```

### 3. Verification
- Raises notices confirming constraint exists
- Warns if verification fails

## How to Run

### Option 1: Supabase CLI (Recommended)
```bash
cd gigaviz-web
supabase db push
```

### Option 2: Manual SQL Execution
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `20260125100000_meta_assets_cache_unique_ws_phone.sql`
3. Execute
4. Check for NOTICE messages in output

## How to Verify

### Query 1: Check Unique Index Exists
```sql
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'meta_assets_cache'
  AND (indexdef LIKE '%UNIQUE%' OR indexname LIKE '%unique%')
  AND indexdef LIKE '%workspace_id%'
  AND indexdef LIKE '%phone_number_id%';
```

**Expected Output:**
| indexname | indexdef |
|-----------|----------|
| `idx_meta_assets_cache_ws_phone_unique` | `CREATE UNIQUE INDEX ... ON public.meta_assets_cache USING btree (workspace_id, phone_number_id)` |

OR (from original migration):
| indexname | indexdef |
|-----------|----------|
| `meta_assets_cache_workspace_id_phone_number_id_key` | `CREATE UNIQUE INDEX ... USING btree (workspace_id, phone_number_id)` |

### Query 2: Test Upsert Operation
```sql
-- Should succeed (no error)
INSERT INTO public.meta_assets_cache (
  workspace_id, 
  phone_number_id, 
  waba_id, 
  display_phone_number
)
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'test_phone_123', 
  'test_waba_456', 
  '+1234567890'
)
ON CONFLICT (workspace_id, phone_number_id)
DO UPDATE SET 
  display_phone_number = EXCLUDED.display_phone_number,
  updated_at = now();
```

**Expected:** Query succeeds without error.

If you get error: `there is no unique or exclusion constraint matching the ON CONFLICT specification` → Migration didn't apply correctly.

### Query 3: Check for Duplicates (Should Return 0)
```sql
SELECT workspace_id, phone_number_id, COUNT(*) as duplicate_count
FROM public.meta_assets_cache
GROUP BY workspace_id, phone_number_id
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows (no duplicates)

## Impact on Code

### Backend Routes Using Upsert
All these routes now have guaranteed upsert safety:

1. **Embedded Signup Route**
   - File: `app/api/meta/whatsapp/connections/embedded-signup/route.ts`
   - Operation: `db.from("meta_assets_cache").upsert(..., { onConflict: "workspace_id,phone_number_id" })`

2. **Sync Route**
   - File: `app/api/meta-hub/connections/[phoneNumberId]/sync/route.ts`
   - Operation: Same as above

### No Code Changes Required
The API routes already use the correct `onConflict` clause. This migration just ensures the database constraint exists to support it.

## Safety & Idempotency

✅ **Safe to run multiple times** - Uses `IF NOT EXISTS` and checks for duplicates first  
✅ **Non-destructive** - Only deletes duplicates if they exist  
✅ **Transaction-safe** - Uses DO blocks for atomic operations  
✅ **Logged** - Raises NOTICE/WARNING messages for observability

## Rollback (If Needed)

If you need to remove the unique constraint:

```sql
-- Find the constraint name
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'meta_assets_cache'
  AND indexdef LIKE '%UNIQUE%'
  AND indexdef LIKE '%workspace_id%phone_number_id%';

-- Drop it (use the actual name from above)
DROP INDEX IF EXISTS idx_meta_assets_cache_ws_phone_unique;
```

⚠️ **Warning:** Dropping the constraint will cause upsert operations to fail!

## Notes

- The original migration `20260121150000_meta_tokens_assets_events.sql` already included `unique (workspace_id, phone_number_id)` on line 81
- This migration serves as a safety net and explicit documentation
- PostgreSQL may create the index with a different name (e.g., `meta_assets_cache_workspace_id_phone_number_id_key`)
- Both the inline constraint and the explicit index are functionally equivalent
