# Migration Deployment Guide - M2/M3/M4

**Date**: January 29, 2026  
**Status**: Ready for Deployment ✅  
**Migrations**: 3 new files

---

## 📋 Migrations to Deploy

### 1. `20260130000000_wa_saved_views.sql`
**Purpose**: User-defined saved filter views for inbox

**Tables Created**:
- `wa_saved_views` - Stores filter configurations per user/workspace

**Features**:
- Unique constraint: (workspace_id, user_id, name)
- RLS enabled with workspace membership policy
- Auto-update timestamp trigger
- Indexes: user_id, workspace_id

**Smoke Test**:
```sql
-- Verify table exists
SELECT tablename FROM pg_tables WHERE tablename = 'wa_saved_views';

-- Test insert
INSERT INTO wa_saved_views (workspace_id, user_id, name, filters)
VALUES ('<workspace_uuid>', '<user_uuid>', 'Test View', '{"status":"open"}'::jsonb);

-- Test RLS
SELECT * FROM wa_saved_views WHERE workspace_id = '<workspace_uuid>';
```

---

### 2. `20260131000000_automation_rules.sql`
**Purpose**: Automation rules engine for inbox workflows

**Tables Created**:
- `automation_rules` - Rule definitions (trigger, conditions, actions)
- `automation_executions` - Audit log of rule executions

**Features**:
- 4 trigger types: new_message, tag_added, status_changed, assigned
- Priority-based execution (0-100)
- Execution count tracking
- RLS with admin/owner access control
- Helper function: `increment_rule_execution_count()`

**Smoke Test**:
```sql
-- Verify tables exist
SELECT tablename FROM pg_tables WHERE tablename IN ('automation_rules', 'automation_executions');

-- Test insert
INSERT INTO automation_rules (workspace_id, name, trigger_type, actions, created_by)
VALUES (
  '<workspace_uuid>',
  'Auto-tag urgent messages',
  'new_message',
  '[{"type":"add_tag","params":{"tag":"urgent"}}]'::jsonb,
  '<user_uuid>'
);

-- Test execution log
SELECT * FROM automation_executions WHERE workspace_id = '<workspace_uuid>' ORDER BY executed_at DESC LIMIT 5;
```

---

### 3. `20260131100000_usage_events.sql`
**Purpose**: Granular event tracking for analytics and billing

**Tables/Views Created**:
- `usage_events` - Per-event tracking (message_sent, automation_triggered, etc.)
- `usage_stats_daily` - Materialized view (aggregated daily stats)

**Features**:
- 6 event types with token costs
- Date partitioning (event_date column)
- Materialized view for performance
- Helper function: `refresh_usage_stats()`
- RLS for workspace members

**Smoke Test**:
```sql
-- Verify table exists
SELECT tablename FROM pg_tables WHERE tablename = 'usage_events';

-- Verify materialized view
SELECT schemaname, matviewname FROM pg_matviews WHERE matviewname = 'usage_stats_daily';

-- Test insert
INSERT INTO usage_events (workspace_id, event_type, token_cost, event_metadata)
VALUES ('<workspace_uuid>', 'message_sent', 10, '{"thread_id":"test"}'::jsonb);

-- Test materialized view refresh
SELECT refresh_usage_stats();

-- Query stats
SELECT * FROM usage_stats_daily WHERE workspace_id = '<workspace_uuid>';
```

---

## 🚀 Deployment Methods

### Option 1: Automatic (via Vercel + Supabase Integration)
**Recommended for production**

1. Push code to GitHub:
```bash
git add .
git commit -m "feat: M2/M3/M4 implementation - inbox workflow, automation, analytics"
git push origin main
```

2. Vercel will automatically:
   - Deploy Next.js app
   - Trigger Supabase migrations via integration
   - Run migrations in order (by timestamp)

3. Verify in Supabase Dashboard:
   - Go to Table Editor
   - Check for: `wa_saved_views`, `automation_rules`, `automation_executions`, `usage_events`
   - Verify RLS policies are enabled

---

### Option 2: Manual via Supabase CLI
**For development/staging environments**

#### Prerequisites
```bash
# Install Supabase CLI (one-time setup)
# Windows: Use scoop or download from https://github.com/supabase/cli/releases
scoop install supabase

# macOS/Linux
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

#### Run Migrations
```bash
# Set database URL (use service role key)
export SUPABASE_DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Or use .env.local
echo "SUPABASE_DB_URL=postgresql://..." >> .env.local

# Push migrations
supabase db push --db-url "$SUPABASE_DB_URL"

# Verify
npm run db:verify
```

---

### Option 3: Manual via psql
**Fallback method**

```bash
# Set connection string
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run each migration in order
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260130000000_wa_saved_views.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260131000000_automation_rules.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260131100000_usage_events.sql

