// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				email: string;
				isActive: boolean;
			} | null;
			nonce: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '$env/static/private' {
	export const STRIPE_SECRET_KEY: string;
	export const STRIPE_WEBHOOK_SECRET: string;
	export const DATABASE_URL: string;
	export const CSRF_SECRET: string;
	export const UPSTASH_REDIS_REST_URL: string;
	export const UPSTASH_REDIS_REST_TOKEN: string;
	export const RESEND_API_KEY: string;
	export const TWILIO_ACCOUNT_SID: string;
	export const TWILIO_AUTH_TOKEN: string;
	export const TWILIO_VERIFY_SERVICE_SID: string;
}

declare module '$env/static/public' {
	export const PUBLIC_BASE_URL: string;
	export const PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
}

export {};
