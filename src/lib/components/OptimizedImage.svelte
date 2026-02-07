<script lang="ts">
	let { src, alt, priority = false, className = '' }: {
		src: string;
		alt: string;
		priority?: boolean;
		className?: string;
	} = $props();

	// Remove extension if provided
	let basePath = $derived(src.replace(/\.(jpg|jpeg|png|webp)$/, ''));
	let webpSrc = $derived(`${basePath}.webp`);
	let fallbackSrc = $derived(`${basePath}.jpg`);
</script>

<picture>
	<source srcset={webpSrc} type="image/webp" />
	<source srcset={fallbackSrc} type="image/jpeg" />
	<img
		src={fallbackSrc}
		{alt}
		loading={priority ? 'eager' : 'lazy'}
		decoding={priority ? 'sync' : 'async'}
		class="optimized-image {className}"
	/>
</picture>

<style>
	.optimized-image {
		width: 100%;
		height: auto;
		display: block;
	}
</style>
