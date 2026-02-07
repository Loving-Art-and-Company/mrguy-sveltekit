<script lang="ts">
	import OptimizedImage from './OptimizedImage.svelte';

	export let beforeSrc: string;
	export let afterSrc: string;
	export let beforeAlt = 'Before detailing';
	export let afterAlt = 'After detailing';

	let sliderPosition = 50; // percentage
	let isDragging = false;
	let containerElement: HTMLElement;

	function handleMove(clientX: number) {
		if (!containerElement) return;

		const rect = containerElement.getBoundingClientRect();
		const x = clientX - rect.left;
		const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
		sliderPosition = percentage;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		handleMove(e.clientX);
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging || !e.touches[0]) return;
		e.preventDefault();
		handleMove(e.touches[0].clientX);
	}

	function startDrag() {
		isDragging = true;
	}

	function stopDrag() {
		isDragging = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			sliderPosition = Math.max(0, sliderPosition - 2);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			sliderPosition = Math.min(100, sliderPosition + 2);
		}
	}
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={stopDrag} on:touchend={stopDrag} />

<div
	class="before-after-slider"
	bind:this={containerElement}
	on:touchmove={handleTouchMove}
	role="region"
	aria-label="Before and after comparison slider"
>
	<div class="before-after-slider__image-container">
		<!-- Before Image (full width) -->
		<div class="before-after-slider__image before-image">
			<OptimizedImage src={beforeSrc} alt={beforeAlt} priority={true} />
		</div>

		<!-- After Image (clipped by slider position) -->
		<div
			class="before-after-slider__image after-image"
			style="clip-path: inset(0 0 0 {sliderPosition}%)"
		>
			<OptimizedImage src={afterSrc} alt={afterAlt} priority={true} />
		</div>
	</div>

	<!-- Slider Handle -->
	<div
		class="before-after-slider__handle"
		style="left: {sliderPosition}%"
		on:mousedown={startDrag}
		on:touchstart={startDrag}
		on:keydown={handleKeydown}
		role="slider"
		aria-valuenow={Math.round(sliderPosition)}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-label="Comparison slider handle"
		tabindex="0"
	>
		<div class="handle-circle">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
				<path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
				<path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
		</div>
	</div>

	<!-- Labels -->
	<div class="before-after-slider__label before-label">Before</div>
	<div class="before-after-slider__label after-label">After</div>
</div>

<style>
	.before-after-slider {
		position: relative;
		overflow: hidden;
		user-select: none;
		touch-action: pan-y;
		aspect-ratio: 16/9;
		border-radius: 1.5rem;
		background: var(--color-deep-blue);
	}

	.before-after-slider__image-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.before-after-slider__image {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.before-after-slider__image :global(img),
	.before-after-slider__image :global(picture) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.after-image {
		z-index: 1;
	}

	.before-after-slider__handle {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 4px;
		background: white;
		cursor: ew-resize;
		transform: translateX(-50%);
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
		z-index: 2;
		transition: opacity 0.2s;
	}

	.before-after-slider__handle:hover,
	.before-after-slider__handle:focus {
		opacity: 1;
	}

	.before-after-slider__handle:focus {
		outline: 2px solid var(--color-accent-blue);
		outline-offset: 2px;
	}

	.handle-circle {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 48px;
		height: 48px;
		background: white;
		border-radius: 50%;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		color: var(--color-deep-blue);
	}

	.handle-circle svg {
		width: 16px;
		height: 16px;
	}

	.before-after-slider__label {
		position: absolute;
		top: 1.5rem;
		padding: 0.5rem 1rem;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-radius: 0.5rem;
		z-index: 3;
		backdrop-filter: blur(8px);
	}

	.before-label {
		left: 1.5rem;
	}

	.after-label {
		right: 1.5rem;
	}

	@media (max-width: 640px) {
		.before-after-slider {
			aspect-ratio: 4/3;
		}

		.before-after-slider__label {
			top: 1rem;
			padding: 0.375rem 0.75rem;
			font-size: 0.75rem;
		}

		.before-label {
			left: 1rem;
		}

		.after-label {
			right: 1rem;
		}

		.handle-circle {
			width: 40px;
			height: 40px;
		}
	}
</style>
