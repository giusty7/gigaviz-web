# API Route Zod Validation Audit

**Audited**: All `route.ts` files under `app/api/`
**Date**: Auto-generated
**Total API Route Files**: 225

---

## Summary

| Category | Count |
|----------|-------|
| **Routes WITH Zod validation** (direct import or external schema) | ~92 |
| **Routes WITHOUT Zod** — 🔴 HIGH priority | 43 |
| **Routes WITHOUT Zod** — 🟡 MEDIUM priority | 21 |
| **Routes WITHOUT Zod** — 🟢 LOW priority | ~69 |

---

## 🔴 HIGH PRIORITY — Mutating Endpoints (POST/PUT/PATCH/DELETE) with Request Body, No Zod

These accept user-controlled JSON bodies and write to the database. **Add Zod schemas immediately.**

### 1. Ops Console Routes (Platform Admin auth, but body unvalidated)

| # | File | Methods | Input | Auth Guard | Manual Validation |
|---|------|---------|-------|------------|-------------------|
| 1 | `app/api/ops/sql-query/route.ts` | POST | `{query}` (raw SQL!) | `requirePlatformAdmin` + `assertOpsEnabled` | `if (!query)` only — **CRITICAL** |
| 2 | `app/api/ops/saved-filters/route.ts` | POST | `{action, name, description, page, filters, columns, sort_config, is_shared, filter_id}` | `requirePlatformAdmin` | action string check |
| 3 | `app/api/ops/scheduled-actions/route.ts` | POST | `{action, action_type, target_type, target_id, payload, reason, scheduled_for, action_id}` | `requirePlatformAdmin` | `if (!scheduled_for)` |
| 4 | `app/api/ops/feature-flags/route.ts` | POST+DELETE | `{flagKey, flagName, description, defaultEnabled, workspaceId, enabled, reason}` | `requirePlatformAdmin` | basic presence checks |
| 5 | `app/api/ops/exports/route.ts` | POST | `{export_type, format, filters}` | `requirePlatformAdmin` | `if (!export_type \|\| !format)` |
| 6 | `app/api/ops/bulk-jobs/route.ts` | POST | `{action, operation_type, target_type, target_filter, payload, scheduled_for, job_id}` | `requirePlatformAdmin` | action string matching |
| 7 | `app/api/ops/canned-responses/route.ts` | POST | `{title, content, shortcut, category, workspaceId}` | `requirePlatformAdmin` | `if (!title \|\| !content)` |
| 8 | `app/api/ops/canned-responses/[id]/route.ts` | PATCH+DELETE | `{title, content, shortcut, category}` | `requirePlatformAdmin` | none on PATCH body |
| 9 | `app/api/ops/analytics/route.ts` | POST | `{action, targetDate}` | `requirePlatformAdmin` | action check |
| 10 | `app/api/ops/health/heartbeat/route.ts` | POST | `{workerName, workerType, status, lastRunAt, ...}` | `CRON_SECRET` bearer | `if (!workerName \|\| !workerType)` |

### 2. Meta / WhatsApp Routes