# Verify tables created
psql "$SUPABASE_DB_URL" -c "\dt wa_*"
psql "$SUPABASE_DB_URL" -c "\dt automation_*"
psql "$SUPABASE_DB_URL" -c "\dt usage_*"
```

---

## ✅ Post-Deployment Verification

### 1. Check Tables Created
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'wa_saved_views',
  'automation_rules',
  'automation_executions',
  'usage_events'
)
ORDER BY table_name;
```

### 2. Verify RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN (
  'wa_saved_views',
  'automation_rules',
  'automation_executions',
  'usage_events'
)
AND schemaname = 'public';
-- All should show: rowsecurity = t (true)
```

### 3. Check Indexes
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN (
  'wa_saved_views',
  'automation_rules',
  'automation_executions',
  'usage_events'
)
ORDER BY tablename, indexname;
```

### 4. Verify Materialized View
```sql
-- Check if materialized view exists
SELECT schemaname, matviewname, definition 
FROM pg_matviews 
WHERE matviewname = 'usage_stats_daily';

-- Check unique index (for CONCURRENTLY refresh)
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'usage_stats_daily' 
AND indexdef LIKE '%UNIQUE%';
```

### 5. Test Helper Functions
```sql
-- Test increment rule execution count
SELECT increment_rule_execution_count('<some-rule-uuid>');

-- Test refresh usage stats
SELECT refresh_usage_stats();
```

---

## 🔄 Ongoing Maintenance

### Hourly Cron Job (Required for Analytics)
Set up a cron job to refresh the materialized view:

**Via Supabase Dashboard**:
1. Go to Database → Cron Jobs
2. Create new job:
   - Name: `refresh_usage_stats_hourly`
   - Schedule: `0 * * * *` (every hour)
   - Command: `SELECT refresh_usage_stats();`

**Via SQL**:
```sql
-- Install pg_cron extension (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly refresh
SELECT cron.schedule(
  'refresh_usage_stats_hourly',
  '0 * * * *',
  'SELECT refresh_usage_stats();'
);

-- Verify scheduled jobs
SELECT * FROM cron.job;
```

---

## 🧪 Quality Checks (All Passed) ✅

```bash
# TypeScript type check
npm run typecheck
# ✅ No errors

# ESLint
npm run lint
# ✅ No errors

# Production build
npm run build
# ✅ Success (179 routes generated)
```

---

## 📊 Migration Summary

| Migration | Tables Created | Functions | Views | Status |
|-----------|---------------|-----------|-------|--------|
| `20260130000000_wa_saved_views.sql` | 1 | 1 | 0 | ✅ Ready |
| `20260131000000_automation_rules.sql` | 2 | 1 | 0 | ✅ Ready |
| `20260131100000_usage_events.sql` | 1 | 2 | 1 | ✅ Ready |
| **TOTAL** | **4 tables** | **4 functions** | **1 materialized view** | **✅ Ready** |

---

## 🎯 Next Steps

1. **Deploy via Git Push** (Recommended):
   ```bash
   git add .
   git commit -m "feat: M2/M3/M4 - inbox workflow, automation rules, analytics"
   git push origin main
   ```

2. **Wait for Vercel Deployment**: ~2-3 minutes

3. **Verify in Supabase Dashboard**:
   - Check Table Editor for new tables
   - Verify RLS policies
   - Test a query

4. **Set Up Cron Job** for analytics refresh (see above)

5. **Test Features**:
   - Create a saved view in inbox
   - Create an automation rule
   - Send a message (should track event)
   - Check analytics API

---

## 🐛 Troubleshooting

### Migration Fails with "relation already exists"
**Solution**: Migrations use `CREATE TABLE IF NOT EXISTS`, so this is safe to ignore or the table was already created manually.

### RLS denies access
**Solution**: Ensure user is in `workspace_memberships` table with correct `workspace_id`.

### Materialized view not refreshing
**Solution**: 
```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY usage_stats_daily;

-- Check for errors
SELECT * FROM pg_stat_progress_create_index WHERE relid = 'usage_stats_daily'::regclass;
```

### Token deduction not working
**Solution**: Verify `apply_workspace_token_delta` RPC exists:
```sql
SELECT oid::regprocedure FROM pg_proc WHERE proname = 'apply_workspace_token_delta';
```

---

## 📚 Additional Documentation

- [MIGRATE.md](MIGRATE.md) - Full migration playbook
- [docs/INBOX_API.md](docs/INBOX_API.md) - API documentation
- [M2_M3_M4_IMPLEMENTATION_PLAN.md](M2_M3_M4_IMPLEMENTATION_PLAN.md) - Implementation details

---

**Deployment Ready** ✅  
**All Quality Checks Passed** ✅  
**3 Migrations Ready to Apply** ✅
