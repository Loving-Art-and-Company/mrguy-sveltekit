// Sentry temporarily disabled - was causing module init errors
// TODO: Re-enable via Vercel Sentry integration or proper env config
import { afterNavigate } from '$app/navigation';
import { dev } from '$app/environment';
import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_SESSION_RECORDING } from '$env/static/public';
import { initAnalytics, trackPageview } from '$lib/analytics';

initAnalytics({
	key: PUBLIC_POSTHOG_KEY,
	host: PUBLIC_POSTHOG_HOST,
	disable: dev,
	sessionRecording: PUBLIC_POSTHOG_SESSION_RECORDING === 'true',
});

afterNavigate(({ to }) => {
	if (!to?.url) return;
	trackPageview(to.url.href);
});