| # | File | Methods | Input | Auth Guard | Manual Validation |
|---|------|---------|-------|------------|-------------------|
| 11 | `app/api/meta/whatsapp/threads/bulk-update/route.ts` | POST | `{workspaceId, threadIds, action, value}` | `supabase.auth.getUser` + membership | `if (!workspaceId \|\| !Array.isArray(threadIds)...)` |
| 12 | `app/api/meta/whatsapp/templates/sync/route.ts` | POST | `{connectionId, workspaceId}` | `requireWorkspaceMember` + `requireWorkspaceRole` | typeof checks, rate limit |
| 13 | `app/api/meta/whatsapp/templates/[templateId]/route.ts` | DELETE | route param only | `requireWorkspaceMember` | — |
| 14 | `app/api/meta/whatsapp/templates/[templateId]/refresh-status/route.ts` | POST | `{workspaceId, connectionId}` | `requireWorkspaceMember` + `requireWorkspaceRole` | field presence checks |
| 15 | `app/api/meta/whatsapp/process-events/route.ts` | POST | `{reconcile, workspaceId}` | `requireWorkspaceMember` + `requireWorkspaceRole` | basic field extraction |
| 16 | `app/api/meta/whatsapp/segments/route.ts` | POST | `{workspaceId, name, description, rules}` (CreateSegmentRequest) | membership check | `if (!body.name)` |
| 17 | `app/api/meta/whatsapp/segments/[id]/route.ts` | PATCH+DELETE | `{workspaceId, name, description, rules}` (UpdateSegmentRequest) | membership check | workspaceId check |
| 18 | `app/api/meta/whatsapp/saved-views/[id]/route.ts` | DELETE | `{workspaceId}` body | `requireWorkspaceMember` | workspaceId check |
| 19 | `app/api/meta/whatsapp/contacts/route.ts` | POST | CreateContactRequest | membership check | phone validation via utility |
| 20 | `app/api/meta/whatsapp/contacts/[id]/route.ts` | PATCH+DELETE | UpdateContactRequest + `{workspaceId}` | membership check | workspaceId, ownership |
| 21 | `app/api/meta/whatsapp/contacts/import-csv/route.ts` | POST | CSVImportRequest + `{workspaceId}` | membership check | workspaceId, phone column mapping |
| 22 | `app/api/meta/whatsapp/contacts/bulk-paste/route.ts` | POST | BulkPasteRequest + `{workspaceId}` | membership check | workspaceId check |
| 23 | `app/api/meta/whatsapp/audience/preview/route.ts` | POST | AudiencePreviewRequest + `{workspaceId}` | membership check | workspaceId check |
| 24 | `app/api/meta/ads/sync/route.ts` | POST | `{workspace_id, date_range}` | role check | `if (!workspace_id)` |
| 25 | `app/api/meta/instagram/threads/[threadId]/route.ts` | PATCH | `{status, assigned_to}` | `supabase.auth.getUser` | none on body fields |
| 26 | `app/api/meta/instagram/threads/[threadId]/send/route.ts` | POST | `{text, imageUrl}` | `supabase.auth.getUser` + membership | `if (!text?.trim() && !imageUrl)` |
| 27 | `app/api/meta/messenger/threads/[threadId]/route.ts` | PATCH | `{status, assigned_to}` | `supabase.auth.getUser` | none on body fields |
| 28 | `app/api/meta/messenger/threads/[threadId]/send/route.ts` | POST | `{text, imageUrl}` | `supabase.auth.getUser` + membership | `if (!text?.trim() && !imageUrl)` |

### 3. Admin Inbox/CRM Routes (workspace-scoped, body unvalidated)

