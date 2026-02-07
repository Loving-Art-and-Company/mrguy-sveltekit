import { env } from '$env/dynamic/private';

function getEnv(key: string): string {
	const value = env[key];
	if (!value) throw new Error(`Missing required env var: ${key}`);
	return value;
}

/**
 * Google OAuth scopes - minimal set for Drive, Sheets, and Docs access
 * Removed Calendar and Chat scopes per plan requirements
 */
export const GOOGLE_SCOPES = [
	'openid',
	'email',
	'profile',
	'https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/spreadsheets',
	'https://www.googleapis.com/auth/documents'
].join(' ');

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state?: string): string {
	const params = new URLSearchParams({
		client_id: getEnv('GOOGLE_CLIENT_ID'),
		redirect_uri: getEnv('GOOGLE_REDIRECT_URI'),
		response_type: 'code',
		scope: GOOGLE_SCOPES,
		access_type: 'offline', // Required to get refresh token
		prompt: 'consent', // Force consent screen to ensure we get refresh token
		...(state && { state })
	});

	return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: getEnv('GOOGLE_CLIENT_ID'),
			client_secret: getEnv('GOOGLE_CLIENT_SECRET'),
			redirect_uri: getEnv('GOOGLE_REDIRECT_URI'),
			grant_type: 'authorization_code',
			code
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to exchange code for tokens: ${error}`);
	}

	return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: getEnv('GOOGLE_CLIENT_ID'),
			client_secret: getEnv('GOOGLE_CLIENT_SECRET'),
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to refresh access token: ${error}`);
	}

	return response.json();
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
	const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		throw new Error('Failed to get user info from Google');
	}

	return response.json();
}

// Types
export interface GoogleTokenResponse {
	access_token: string;
	expires_in: number;
	refresh_token?: string; // Only returned on initial auth, not on refresh
	scope: string;
	token_type: string;
	id_token?: string;
}

export interface GoogleUserInfo {
	id: string;
	email: string;
	verified_email: boolean;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
}
