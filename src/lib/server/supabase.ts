import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import type { Database } from '$lib/types/database';

export type TypedSupabaseClient = SupabaseClient<Database>;

let _supabaseAdmin: TypedSupabaseClient | null = null;

/**
 * Server-side Supabase client with service role key
 * Use for admin operations that bypass RLS
 * Lazy-initialized to avoid build-time errors when env vars aren't set
 */
export const supabaseAdmin: TypedSupabaseClient = new Proxy({} as TypedSupabaseClient, {
  get(_, prop) {
    if (!_supabaseAdmin) {
      if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server operations');
      }
      _supabaseAdmin = createClient<Database>(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
    return (_supabaseAdmin as unknown as Record<string | symbol, unknown>)[prop];
  },
});