| # | File | Methods | Input | Auth Guard | Manual Validation |
|---|------|---------|-------|------------|-------------------|
| 29 | `app/api/admin/inbox/[id]/route.ts` | PATCH | ConversationPatchBody (ticket_status, priority, assigned_to, etc.) | `requireAdminOrSupervisorWorkspace` | `parseTicketStatus`, `parsePriority` helpers (not Zod) |
| 30 | `app/api/admin/inbox/[id]/notes/route.ts` | POST | `{text}` | `requireAdminOrSupervisorWorkspace` | `if (!text)` |
| 31 | `app/api/admin/inbox/[id]/messages/route.ts` | POST | `{text}` | `requireAdminOrSupervisorWorkspace` | `if (!text)` |
| 32 | `app/api/admin/inbox/threads/[id]/update/route.ts` | POST | ConversationPatchBody (same as #29) | `requireAdminOrSupervisorWorkspace` | `parseTicketStatus`, `parsePriority` helpers |
| 33 | `app/api/admin/inbox/threads/[id]/transfer/route.ts` | POST | `{team_id}` | `requireAdminOrSupervisorWorkspace` | `if (!teamId)` |
| 34 | `app/api/admin/inbox/threads/[id]/takeover/route.ts` | POST | (no body needed) | `requireWorkspaceRole(["supervisor","admin"])` | feature flag check |
| 35 | `app/api/admin/inbox/threads/[id]/send/route.ts` | POST | `{text}` | `requireAdminOrSupervisorWorkspace` | `if (!text)` |
| 36 | `app/api/admin/inbox/threads/[id]/send-template/route.ts` | POST | `{templateName, language, components}` | `requireAdminOrSupervisorWorkspace` | manual field extraction |
| 37 | `app/api/admin/inbox/threads/[id]/release/route.ts` | POST | (no body needed) | `requireWorkspaceRole(["supervisor","admin"])` | feature flag check |
| 38 | `app/api/admin/inbox/threads/[id]/category/route.ts` | PATCH | `{category_id}` | `requireAdminOrSupervisorWorkspace` | `if (!hasOwnProperty("category_id"))` |
| 39 | `app/api/admin/inbox/threads/[id]/notes/route.ts` | POST | `{text}` | `requireAdminOrSupervisorWorkspace` | `if (!text)` |
| 40 | `app/api/admin/inbox/threads/[id]/auto-assign/route.ts` | POST | `{team_id}` (optional) | `requireAdminOrSupervisorWorkspace` | team lookup fallback |
| 41 | `app/api/admin/crm/fields/route.ts` | POST | `{field/fields}` with key, label, type, options | `requireAdminWorkspace` | `normalizeField()` helper (not Zod) |
| 42 | `app/api/admin/crm/contacts/[id]/fields/route.ts` | POST | `{values: {fieldKey: value}}` | `requireAdminOrSupervisorWorkspace` | `normalizeValue()` per field type |
| 43 | `app/api/admin/routing/categories/route.ts` | POST+DELETE | `{category/categories, delete_ids}` | `requireAdminWorkspace` | `normalizeCategory()` helper |

### 4. Other Mutating Routes

| # | File | Methods | Input | Auth Guard | Manual Validation |
|---|------|---------|-------|------------|-------------------|
| — | `app/api/admin/routing/team-categories/route.ts` | POST | `{mapping/mappings}` with team_id, category_id | `requireAdminWorkspace` | `normalizeMapping()` helper |
| — | `app/api/workspaces/current/route.ts` | POST | `{workspace_id}` | `createSupabaseRouteClient` | typeof check only |
| — | `app/api/workspaces/[workspaceId]/entitlements/usage-cap/route.ts` | PATCH | `{cap}` | `guardWorkspace` + `isPlatformAdmin` | `parseCap()` (integer + range check) |
| — | `app/api/invites/revoke/route.ts` | POST | `{inviteId}` | `supabase.auth.getUser` + ownership | typeof check |
| — | `app/api/invites/accept/route.ts` | POST | invite token | `createSupabaseRouteClient` | token lookup logic |
| — | `app/api/invites/claim/route.ts` | POST | token claim | rate limiting | token lookup |
| — | `app/api/subscriptions/test-change/route.ts` | POST | `{workspace_id, plan_id}` | admin check | typeof checks — **dev-only route** |
| — | `app/api/dev/token-credit/route.ts` | POST | `{amount}` | email allowlist | parseAmount — **dev-only route** |
| — | `app/api/helper/crm/insights/route.ts` | POST | `{id, action}` | `guardWorkspace` | `if (!id \|\| !action)` |
| — | `app/api/helper/crm/insights/generate/route.ts` | POST | AI generation body | `guardWorkspace` + `requireWorkspaceRole` | none visible |
| — | `app/api/helper/tools/call/route.ts` | POST | `{workspaceId, functionName, parameters, ...}` | `requireUser` + `requireWorkspaceMember` | `if (!workspaceId \|\| !functionName \|\| !parameters)` |
| — | `app/api/helper/conversations/[id]/route.ts` | PATCH | `{title}` | `guardWorkspace` | `if (!title)` |
| — | `app/api/helper/conversations/[id]/messages/stream/route.ts` | POST (SSE) | `{workspaceSlug, workspaceId, content, providerKey, modeKey}` | `requireUser` + `requireWorkspaceMember` | workspace check |
| — | `app/api/marketplace/items/route.ts` | POST | `{workspace_id, title, description, category, ...}` (12+ fields) | `supabase.auth.getUser` | `if (!workspace_id \|\| !title \|\| !description \|\| !category)` — **trusts client workspace_id** |
| — | `app/api/apps/requests/route.ts` | POST | `{workspace_id, user_id, app_name, description, ...}` | `supabase.auth.getUser` | `if (!workspace_id \|\| !user_id \|\| !app_name \|\| !description)` — **trusts client workspace_id AND user_id** |
| — | `app/api/admin/wa/templates/sync/route.ts` | POST | (no body — triggers sync) | `requireWorkspaceRole(["admin","supervisor"])` | — |
| — | `app/api/ops/claim-platform-admin/route.ts` | POST | (no body) | `getCurrentUser` + email allowlist | email allowlist |

---

## 🟡 MEDIUM PRIORITY — GET Routes with Query Params Affecting DB Queries

These accept query parameters that are used in database queries without type/range validation.

| # | File | Methods | Query Params | Auth Guard | Risk |
|---|------|---------|-------------|------------|------|
| 1 | `app/api/tokens/ledger/route.ts` | GET | `page, pageSize, type, status, from, to, workspaceId` | `guardWorkspace` | Unvalidated type/status values passed to `.eq()` |
| 2 | `app/api/tokens/overview/route.ts` | GET | `month, workspaceId` | `guardWorkspace` | month format unvalidated |
| 3 | `app/api/notifications/route.ts` | GET | `workspaceId, unreadOnly, limit` | `requireWorkspaceMember` | parseInt for limit (NaN possible) |
| 4 | `app/api/notifications/count/route.ts` | GET | `workspaceId` | `requireWorkspaceMember` | minimal |
| 5 | `app/api/meta-hub/status/route.ts` | GET | `workspaceId` | membership check | workspaceId presence check only |
| 6 | `app/api/meta-hub/ai-reply/logs/route.ts` | GET | `threadId, status, limit, offset, statsOnly, days` | `getAppContext` | parseInt — no range validation |
| 7 | `app/api/ops/webhooks/route.ts` | GET | `type, workspaceId, hasError, limit, offset, id` | `requirePlatformAdmin` | parseInt |
| 8 | `app/api/ops/analytics/route.ts` | GET | `action, period, start, end, limit` | `requirePlatformAdmin` | parseInt, date parsing |
| 9 | `app/api/ops/customers/search/route.ts` | GET | `q, limit` | `requirePlatformAdmin` | search query used in `.ilike()` |
| 10 | `app/api/ops/audit/export/route.ts` | GET | `action, actor, from, to, format` | `requirePlatformAdmin` | date parsing |
| 11 | `app/api/meta/whatsapp/webhook-events/route.ts` | GET | `workspaceId, limit, status, type, from, to` | `requireWorkspaceMember` + role | Math.min/max for limit |
| 12 | `app/api/meta/whatsapp/tags/route.ts` | GET | `workspaceId` | `requireWorkspaceMember` | workspaceId check |
| 13 | `app/api/meta/whatsapp/jobs/route.ts` | GET | `workspaceId` | `requireWorkspaceMember` + role | workspaceId via helper |
| 14 | `app/api/meta/whatsapp/jobs/[jobId]/route.ts` | GET | `status, limit, offset` | `requireWorkspaceMember` + role | parseInt |
| 15 | `app/api/meta/whatsapp/messages/route.ts` | GET | `workspaceId, threadId` | `requireWorkspaceMember` | presence check |
| 16 | `app/api/meta/whatsapp/contacts/tags/route.ts` | GET | `workspaceId` | membership check | presence check |
| 17 | `app/api/meta/instagram/threads/route.ts` | GET | `workspace_id, status, search, assigned_to` | `supabase.auth.getUser` | **search used in `.or()` — potential injection vector** |
| 18 | `app/api/meta/messenger/threads/route.ts` | GET | `workspace_id, status, search, assigned_to` | `supabase.auth.getUser` | **search used in `.or()` — potential injection vector** |
| 19 | `app/api/meta/ads/insights/route.ts` | GET | `workspace_id, date_range` | `supabase.auth.getUser` | workspace_id check |
| 20 | `app/api/meta/whatsapp/templates/[templateId]/analytics/route.ts` | GET | `workspaceId` | membership check | presence check |
| 21 | `app/api/helper/crm/insights/route.ts` | GET | `type, active, limit` | `guardWorkspace` | parseInt, Math.min |

---

## 🟢 LOW PRIORITY — Simple GETs, Health Checks, Webhooks with Signature Verification, Auth Flows

These are either read-only without sensitive query params, use external signature verification, or are standard auth flows.

| # | File | Methods | Reason LOW |
|---|------|---------|------------|
| 1 | `app/api/health/route.ts` | GET | Health check, CRON_SECRET for details |
| 2 | `app/api/health/workers/route.ts` | GET | Worker health, read-only |
| 3 | `app/api/ops/health/route.ts` | GET | `requirePlatformAdmin`, read-only |
| 4 | `app/api/ops/health/check/route.ts` | GET | Public monitoring endpoint |
| 5 | `app/api/webhooks/meta/whatsapp/route.ts` | GET+POST | Meta signature verification |
| 6 | `app/api/webhooks/outbox-trigger/route.ts` | POST | `WEBHOOK_SECRET` bearer auth |
| 7 | `app/api/webhooks/whatsapp/route.ts` | — | Re-export of #5 |
| 8 | `app/api/whatsapp/webhook/route.ts` | — | Re-export of #5 |
| 9 | `app/api/meta/webhooks/route.ts` | — | Re-export webhook handler |
| 10 | `app/api/meta/messenger/webhook/route.ts` | GET+POST | HMAC signature verification |
| 11 | `app/api/meta/instagram/webhook/route.ts` | GET+POST | HMAC signature verification |
| 12 | `app/api/meta/data-deletion/route.ts` | POST | Meta `signed_request` verification |
| 13 | `app/api/meta/deauthorize/route.ts` | POST | Meta `signed_request` verification |
| 14 | `app/api/meta/oauth/callback/route.ts` | GET | OAuth callback with state + HMAC |
| 15 | `app/api/meta/whatsapp/verify/route.ts` | GET | Verification diagnostics, read-only |
| 16 | `app/api/cron/wa-send-worker/route.ts` | POST | `CRON_SECRET` auth, no user body |
| 17 | `app/api/cron/outbox-worker/route.ts` | POST | `CRON_SECRET` auth, no user body |
| 18 | `app/api/cron/refresh-analytics/route.ts` | GET+POST | `CRON_SECRET` auth, no user body |
| 19 | `app/api/auth/oauth/route.ts` | GET | OAuth redirect, rate-limited, provider whitelist |
| 20 | `app/api/auth/logout/route.ts` | POST | No body, just sign out |
| 21 | `app/api/auth/callback/route.ts` | GET | OAuth code exchange, no body |
| 22 | `app/api/tokens/wallet/route.ts` | GET | Simple wallet fetch |
| 23 | `app/api/tokens/rates/route.ts` | GET | Static rate list |
| 24 | `app/api/workspaces/check/route.ts` | GET | Slug availability, regex validation |
| 25 | `app/api/billing/summary/route.ts` | GET | Read-only billing summary |
| 26 | `app/api/billing/topup/pending/route.ts` | GET | Read-only pending topups |
| 27 | `app/api/admin/inbox/conversations/route.ts` | GET | Read-only, workspace-scoped |
| 28 | `app/api/admin/inbox/threads/[id]/route.ts` | GET | Read-only thread detail |
| 29 | `app/api/admin/inbox/threads/[id]/messages/route.ts` | GET | Read-only message list |
| 30 | `app/api/admin/inbox/threads/[id]/notes/route.ts` | GET | Read-only notes (POST is HIGH) |
| 31 | `app/api/admin/teams/route.ts` | GET | Read-only team list |
| 32 | `app/api/admin/crm/merge-enabled/route.ts` | GET | Read-only feature flag check |
| 33 | `app/api/admin/crm/duplicates/route.ts` | GET | Read-only duplicate contacts |
| 34 | `app/api/workspaces/[workspaceId]/members/route.ts` | GET | Read-only member list |
| 35 | `app/api/workspaces/[workspaceId]/usage/summary/route.ts` | GET | Read-only usage summary |
| 36 | `app/api/workspaces/[workspaceId]/usage/cap/route.ts` | PATCH | Re-exports entitlements/usage-cap (already counted) |
| 37 | `app/api/meta/instagram/threads/[threadId]/messages/route.ts` | GET | Read-only messages |
| 38 | `app/api/meta/messenger/threads/[threadId]/messages/route.ts` | GET | Read-only messages |
| 39 | `app/api/helper/tools/list/route.ts` | GET | Read-only tool list |
| 40 | `app/api/helper/knowledge/search/route.ts` | GET | Read-only search |
| 41 | `app/api/helper/usage/route.ts` | GET | Read-only usage |
| 42 | `app/api/audit-events/route.ts` | GET | Read-only audit events |
| 43 | `app/api/invites/preview/route.ts` | GET | Read-only invite preview |

### Routes with Zod via External Schemas (correctly validated, not counted as missing)

| File | External Schema |
|------|----------------|
| `app/api/auth/register/route.ts` | `registerSchema` from `@/lib/validation/auth` |
| `app/api/auth/resend-verification/route.ts` | `resendVerificationSchema` from `@/lib/validation/auth` |
| `app/api/auth/forgot-password/route.ts` | `forgotPasswordSchema` from `@/lib/validation/auth` |
| `app/api/beta/apply/route.ts` | Inline Zod schema (`ApplySchema`) — was listed as missing, actually HAS Zod |
| `app/api/contact/route.ts` | `contactSchema` from `@/lib/validation/contact` |

---

## 🚨 Critical Security Findings

### 1. SQL Injection Risk — `ops/sql-query`
**File**: `app/api/ops/sql-query/route.ts`
- Accepts raw SQL in POST body with only `if (!query)` check
- While behind `requirePlatformAdmin`, Zod should enforce `z.string().max(10000)` and content sanitization at minimum

### 2. Client-Trusted `workspace_id` and `user_id`
**Files**:
- `app/api/marketplace/items/route.ts` — trusts `workspace_id` from body
- `app/api/apps/requests/route.ts` — trusts **both** `workspace_id` AND `user_id` from body

These violate the Golden Rule: *"Never trust client input for `workspace_id` or role"*

### 3. Search String in `.or()` Filter
**Files**:
- `app/api/meta/instagram/threads/route.ts` — `search` query param used in `.or()` PostgREST filter
- `app/api/meta/messenger/threads/route.ts` — same pattern

While PostgREST typically escapes these, unvalidated strings in filter expressions are a risk.

---

## Recommended Remediation Order

1. **Immediate** (security): Fix `marketplace/items` and `apps/requests` to derive `workspace_id` from auth context, not body
2. **Immediate** (defense-in-depth): Add Zod schema to `ops/sql-query`
3. **Week 1**: Add Zod to all 28 Meta/WhatsApp mutation routes (#11–#28)
4. **Week 1**: Add Zod to all 15 Admin inbox/CRM mutation routes (#29–#43)
5. **Week 2**: Add Zod to remaining ops console routes (#1–#10)
6. **Week 2**: Add Zod to helper & workspace mutation routes
7. **Week 3**: Add Zod to MEDIUM priority GET routes for query param validation
8. **Ongoing**: Enforce lint rule requiring Zod import in any route with `req.json()` or `searchParams`
