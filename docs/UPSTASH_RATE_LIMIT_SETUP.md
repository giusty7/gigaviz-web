# Upstash Rate Limit Setup

## Overview

The `/ops` platform uses **Upstash Rate Limit** for distributed rate limiting across all sovereign operations (token grants, entitlement changes, suspensions, etc.). This prevents abuse and ensures system stability.

**Benefits over in-memory rate limiting:**
- ✅ Distributed across multiple server instances
- ✅ Persists across deployments
- ✅ Real-time analytics dashboard
- ✅ No memory leaks from unbounded Map growth

---

## Setup Instructions

### 1. Create Upstash Redis Database

1. Go to [console.upstash.com](https://console.upstash.com)
2. Create account or log in
3. Click **Create Database**
4. Choose:
   - **Name**: `gigaviz-ops-ratelimit`
   - **Type**: Regional (for better latency)
   - **Region**: Choose closest to your deployment (e.g., US East, EU West, Asia Pacific)
5. Click **Create**

### 2. Get Credentials

After database creation:
1. Go to database details
2. Scroll to **REST API** section
3. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Add to Environment Variables

Add to `.env.local` (development):
```env
UPSTASH_REDIS_REST_URL=https://your-database-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

Add to Vercel (production):
```bash
vercel env add UPSTASH_REDIS_REST_URL
# Paste URL when prompted

vercel env add UPSTASH_REDIS_REST_TOKEN
# Paste token when prompted
```

---

## Rate Limit Configuration

**Default limits** (configured in `lib/ops/rate-limit.ts`):
- **30 requests per 60 seconds** using sliding window algorithm
- **Per-user, per-action** isolation (e.g., `userId:token.grant`)

**Actions covered:**
- `token.grant` / `token.deduct`
- `entitlement` (enable/disable)
- `note` (support notes)
- `flag` / `flag_toggle` (feature flags)
- `suspend` / `unsuspend` (workspace status)

---

## Fallback Behavior

If Upstash credentials are **not configured**, the system automatically falls back to **in-memory rate limiting**:

⚠️ **In-memory limitations:**
- Not distributed (per-instance only)
- Resets on server restart
- Not suitable for production multi-instance deployments

**Check if Upstash is active:**
```typescript
import { isUpstashConfigured } from '@/lib/ops/rate-limit';

if (isUpstashConfigured()) {
  console.log('✅ Using Upstash (distributed)');
} else {
  console.warn('⚠️ Using in-memory fallback');
}
```

---

## Monitoring

View rate limit analytics in Upstash Console:
1. Go to your database
2. Click **Analytics** tab
3. See:
   - Requests per second
   - Hit rate (successful vs rate limited)
   - Geographic distribution

---

## Customizing Limits

To adjust rate limits per action:

```typescript
// In server actions or ops functions
await assertOpsRateLimit(`${userId}:custom-action`, {
  limit: 10,        // Max 10 requests
  windowMs: 60000   // Per 60 seconds
});
```

**Common scenarios:**
- **Token grants**: 10 per minute (more restrictive)
- **Read-only queries**: 100 per minute (more permissive)
- **Bulk operations**: 5 per 5 minutes

---

## Troubleshooting

### Error: "rate_limited:{retryAfterMs}"

This means user exceeded rate limit. The error message includes retry-after time in milliseconds.

**Solution:**
1. Wait for the specified time
2. Retry the operation
3. If persistent, check for loops or automation bugs

### Rate limit too restrictive

If legitimate ops workflows are being blocked:

1. **Temporary fix**: Increase limits in code
   ```typescript
   await assertOpsRateLimit(key, { limit: 60, windowMs: 60000 });
   ```

2. **Long-term fix**: Audit ops workflows and optimize action frequency

### Upstash connection errors

Check:
- ✅ Credentials are correct
- ✅ Database is not paused (Upstash auto-pauses inactive databases)
- ✅ Network allows outbound HTTPS to `*.upstash.io`

Fallback to in-memory is automatic on connection errors.

---

## Cost Estimation

**Upstash Redis pricing** (as of 2026):
- **Free tier**: 10,000 commands/day
- **Pro**: $0.20 per 100K commands

**Typical usage** for ops platform:
- ~500 ops actions/day = 500 commands
- Well within free tier for most teams
- Pro tier needed only for high-volume platforms (>10K ops actions/day)

---

## Security Notes

- ✅ REST API uses TLS encryption
- ✅ Tokens are read-only (no admin commands exposed)
- ✅ Rate limit keys include user ID for isolation
- ⚠️ Do not commit `.env.local` with tokens to version control

---

## Migration from In-Memory

No migration needed! The new rate limit helper (`assertOpsRateLimit`) automatically:
1. Uses Upstash if configured
2. Falls back to in-memory if not

Simply add env vars to production and restart. No code changes required.

---

## Testing

**Development (without Upstash):**
```bash
npm run dev
# Falls back to in-memory automatically
```

**Staging (with Upstash):**
```bash
# Add env vars to .env.local
vercel --env=preview
```

**Production:**
```bash
vercel --prod
# Ensure env vars are set in Vercel dashboard
```

---

## References

- [Upstash Rate Limit Docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Upstash Console](https://console.upstash.com)
- [Sliding Window Algorithm](https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms#sliding-window)
