# WhatsApp Contacts & Audience - Technical Documentation

## Architecture Overview

### Database Schema

#### wa_contacts
```sql
CREATE TABLE wa_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  normalized_phone TEXT NOT NULL,
  display_name TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  opt_in_status TEXT DEFAULT 'unknown' CHECK (opt_in_status IN ('unknown', 'opted_in', 'opted_out')),
  opt_in_at TIMESTAMPTZ,
  opt_out_at TIMESTAMPTZ,
  source TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wa_contacts_workspace_phone_unique UNIQUE (workspace_id, normalized_phone)
);

-- Indexes
CREATE INDEX wa_contacts_workspace_phone_idx ON wa_contacts(workspace_id, normalized_phone);
CREATE INDEX wa_contacts_tags_idx ON wa_contacts USING GIN(tags);
CREATE INDEX wa_contacts_custom_fields_idx ON wa_contacts USING GIN(custom_fields);
CREATE INDEX wa_contacts_opt_in_status_idx ON wa_contacts(workspace_id, opt_in_status);
CREATE INDEX wa_contacts_last_seen_idx ON wa_contacts(workspace_id, last_seen_at DESC);
```

#### wa_contact_segments
```sql
CREATE TABLE wa_contact_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wa_contact_segments_workspace_name_unique UNIQUE (workspace_id, name)
);
```

### Rules Schema (JSONB)
```typescript
{
  "includeTags": ["tag1", "tag2"],  // Contact must have ANY of these
  "excludeTags": ["tag3"],          // Contact must NOT have ANY of these
  "customFieldFilters": [
    {
      "field": "city",
      "operator": "equals",        // "equals" | "contains" | "exists"
      "value": "Jakarta"           // Required for equals/contains
    }
  ],
  "optInOnly": true                 // Only include opted_in contacts
}
```

### RLS Policies

All tables enforce workspace isolation:
```sql
CREATE POLICY "wa_contacts_workspace_access" ON wa_contacts
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  );
```

## API Endpoints

Base: `/api/meta/whatsapp`

### Contacts

#### GET /contacts
List contacts with filters

**Query Params**:
- `workspaceId` (required)
- `search` (optional): Search name or phone
- `tag` (optional): Filter by tag
- `segmentId` (optional): Filter by segment ID
- `optInStatus` (optional): `unknown` | `opted_in` | `opted_out`
- `page` (optional): Default 1
- `limit` (optional): Default 50, max 100

**Response**:
```json
{
  "contacts": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "normalized_phone": "6281234567890",
      "display_name": "John Doe",
      "tags": ["vip", "jakarta"],
      "custom_fields": {"city": "Jakarta"},
      "opt_in_status": "opted_in",
      "last_seen_at": "2026-01-25T12:00:00Z",
      "created_at": "2026-01-20T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

#### POST /contacts
Create a contact

**Request**:
```json
{
  "workspaceId": "uuid",
  "phone": "+62 812-3456-7890",
  "display_name": "John Doe",
  "tags": ["customer", "jakarta"],
  "custom_fields": {"source": "webform"},
  "opt_in_status": "opted_in",
  "source": "manual"
}
```

**Response**: Created contact object (201)

**Errors**:
- 400: Invalid phone format
- 409: Contact already exists

#### PATCH /contacts/:id
Update a contact

**Request**:
```json
{
  "workspaceId": "uuid",
  "display_name": "Jane Doe",
  "tags": ["vip"],
  "opt_in_status": "opted_out"
}
```

#### DELETE /contacts/:id
Delete a contact

**Query Params**: `workspaceId` (required)

### Bulk Operations

#### POST /contacts/bulk-paste
Import from pasted text

**Request**:
```json
{
  "workspaceId": "uuid",
  "lines": [
    "6281234567890",
    "+62 812-3456-7891,John Doe",
    "08123456789,Jane Smith"
  ],
  "tags": ["bulk_import_jan2026"],
  "source": "bulk_paste"
}
```

**Response**:
```json
{
  "valid": 2,
  "invalid": 0,
  "duplicates": 1,
  "created": ["uuid1", "uuid2"],
  "errors": []
}
```

#### POST /contacts/import-csv
Import from CSV

**Request**:
```json
{
  "workspaceId": "uuid",
  "csvData": "Phone,Name,City\n6281234567890,John,Jakarta\n...",
  "mapping": {
    "phoneColumn": "Phone",
    "nameColumn": "Name",
    "customFieldMappings": [
      {"csvColumn": "City", "fieldName": "city"}
    ]
  },
  "tags": ["csv_import_jan2026"],
  "source": "csv_import"
}
```

### Tags

#### GET /contacts/tags
List all tags in workspace

**Response**:
```json
{
  "tags": ["vip", "jakarta", "customer", "lead"]
}
```

### Segments

#### GET /segments
List all segments

**Response**:
```json
{
  "segments": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "name": "VIP Jakarta",
      "description": "VIP customers in Jakarta",
      "rules": {
        "includeTags": ["vip", "jakarta"],
        "optInOnly": true
      },
      "created_at": "2026-01-20T10:00:00Z"
    }
  ]
}
```

#### POST /segments
Create a segment

**Request**:
```json
{
  "workspaceId": "uuid",
  "name": "VIP Jakarta",
  "description": "VIP customers in Jakarta who opted in",
  "rules": {
    "includeTags": ["vip", "jakarta"],
    "excludeTags": ["unsubscribed"],
    "optInOnly": true,
    "customFieldFilters": [
      {"field": "city", "operator": "equals", "value": "Jakarta"}
    ]
  }
}
```

#### PATCH /segments/:id
Update segment

#### DELETE /segments/:id
Delete segment

### Audience Preview

#### POST /audience/preview
Preview audience count and sample

**Request**:
```json
{
  "workspaceId": "uuid",
  "segmentId": "uuid",      // OR
  "tags": ["vip"],          // OR
  "rules": { ... }          // Direct rules
}
```

**Response**:
```json
{
  "count": 1250,
  "sample": [ /* first 10 contacts */ ],
  "estimation": {
    "opted_in": 1100,
    "opted_out": 50,
    "unknown": 100
  }
}
```

## Phone Normalization

### Function: `normalizePhone(input: string): string`

**Logic**:
1. Strip all non-digit characters: `/\D/g`
2. If starts with `0`, replace with `62` (Indonesia)
3. Return digits-only string

**Examples**:
- `"+62 812-3456-7890"` → `"6281234567890"`
- `"08123456789"` → `"628123456789"`
- `"62 812 345 6789"` → `"6281234567890"`

### Function: `validatePhone(input: string)`

**Rules**:
- Length: 10-15 digits after normalization
- Must be all digits

**Returns**:
```typescript
{
  valid: boolean;
  normalized?: string;
  error?: string;
}
```

## Auto-Capture from Inbound Messages

### Integration Point
File: `app/api/webhooks/whatsapp/route.ts` (existing webhook handler)

### Logic
```typescript
// After validating webhook and parsing message
const fromPhone = message.from; // E.164 format
const profileName = message.profile?.name;

