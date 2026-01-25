# WhatsApp Contacts wa_id NULL Constraint Fix

## Problem
`wa_contacts` table has a NOT NULL constraint on `wa_id` column, but all insert operations were only providing `normalized_phone`, causing constraint violations.

**Error Message:**
```
null value in column 'wa_id' of relation 'wa_contacts' violates not-null constraint
```

## Root Cause
The database migration created `wa_contacts` with `wa_id text not null`, but application code was not populating this field during inserts.

## Solution Summary
1. Enhanced phone normalizer utility to handle Indonesia-specific formats
2. Updated `validatePhone()` to return `wa_id` and `e164` formats
3. Patched all 3 insert locations to include `wa_id`
4. Changed duplicate checks from `normalized_phone` to `wa_id`

## Changed Files

### 1. `lib/meta/wa-contacts-utils.ts`
**Enhanced phone normalization:**
- Added `getWhatsAppId()` function that returns both `wa_id` (digits only) and `e164` format (+62...)
- Improved `normalizePhone()` to handle:
  - `0812...` → `62812...` (strip leading 0, add 62)
  - `812...` → `62812...` (add 62 prefix for Indonesia)
  - `+62812...` → `62812...` (strip +)
  - `62812...` → `62812...` (keep as-is)
- Updated `validatePhone()` to return additional fields:
  - `wa_id`: digits-only WhatsApp ID
  - `e164`: E.164 format with + prefix
  - `normalized`: same as `wa_id` (kept for backward compatibility)

### 2. `app/api/meta/whatsapp/contacts/route.ts`
**POST endpoint (Add single contact):**
- Extract `wa_id` from `validatePhone()` result
- Include `wa_id` in insert statement
- Changed duplicate check from `normalized_phone` to `wa_id`

### 3. `app/api/meta/whatsapp/contacts/bulk-paste/route.ts`
**Bulk Paste import:**
- Extract `wa_id` for all validated contacts
- Changed existing contacts query to use `wa_id`
- Include `wa_id` in each insert statement
- Changed duplicate tracking set to use `wa_id`

### 4. `app/api/meta/whatsapp/contacts/import-csv/route.ts`
**CSV import:**
- Added `validatePhone` to imports
- Extract `wa_id` for all validated phone numbers
- Changed existing contacts query to use `wa_id`
- Added explicit validation step before insert
- Include `wa_id` in each insert statement
- Changed duplicate tracking set to use `wa_id`

## Phone Number Normalization Examples

| Input Format | wa_id Output | e164 Output | Notes |
|-------------|--------------|-------------|-------|
| `+62 812-3456-7890` | `6281234567890` | `+6281234567890` | Standard format |
| `08123456789` | `628123456789` | `+628123456789` | Indonesia leading 0 |
| `812345678` | `62812345678` | `+62812345678` | Indonesia without prefix |
| `6281234567890` | `6281234567890` | `+6281234567890` | Already normalized |
| `+1 555-1234` | `15551234` | `+15551234` | International format |

## Database Schema
```sql
-- wa_contacts table structure (relevant fields)
wa_id text not null,              -- WhatsApp ID (digits only)
normalized_phone text,             -- Same as wa_id (legacy)
display_name text,
tags text[] default '{}',
constraint wa_contacts_unique unique (workspace_id, wa_id)
```

## Manual Testing Steps

### 1. Test Add Contact (Single)
```bash
# Test Indonesia formats
curl -X POST http://localhost:3000/api/meta/whatsapp/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "your-workspace-id",
    "phone": "08123456789",
    "display_name": "Test Contact 1"
  }'

curl -X POST http://localhost:3000/api/meta/whatsapp/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "your-workspace-id",
    "phone": "812345678",
    "display_name": "Test Contact 2"
  }'

curl -X POST http://localhost:3000/api/meta/whatsapp/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "your-workspace-id",
    "phone": "+6281234567890",
    "display_name": "Test Contact 3"
  }'
```

### 2. Test Bulk Paste
**UI Steps:**
1. Navigate to WhatsApp Contacts page
2. Click "Bulk Paste" button
3. Paste multiple contacts (one per line):
   ```
   08123456789, John Doe
   812999888, Jane Smith
   +6281234567890, Bob Wilson
   ```
4. Click "Preview" → verify parsing
5. Click "Import" → verify success toast

**Expected Result:** All contacts inserted with wa_id populated

### 3. Test CSV Import
**UI Steps:**
1. Create test CSV file:
   ```csv
   phone,name
   08123456789,Alice
   812999888,Bob
   +6281234567890,Charlie
   ```
2. Click "Import CSV" button
3. Upload file
4. Map columns (phone → phone, name → name)
5. Preview → Import

**Expected Result:** All contacts inserted with wa_id populated

### 4. Verify Duplicate Prevention
**Test Steps:**
1. Add contact with phone `08123456789`
2. Try adding again with `+628123456789` (same number, different format)
3. Expected: "Contact already exists" error

### 5. Database Verification
```sql
-- Check all contacts have wa_id
SELECT id, wa_id, normalized_phone, display_name 
FROM wa_contacts 
WHERE workspace_id = 'your-workspace-id' 
AND wa_id IS NULL;
-- Expected: 0 rows

-- Check uniqueness constraint
SELECT wa_id, COUNT(*) 
FROM wa_contacts 
WHERE workspace_id = 'your-workspace-id'
GROUP BY wa_id 
HAVING COUNT(*) > 1;
-- Expected: 0 rows
```

## Edge Cases Handled
1. ✅ Indonesia formats (0812, 812, +62812)
2. ✅ International formats (any country code)
3. ✅ Duplicate detection across different formats
4. ✅ Race condition duplicates (23505 error code)
5. ✅ Phone validation (10-15 digits)
6. ✅ Special characters stripped automatically

## Validation Results
- ✅ `npm run lint`: PASS
- ✅ `npm run typecheck`: PASS
- ✅ `npm run build`: SUCCESS (175 routes)

## Related Files
- Migration: `supabase/migrations/20260125200000_wa_templates_complete.sql`
- Types: `types/wa-contacts.ts`
- Components:
  - `components/meta-hub/ContactModal.tsx`
  - `components/meta-hub/BulkPasteModal.tsx`
  - `components/meta-hub/ImportCSVModal.tsx`

## Rollback Plan
If issues occur, revert commits and temporarily make `wa_id` nullable:
```sql
ALTER TABLE wa_contacts ALTER COLUMN wa_id DROP NOT NULL;
```

## Next Steps
1. ✅ Test in dev environment
2. ⚠️ Check webhook handlers (if any auto-create contacts)
3. ⚠️ Update any raw SQL queries that insert wa_contacts
4. ⚠️ Deploy to staging
5. ⚠️ Smoke test all contact creation flows
6. ⚠️ Deploy to production

## Notes
- `normalized_phone` field kept for backward compatibility
- Unique constraint on `(workspace_id, wa_id)` enforces deduplication
- Phone number must start with country code (62 for Indonesia)
- Maximum phone length: 15 digits (per E.164 standard)
