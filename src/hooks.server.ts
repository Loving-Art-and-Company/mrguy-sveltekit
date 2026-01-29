import * as Sentry from '@sentry/sveltekit';
import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SENTRY_DSN } from '$env/static/public';
import type { Database } from '$lib/types/database';

if (PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: PUBLIC_SENTRY_DSN,
		tracesSampleRate: 1.0
	});
}

const customHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				},
			},
		}
	);

	event.locals.safeGetSession = async () => {
		const {
			data: { session },
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error,
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	// Protect admin routes
	if (event.url.pathname.startsWith('/admin')) {
		const { session } = await event.locals.safeGetSession();

		// Allow access to login page without auth
		if (event.url.pathname === '/admin/login') {
			// If already logged in, redirect to dashboard
			if (session) {
				throw redirect(303, '/admin');
			}
			return resolve(event);
		}

		// All other admin routes require auth
		if (!session) {
			throw redirect(303, '/admin/login');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		},
	});
};

export const handle = PUBLIC_SENTRY_DSN
	? sequence(Sentry.sentryHandle(), customHandle)
	: customHandle;

export const handleError = Sentry.handleErrorWithSentry();
