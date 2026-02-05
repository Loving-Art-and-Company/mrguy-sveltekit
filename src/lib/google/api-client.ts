import { googleTokens, updateGoogleTokens, clearGoogleTokens } from '$lib/stores/google';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';

export interface GoogleFetchOptions extends Omit<RequestInit, 'headers'> {
	headers?: Record<string, string>;
}

export interface GoogleApiError {
	error: string;
	details?: unknown;
}

/**
 * Centralized fetch wrapper for Google API calls
 * - Automatically includes Authorization header with access token
 * - Includes X-Refresh-Token header for server-side token refresh
 * - Handles token refresh responses from server
 * - Handles errors consistently
 */
export async function googleFetch<T = unknown>(
	url: string,
	options: GoogleFetchOptions = {}
): Promise<T> {
	const tokens = get(googleTokens);

	if (!tokens) {
		// No tokens stored, redirect to connect Google account
		await goto('/admin/settings?connect=google');
		throw new GoogleAuthError('Not authenticated with Google');
	}

	const headers: Record<string, string> = {
		...options.headers,
		Authorization: `Bearer ${tokens.accessToken}`,
		'X-Refresh-Token': tokens.refreshToken
	};

	const response = await fetch(url, {
		...options,
		headers
	});

	// Check for refreshed token in response headers
	const newAccessToken = response.headers.get('X-New-Access-Token');
	const newExpiresAt = response.headers.get('X-Token-Expires-At');

	if (newAccessToken && newExpiresAt) {
		// Server refreshed the token, update our store
		updateGoogleTokens({
			accessToken: newAccessToken,
			expiresAt: parseInt(newExpiresAt, 10)
		});
	}

	// Handle auth errors
	if (response.status === 401) {
		// Token invalid and couldn't be refreshed
		clearGoogleTokens();
		await goto('/admin/settings?connect=google&reason=expired');
		throw new GoogleAuthError('Google authentication expired. Please reconnect.');
	}

	if (!response.ok) {
		let errorData: GoogleApiError;
		try {
			errorData = await response.json();
		} catch {
			errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
		}
		throw new GoogleApiRequestError(errorData.error, response.status, errorData.details);
	}

	return response.json();
}

/**
 * Fetch files from Google Drive
 */
export async function fetchDriveFiles(
	folderId?: string,
	pageToken?: string
): Promise<DriveFilesResponse> {
	const params = new URLSearchParams();
	if (folderId) params.set('folderId', folderId);
	if (pageToken) params.set('pageToken', pageToken);

	const url = `/api/google/drive${params.toString() ? `?${params}` : ''}`;
	return googleFetch<DriveFilesResponse>(url);
}

/**
 * Fetch spreadsheets from Google Sheets
 */
export async function fetchSheets(pageToken?: string): Promise<SheetsListResponse> {
	const params = new URLSearchParams();
	if (pageToken) params.set('pageToken', pageToken);

	const url = `/api/google/sheets${params.toString() ? `?${params}` : ''}`;
	return googleFetch<SheetsListResponse>(url);
}

/**
 * Fetch documents from Google Docs
 */
export async function fetchDocs(pageToken?: string): Promise<DocsListResponse> {
	const params = new URLSearchParams();
	if (pageToken) params.set('pageToken', pageToken);

	const url = `/api/google/docs${params.toString() ? `?${params}` : ''}`;
	return googleFetch<DocsListResponse>(url);
}

// Error classes
export class GoogleAuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'GoogleAuthError';
	}
}

export class GoogleApiRequestError extends Error {
	public readonly statusCode: number;
	public readonly details?: unknown;

	constructor(message: string, statusCode: number, details?: unknown) {
		super(message);
		this.name = 'GoogleApiRequestError';
		this.statusCode = statusCode;
		this.details = details;
	}
}

// Response types
export interface DriveFile {
	id: string;
	name: string;
	mimeType: string;
	webViewLink?: string;
	iconLink?: string;
	thumbnailLink?: string;
	createdTime?: string;
	modifiedTime?: string;
	size?: string;
	parents?: string[];
}

export interface DriveFilesResponse {
	files: DriveFile[];
	nextPageToken?: string;
}

export interface Sheet {
	id: string;
	name: string;
	webViewLink?: string;
	createdTime?: string;
	modifiedTime?: string;
}

export interface SheetsListResponse {
	files: Sheet[];
	nextPageToken?: string;
}

export interface Doc {
	id: string;
	name: string;
	webViewLink?: string;
	createdTime?: string;
	modifiedTime?: string;
}

export interface DocsListResponse {
	files: Doc[];
	nextPageToken?: string;
}
