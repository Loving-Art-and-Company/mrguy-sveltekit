import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'google_tokens';

export interface GoogleTokens {
	accessToken: string;
	refreshToken: string;
	expiresAt: number; // Unix timestamp in milliseconds
	userId: string; // Google user ID for tracking
	email: string; // Google email for display
	name?: string; // Google user name
	picture?: string; // Google profile picture URL
}

function createGoogleTokensStore() {
	// Load initial state from localStorage if in browser
	const initialValue = browser ? loadFromStorage() : null;

	const { subscribe, set, update } = writable<GoogleTokens | null>(initialValue);

	return {
		subscribe,

		/**
		 * Set tokens after successful OAuth flow
		 */
		setTokens(tokens: GoogleTokens) {
			set(tokens);
			if (browser) {
				saveToStorage(tokens);
			}
		},

		/**
		 * Update tokens after a refresh (only accessToken and expiresAt change)
		 */
		updateTokens(update: { accessToken: string; expiresAt: number }) {
			const current = get({ subscribe });
			if (current) {
				const updated = {
					...current,
					accessToken: update.accessToken,
					expiresAt: update.expiresAt
				};
				set(updated);
				if (browser) {
					saveToStorage(updated);
				}
			}
		},

		/**
		 * Clear tokens (disconnect Google account)
		 */
		clear() {
			set(null);
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	};
}

function loadFromStorage(): GoogleTokens | null {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch {
		// Invalid JSON in storage, clear it
		localStorage.removeItem(STORAGE_KEY);
	}
	return null;
}

function saveToStorage(tokens: GoogleTokens): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

// Main store
export const googleTokens = createGoogleTokensStore();

// Derived store: is user connected to Google?
export const isGoogleConnected = derived(googleTokens, ($tokens) => $tokens !== null);

// Derived store: Google user info (email, name, picture)
export const googleUser = derived(googleTokens, ($tokens) =>
	$tokens
		? {
				userId: $tokens.userId,
				email: $tokens.email,
				name: $tokens.name,
				picture: $tokens.picture
			}
		: null
);

// Derived store: is token expired or expiring soon (within 5 minutes)?
export const isTokenExpiringSoon = derived(googleTokens, ($tokens) => {
	if (!$tokens) return false;
	const bufferMs = 5 * 60 * 1000; // 5 minutes
	return Date.now() + bufferMs >= $tokens.expiresAt;
});

// Helper functions for external use
export function updateGoogleTokens(update: { accessToken: string; expiresAt: number }) {
	googleTokens.updateTokens(update);
}

export function clearGoogleTokens() {
	googleTokens.clear();
}

export function setGoogleTokens(tokens: GoogleTokens) {
	googleTokens.setTokens(tokens);
}
