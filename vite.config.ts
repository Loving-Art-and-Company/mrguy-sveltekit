import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
	plugins: [
		...(sentryAuthToken ? [sentrySvelteKit()] : []),
		sveltekit(),
		svelteTesting()
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts']
	}
});
