import postgres from 'postgres';
import { loadLocalEnv } from '../env.mjs';

loadLocalEnv();

export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required.');
  }
  return postgres(connectionString, { ssl: 'require', max: 1 });
}
