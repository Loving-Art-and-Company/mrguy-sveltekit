// src/lib/server/rateLimit.ts
// Upstash Redis rate limiting — fail-open (allow on Redis errors)

import { redis } from './redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
}

/**
 * Check rate limit for a given key.
 * FAIL-OPEN: if Redis is unavailable, requests are ALLOWED.
 * For a low-traffic booking form, blocking real customers is worse than
 * missing rate limiting during a Redis outage.
 */
export async function checkRateLimit(
  key: string,
  limit = 10,
  window = 60,
  timeout = 1500
): Promise<RateLimitResult> {
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

    if (!success) {
      console.warn(`[rateLimit] Rate limit exceeded: ${key} (${current}/${limit})`);
    }

    return { success, limit, remaining };
  } catch (err) {
    console.warn('[rateLimit] Redis error — allowing request (fail-open):', err);
    return { success: true, limit, remaining: limit };
  }
}
