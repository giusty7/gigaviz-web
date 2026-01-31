# Outbox Real-Time Webhook Setup

## Overview
Real-time message delivery menggunakan Supabase Database Webhooks untuk trigger immediate processing ketika message di-insert ke `outbox_messages`.

## Setup di Supabase Dashboard

### 1. Buka Supabase Dashboard
- Project: gigaviz-web
- Pergi ke: **Database → Webhooks**

### 2. Create Webhook untuk INSERT
**Webhook #1: Outbox Insert Trigger**
- Name: `outbox-insert-trigger`
- Table: `outbox_messages`
- Events: `INSERT`
- HTTP Method: `POST`
- URL: `https://gigaviz.com/api/webhooks/outbox-trigger`
- HTTP Headers:
  ```
  Authorization: Bearer ${WEBHOOK_SECRET}
  Content-Type: application/json
  ```
- Enabled: ✅

### 3. Create Webhook untuk UPDATE (Retry)
**Webhook #2: Outbox Retry Trigger**
- Name: `outbox-retry-trigger`
- Table: `outbox_messages`
- Events: `UPDATE`
- HTTP Method: `POST`
- URL: `https://gigaviz.com/api/webhooks/outbox-trigger`
- HTTP Headers:
  ```
  Authorization: Bearer ${WEBHOOK_SECRET}
  Content-Type: application/json
  ```
- Filter: `status = 'queued' AND next_attempt_at IS NOT NULL`
- Enabled: ✅

## Environment Variables

### Production (Vercel)
```bash
WEBHOOK_SECRET=<same-as-CRON_SECRET-or-generate-new>
ENABLE_WA_SEND=true
```

### Development (.env.local)
```bash
# Optional for local testing (webhook will bypass auth in dev mode)
WEBHOOK_SECRET=dev-webhook-secret
ENABLE_WA_SEND=true
```

## Testing

### 1. Send Message via Inbox
```bash
# Kirim pesan via inbox UI
# Check outbox_messages table:
SELECT id, status, attempts, last_error, created_at 
FROM outbox_messages 
WHERE status = 'queued' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. Check Webhook Logs
- Supabase Dashboard → Database → Webhooks → View Logs
- Check for successful triggers dan response status

### 3. Manual Trigger (Development)
```bash
curl -X POST http://localhost:3000/api/webhooks/outbox-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "outbox_messages",
    "schema": "public",
    "record": {
      "id": "uuid-here",
      "workspace_id": "workspace-uuid",
      "connection_id": "connection-uuid",
      "to_phone": "628123456789",
      "message_type": "text",
      "payload": {"message_id": "msg-uuid", "text": "test"},
      "status": "queued",
      "attempts": 0
    }
  }'
```

## Flow Diagram

```
User kirim message
    ↓
POST /api/meta/whatsapp/send-text
    ↓
1. Insert wa_messages (status: queued)
2. Insert outbox_messages (status: queued)
    ↓
Supabase Database Webhook (real-time)
    ↓
POST /api/webhooks/outbox-trigger
    ↓
1. Fetch connection & token
2. Call Meta Graph API
3. Update wa_messages (status: sent/failed)
4. Update outbox_messages (status: sent/failed)
    ↓
Message delivered!
```

## Fallback: GitHub Actions Cron

Jika webhook gagal, GitHub Actions akan process pending messages setiap 5 menit:

```yaml
# .github/workflows/outbox-worker.yml
schedule:
  - cron: "*/5 * * * *"
```

## Troubleshooting

### Messages stuck di "queued"
1. Check webhook enabled di Supabase
2. Check webhook logs untuk error
3. Check `WEBHOOK_SECRET` di Vercel environment variables
4. Manual trigger via cron endpoint:
   ```bash
   curl -X POST https://gigaviz.com/api/cron/outbox-worker \
     -H "Authorization: Bearer ${CRON_SECRET}"
   ```

### "Invalid OAuth access token"
- Pastikan fix sudah di-deploy
- Check `meta_tokens` table ada token untuk workspace
- Token format harus string bersih (tidak `[object Object]`)

### Webhook 401 Unauthorized
- Check `WEBHOOK_SECRET` match antara Supabase webhook header dan Vercel env
- Di dev mode, webhook akan bypass auth check
