import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleAuthUrl } from '$lib/google/client';

/**
 * Initiates Google OAuth flow
 * Redirects user to Google consent screen
 */
export const GET: RequestHandler = async ({ url }) => {
	// Optional state parameter for CSRF protection
	const returnTo = url.searchParams.get('returnTo') || '/admin';

	// Encode the return URL in state (you could also add a CSRF token here)
	const state = encodeURIComponent(returnTo);

	const authUrl = getGoogleAuthUrl(state);

	throw redirect(302, authUrl);
};
