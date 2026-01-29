# Database migration playbook

This repo uses Supabase migrations plus helper scripts to keep deployments safe, even if the database has drifted due to manual changes.

## Development Notes

### Windows: Turbopack source map warnings
If you see `Invalid source map... sourceMapURL could not be parsed` errors on Windows, use:
```bash
npm run dev          # Default (no Turbopack)
npm run dev:webpack  # Explicit Webpack fallback
```

## Prerequisites
- `SUPABASE_DB_URL` set to the target database URL (service-role or migration user). Keep this out of git and shells where it can leak.
- Tools: `supabase` CLI, `psql`, `bash`, and optionally `jq` for nicer verify output.

### Setting `SUPABASE_DB_URL`
```bash
export SUPABASE_DB_URL="postgresql://postgres:service-role-key@db-host:5432/postgres"
# Optionally place in .env.local (not committed)
```

## One-command migration
```bash
npm run db:push
```
This performs: backup -> `supabase db push` -> verification.

### Skipping backups (optional)
```bash
SKIP_DB_BACKUP=1 npm run db:push
```

If Docker is not available, the backup step falls back to `pg_dump` using `SUPABASE_DB_URL`.

## Manual steps (if needed)
```bash
# 1) Backup only
bash scripts/supabase/backup.sh

# 2) Apply migrations (expects SUPABASE_DB_URL and supabase CLI)
supabase db push --db-url "$SUPABASE_DB_URL"

# 3) Verify critical tables exist
npm run db:verify
```

## Seeding owner users
Use the service key via psql to seed the allowlist:
```bash
psql "$SUPABASE_DB_URL" <<'SQL'
insert into owner_members (user_id, email, role, active)
values ('<auth_user_uuid>', 'owner@example.com', 'owner', true)
on conflict (user_id) do update set email=excluded.email, role=excluded.role, active=true;
SQL
```

## Vercel env vars
Ensure these are set for production deployments:
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Meta WhatsApp Embedded Signup envs
Set these to enable the Meta Hub embedded signup entrypoint:
- `NEXT_PUBLIC_META_APP_ID`
- `NEXT_PUBLIC_META_CONFIG_ID`
- `META_OAUTH_REDIRECT_URI` (defaults to `/api/meta/oauth/callback`)

## Common failure patterns
- **Missing SUPABASE_DB_URL**: export it in your shell or .env.local before running scripts.
- **supabase CLI not found**: install from https://supabase.com/docs/guides/cli.
- **psql not found** (verify step): install Postgres client tools.
- **Migration fails due to prior manual schema changes**: re-run after ensuring the drifted objects are compatible (migrations are idempotent where possible). If an older manual script is needed, see `scripts/_archive/manual-sql/README.md` and convert snippets into a new migration instead of re-running the whole script.

## Smoke tests

### Ops Console Workspace Detail
1. Login as a platform admin (email allowlisted + platform_admins).
2. Navigate to `/ops/platform-admin` → **Workspaces** list.
3. Click **Details** on any workspace row.
4. Verify `/ops/workspaces/<workspace_id>` loads without 404.
5. For a non-existent UUID, verify a friendly "Workspace not found" message instead of 404.

### Ops Console Token Actions
1. Navigate to `/ops/workspaces/<workspace_id>`.
2. Click **Grant tokens**.
3. Enter amount (e.g., 100), reason ("Test grant"), leave Reference ID empty.
4. Click **Confirm grant** → should succeed, balance increases. No "Invalid input" error.
5. Repeat with Reference ID filled (e.g., "test-ref-123") → should also succeed.
6. Click **Deduct tokens**, enter amount and reason, leave Reference ID empty → should succeed.

### Ops Console Entitlement Actions
1. Navigate to `/ops/workspaces/<workspace_id>`.
2. Find any disabled entitlement (e.g., "Core OS").
3. Click **Enable** → should succeed with payload stored as `{}`.
4. Click **Payload** button, leave JSON as `{}` or add `{"tier":"beta"}`, save → should succeed.
5. Click **Disable**, leave reason empty → should succeed.
6. Click **Disable** again with a reason filled → should also succeed.

