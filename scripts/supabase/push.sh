#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB_URL="${SUPABASE_DB_URL:-}"

if [[ -z "${DB_URL}" ]]; then
  echo "[push] SUPABASE_DB_URL is required. Export it before running." >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "[push] npx is required (comes with Node.js). Install Node.js first." >&2
  exit 1
fi

if [[ "${SKIP_DB_BACKUP:-0}" == "1" ]]; then
  echo "[push] SKIP_DB_BACKUP=1 -> skipping backup"
else
  echo "[push] Step 1/3: Backup"
  bash "${ROOT_DIR}/scripts/supabase/backup.sh"
fi

echo "[push] Step 2/3: Apply migrations"
npx supabase db push --db-url "${DB_URL}"

echo "[push] Step 3/3: Verify"
bash "${ROOT_DIR}/scripts/supabase/verify.sh"

echo "[push] Done."
