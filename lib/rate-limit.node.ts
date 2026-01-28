import { supabaseAdmin } from "@/lib/supabase/admin.node";
import "dotenv/config";

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

// NOTE: In-memory only; use DB-backed for multi-instance limits.
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

// DB-backed rate limit; falls back to in-memory if RPC fails
export async function rateLimitDb(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.floor(options.windowMs / 1000));
  try {
    const db = supabaseAdmin();
    const { data, error } = await db.rpc("take_rate_limit_slot", {
      p_key: key,
      p_cap: options.max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    const ok = Boolean(data);
    return {
      ok,
      limit: options.max,
      remaining: ok ? Math.max(options.max - 1, 0) : 0,
      resetAt: Date.now() + options.windowMs,
    };
  } catch {
    return rateLimit(key, options);
  }
}
