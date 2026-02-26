// Sentry temporarily disabled - was causing module init errors
// TODO: Re-enable via Vercel Sentry integration or proper env config
import { dev } from '$app/environment';
import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_SESSION_RECORDING } from '$env/static/public';
import { initAnalytics } from '$lib/analytics';

// NOTE: afterNavigate was previously called here but it requires
// Svelte component context (uses onMount internally). Moved to +layout.svelte.
initAnalytics({
	key: PUBLIC_POSTHOG_KEY,
	host: PUBLIC_POSTHOG_HOST,
	disable: dev,
	sessionRecording: PUBLIC_POSTHOG_SESSION_RECORDING === 'true',
});

// Reload the page when a stale deployment causes a dynamic import to fail.
// This happens when users have the old page open after a new deploy: the browser
// tries to fetch a JS chunk by its old hash, which no longer exists on the server.
export const handleError = ({ error }: { error: unknown }) => {
		if (error instanceof TypeError && error.message.includes('Failed to fetch dynamically imported module')) {
					window.location.reload();
		}
};
