// src/lib/server/redis.ts
// Upstash Redis lazy singleton for rate limiting

import { Redis } from '@upstash/redis';
import { env as privateEnv } from '$env/dynamic/private';

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    const url = privateEnv.UPSTASH_REDIS_REST_URL;
    const token = privateEnv.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
    }

    _redis = new Redis({ url, token });
  }
  return _redis;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop, receiver) {
    return Reflect.get(getRedis(), prop, receiver);
  },
});
