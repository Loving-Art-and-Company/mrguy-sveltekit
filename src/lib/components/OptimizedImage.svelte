<script lang="ts">
	export let src: string; // path without extension (e.g., "/images/hero-car-detail")
	export let alt: string;
	export let lazy = true;
	export let priority = false;
	export let className = '';

	// Remove extension if provided
	$: basePath = src.replace(/\.(jpg|jpeg|png|webp)$/, '');
	$: webpSrc = `${basePath}.webp`;
	$: fallbackSrc = `${basePath}.jpg`;
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
