<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { setGoogleTokens } from '$lib/stores/google';

	export let data;

	onMount(() => {
		if (data.tokens) {
			// Store tokens in the client-side store (persisted to localStorage)
			setGoogleTokens(data.tokens);

			// Redirect to the return URL
			goto(data.returnTo || '/admin', { replaceState: true });
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="text-center">
		<div class="mb-4">
			<svg
				class="mx-auto h-12 w-12 animate-spin text-blue-600"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
		<h1 class="text-xl font-semibold text-gray-900">Completing Google sign-in...</h1>
		<p class="mt-2 text-sm text-gray-500">You'll be redirected automatically.</p>
	</div>
</div>
