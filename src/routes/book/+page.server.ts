import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Redirect old /book URLs to homepage services section
export const load: PageServerLoad = async () => {
  throw redirect(302, '/#services');
};
