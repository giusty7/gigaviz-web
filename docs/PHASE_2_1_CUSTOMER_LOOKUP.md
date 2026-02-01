# Phase 2.1: Customer Lookup - Implementation Summary

## Overview
Customer Lookup system untuk ops platform yang memungkinkan platform admin mencari workspace/user berdasarkan email, phone, workspace slug/id, atau user id.

## Files Created/Modified

### Database (Supabase)
- ✅ `supabase/migrations/20260201_ops_customer_lookup.sql` - Migration file
  - Table: `ops_customer_searches` (search history logging)
  - RPC Function: `ops_search_customers()` (efficient search with ranking)
  - RLS policies for platform admin only access
  - Indexes for performance

- ✅ `supabase/migrations/20260201_ops_customer_lookup_rollback.sql` - Rollback script

### Backend (Server)
- ✅ `lib/ops/customers.ts` - Server-side logic
  - `searchCustomers()` - Main search function
  - `getSearchHistory()` - Fetch recent searches
  - `detectQueryType()` - Auto-detect query type
  - `logSearch()` - Log to audit table

- ✅ `app/api/ops/customers/search/route.ts` - API endpoint
  - GET `/api/ops/customers/search?q=...`
  - Platform admin guard
  - Error handling

### Frontend (UI)
- ✅ `app/ops/customers/page.tsx` - Main page component
  - Server component
  - Search history display
  - Integration with OpsShell

- ✅ `components/ops/CustomerSearchClient.tsx` - Client component
  - Real-time search
  - Results display as cards
  - Quick action buttons (placeholder)
  - Loading states

### Navigation
- ✅ `lib/ops/theme.ts` - Added "Customers" nav item
- ✅ `components/platform/OpsShell.tsx` - Added Users icon to iconMap

## Database Schema

### Table: `ops_customer_searches`
```sql
- id: uuid (PK)
- actor_user_id: uuid (FK to auth.users)
- actor_email: text
- query: text
- query_type: text (email|phone|workspace_slug|workspace_id|user_id|uuid|text)
- result_count: int
- results_preview: jsonb
- created_at: timestamptz
```

**Indexes:**
- `idx_ops_customer_searches_actor` - (actor_user_id, created_at DESC)
- `idx_ops_customer_searches_created` - (created_at DESC)
- `idx_ops_customer_searches_query` - GIN index for full-text search

**RLS:**
- SELECT: Platform admins only
- INSERT: Platform admins only (actor_user_id must match auth.uid())

### RPC Function: `ops_search_customers(p_query text, p_limit int)`

**Returns:**
- match_type
- workspace_id, workspace_slug, workspace_name, workspace_status, workspace_plan, workspace_created_at
- user_id, user_email, user_phone
- owner_email
- entitlements (jsonb)
- token_balance (numeric)
- relevance_score (float)

**Search Strategy:**
1. Exact UUID match (workspace_id or user_id) → score: 100
2. Exact workspace slug match → score: 90
3. Exact email match → score: 95
4. Phone match → score: 95
5. Partial email match → score: 70
6. Fuzzy name/slug match → score: 50-70

## Features Implemented

### ✅ Search Capabilities
- [x] Email search (exact + partial)
- [x] Phone search (E.164 and local ID formats)
- [x] Workspace slug search
- [x] Workspace ID (UUID) search
- [x] User ID (UUID) search
- [x] Auto-detect query type
- [x] Relevance scoring and ranking

### ✅ Results Display
- [x] Workspace: id, slug, name, plan, status, created_at
- [x] Owner/user: email, phone, user_id
- [x] Entitlements summary (count of enabled)
- [x] Token balance display
- [x] Match type indicator
- [x] Card-based UI with icons
- [x] Responsive design

### ✅ Search History
- [x] Log every search (query, actor, timestamp, result_count)
- [x] Display last 20 searches
- [x] Show query type, result count, timestamp
- [x] Table format with hover effects

### ✅ Quick Actions (Placeholders)
- [x] "Impersonate" button (disabled, Phase 2.2)
- [x] "Suspend" button (disabled)
- [x] "Grant Tokens" button (disabled)
- [x] "View Details" link (to `/ops/workspaces/[id]`)

### ✅ Security
- [x] Ops platform guard (OPS_ENABLED check)
- [x] Platform admin requirement
- [x] RLS on ops_customer_searches table
- [x] Security definer on RPC function
- [x] Search logging for audit trail

## Manual Test Steps

### 1. Run Migration
```bash
# Apply migration
supabase db push

# Or run manually in Supabase SQL Editor:
# Copy contents of supabase/migrations/20260201_ops_customer_lookup.sql
```

### 2. Verify Database
```sql
-- Check table exists
SELECT * FROM ops_customer_searches LIMIT 1;

-- Check RPC function exists
SELECT ops_search_customers('test', 10);

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'ops_customer_searches';
```