### Entitlement Payload v1 (Ops)
1. Open `/ops/workspaces/<workspace_id>`.
2. Enable `core_os` with an empty payload (leave payload editor empty) - should succeed and payload becomes `{}`.
3. Edit payload to `{"plan":"pro"}` - should persist.
4. Grant tokens `50000` with reason "For Meta Review" - balance updates and ledger entry created.
5. Verify audit log entries for `owner.entitlement.enabled` and `owner.tokens.granted`.

## Known Schema Migrations

### 20260120_fix_entitlements_value_column.sql
Fixes **Error 23502**: `null value in column "value" violates not-null constraint`

**Problem**: Legacy `workspace_entitlements` table has a `value` column with `NOT NULL` constraint, but the code only uses `enabled` and `payload` columns.

**Fix**:
- Migrates data from `value` → `payload` where applicable
- Drops `NOT NULL` constraint on `value` column
- Sets default `'{}'::jsonb` for backward compatibility
- Re-creates `apply_workspace_token_delta` function with table-qualified column references to fix "column reference 'balance' is ambiguous" error

**Applied via**:
```bash
SKIP_DB_BACKUP=1 npm run db:push
# or
supabase db push --db-url "$SUPABASE_DB_URL"
```

**Verify**:
```bash
npm run db:verify
# Or manually check:
psql "$SUPABASE_DB_URL" -c "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='workspace_entitlements' AND column_name='value';"
# Should show: value | YES
```

### 20260121200000_fix_ambiguous_column_refs.sql
Fixes **Error**: `column reference 'workspace_id' is ambiguous`

**Problem**: `set_workspace_entitlement_payload` function returns `TABLE(workspace_id uuid, ...)` with column names matching the table columns, causing ambiguity in the `RETURN QUERY SELECT` statement.

**Fix**:
- Uses table alias `we` in the SELECT query
- Fully qualifies all column references: `we.workspace_id`, `we.key`, `we.enabled`, etc.
- Also updates `apply_workspace_token_delta` with proper table qualification
- Removes duplicate unique index (primary key already covers it)

