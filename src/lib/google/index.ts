// Google OAuth client
export {
	getGoogleAuthUrl,
	exchangeCodeForTokens,
	refreshAccessToken,
	getGoogleUserInfo,
	GOOGLE_SCOPES,
	type GoogleTokenResponse,
	type GoogleUserInfo
} from './client';

// Token refresh utilities
export {
	getValidToken,
	tokenNeedsRefresh,
	calculateExpiresAt,
	TokenRefreshError,
	type TokenInfo,
	type RefreshResult
} from './token-refresh';

// API client for frontend
export {
	googleFetch,
	fetchDriveFiles,
	fetchSheets,
	fetchDocs,
	GoogleAuthError,
	GoogleApiRequestError,
	type GoogleFetchOptions,
	type GoogleApiError,
	type DriveFile,
	type DriveFilesResponse,
	type Sheet,
	type SheetsListResponse,
	type Doc,
	type DocsListResponse
} from './api-client';
