import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { getGoogleAuthUrl } from '$lib/google/client';

/**
 * Initiates Google OAuth flow
 * Redirects user to Google consent screen
 */
export const GET: RequestHandler = async ({ url }) => {
	if (!env.GOOGLE_CLIENT_ID) {
		throw error(503, 'Google integration is not configured yet. Please contact the administrator.');
	}

	const returnTo = url.searchParams.get('returnTo') || '/admin';
	const state = encodeURIComponent(returnTo);
	const authUrl = getGoogleAuthUrl(state);

	throw redirect(302, authUrl);
};
