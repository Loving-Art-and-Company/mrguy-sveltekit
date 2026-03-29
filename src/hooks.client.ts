import { dev } from '$app/environment';
import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';
import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_SESSION_RECORDING } from '$env/static/public';
import { initAnalytics } from '$lib/analytics';

// Sentry initialization
if (env.PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: env.PUBLIC_SENTRY_DSN,
		tracesSampleRate: 1.0,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		integrations: [Sentry.replayIntegration()],
	});
}

// NOTE: afterNavigate was previously called here but it requires
// Svelte component context (uses onMount internally). Moved to +layout.svelte.
initAnalytics({
	key: PUBLIC_POSTHOG_KEY,
	host: PUBLIC_POSTHOG_HOST,
	disable: dev,
	sessionRecording: PUBLIC_POSTHOG_SESSION_RECORDING === 'true',
});

const STALE_IMPORT_RELOAD_KEY = 'mrguy:stale-import-reload';
const STALE_IMPORT_RELOAD_COOLDOWN_MS = 30_000;

// Reload the page when a stale deployment causes a dynamic import to fail.
// This happens when users have the old page open after a new deploy: the browser
// tries to fetch a JS chunk by its old hash, which no longer exists on the server.
const customHandleError = ({ error }: { error: unknown }) => {
	if (error instanceof TypeError && error.message.includes('Failed to fetch dynamically imported module')) {
		const lastReloadAt = Number(sessionStorage.getItem(STALE_IMPORT_RELOAD_KEY) ?? '0');
		if (Date.now() - lastReloadAt < STALE_IMPORT_RELOAD_COOLDOWN_MS) {
			console.error('[app] Dynamic import failed after one reload; leaving page as-is to avoid a loop.');
			return;
		}

		sessionStorage.setItem(STALE_IMPORT_RELOAD_KEY, String(Date.now()));
		window.location.reload();
	}
};

// Combine Sentry error handler with custom handler
export const handleError = ({ error }: { error: unknown }) => {
	// Call custom handler first
	customHandleError({ error });
	
	// Sentry will also capture this error via its own handler
	return Sentry.handleErrorWithSentry()({ error });
};
