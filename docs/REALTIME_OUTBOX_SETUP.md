# Real-Time Outbox Processing Setup Guide

## 🎯 Overview

This implementation provides **real-time message processing** using **Database Webhooks** instead of Vercel Cron Jobs (which are limited on Hobby plan).

## 📐 Architecture

```
User sends message
    ↓
Insert to outbox_messages (status: queued)
    ↓
    ⚡ Database Trigger fires (0ms delay!)
    ↓
Supabase Webhook calls /api/webhooks/outbox-trigger
    ↓
Process & send to WhatsApp API immediately
    ↓
Update status (sent/failed)
```

**Fallback:** GitHub Actions runs every 5 minutes to catch any missed messages.

## 🚀 Setup Instructions

### 1. Apply Database Migration

```bash
# Apply the trigger migration
npm run supabase:migration:up
```

This creates:
- `notify_outbox_insert()` function
- `outbox_insert_trigger` trigger
- `notify_outbox_retry()` function for retries

### 2. Configure Supabase Database Webhook

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Database** → **Webhooks**
3. Click **Create a new webhook**
4. Configure:
   - **Name:** `Outbox Message Trigger`
   - **Table:** `outbox_messages`
   - **Events:** Check `INSERT` and `UPDATE`
   - **HTTP Request:**
     - **Method:** `POST`
     - **URL:** `https://YOUR_DOMAIN.vercel.app/api/webhooks/outbox-trigger`
     - **HTTP Headers:**
       ```
       Authorization: Bearer YOUR_WEBHOOK_SECRET
       Content-Type: application/json
       ```
   - **Conditions (optional):**
     ```sql
     record.status = 'queued'
     ```
5. Click **Create webhook**
6. Click **Send a test** to verify it works

### 3. Set Environment Variables

Add to Vercel or `.env.local`:

```bash
# Webhook authentication (same as CRON_SECRET for backward compatibility)
WEBHOOK_SECRET=your_secure_random_token_here

# Enable actual WhatsApp sending (set to false for testing)
ENABLE_WA_SEND=true

# Worker configuration
WORKER_MAX_ATTEMPTS=5
WORKER_BATCH_SIZE=20
```

### 4. Setup GitHub Actions Fallback (Optional but Recommended)

GitHub Actions provide fallback cron jobs if webhooks fail.

**Add GitHub Secrets:**
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `APP_URL`: `https://your-domain.vercel.app`
   - `CRON_SECRET`: Same value as `WEBHOOK_SECRET`

The workflows will automatically run:
- `outbox-worker.yml`: Every 5 minutes (fallback for missed messages)
- `wa-send-worker.yml`: Every 5 minutes (bulk send jobs)
- `refresh-analytics.yml`: Every hour (stats refresh)

### 5. Deploy to Vercel

```bash
git add .
git commit -m "feat: implement real-time outbox processing with database webhooks"
git push origin main
```

Vercel will automatically deploy. No more cron job errors! ✅

## 🧪 Testing

### Test Webhook Locally

1. Start local dev server:
   ```bash
   npm run dev
   ```

2. Use ngrok or similar to expose local server:
   ```bash
   ngrok http 3000
   ```

3. Update Supabase webhook URL to ngrok URL:
   ```
   https://abc123.ngrok.io/api/webhooks/outbox-trigger
   ```

4. Send a test message and verify it processes immediately

### Test GitHub Actions

1. Go to GitHub repo → **Actions** tab
2. Select a workflow (e.g., `Outbox Worker Fallback`)
3. Click **Run workflow** → **Run workflow**
4. Check logs to verify it calls your API successfully

## 📊 Monitoring

### Check Webhook Status

In Supabase Dashboard → Database → Webhooks:
- View delivery history
- Check success/failure rates
- See response times

### Check GitHub Actions

In GitHub → Actions tab:
- See all workflow runs
- View execution logs
- Monitor success rates

### Application Logs

Check Vercel logs for:
```
[outbox-trigger] Processing outbox message
[outbox-trigger] Message sent successfully
```

## ⚙️ Configuration

### Retry Logic

Failed messages are automatically retried with exponential backoff:
- Attempt 1: Retry after 1 minute
- Attempt 2: Retry after 2 minutes
- Attempt 3: Retry after 4 minutes
- Attempt 4: Retry after 8 minutes
- Attempt 5: Retry after 16 minutes
- After 5 attempts: Mark as permanently failed

### Rate Limiting

- Webhooks: No built-in limit (process immediately)
- GitHub Actions fallback: Every 5 minutes (catches any missed)
- WhatsApp API: Respects Meta rate limits automatically

## 🔧 Troubleshooting

### Webhook not triggering

1. Check Supabase webhook delivery history
2. Verify `Authorization` header matches `WEBHOOK_SECRET`
3. Check trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'outbox_insert_trigger';
   ```

### Messages stuck in queue

1. Check GitHub Actions fallback is running
2. Manually trigger workflow: GitHub → Actions → Run workflow
3. Check logs in Vercel for errors

### Deployment failing

1. Verify `vercel.json` has empty crons array
2. Check build logs in Vercel dashboard
3. Ensure all dependencies are installed

## 🎯 Benefits

### vs. Vercel Cron (Old)
- ✅ **Instant processing** (0s vs 0-120s delay)
- ✅ **Works on Hobby plan** (no cron limits)
- ✅ **Cheaper** (only runs when needed)
- ✅ **More reliable** (event-driven, not polling)

### vs. Direct Send (Alternative)
- ✅ **Better failure handling** (retries with backoff)
- ✅ **Atomic processing** (prevents duplicates)
- ✅ **Audit trail** (all events logged in outbox)
- ✅ **Rate limit safe** (controlled sending)

## 📚 Related Files

- `/supabase/migrations/20260202000000_realtime_outbox_trigger.sql` - Database triggers
- `/app/api/webhooks/outbox-trigger/route.ts` - Webhook handler
- `/.github/workflows/outbox-worker.yml` - Fallback cron
- `/vercel.json` - Vercel config (crons removed)

## 🔄 Migration from Old System

The old cron-based system is automatically disabled by removing cron config from `vercel.json`.

**Data migration:** NOT REQUIRED - all existing `outbox_messages` rows will be processed by the fallback GitHub Actions cron.

**No downtime:** Deploy this change and it will start working immediately. Old messages in queue will be processed by GitHub Actions fallback within 5 minutes.

## 💡 Future Improvements

1. **Supabase Edge Functions** - Move webhook handler to edge for even lower latency
2. **Dead Letter Queue** - Separate table for permanently failed messages
3. **Priority queues** - High-priority messages processed first
4. **Metrics dashboard** - Real-time delivery monitoring

---

**Questions?** Check the implementation code or ask in team chat.
