import { fail, redirect } from '@sveltejs/kit';
import { authenticate, createSession, getClientIp, SESSION_COOKIE } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Already logged in? Redirect to admin dashboard
	if (locals.user) {
		redirect(303, '/admin');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const ip = getClientIp(request);
		const result = await authenticate(email, password, ip);

		if (!result.user) {
			return fail(401, { error: result.error || 'Invalid login credentials' });
		}

		// Create session
		const session = await createSession(
			result.user.id,
			ip,
			request.headers.get('user-agent') || undefined
		);

		if (!session) {
			return fail(500, { error: 'Failed to create session' });
		}

		// Set session cookie
		cookies.set(SESSION_COOKIE, session.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			expires: session.expiresAt,
		});

		redirect(303, '/admin');
	},
};
