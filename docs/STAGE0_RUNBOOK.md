# Stage 0 Runbook (Minimal Production Stability)

## 1) Apply DB migration

Apply in Supabase SQL editor after prior migrations:

- `docs/sql/20260113_outbox.sql`

## 2) Run worker locally

1) Ensure env vars are set (Supabase + WhatsApp):
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `WA_ACCESS_TOKEN` or `WA_CLOUD_API_TOKEN`
   - `WA_PHONE_NUMBER_ID`
   - `ENABLE_WA_SEND=true` for real sends, `false` for dry-run

2) Start the worker:

```bash
npm run worker
```

## 3) Deploy considerations

- Multiple workers are safe: outbox claims use `claim_outbox` with `SKIP LOCKED`.
- Ensure `RATE_CAP_PER_MIN` is set; rate limit is enforced via DB function.
- Optional tuning:
  - `WORKER_BATCH_SIZE` (default 20)
  - `WORKER_POLL_INTERVAL_MS` (default 2000)
  - `RATE_DELAY_MIN_MS` / `RATE_DELAY_MAX_MS` for jitter

## 4) Health endpoint

- `GET /api/health` returns DB connectivity, WA token presence, and outbox backlog.

## 5) Backoff policy

- Retries use minutes: 3 / 5 / 10
- After last retry, outbox row is marked `failed` and message status becomes `failed`
