# Meta Hub – WhatsApp Smoke Test

## Pre-requisites
- Workspace exists and you are a member (owner/admin/member as required).
- Valid Supabase session; workspace cookies set.
- WhatsApp connection configured (phone number ID, WABA ID) and token present in `meta_tokens` for the workspace.
- Sandbox whitelist numbers added if sandbox is enabled.
- Webhook endpoint installed on Meta and reachable (for inbox tests).

## Test URLs
- Templates: `/{workspaceSlug}/meta-hub/messaging/whatsapp`
- Inbox: `/{workspaceSlug}/meta-hub/messaging/whatsapp/inbox`
- **Webhooks Monitor**: `/{workspaceSlug}/meta-hub/messaging/whatsapp/webhooks`
- Templates detail (same page sections) if routed: `/{workspaceSlug}/meta-hub/messaging/whatsapp/templates`

## Templates Flow
1) Sync templates: click **Sync now** → expect success toast; on failure, toast shows reason.
2) Refresh status: use **Refresh** on a row → status/quality badge updates.
3) Search/filter: type in search box; list narrows; clear search resets results.
4) Test send (sandbox/whitelist): select template, fill variables, send test → success toast or whitelist error.
5) Create wizard: leave required fields blank to see validation; complete steps and submit → template appears in list.
6) Clone template: click **Clone** on a row → wizard prefilled; after submit, new template appears and is selectable.

## Inbox Flow
1) Refresh inbox: click **Refresh Inbox** (process-events) → new conversations appear if webhook data exists.
2) Open thread: select a thread → messages render in panel.
3) Mark read: opening a thread triggers mark-read; unread badge should clear on that thread.
4) Send text: type message and send → optimistic bubble then resolved state.
5) Send template reply: load template dropdown (spinner if loading), choose, send → toast success.
6) Update status/assignee: change fields and save → values persist and reflect in thread list details.
7) Tags and internal note: add tags and a note → they render immediately and persist on reload.

## Webhooks Monitor Flow
1) Navigate to **Webhooks** tab: expect Health header with last event time, events in 24h, errors in 24h, and token status.
2) Refresh events: click **Refresh** → event timeline updates; "Last refreshed" indicator updates.
3) Filters: change status (OK/Failed/All), event type dropdown, date range tabs (24h/7d/30d/All) → list filters accordingly.
4) Reconcile: click **Reconcile now** → toast shows reconcile result; events re-fetched.
5) Empty state: if no events, verify CTA links appear ("Verify webhook setup", "Reconcile now").
6) Token status: if connection missing, "Missing" badge appears with "Open Connections" link.

## Supabase Data Checks
- `wa_threads`: thread status/assignee updates, unread_count drops after mark-read.
- `wa_messages`: new outbound messages inserted with `direction=outbound` and timestamps.
- `meta_webhook_events`: new webhook rows processed; errors cleared after successful processing.
- Audit events (if enabled): entries for template sync/test send, inbox process-events, send message/template, thread updates, tag/note changes.

## Quick Troubleshooting
- If whitelist error occurs during test send, ensure `wa_settings.test_whitelist` contains the target number and sandbox is enabled.
- If inbox stays empty, confirm webhook is installed and `meta_webhook_events` has unprocessed rows; rerun **Refresh Inbox**.
- For template creation errors, verify token/WABA/phone number ID exist and Meta Graph version env vars are set.
