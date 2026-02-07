<script lang="ts">
	import { scrollReveal } from '$lib/actions/scrollReveal';
	import type { Snippet } from 'svelte';

	let {
		animation = 'fade-in-up',
		threshold = 0.2,
		delay = 0,
		children
	}: {
		animation?: 'fade-in' | 'fade-in-up' | 'slide-in-left';
		threshold?: number;
		delay?: number;
		children: Snippet;
	} = $props();
</script>

<div use:scrollReveal={{ animation, threshold, delay }}>
	{@render children()}
</div>
