# Pre-Deploy Checklist

## 1. ✅ Code Fixes Applied
- [x] Fixed `findTokenForConnection` to extract `token_encrypted` from result
- [x] All lint/typecheck/build passing

## 2. ❌ Deployment Steps

### A. Push to GitHub
```bash
git status
git add .
git commit -m "fix: extract token_encrypted from tokenRow in outbox webhook"
git push origin main
```

### B. Vercel Deploy
- Auto-deploy setelah push OR
- Manual trigger di Vercel dashboard

### C. Verify Environment Variables (Vercel)
```bash
WEBHOOK_SECRET=<generate-or-use-CRON_SECRET>
ENABLE_WA_SEND=true
CRON_SECRET=<existing-value>
```

## 3. ❌ Supabase Webhook Setup

### Buka Supabase Dashboard
Project: gigaviz-web → Database → Webhooks

### Create Webhook #1: INSERT
- **Name**: `outbox-insert-trigger`
- **Table**: `outbox_messages`
- **Events**: `INSERT`
- **Method**: `POST`
- **URL**: `https://gigaviz.com/api/webhooks/outbox-trigger`
- **Headers**:
  ```
  Authorization: Bearer ${WEBHOOK_SECRET}
  Content-Type: application/json
  ```
- **Enabled**: ✅

### Create Webhook #2: UPDATE (Optional - for retry)
- **Name**: `outbox-retry-trigger`  
- **Table**: `outbox_messages`
- **Events**: `UPDATE`
- **Method**: `POST`
- **URL**: `https://gigaviz.com/api/webhooks/outbox-trigger`
- **Headers**: (same as #1)
- **Conditions**: `status = 'queued'`
- **Enabled**: ✅

## 4. ✅ Testing Plan

### Test 1: Send Message via Inbox
1. Buka https://gigaviz.com/gigaviz-platform/meta-hub/messaging/whatsapp/inbox/full
2. Pilih thread, kirim pesan
3. Expect: message sent dalam < 2 detik

### Test 2: Check Database
```sql
-- Check outbox processing
SELECT 
  id, 
  status, 
  attempts, 
  last_error, 
  created_at,
  updated_at
FROM outbox_messages 
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
ORDER BY created_at DESC 
LIMIT 10;

-- Should see status: 'sent' (not stuck in 'queued')
```

### Test 3: Check Webhook Logs
- Supabase → Database → Webhooks → `outbox-insert-trigger` → Logs
- Should see successful POST requests (200/202 status)

### Test 4: Fallback Cron
```bash
# Manual trigger if webhook fails
curl -X POST https://gigaviz.com/api/cron/outbox-worker \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

## 5. ❌ Known Issues to Monitor

### Issue: Messages stuck in "queued"
**Cause**: Webhook not triggering
**Fix**: 
1. Check webhook enabled in Supabase
2. Check WEBHOOK_SECRET in Vercel
3. Check webhook logs for errors
4. Fallback: GitHub Actions cron runs every 5 min

### Issue: "Invalid OAuth access token"
**Cause**: Old code still deployed
**Fix**: Verify deployment timestamp, force redeploy if needed

### Issue: "token_not_found"
**Cause**: No Meta token in meta_tokens table
**Fix**: Re-authenticate Meta connection in Meta Hub

## 6. Success Criteria

- ✅ Message send latency < 2 seconds
- ✅ No "Invalid OAuth access token" errors
- ✅ Outbox status transitions: queued → sent
- ✅ WhatsApp message delivered with wa_message_id
- ✅ Inbox/full accessible (no 404)

## 7. Rollback Plan

If production breaks:
```bash
# Revert commit
git revert HEAD
git push origin main

# OR restore via Vercel
# Vercel Dashboard → Deployments → Previous deployment → Promote to Production
```

## Order of Operations

1. **FIRST**: Push code to GitHub
2. **SECOND**: Wait for Vercel deploy to complete
3. **THIRD**: Setup Supabase webhooks
4. **FOURTH**: Test send message
5. **FIFTH**: Monitor for 10 minutes

---

## Quick Commands

```bash
# Check current deployment
vercel ls gigaviz-web

# Check webhook endpoint health
curl https://gigaviz.com/api/health/workers

# Test webhook locally (dev server running)
curl -X POST http://localhost:3000/api/webhooks/outbox-trigger \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"outbox_messages","schema":"public","record":{"id":"test","workspace_id":"test","to_phone":"628","message_type":"text","payload":{},"status":"queued","attempts":0}}'
```
