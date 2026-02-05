import { refreshAccessToken } from './client';

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

export interface TokenInfo {
	accessToken: string;
	refreshToken: string;
	expiresAt: number; // Unix timestamp in milliseconds
}

export interface RefreshResult {
	accessToken: string;
	expiresAt: number;
	wasRefreshed: boolean;
}

/**
 * Check if the token needs to be refreshed (expires within 5 minutes)
 */
export function tokenNeedsRefresh(expiresAt: number): boolean {
	return Date.now() + TOKEN_EXPIRY_BUFFER_MS >= expiresAt;
}

/**
 * Get a valid access token, refreshing if necessary
 * Returns the access token and whether it was refreshed
 */
export async function getValidToken(tokenInfo: TokenInfo): Promise<RefreshResult> {
	// If token is still valid, return it
	if (!tokenNeedsRefresh(tokenInfo.expiresAt)) {
		return {
			accessToken: tokenInfo.accessToken,
			expiresAt: tokenInfo.expiresAt,
			wasRefreshed: false
		};
	}

	// Token needs refresh
	try {
		const response = await refreshAccessToken(tokenInfo.refreshToken);

		const newExpiresAt = Date.now() + response.expires_in * 1000;

		return {
			accessToken: response.access_token,
			expiresAt: newExpiresAt,
			wasRefreshed: true
		};
	} catch (error) {
		// If refresh fails, the user needs to re-authenticate
		throw new TokenRefreshError(
			'Failed to refresh Google access token. Please reconnect your Google account.',
			error instanceof Error ? error : new Error(String(error))
		);
	}
}

/**
 * Calculate token expiry timestamp from expires_in seconds
 */
export function calculateExpiresAt(expiresInSeconds: number): number {
	return Date.now() + expiresInSeconds * 1000;
}

/**
 * Custom error for token refresh failures
 */
export class TokenRefreshError extends Error {
	public readonly cause: Error;

	constructor(message: string, cause: Error) {
		super(message);
		this.name = 'TokenRefreshError';
		this.cause = cause;
	}
}
