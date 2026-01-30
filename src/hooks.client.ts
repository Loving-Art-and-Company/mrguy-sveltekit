import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';

// Optional Sentry integration - only if DSN is configured
if (env.PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: env.PUBLIC_SENTRY_DSN,
		tracesSampleRate: 1.0,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		integrations: [Sentry.replayIntegration()]
	});
}

export const handleError = Sentry.handleErrorWithSentry();
