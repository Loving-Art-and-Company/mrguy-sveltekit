<script lang="ts">
	import OptimizedImage from './OptimizedImage.svelte';
	import AnimatedSection from './AnimatedSection.svelte';

	export let steps: Array<{
		title: string;
		description: string;
		imageSrc: string;
		imageAlt: string;
	}>;
</script>

<div class="process-timeline">
	{#each steps as step, index}
		<AnimatedSection animation="fade-in-up" threshold={0.15} delay={index * 150}>
			<div class="process-step">
				<div class="step-number">
					<span>{index + 1}</span>
				</div>

				<div class="step-content">
					<div class="step-image">
						<OptimizedImage src={step.imageSrc} alt={step.imageAlt} />
					</div>

					<div class="step-text">
						<h3>{step.title}</h3>
						<p>{step.description}</p>
					</div>
				</div>
			</div>
		</AnimatedSection>
	{/each}
</div>

<style>
	.process-timeline {
		display: flex;
		flex-direction: column;
		gap: 4rem;
		position: relative;
		max-width: 900px;
		margin: 0 auto;
	}

	/* Vertical connecting line */
	.process-timeline::before {
		content: '';
		position: absolute;
		left: 2rem;
		top: 4rem;
		bottom: 4rem;
		width: 2px;
		background: linear-gradient(
			to bottom,
			var(--color-accent-blue) 0%,
			var(--color-sky-blue) 100%
		);
	}

	.process-step {
		display: flex;
		gap: 2rem;
		position: relative;
	}

	.step-number {
		flex-shrink: 0;
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		background: var(--color-sky-blue);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		box-shadow:
			0 4px 12px rgba(14, 165, 233, 0.3),
			0 0 0 4px rgba(14, 165, 233, 0.1);
		z-index: 1;
		position: relative;
	}

	.step-content {
		flex: 1;
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2rem;
		align-items: center;
	}

	.step-image {
		border-radius: 1rem;
		overflow: hidden;
		box-shadow:
			0 10px 30px rgba(0, 0, 0, 0.1),
			0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.step-image :global(img) {
		aspect-ratio: 4/3;
		object-fit: cover;
	}

	.step-text h3 {
		font-size: clamp(1.5rem, 2vw, 1.75rem);
		font-weight: 700;
		color: var(--color-deep-blue);
		margin: 0 0 0.75rem 0;
	}

	.step-text p {
		font-size: 1.125rem;
		line-height: 1.7;
		color: var(--color-text-secondary, #475569);
		margin: 0;
	}

	/* Tablet and below */
	@media (max-width: 1024px) {
		.process-timeline::before {
			left: 1.5rem;
		}

		.step-number {
			width: 3rem;
			height: 3rem;
			font-size: 1.25rem;
		}

		.step-content {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.step-image {
			max-width: 400px;
		}
	}

	/* Mobile */
	@media (max-width: 640px) {
		.process-timeline {
			gap: 3rem;
			padding-left: 0;
		}

		.process-timeline::before {
			left: 1.25rem;
			top: 3rem;
			bottom: 3rem;
		}

		.process-step {
			gap: 1.5rem;
		}

		.step-number {
			width: 2.5rem;
			height: 2.5rem;
			font-size: 1.125rem;
		}

		.step-content {
			gap: 1rem;
		}

		.step-text h3 {
			font-size: 1.25rem;
		}

		.step-text p {
			font-size: 1rem;
		}
	}
</style>
