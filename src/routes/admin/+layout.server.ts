import { redirect } from '@sveltejs/kit';
import { ensureBusinessSchema } from '$lib/server/businessSchema';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (url.pathname.startsWith('/admin/business')) {
		await ensureBusinessSchema();
	}

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
