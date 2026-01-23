// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '$env/static/private' {
	export const STRIPE_SECRET_KEY: string;
	export const STRIPE_WEBHOOK_SECRET: string;
	export const SUPABASE_SERVICE_ROLE_KEY: string;
	export const TWILIO_ACCOUNT_SID: string;
	export const TWILIO_AUTH_TOKEN: string;
	export const TWILIO_VERIFY_SERVICE_SID: string;
}

declare module '$env/static/public' {
	export const PUBLIC_BASE_URL: string;
	export const PUBLIC_SUPABASE_URL: string;
	export const PUBLIC_SUPABASE_ANON_KEY: string;
	export const PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
}

export {};