**Applied via**:
```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

**Verify**:
```bash
# Test entitlement enable in Owner Console
# Should succeed without "workspace_id is ambiguous" error
```

### Regression sanity checks (entitlement RPCs)
After deploying entitlement fixes, run:
```sql
select * from public.set_workspace_entitlement('coba-gigaviz','meta_hub',true,null,'owner grant');
select * from public.set_workspace_entitlement_payload('<workspace_uuid>','core_os',true,'{}'::jsonb,null,'owner grant');
```
Both should return rows without ambiguity errors.

---

## 20260128231758_m1_reliability

Adds missing schema for Meta Hub stability:
- Creates `meta_webhook_events` (idempotent event store) with unique `(workspace_id, event_key)` and RLS.
- Adds durable rate limiter (`rate_limit_counters`, function `take_rate_limit_slot(p_key,p_cap,p_window_seconds)`).
- Upgrades `outbox_messages` with workspace_id, thread/connection refs, idempotency key, and `claim_outbox` RPC using `SKIP LOCKED`.

Apply:
```bash
npm run db:push
```

Verify:
```sql
-- meta_webhook_events uniqueness
SELECT count(*) FROM pg_indexes WHERE tablename='meta_webhook_events' AND indexdef ILIKE '%event_key%';
-- rate limiter function exists
SELECT oid::regprocedure FROM pg_proc WHERE proname='take_rate_limit_slot';
-- outbox uniqueness
SELECT count(*) FROM pg_indexes WHERE tablename='outbox_messages' AND indexdef ILIKE '%idempotency_key%';
```

Smoke:
1) POST `/api/webhooks/meta/whatsapp` with same payload twice -> second should return `deduped=true` (from response).  
2) Queue outbound (e.g., `/api/meta/whatsapp/send-text`) -> row appears in `outbox_messages`, status `queued`.  
3) Run worker `npm run worker` -> sends (or dry-run) and marks outbox `sent`.

Rollback:
```
drop function if exists claim_outbox(integer,text);
drop function if exists take_rate_limit_slot(text,integer,integer);
drop table if exists rate_limit_counters;
drop table if exists outbox_messages;
drop table if exists meta_webhook_events;
```

## WhatsApp Multi-Connection Routing (20260123090000)

### Problem Summary
- **403 Forbidden** when replying to certain threads due to `phone_number_id` mismatch with token
- Outbound routing relied on `wa_messages.phone_number_id` (which can be stale/backfilled) instead of deterministic FK
- No guard rails for orphan webhook events (phone_number_id not registered)

### Fix Applied
1. Added `connection_id` FK column to `wa_threads` and `wa_messages`
2. Created `orphan_webhook_events` table for unmatched webhooks
3. Updated webhook handler to use `resolveConnectionForWebhook()` and store orphans
4. Updated outbound send endpoints to use `resolveConnectionForThread()` which:
   - First uses `thread.connection_id` (deterministic)
   - Falls back to `phone_number_id` lookup and backfills `connection_id`
5. All message inserts now include `connection_id` for audit trail

### Migration File
`supabase/migrations/20260123090000_wa_connection_id_routing.sql`

### Testing Checklist

#### Multi-Connection Scenario
1. **Setup**: Ensure workspace has 2+ connections in `wa_phone_numbers` (e.g., Connection A and Connection B)
2. **Inbound A**: Send inbound message to Connection A's phone number
   - Verify thread created with `connection_id = A.id`
   - Verify message has `connection_id = A.id`
3. **Reply A**: Reply to thread A from inbox
   - Should use Connection A's token and phone_number_id
   - Should NOT get 403 Forbidden
4. **Inbound B**: Send inbound message to Connection B's phone number
   - Verify NEW thread created with `connection_id = B.id`
5. **Reply B**: Reply to thread B from inbox
   - Should use Connection B's token and phone_number_id
   - Should NOT get 403 Forbidden

#### Orphan Event Handling
1. **Simulate**: Send webhook with `phone_number_id` not in `wa_phone_numbers`
2. **Verify**: Event stored in `orphan_webhook_events` table
3. **Verify**: Response is 200 OK (not 5xx, to prevent Meta retry spam)
4. **Verify**: Log message contains "orphan event"

#### Backfill Verification
1. **Query**: Check existing threads now have `connection_id` populated
```sql
SELECT t.id, t.phone_number_id, t.connection_id, c.phone_number_id as conn_phone
FROM wa_threads t
LEFT JOIN wa_phone_numbers c ON t.connection_id = c.id
WHERE t.connection_id IS NOT NULL
LIMIT 10;
```
2. **Verify**: `t.phone_number_id` matches `c.phone_number_id`

#### Connection Error Handling
1. Delete a connection from `wa_phone_numbers` (or set status='inactive')
2. Try to reply to a thread that used that connection
3. Should return 409 with `code: "connection_not_found"` or `"connection_inactive"`

### Manual Verification Commands
```bash
# Check connection_id populated in threads
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM wa_threads WHERE connection_id IS NOT NULL;"

# Check orphan events table exists and is empty
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM orphan_webhook_events;"

# Verify indexes exist
psql "$SUPABASE_DB_URL" -c "SELECT indexname FROM pg_indexes WHERE tablename IN ('wa_threads','wa_messages','orphan_webhook_events') AND indexname LIKE '%connection%' OR indexname LIKE '%orphan%';"
```
---

## Saved Views for Inbox (20260130000000)

### Purpose
Allows users to save custom filter combinations (status, assignee, tag, search query) for quick access in the WhatsApp inbox.

### Tables Created
**`wa_saved_views`**
- Columns: `id`, `workspace_id`, `user_id`, `name`, `filters` (jsonb), `created_at`, `updated_at`
- Unique constraint: `(workspace_id, user_id, name)` - prevents duplicate view names per user
- RLS Policy: User can only access their own views in workspaces they're a member of

### Schema Details
```sql
CREATE TABLE wa_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, name)
);

