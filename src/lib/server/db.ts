// src/lib/server/db.ts
// Neon serverless Postgres connection via Drizzle ORM
// Lazy Proxy singleton — initialized on first property access

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env as privateEnv } from '$env/dynamic/private';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function readPoolMax() {
  const rawValue = privateEnv.DB_POOL_MAX ?? '8';
  const poolMax = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 20) {
    throw new Error('DB_POOL_MAX must be an integer between 1 and 20');
  }

  return poolMax;
}

function getDb() {
  if (!_db) {
    const connectionString = privateEnv.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const client = postgres(connectionString, {
      max: readPoolMax(),
      idle_timeout: 20,
      ssl: 'require',
    });

    _db = drizzle(client, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type Database = ReturnType<typeof drizzle<typeof schema>>;
