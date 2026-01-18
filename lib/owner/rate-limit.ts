import "server-only";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function assertOwnerRateLimit(
  key: string,
  options?: { limit?: number; windowMs?: number }
) {
  const limit = options?.limit ?? 30;
  const windowMs = options?.windowMs ?? 60_000;
  const now = Date.now();

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.max(bucket.resetAt - now, 0);
    throw new Error(`rate_limited:${retryAfter}`);
  }

  buckets.set(key, bucket);
}
