<script lang="ts">
	import { scrollReveal } from '$lib/actions/scrollReveal';

	export let animation: 'fade-in' | 'fade-in-up' | 'slide-in-left' = 'fade-in-up';
	export let threshold = 0.2;
	export let delay = 0;
</script>

<div use:scrollReveal={{ animation, threshold, delay }}>
	<slot />
</div>
