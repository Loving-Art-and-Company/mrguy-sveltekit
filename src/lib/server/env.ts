// src/lib/server/env.ts
// Zod-validated environment variables with lazy singleton

import { z } from 'zod';
import { env as privateEnv } from '$env/dynamic/private';

function sanitizeEnvValue(val: string | undefined): string | undefined {
  if (!val) return val;
  return val.replace(/[\r\n\t]/g, '').trim();
}

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .transform(sanitizeEnvValue)
    .pipe(z.string().startsWith('postgresql://', 'Must be a PostgreSQL connection string')),

  CSRF_SECRET: z
    .string()
    .min(32, 'CSRF_SECRET must be at least 32 characters')
    .transform(sanitizeEnvValue)
    .pipe(z.string().min(32)),

  UPSTASH_REDIS_REST_URL: z
    .string()
    .min(1, 'UPSTASH_REDIS_REST_URL is required')
    .transform(sanitizeEnvValue)
    .pipe(z.string().url()),

  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, 'UPSTASH_REDIS_REST_TOKEN is required')
    .transform(sanitizeEnvValue)
    .pipe(z.string().min(1)),

  RESEND_API_KEY: z
    .string()
    .min(1, 'RESEND_API_KEY is required')
    .transform(sanitizeEnvValue)
    .pipe(z.string().startsWith('re_', 'Must start with re_')),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(privateEnv);
    if (!result.success) {
      const formatted = result.error.issues
        .map((i) => `  ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${formatted}`);
    }
    _env = result.data;
  }
  return _env;
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
