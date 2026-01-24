# 🚀 CARA MENJALANKAN MIGRASI SQL

## Opsi 1: Supabase Dashboard SQL Editor (PALING MUDAH) ⭐

1. **Buka Supabase Dashboard**
   - Pergi ke: https://supabase.com/dashboard
   - Pilih project Gigaviz
   - Klik "SQL Editor" di sidebar kiri

2. **Jalankan SQL Batch**
   - Klik "+ New Query"
   - Copy seluruh isi file: `supabase/migrations/BATCH_20260125_meta_hub_polish.sql`
   - Paste ke editor
   - Klik tombol "Run" (atau tekan Ctrl/Cmd + Enter)

3. **Cek Output**
   - Scroll ke bawah untuk lihat NOTICE messages
   - Harus ada: ✅ ALL MIGRATIONS SUCCESSFUL!
   - Jika ada ⚠️ warning, baca pesan errornya

---

## Opsi 2: psql Command Line (Untuk Advanced User)

```bash
# Set database URL
export SUPABASE_DB_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Jalankan migration batch
psql $SUPABASE_DB_URL -f supabase/migrations/BATCH_20260125_meta_hub_polish.sql
```

---

## Opsi 3: Jalankan Satu per Satu

Jika ada masalah dengan batch, jalankan individual:

### Migration 1: Diagnostic Columns
```sql
-- Copy dari: supabase/migrations/20260125000000_meta_assets_cache_diagnostics.sql
-- Paste di SQL Editor
-- Run
```

### Migration 2: UNIQUE Constraint
```sql
-- Copy dari: supabase/migrations/20260125100000_meta_assets_cache_unique_ws_phone.sql
-- Paste di SQL Editor
-- Run
```

---

## ✅ VERIFIKASI SETELAH MIGRASI

Jalankan query ini di SQL Editor untuk memastikan semua berhasil:

```sql
-- 1. Cek kolom baru
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'meta_assets_cache' AND column_name IN ('last_synced_at', 'last_error'))
    OR (table_name = 'wa_phone_numbers' AND column_name = 'notes')
  )
ORDER BY table_name, column_name;

-- Expected output: 3 rows
-- meta_assets_cache | last_error      | text                 | YES
-- meta_assets_cache | last_synced_at  | timestamp with time zone | YES
-- wa_phone_numbers  | notes           | text                 | YES
```

```sql
-- 2. Cek UNIQUE index
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'meta_assets_cache'
  AND indexdef LIKE '%UNIQUE%'
  AND indexdef LIKE '%workspace_id%'
  AND indexdef LIKE '%phone_number_id%';

-- Expected output: 1 row dengan CREATE UNIQUE INDEX
```

```sql
-- 3. Test upsert (HARUS BERHASIL tanpa error)
INSERT INTO public.meta_assets_cache (
  workspace_id, 
  phone_number_id, 
  waba_id
)
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'test_migration_check', 
  'test_waba'
)
ON CONFLICT (workspace_id, phone_number_id)
DO UPDATE SET 
  updated_at = now();

-- Kemudian hapus test data
DELETE FROM public.meta_assets_cache 
WHERE phone_number_id = 'test_migration_check';
```

---

## 🐛 TROUBLESHOOTING

### Error: "relation does not exist"
**Solusi:** Pastikan tabel `meta_assets_cache` dan `wa_phone_numbers` sudah ada. Cek dengan:
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('meta_assets_cache', 'wa_phone_numbers');
```

### Error: "duplicate key value violates unique constraint"
**Artinya:** Ada duplikat data sebelum UNIQUE index dibuat.  
**Solusi:** Migration sudah handle ini di Step 1 (deduplication). Jika masih error, jalankan manual:
```sql
-- Lihat duplikat
SELECT workspace_id, phone_number_id, COUNT(*) 
FROM meta_assets_cache 
GROUP BY workspace_id, phone_number_id 
HAVING COUNT(*) > 1;

-- Hapus duplikat (manual)
-- Sesuaikan dengan data duplikat yang muncul
```

### Error: "no unique constraint matching ON CONFLICT"
**Artinya:** UNIQUE index belum dibuat.  
**Solusi:** Pastikan Migration 2 sudah dijalankan. Cek dengan query verifikasi #2 di atas.

---

## 📝 CATATAN

- ✅ Migrations ini **IDEMPOTENT** (aman dijalankan berkali-kali)
- ✅ Menggunakan `IF NOT EXISTS` untuk semua operasi
- ✅ Tidak akan menghapus data existing
- ✅ Hanya hapus duplikat jika diperlukan (otomatis)
- ⚠️ Backup database direkomendasikan sebelum menjalankan di production

---

## 🎯 NEXT STEPS SETELAH MIGRASI

1. Deploy backend API changes ke Vercel
2. Test Embedded Signup di staging
3. Verify auto-population of display_phone_number & verified_name
4. Test Edit Connection dialog
5. Test Sync from Meta button
6. Check Diagnostics tab di Settings page

---

**Created:** 2026-01-25  
**By:** GitHub Copilot (Claude Sonnet 4.5)  
**Related Files:** 
- IMPLEMENTATION_META_HUB_POLISH.md
- docs/migrations/META_ASSETS_UNIQUE_CONSTRAINT.md
