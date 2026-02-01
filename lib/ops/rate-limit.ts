import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash Rate Limit for distributed rate limiting across ops actions.
 * Falls back to in-memory if Upstash is not configured.
 */

let upstashRateLimit: Ratelimit | null = null;

// Initialize Upstash Rate Limit if credentials are available
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  upstashRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: true,
    prefix: "gigaviz:ops:ratelimit",
  });
}

// In-memory fallback for development/testing
type Bucket = {
  count: number;
  resetAt: number;
};

const inMemoryBuckets = new Map<string, Bucket>();

/**
 * Rate limit ops actions using Upstash (distributed) or in-memory (fallback).
 * 
 * @param key - Unique identifier for rate limit bucket (e.g., "userId:action")
 * @param options - Configuration options
 * @throws Error with format "rate_limited:{retryAfterMs}" if limit exceeded
 * 
 * @example
 * await assertOpsRateLimit(`${userId}:token.grant`, { limit: 10, windowMs: 60000 });
 */
export async function assertOpsRateLimit(
  key: string,
  options?: { limit?: number; windowMs?: number }
): Promise<void> {
  const limit = options?.limit ?? 30;
  const windowMs = options?.windowMs ?? 60_000;

  // Use Upstash if configured
  if (upstashRateLimit) {
    const { success, reset } = await upstashRateLimit.limit(key);
    
    if (!success) {
      const now = Date.now();
      const retryAfter = Math.max(reset - now, 0);
      throw new Error(`rate_limited:${retryAfter}`);
    }
    
    return;
  }

  // Fallback to in-memory (development only)
  const now = Date.now();
  const bucket = inMemoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    inMemoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.max(bucket.resetAt - now, 0);
    throw new Error(`rate_limited:${retryAfter}`);
  }

  inMemoryBuckets.set(key, bucket);
}

/**
 * Check if Upstash is configured and active.
 */
export function isUpstashConfigured(): boolean {
  return upstashRateLimit !== null;
}

/**
 * Get current rate limit status for a key (diagnostic purposes).
 * Only works with Upstash backend.
 */
export async function getRateLimitStatus(key: string): Promise<{
  remaining: number;
  limit: number;
  reset: number;
} | null> {
  if (!upstashRateLimit) return null;

  const { remaining, limit, reset } = await upstashRateLimit.limit(key);
  
  return {
    remaining,
    limit,
    reset,
  };
}
