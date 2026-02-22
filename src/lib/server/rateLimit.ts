// src/lib/server/rateLimit.ts
// Upstash Redis rate limiting with circuit breaker (fail-closed)

import { redis } from './redis';

let redisFailureCount = 0;
let lastRedisFailure = 0;
const FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_DURATION = 60000; // 1 minute

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
}

/**
 * Check rate limit for a given key.
 * FAIL-CLOSED: if Redis is unavailable, requests are DENIED.
 */
export async function checkRateLimit(
  key: string,
  limit = 10,
  window = 60,
  timeout = 500
): Promise<RateLimitResult> {
  const now = Date.now();

  // Check circuit breaker
  if (
    redisFailureCount >= FAILURE_THRESHOLD &&
    now - lastRedisFailure < CIRCUIT_OPEN_DURATION
  ) {
    console.warn('[rateLimit] Circuit breaker OPEN — denying request');
    return { success: false, limit: 0, remaining: 0 };
  }

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, window, 'NX');

    const results = await Promise.race([
      pipeline.exec<[number, number]>(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis timeout')), timeout)
      ),
    ]);

    const current = results[0];

    if (typeof current !== 'number') {
      throw new Error('Invalid Redis response type');
    }

    const success = current <= limit;
    const remaining = Math.max(0, limit - current);

    // Reset failure count on success
    redisFailureCount = 0;

    if (!success) {
      console.warn(`[rateLimit] Rate limit exceeded: ${key} (${current}/${limit})`);
    }

    return { success, limit, remaining };
  } catch (err) {
    redisFailureCount++;
    lastRedisFailure = now;

    console.error('[rateLimit] Redis error — denying request (fail-closed):', err);
    return { success: false, limit: 0, remaining: 0 };
  }
}
