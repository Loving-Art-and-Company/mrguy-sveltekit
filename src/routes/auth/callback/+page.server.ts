import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { exchangeCodeForTokens, getGoogleUserInfo } from '$lib/google/client';
import { calculateExpiresAt } from '$lib/google/token-refresh';
import { storeGoogleTokens } from '$lib/server/calendar';

export const load: PageServerLoad = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	// Handle OAuth errors
	if (errorParam) {
		const errorDescription = url.searchParams.get('error_description') || 'Unknown error';
		throw error(400, `Google OAuth error: ${errorDescription}`);
	}

	// Validate code is present
	if (!code) {
		throw error(400, 'Missing authorization code from Google');
	}

	try {
		// Exchange code for tokens
		const tokenResponse = await exchangeCodeForTokens(code);

		// Get user info
		const userInfo = await getGoogleUserInfo(tokenResponse.access_token);

		// Calculate expiry timestamp
		const expiresAt = calculateExpiresAt(tokenResponse.expires_in);

		// Store refresh token server-side for Calendar sync
		if (tokenResponse.refresh_token && locals.user) {
			await storeGoogleTokens(
				locals.user.id,
				tokenResponse.refresh_token,
				tokenResponse.access_token,
				tokenResponse.expires_in,
				userInfo.email
			).catch((err) => console.error('[oauth] Failed to store tokens server-side:', err));
		}

		// Decode return URL from state
		const returnTo = state ? decodeURIComponent(state) : '/admin';

		// Return token data to client to store
		// The client-side page will store these in the google store
		return {
			tokens: {
				accessToken: tokenResponse.access_token,
				refreshToken: tokenResponse.refresh_token || '',
				expiresAt,
				userId: userInfo.id,
				email: userInfo.email,
				name: userInfo.name,
				picture: userInfo.picture
			},
			returnTo
		};
	} catch (e) {
		console.error('OAuth callback error:', e);
		throw error(500, 'Failed to complete Google authentication');
	}
};
