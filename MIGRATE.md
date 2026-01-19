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
