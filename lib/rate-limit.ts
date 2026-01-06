type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

const store = new Map<string, { count: number; resetAt: number }>();

// NOTE: In-memory only; use Redis/Upstash for durable, multi-instance limits.
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      ok: true,
      limit: options.max,
      remaining: Math.max(options.max - 1, 0),
      resetAt,
    };
  }

  const nextCount = entry.count + 1;
  entry.count = nextCount;
  store.set(key, entry);

  return {
    ok: nextCount <= options.max,
    limit: options.max,
    remaining: Math.max(options.max - nextCount, 0),
    resetAt: entry.resetAt,
  };
}