-- Indexes for performance
CREATE INDEX wa_saved_views_user_idx ON wa_saved_views(user_id);
CREATE INDEX wa_saved_views_workspace_idx ON wa_saved_views(workspace_id);

-- RLS for security
ALTER TABLE wa_saved_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_access_own_saved_views"
ON wa_saved_views
FOR ALL
USING (
  user_id = auth.uid()
  AND workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);
```

### API Endpoints
- **GET** `/api/meta/whatsapp/saved-views?workspaceId=<uuid>` - List user's saved views
- **POST** `/api/meta/whatsapp/saved-views` - Create new view
  ```json
  {
    "workspaceId": "uuid",
    "name": "High Priority Open",
    "filters": {
      "status": "open",
      "tag": "urgent",
      "q": "payment"
    }
  }
  ```
- **DELETE** `/api/meta/whatsapp/saved-views` - Delete view
  ```json
  {
    "workspaceId": "uuid",
    "viewId": "uuid"
  }
  ```

### Migration File
`supabase/migrations/20260130000000_wa_saved_views.sql`

### Smoke Tests

#### Creating Saved Views
1. Navigate to WhatsApp inbox at `/dashboard/meta-hub/whatsapp/<workspace_id>`
2. Apply filters: set status to "open", select a tag, enter search query
3. Click "Save view" button (bookmark icon)
4. Enter view name "Test View" → should succeed
5. Try saving again with same name → should show error "View name already exists"
6. Verify view appears in saved views dropdown with correct filters

#### Applying Saved Views
1. Change filters manually (different status, clear search)
2. Select saved view from dropdown
3. Verify all filters update to match saved configuration:
   - Status dropdown changes
   - Tag filter updates
   - Search input populates
   - URL params update (`?status=open&tag=urgent&q=payment`)

#### Deleting Saved Views
1. Hover over saved view in dropdown
2. Click delete icon (trash)
3. Confirm deletion → view removed from list
4. Verify it no longer appears after page refresh

#### Multi-User Isolation
1. Create view as User A: "User A's View"
2. Login as User B in same workspace
3. Verify User B cannot see "User A's View" in their dropdown
4. User B can create their own view with same name

### Manual Verification Commands
```bash
# Check table exists with correct schema
psql "$SUPABASE_DB_URL" -c "\d wa_saved_views"

# Verify RLS is enabled
psql "$SUPABASE_DB_URL" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename='wa_saved_views';"
# Should show: wa_saved_views | t

# Check unique constraint exists
psql "$SUPABASE_DB_URL" -c "SELECT conname FROM pg_constraint WHERE conrelid='wa_saved_views'::regclass AND contype='u';"
# Should show: wa_saved_views_workspace_id_user_id_name_key

# Verify indexes created
psql "$SUPABASE_DB_URL" -c "SELECT indexname FROM pg_indexes WHERE tablename='wa_saved_views';"
# Should show: wa_saved_views_pkey, wa_saved_views_user_idx, wa_saved_views_workspace_idx

# Test basic CRUD (replace UUIDs with actual values)
psql "$SUPABASE_DB_URL" <<SQL
-- Insert test view
INSERT INTO wa_saved_views (workspace_id, user_id, name, filters)
VALUES ('<workspace_uuid>', '<user_uuid>', 'Test View', '{"status":"open","tag":"urgent"}'::jsonb);

-- Query views for user
SELECT id, name, filters FROM wa_saved_views WHERE user_id = '<user_uuid>';

-- Delete test view
DELETE FROM wa_saved_views WHERE user_id = '<user_uuid>' AND name = 'Test View';
SQL
```

### Rollback
```sql
DROP TABLE IF EXISTS wa_saved_views CASCADE;
```