# Cron Worker Migration Guide

## Overview

WhatsApp send worker cron has been migrated from **Vercel Cron Jobs** to **GitHub Actions** to avoid deployment failures on Hobby plan (which doesn't support per-minute schedules).

## Architecture

- **Trigger**: GitHub Actions workflow (`.github/workflows/wa-send-worker.yml`)
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Endpoint**: `POST /api/cron/wa-send-worker`
- **Authentication**: Bearer token via `CRON_SECRET`

## Setup Instructions

### 1. Generate CRON_SECRET

```bash
# Generate a secure random secret (32 bytes base64)
openssl rand -base64 32
```

Copy the output, e.g., `xK9mP2vQ8sL3jR7nH5dF4aT6bW1cE0uY9iO8pI7gH6k=`

### 2. Configure Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables:

**Add new variable:**
- **Key**: `CRON_SECRET`
- **Value**: (paste the generated secret)
- **Environments**: Production, Preview, Development

**Redeploy** after adding the variable.

### 3. Configure GitHub Repository Secrets

Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

**Add two secrets:**

1. **CRON_URL**
   - Value: `https://your-domain.vercel.app/api/cron/wa-send-worker`
   - Example: `https://gigaviz-platform.vercel.app/api/cron/wa-send-worker`

2. **CRON_SECRET**
   - Value: (same secret as Vercel, e.g., `xK9mP2vQ8sL3jR7nH5dF4aT6bW1cE0uY9iO8pI7gH6k=`)

### 4. Verify Setup

**Manual trigger test:**
1. Go to GitHub repo → Actions → "WA Send Worker"
2. Click "Run workflow" → "Run workflow"
3. Check the logs to ensure it completes successfully

**Scheduled runs:**
- Workflow will automatically run every 5 minutes
- Check Actions tab for execution history

## Security

- The endpoint **requires** `Authorization: Bearer <CRON_SECRET>` header
- Without valid secret:
  - **Production**: Returns 500 "CRON_SECRET not configured" (if not set) or 401 "unauthorized"
  - **Development**: Allows requests without secret for local testing

## Local Testing

```bash
# Set CRON_SECRET in .env.local
echo "CRON_SECRET=test-secret-123" >> .env.local

# Start dev server
npm run dev

# Test endpoint
curl -i -X POST http://localhost:3000/api/cron/wa-send-worker \
  -H "Authorization: Bearer test-secret-123" \
  -H "Content-Type: application/json" \
  -d '{"source":"manual-test"}'
```

## Troubleshooting

### Deployment still fails
- Ensure `vercel.json` has no `crons` field (should be `{}` or removed)
- Commit and push changes

### Worker not running
- Check GitHub Actions → "WA Send Worker" for errors
- Verify `CRON_URL` and `CRON_SECRET` secrets are set correctly
- Ensure Vercel `CRON_SECRET` env var is set and deployed

### 401 Unauthorized
- Secret mismatch: GitHub `CRON_SECRET` ≠ Vercel `CRON_SECRET`
- Update both to match exactly

### 500 CRON_SECRET not configured
- Missing `CRON_SECRET` in Vercel environment variables
- Add it and redeploy

## Rollback

If you need to revert to Vercel Cron (upgrade to Pro plan first):

1. Restore `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/wa-send-worker",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

2. Remove authentication check from `route.ts` (optional, but less secure)

3. Disable GitHub Actions workflow (rename file or add `if: false`)

## Notes

- Minimum GitHub Actions cron interval: 5 minutes
- Worker processes 10 items per invocation (configurable via `BATCH_SIZE`)
- Rate limiting: Respects `rate_limit_per_minute` per job
- Endpoint also supports manual triggers via `workflow_dispatch`