### 3. Test Search Functionality

**Prerequisites:**
- Dev server running (`npm run dev`)
- Logged in as platform admin
- At least 1 workspace exists in database

**Test Cases:**

**A. Search by Email**
1. Navigate to http://localhost:3000/ops/customers
2. Enter user email (e.g., `vg.gigaviz@gmail.com`)
3. Click "Search"
4. Expected: Results show workspace(s) where user is member
5. Verify: Match type shows "email"

**B. Search by Workspace Slug**
1. Enter workspace slug (e.g., `gigaviz-platform`)
2. Click "Search"
3. Expected: Results show matching workspace
4. Verify: Match type shows "workspace_slug"

**C. Search by Workspace ID (UUID)**
1. Get workspace ID from database or previous search
2. Enter UUID
3. Click "Search"
4. Expected: Exact match for workspace
5. Verify: Match type shows "workspace_id", score = 100

**D. Search by Phone**
1. Enter phone number (e.g., `+6281234567890`)
2. Click "Search"
3. Expected: Results show user with that phone
4. Verify: Match type shows "phone"

**E. Partial Search**
1. Enter partial email (e.g., `gigaviz`)
2. Click "Search"
3. Expected: Results show all matches containing "gigaviz"
4. Verify: Multiple results ranked by relevance

**F. No Results**
1. Enter non-existent query (e.g., `nonexistent@test.com`)
2. Click "Search"
3. Expected: "No results found" message

**G. Search History**
1. Perform 3-5 searches
2. Scroll down to "Recent Searches" section
3. Expected: All searches logged with query, type, result count, timestamp
4. Verify: Newest searches appear first

### 4. Test UI/UX

**Responsive Design:**
- [x] Desktop (1920x1080): Full layout with all details
- [x] Tablet (768x1024): Stacked layout, readable
- [x] Mobile (375x667): Single column, touch-friendly buttons

**Loading States:**
- [x] Search button shows spinner during search
- [x] Input disabled during search
- [x] Results clear before new search

**Error Handling:**
- [x] Empty query shows error message
- [x] API errors display user-friendly message
- [x] Network failures handled gracefully

### 5. Test Security

**A. Without Login**
1. Logout from platform
2. Navigate to http://localhost:3000/ops/customers
3. Expected: Redirect to login or 404

**B. Without Platform Admin**
1. Login as regular user (not platform admin)
2. Navigate to http://localhost:3000/ops/customers
3. Expected: 404 or access denied

**C. API Direct Access**
```bash
# Without auth (should fail)
curl http://localhost:3000/api/ops/customers/search?q=test

# With valid session (should work)
# (Copy session cookie from browser)
curl -H "Cookie: ..." http://localhost:3000/api/ops/customers/search?q=test
```

### 6. Test Performance

**A. Large Result Sets**
1. Search for common term (e.g., `@gmail.com`)
2. Expected: Results return in <2 seconds
3. Verify: Pagination/limit applied (max 50 results)

**B. Complex Queries**
1. Search with special characters
2. Search with very long strings
3. Expected: No crashes, proper escaping

## API Documentation

### GET /api/ops/customers/search

**Query Parameters:**
- `q` (required): Search query string
- `limit` (optional): Max results (default: 50, max: 100)

**Response:**
```json
{
  "results": [
    {
      "matchType": "email",
      "workspaceId": "uuid",
      "workspaceSlug": "string",
      "workspaceName": "string",
      "workspaceStatus": "active|suspended",
      "workspacePlan": "free|individual|team",
      "workspaceCreatedAt": "iso-datetime",
      "userId": "uuid|null",
      "userEmail": "string|null",
      "userPhone": "string|null",
      "ownerEmail": "string|null",
      "entitlements": {
        "entitlement_key": true|false
      },
      "tokenBalance": 1000,
      "relevanceScore": 95.0
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `400`: Missing or invalid query parameter
- `401`: Unauthorized (not platform admin)
- `500`: Server error (database failure)

## Next Steps (Phase 2.2)

1. **User Impersonation**
   - Create impersonation session management
   - Add audit trail for impersonation start/end
   - Implement impersonation banner in app
   - Wire "Impersonate" button

2. **Enhanced Actions**
   - Implement "Suspend Workspace" functionality
   - Implement "Grant Tokens" modal
   - Add inline editing for entitlements

3. **Advanced Filters**
   - Filter by plan (free/individual/team)
   - Filter by status (active/suspended)
   - Filter by entitlement (has X enabled)
   - Date range for created_at

4. **Export**
   - Export search results as CSV
   - Export search history

## Notes

- Search is case-insensitive
- Phone search works with or without country code
- UUID search requires full UUID (no partial match)
- All searches are logged for compliance
- RPC function uses `security definer` for admin access
- Results are ranked by relevance score
- Entitlements stored as JSONB for flexible querying
- Token balance may be null if wallet not initialized
