import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { session, user } = await locals.safeGetSession();

	// Don't guard the login page
	if (url.pathname === '/admin/login') {
		return { session, user };
	}

	// Redirect to login if not authenticated
	if (!session) {
		redirect(303, '/admin/login');
	}

	return { session, user };
};
