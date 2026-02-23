import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getValidToken, type TokenInfo } from '$lib/google/token-refresh';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// Google Sheets MIME type
const SHEETS_MIME_TYPE = 'application/vnd.google-apps.spreadsheet';

export const GET: RequestHandler = async ({ request, url }) => {
	// Extract tokens from headers (secure, not in URL)
	const authHeader = request.headers.get('Authorization');
	const refreshToken = request.headers.get('X-Refresh-Token');

	if (!authHeader?.startsWith('Bearer ') || !refreshToken) {
		throw error(401, 'Missing authentication tokens');
	}

	const driveId = env.GOOGLE_SHARED_DRIVE_ID;
	if (!driveId) {
		console.error('GOOGLE_SHARED_DRIVE_ID is not configured');
		throw error(500, 'Google Drive integration is not configured');
	}

	const accessToken = authHeader.slice(7);
	const pageToken = url.searchParams.get('pageToken');

	try {
		// Search for spreadsheets in the shared drive
		const params = new URLSearchParams({
			q: `mimeType = '${SHEETS_MIME_TYPE}' and trashed = false`,
			fields: 'nextPageToken,files(id,name,webViewLink,createdTime,modifiedTime)',
			pageSize: '50',
			orderBy: 'modifiedTime desc',
			supportsAllDrives: 'true',
			includeItemsFromAllDrives: 'true',
			corpora: 'drive',
			driveId
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
					throw error(retryResponse.status, `Sheets API error: ${errorText}`);
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
			throw error(response.status, `Sheets API error: ${errorText}`);
		}

		const data = await response.json();
		return json(data);
	} catch (e) {
		if (e instanceof Error && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		console.error('Sheets API error:', e);
		throw error(500, 'Failed to fetch spreadsheets from Google Sheets');
	}
};
