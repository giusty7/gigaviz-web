# Script untuk menjalankan migrasi SQL ke Supabase
# Membaca semua file SQL migration yang belum dijalankan

$ErrorActionPreference = "Stop"

Write-Host "=== Gigaviz Migration Runner ===" -ForegroundColor Cyan
Write-Host ""

# Cek environment variable
if (-not $env:SUPABASE_DB_URL) {
    Write-Host "[ERROR] SUPABASE_DB_URL tidak ditemukan!" -ForegroundColor Red
    Write-Host "Silakan set environment variable:" -ForegroundColor Yellow
    Write-Host '  $env:SUPABASE_DB_URL = "postgresql://postgres:[password]@[host]:5432/postgres"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Atau tambahkan ke file .env.local" -ForegroundColor Yellow
    exit 1
}

# Load migrations yang akan dijalankan
$migrationsPath = "supabase\migrations"
$newMigrations = @(
    "20260125000000_meta_assets_cache_diagnostics.sql",
    "20260125100000_meta_assets_cache_unique_ws_phone.sql"
)

Write-Host "Migrations yang akan dijalankan:" -ForegroundColor Green
foreach ($migration in $newMigrations) {
    $fullPath = Join-Path $migrationsPath $migration
    if (Test-Path $fullPath) {
        Write-Host "  ✓ $migration" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $migration (tidak ditemukan)" -ForegroundColor Red
    }
}
Write-Host ""

$continue = Read-Host "Lanjutkan? (y/n)"
if ($continue -ne "y") {
    Write-Host "Dibatalkan." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Menjalankan Migrations ===" -ForegroundColor Cyan
Write-Host ""

foreach ($migration in $newMigrations) {
    $fullPath = Join-Path $migrationsPath $migration
    if (-not (Test-Path $fullPath)) {
        Write-Host "⏭️  Skip: $migration (file tidak ada)" -ForegroundColor Yellow
        continue
    }

    Write-Host "▶️  Running: $migration" -ForegroundColor Cyan
    
    $sqlContent = Get-Content $fullPath -Raw
    
    # Jalankan menggunakan psql jika tersedia
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        try {
            $sqlContent | psql $env:SUPABASE_DB_URL
            Write-Host "✅ Success: $migration" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed: $migration" -ForegroundColor Red
            Write-Host "   Error: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  psql tidak tersedia. Gunakan Supabase Dashboard SQL Editor:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   1. Buka: https://supabase.com/dashboard/project/_/sql" -ForegroundColor Gray
        Write-Host "   2. Copy SQL dari: $fullPath" -ForegroundColor Gray
        Write-Host "   3. Paste dan Run di SQL Editor" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verifikasi dengan query ini di SQL Editor:" -ForegroundColor Yellow
Write-Host @"

-- Cek UNIQUE index
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'meta_assets_cache'
  AND indexdef LIKE '%UNIQUE%';

-- Cek kolom baru
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('meta_assets_cache', 'wa_phone_numbers')
  AND column_name IN ('last_synced_at', 'last_error', 'notes')
ORDER BY table_name, column_name;

"@ -ForegroundColor Gray
