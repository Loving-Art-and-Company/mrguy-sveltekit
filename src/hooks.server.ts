// Sentry removed from server hooks - causes module init errors in Vercel
// If needed, configure Sentry via vercel.json or Sentry Vercel integration
import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from '$lib/types/database';
import { supabaseAdmin } from '$lib/server/supabase';

/** Verify request origin for state-changing API requests (CSRF protection) */
function isValidOrigin(request: Request, url: URL): boolean {
	if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
	const origin = request.headers.get('origin');
	// Allow if no origin header (same-origin requests from some clients)
	if (!origin) return true;
	try {
		return new URL(origin).origin === url.origin;
	} catch {
		return false;
	}
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

	// CSRF: reject cross-origin state-changing requests to /api/* endpoints
	// (SvelteKit's built-in checkOrigin only covers form actions, not +server.ts)
	if (event.url.pathname.startsWith('/api/') && !isValidOrigin(event.request, event.url)) {
		// Allow Stripe webhooks (verified by signature, not origin)
		if (!event.url.pathname.includes('/webhook')) {
			return new Response(JSON.stringify({ error: 'Forbidden' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

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

		// Verify user is in admin_users table (not just any authenticated user)
		const { data: adminUser } = await supabaseAdmin
			.from('admin_users')
			.select('id')
			.eq('user_id', session.user.id)
			.single();

		if (!adminUser) {
			// Authenticated but not an admin — sign out and redirect
			await event.locals.supabase.auth.signOut();
			throw redirect(303, '/admin/login');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		},
	});
};

export const handle = customHandle;
