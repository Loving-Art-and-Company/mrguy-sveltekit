import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();

	if (session) {
		redirect(303, '/admin');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return fail(401, { error: 'Invalid login credentials' });
		}

		redirect(303, '/admin');
	},
};
