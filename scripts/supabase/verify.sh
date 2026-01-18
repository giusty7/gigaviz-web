#!/usr/bin/env bash
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-}"

if [[ -z "${DB_URL}" ]]; then
  echo "[verify] SUPABASE_DB_URL is required." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "[verify] psql is required for verification. Install Postgres client tools." >&2
  exit 1
fi

# Check table existence
table_sql=$(cat <<'SQL'
select jsonb_build_object(
  'owner_users', coalesce(to_regclass('public.owner_users') is not null, false) or coalesce(to_regclass('public.owner_members') is not null, false),
  'owner_audit_log', coalesce(to_regclass('public.owner_audit_log') is not null, false),
  'owner_notes', coalesce(to_regclass('public.owner_notes') is not null, false) or coalesce(to_regclass('public.owner_workspace_notes') is not null, false),
  'feature_flags', coalesce(to_regclass('public.feature_flags') is not null, false) or coalesce(to_regclass('public.owner_feature_flags') is not null, false),
  'workspace_entitlements', coalesce(to_regclass('public.workspace_entitlements') is not null, false),
  'workspace_token_ledger', coalesce(to_regclass('public.workspace_token_ledger') is not null, false),
  'workspace_token_balance', coalesce(to_regclass('public.workspace_token_balance') is not null, false)
);
SQL
)

echo "[verify] Checking critical tables..."
TABLE_RESULT="$(psql "${DB_URL}" -tA -c "${table_sql}")"

echo "${TABLE_RESULT}" | jq . >/dev/null 2>&1 || true

if echo "${TABLE_RESULT}" | grep -q "false"; then
  echo "[verify] FAIL - missing tables:"
  echo "${TABLE_RESULT}"
  exit 1
fi

echo "[verify] OK - required tables present"
echo "${TABLE_RESULT}"

# Check workspace_entitlements column structure
column_sql=$(cat <<'SQL'
select jsonb_build_object(
  'has_workspace_id', exists(select 1 from information_schema.columns where table_schema='public' and table_name='workspace_entitlements' and column_name='workspace_id'),
  'has_key', exists(select 1 from information_schema.columns where table_schema='public' and table_name='workspace_entitlements' and column_name='key'),
  'has_enabled', exists(select 1 from information_schema.columns where table_schema='public' and table_name='workspace_entitlements' and column_name='enabled'),
  'has_payload', exists(select 1 from information_schema.columns where table_schema='public' and table_name='workspace_entitlements' and column_name='payload'),
  'has_updated_at', exists(select 1 from information_schema.columns where table_schema='public' and table_name='workspace_entitlements' and column_name='updated_at'),
  'has_primary_key', exists(
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname='public' and t.relname='workspace_entitlements' and c.contype='p'
  )
);
SQL
)

echo ""
echo "[verify] Checking workspace_entitlements columns..."
COLUMN_RESULT="$(psql "${DB_URL}" -tA -c "${column_sql}")"

echo "${COLUMN_RESULT}" | jq . >/dev/null 2>&1 || true

if echo "${COLUMN_RESULT}" | grep -q "false"; then
  echo "[verify] WARNING - workspace_entitlements missing expected columns:"
  echo "${COLUMN_RESULT}"
  echo ""
  echo "Run: supabase db push --db-url \"\$SUPABASE_DB_URL\" to apply migrations."
else
  echo "[verify] OK - workspace_entitlements schema correct"
  echo "${COLUMN_RESULT}"
fi

# Check if 'value' column is nullable (should be after migration fix)
value_check_sql=$(cat <<'SQL'
select jsonb_build_object(
  'value_column_exists', exists(
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='workspace_entitlements' and column_name='value'
  ),
  'value_is_nullable', coalesce(
    (select is_nullable = 'YES' from information_schema.columns 
     where table_schema='public' and table_name='workspace_entitlements' and column_name='value'),
    true
  )
);
SQL
)

echo ""
echo "[verify] Checking value column compatibility..."
VALUE_RESULT="$(psql "${DB_URL}" -tA -c "${value_check_sql}")"

if echo "${VALUE_RESULT}" | grep -q '"value_column_exists": true' && echo "${VALUE_RESULT}" | grep -q '"value_is_nullable": false'; then
  echo "[verify] FAIL - 'value' column exists and is NOT NULL. Run migration 20260120_fix_entitlements_value_column.sql"
  echo "${VALUE_RESULT}"
  exit 1
else
  echo "[verify] OK - no blocking 'value' column constraint"
  echo "${VALUE_RESULT}"
fi

# Check token function exists
func_check_sql=$(cat <<'SQL'
select jsonb_build_object(
  'apply_workspace_token_delta', exists(
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname = 'apply_workspace_token_delta'
  )
);
SQL
)

echo ""
echo "[verify] Checking token function..."
FUNC_RESULT="$(psql "${DB_URL}" -tA -c "${func_check_sql}")"

if echo "${FUNC_RESULT}" | grep -q "false"; then
  echo "[verify] WARNING - apply_workspace_token_delta function missing"
  echo "${FUNC_RESULT}"
else
  echo "[verify] OK - token function present"
  echo "${FUNC_RESULT}"
fi

echo ""
echo "[verify] All checks completed."
