# Gigaviz Inbox Report

## A) Status Checklist

### A1 Shared Team Inbox
[x] Unified inbox list + unread badge
[x] Conversation detail bubble chat
[x] Notes internal (persist)
[x] Status sent/delivered/read (webhook updates)
[x] Search & filter UI (server-side)
[x] Snooze
[x] Attachments viewer (MVP)
[x] Pinned
[x] Archived

### A2 Ticketing + SLA
[x] Ticket status open/pending/solved (spam belum)
[x] Priority low/med/high/urgent
[ ] SLA timer (first response + resolution)
[ ] Escalation

### A3 Routing + Assignment
[x] Manual assignment (assigned_to)
[ ] Transfer team
[ ] Round-robin
[ ] Skill-based routing
[ ] Supervisor takeover

### A4 CRM Mini
[~] Profile basic (name/phone/tags/lastSeen)
[ ] Timeline activity
[ ] Custom fields
[ ] Dedup & merge
[ ] Blacklist/whitelist

## B) How To Run Locally

1) `npm install`
2) Copy `.env.example` to `.env.local` and fill Supabase + WhatsApp values.
3) Apply SQL migration in `docs/sql/20260102_inbox.sql` to Supabase.
4) Run `npm run dev`
5) Open `http://localhost:3000/admin/inbox`

## C) How To Test

### Dry-run send (default)
1) Ensure `ENABLE_WA_SEND=false`.
2) Open a conversation and send a message.
3) Confirm message is stored with status `queued` and no WA call is made.

### Real send (Cloud API)
1) Set `ENABLE_WA_SEND=true`.
2) Fill `WA_ACCESS_TOKEN` (or `WA_CLOUD_API_TOKEN`) and `WA_PHONE_NUMBER_ID`.
3) Send a message and confirm `wa_message_id` + status `sent`.

### Webhook status updates
1) Expose the app (ngrok or similar) and set webhook URL to
   `https://<host>/api/webhooks/whatsapp`.
2) Verify GET using `WA_VERIFY_TOKEN`.
3) POST a sample payload:

```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "statuses": [
              { "id": "wamid.HBg...", "status": "delivered", "timestamp": "1710000000" }
            ]
          }
        }
      ]
    }
  ]
}
```

4) Confirm message status changes to `delivered` and a `message_events` row is added.

## D) Risks & Mitigations

- Webhook payload variance: handler ignores unknown events and logs errors.
- Media URL lookup: fallback stores `wa-media://<id>` when URL fetch fails.
- Rate control: simple in-memory cap; restart resets counters (acceptable for MVP).
- Inbound webhook uses `DEFAULT_WORKSPACE_ID` to map messages to a workspace.
