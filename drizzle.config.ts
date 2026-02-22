import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/server/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // drizzle-kit runs as Node CLI, not through SvelteKit — process.env is correct here
    url: process.env.DATABASE_URL!,
  },
});
