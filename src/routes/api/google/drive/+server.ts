import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getValidToken, type TokenInfo } from '$lib/google/token-refresh';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export const GET: RequestHandler = async ({ request, url }) => {
	// Extract tokens from headers (secure, not in URL)
	const authHeader = request.headers.get('Authorization');
	const refreshToken = request.headers.get('X-Refresh-Token');

	if (!authHeader?.startsWith('Bearer ') || !refreshToken) {
		throw error(401, 'Missing authentication tokens');
	}

	const accessToken = authHeader.slice(7);

	// Get query params
	const folderId = url.searchParams.get('folderId') || env.GOOGLE_SHARED_DRIVE_ID || '';
	const pageToken = url.searchParams.get('pageToken');

	// For now, we can't refresh tokens server-side without expiresAt
	// The client should handle token refresh or include expiry info
	// We'll attempt the request and handle 401 responses

	try {
		const params = new URLSearchParams({
			q: `'${folderId}' in parents and trashed = false`,
			fields: 'nextPageToken,files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,createdTime,modifiedTime,size,parents)',
			pageSize: '50',
			orderBy: 'modifiedTime desc',
			supportsAllDrives: 'true',
			includeItemsFromAllDrives: 'true'
		});

		if (pageToken) {
			params.set('pageToken', pageToken);
		}

		const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		if (response.status === 401) {
			// Token expired, try to refresh
			const tokenInfo: TokenInfo = {
				accessToken,
				refreshToken,
				expiresAt: 0 // Force refresh
			};

			try {
				const result = await getValidToken(tokenInfo);

				// Retry with new token
				const retryResponse = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
					headers: {
						Authorization: `Bearer ${result.accessToken}`
					}
				});

				if (!retryResponse.ok) {
					const errorText = await retryResponse.text();
					throw error(retryResponse.status, `Drive API error: ${errorText}`);
				}

				const data = await retryResponse.json();

				// Return data with new token in headers
				return json(data, {
					headers: {
						'X-New-Access-Token': result.accessToken,
						'X-Token-Expires-At': result.expiresAt.toString()
					}
				});
			} catch (refreshError) {
				throw error(401, 'Token expired and refresh failed. Please reconnect your Google account.');
			}
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw error(response.status, `Drive API error: ${errorText}`);
		}

		const data = await response.json();
		return json(data);
	} catch (e) {
		if (e instanceof Error && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		console.error('Drive API error:', e);
		throw error(500, 'Failed to fetch files from Google Drive');
	}
};
