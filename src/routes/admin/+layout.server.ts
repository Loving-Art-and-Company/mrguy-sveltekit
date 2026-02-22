import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Don't guard the login page
	if (url.pathname === '/admin/login') {
		return { user: locals.user };
	}

	// Redirect to login if not authenticated
	if (!locals.user) {
		redirect(303, '/admin/login');
	}

	return { user: locals.user };
};
