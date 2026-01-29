# WhatsApp Inbox API Documentation

This document covers the API endpoints for WhatsApp inbox features including filtering, tags, and saved views.

---

## Thread Listing

### `GET /api/meta/whatsapp/threads`

Retrieve WhatsApp conversation threads with optional filtering.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `status` (optional): Filter by thread status - `"open"` | `"resolved"` | `"archived"`
- `assigned` (optional): Filter by assigned user UUID
- `tag` (optional): Filter by thread tag (exact match)
- `q` (optional): Search query - searches across thread messages
- `limit` (optional): Max threads to return (default: 50)

**Example Request:**
```bash
GET /api/meta/whatsapp/threads?workspaceId=abc123&status=open&tag=urgent&q=payment
```

**Response:**
```json
{
  "threads": [
    {
      "id": "thread-uuid",
      "workspace_id": "abc123",
      "phone_number": "+628123456789",
      "contact_name": "John Doe",
      "status": "open",
      "assigned_to": "user-uuid",
      "last_message_at": "2026-01-30T10:30:00Z",
      "created_at": "2026-01-28T14:20:00Z",
      "unread_count": 3,
      "tags": ["urgent", "payment"]
    }
  ]
}
```

**Implementation Details:**
- Tag filtering uses `!inner` join with `wa_thread_tags` table to ensure only threads WITH that tag are returned
- Search query filters messages using `ILIKE` on message content
- Results ordered by `last_message_at DESC`
- RLS ensures user can only access threads in their workspace

---

## Tag Management

### `GET /api/meta/whatsapp/tags`

Retrieve all distinct tags used in workspace threads.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID

**Example Request:**
```bash
GET /api/meta/whatsapp/tags?workspaceId=abc123
```

**Response:**
```json
{
  "tags": ["urgent", "payment", "support", "sales", "vip"]
}
```

**Implementation Details:**
- Returns alphabetically sorted list of unique tags from `wa_thread_tags` table
- Filtered by workspace membership via RLS
- Empty array if no tags exist

---

## Saved Views CRUD

### `GET /api/meta/whatsapp/saved-views`

List user's saved filter configurations.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID

**Example Request:**
```bash
GET /api/meta/whatsapp/saved-views?workspaceId=abc123
```

**Response:**
```json
{
  "views": [
    {
      "id": "view-uuid",
      "workspace_id": "abc123",
      "user_id": "user-uuid",
      "name": "High Priority Open",
      "filters": {
        "status": "open",
        "tag": "urgent",
        "q": "payment"
      },
      "created_at": "2026-01-30T09:00:00Z",
      "updated_at": "2026-01-30T09:00:00Z"
    }
  ]
}
```

**Implementation Details:**
- RLS ensures users only see their own views in workspaces they're members of
- Views ordered by `name ASC`
- Filters stored as JSONB with optional fields: `status`, `assigned`, `tag`, `q`

---

### `POST /api/meta/whatsapp/saved-views`

Create a new saved view.

**Request Body:**
```json
{
  "workspaceId": "abc123",
  "name": "Urgent Open Tickets",
  "filters": {
    "status": "open",
    "tag": "urgent"
  }
}
```

**Response (Success):**
```json
{
  "view": {
    "id": "new-view-uuid",
    "workspace_id": "abc123",
    "user_id": "user-uuid",
    "name": "Urgent Open Tickets",
    "filters": {
      "status": "open",
      "tag": "urgent"
    },
    "created_at": "2026-01-30T10:00:00Z",
    "updated_at": "2026-01-30T10:00:00Z"
  }
}
```

**Error Response (Duplicate Name):**
```json
{
  "error": "View name already exists",
  "code": "duplicate_view_name"
}
```
**HTTP Status:** `409 Conflict`

**Validation:**
- `name`: Required, max 100 characters
- `filters`: Required JSONB object (can be empty `{}`)
- `workspaceId`: Must be valid workspace UUID where user is a member
- Unique constraint: `(workspace_id, user_id, name)` - prevents duplicate names per user

**Implementation Details:**
- Database enforces uniqueness via constraint
- Returns 409 if name collision detected
- RLS ensures user can only create views in their workspaces

---

### `DELETE /api/meta/whatsapp/saved-views`

Delete an existing saved view.

**Request Body:**
```json
{
  "workspaceId": "abc123",
  "viewId": "view-uuid"
}
```

**Response (Success):**
```json
{
  "success": true
}
```

**Error Response (Not Found):**
```json
{
  "error": "View not found or not authorized",
  "code": "view_not_found"
}
```
**HTTP Status:** `404 Not Found`

**Implementation Details:**
- RLS ensures user can only delete their own views
- Returns 404 if view doesn't exist or user doesn't own it
- Cascade delete handled by database FK constraints

---

## Authentication & Authorization

All endpoints require:
- Valid Supabase session cookie
- User must be member of requested workspace
- RLS policies enforce workspace isolation

**Error Responses:**
- `401 Unauthorized`: No valid session
- `403 Forbidden`: Not a member of workspace
- `422 Unprocessable Entity`: Invalid or missing parameters

---

## Usage Examples

### Filter by status and tag
```typescript
const response = await fetch(
  `/api/meta/whatsapp/threads?workspaceId=${wid}&status=open&tag=urgent`,
  { credentials: 'include' }
);
const { threads } = await response.json();
```

### Save current filters
```typescript
const response = await fetch('/api/meta/whatsapp/saved-views', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    workspaceId: 'abc123',
    name: 'My Custom View',
    filters: { status: 'open', tag: 'vip' }
  })
});

if (response.status === 409) {
  console.error('View name already exists');
}
```

### Load saved views on mount
```typescript
const response = await fetch(
  `/api/meta/whatsapp/saved-views?workspaceId=${wid}`,
  { credentials: 'include' }
);
const { views } = await response.json();
setSavedViews(views);
```

### Apply saved view filters
```typescript
function applyView(view: SavedView) {
  const params = new URLSearchParams();
  if (view.filters.status) params.set('status', view.filters.status);
  if (view.filters.assigned) params.set('assigned', view.filters.assigned);
  if (view.filters.tag) params.set('tag', view.filters.tag);
  if (view.filters.q) params.set('q', view.filters.q);
  
  router.push(`?${params.toString()}`);
}
```

---

## Database Schema

### `wa_saved_views`

```sql
CREATE TABLE wa_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, name)
);

CREATE INDEX wa_saved_views_user_idx ON wa_saved_views(user_id);
CREATE INDEX wa_saved_views_workspace_idx ON wa_saved_views(workspace_id);
```

### RLS Policy

```sql
CREATE POLICY "users_access_own_saved_views"
ON wa_saved_views
FOR ALL
USING (
  user_id = auth.uid()
  AND workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);
```

---

## Testing

See [MIGRATE.md](../MIGRATE.md#saved-views-for-inbox-20260130000000) for comprehensive smoke test checklist including:
- Creating/updating/deleting saved views
- Multi-user isolation verification
- Duplicate name handling
- Filter persistence and application
- RLS enforcement testing
