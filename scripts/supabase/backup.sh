#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/supabase/backups"
mkdir -p "${BACKUP_DIR}"

DB_URL="${SUPABASE_DB_URL:-}"

if [[ -z "${DB_URL}" ]]; then
  echo "[backup] SUPABASE_DB_URL is required. Export it or place it in .env.local before running." >&2
  exit 1
fi

STAMP="$(date -u +"%Y%m%d-%H%M%S")"
OUT_FILE="${BACKUP_DIR}/backup-${STAMP}.sql"

has_docker=0
if command -v docker >/dev/null 2>&1; then
  has_docker=1
fi

if command -v supabase >/dev/null 2>&1 && [[ "${has_docker}" -eq 1 ]]; then
  echo "[backup] Using supabase CLI to dump database -> ${OUT_FILE}"
  if ! supabase db dump --db-url "${DB_URL}" --file "${OUT_FILE}"; then
    echo "[backup] supabase db dump failed; falling back to pg_dump."
    if command -v pg_dump >/dev/null 2>&1; then
      pg_dump --no-owner --format=plain --file="${OUT_FILE}" "${DB_URL}"
    else
      echo "[backup] pg_dump not found. Install Postgres client tools." >&2
      exit 1
    fi
  fi
elif command -v pg_dump >/dev/null 2>&1; then
  echo "[backup] Docker unavailable; using pg_dump -> ${OUT_FILE}"
  pg_dump --no-owner --format=plain --file="${OUT_FILE}" "${DB_URL}"
else
  echo "[backup] Neither supabase CLI nor pg_dump found. Install one of them to continue." >&2
  exit 1
fi

echo "[backup] Backup complete: ${OUT_FILE}"