// Upsert contact
await supabase
  .from("wa_contacts")
  .upsert(
    {
      workspace_id: workspaceId,
      normalized_phone: normalizePhone(fromPhone),
      display_name: profileName || null,
      last_seen_at: new Date().toISOString(),
      source: "inbound",
    },
    {
      onConflict: "workspace_id,normalized_phone",
      ignoreDuplicates: false, // Update last_seen_at
    }
  );
```

### Upsert Behavior
- **New contact**: Creates with `opt_in_status = 'unknown'`
- **Existing contact**: Updates `last_seen_at` only
- **Does NOT**: Override existing name, tags, or opt-in status

## Security Considerations

### Server-Side Validation
All API routes:
1. Verify auth: `supabase.auth.getUser()`
2. Check workspace membership
3. Enforce RLS via Supabase client
4. Validate and sanitize input

### Rate Limiting
Mutations (POST/PATCH/DELETE) should be rate-limited per workspace:
- Contacts: 100 requests/minute
- Bulk operations: 10 requests/minute

### Privacy
- Phone numbers stored in normalized format
- UI masks by default: `+62 812-****-7890`
- Reveal requires explicit user action

## Performance Optimization

### Indexes
- **GIN indexes** on `tags` and `custom_fields` for fast array/JSONB queries
- **B-tree indexes** on `workspace_id + normalized_phone` for uniqueness
- **Composite index** on `workspace_id + opt_in_status` for filtering

### Pagination
- Default limit: 50
- Max limit: 100
- Use cursor-based pagination for large datasets (future)

### Segment Count Caching
For frequently used segments, cache count with 5-minute TTL:
```typescript
const cacheKey = `segment:${segmentId}:count`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const count = await countSegmentContacts(workspaceId, rules);
await redis.setex(cacheKey, 300, JSON.stringify(count));
```

## Testing

### Smoke Test Checklist

1. **Migration**
   ```bash
   npm run supabase:db:push
   # Verify tables and RLS policies created
   ```

2. **API Endpoints**
   ```bash
   # Create contact
   curl -X POST http://localhost:3000/api/meta/whatsapp/contacts \
     -H "Content-Type: application/json" \
     -d '{"workspaceId": "...", "phone": "+628123456789"}'
   
   # List contacts
   curl "http://localhost:3000/api/meta/whatsapp/contacts?workspaceId=..."
   ```

3. **RLS Verification**
   - Create 2 test workspaces
   - Add contacts to each
   - Verify user A cannot see user B's contacts via API

4. **Bulk Import**
   - Prepare CSV with 100 rows
   - Import via UI
   - Verify all valid rows created, duplicates handled

5. **Webhook Auto-Capture**
   - Send test WhatsApp message
   - Verify contact upserted in database
   - Check `last_seen_at` updated

## Migration Guide

### From Existing wa_contacts Table

If your `wa_contacts` table already exists:

1. Run migration: `20260125210000_wa_contacts_complete.sql`
2. Migration uses `ADD COLUMN IF NOT EXISTS` (safe)
3. Backfills `normalized_phone` from existing `phone` or `wa_id`
4. Existing data preserved

### Breaking Changes
None - fully backward compatible.

## Troubleshooting

### Issue: Contact not appearing after webhook
**Check**:
1. Webhook handler logs for errors
2. Phone normalization (must be digits-only)
3. Workspace context in webhook payload

### Issue: Segment query too slow
**Check**:
1. GIN indexes exist on `tags` and `custom_fields`
2. Use `EXPLAIN ANALYZE` to check query plan
3. Consider denormalizing frequently queried custom fields

### Issue: RLS denying access
**Check**:
1. User is member of workspace
2. Supabase client using session (not service role)
3. RLS policies exist and enabled

---

**Implementation Notes**:
- All routes use Next.js App Router (not Pages Router)
- TypeScript strict mode enforced
- Supabase v2 with `createRouteHandlerClient`
- Phone normalization server-side only (never trust client)
