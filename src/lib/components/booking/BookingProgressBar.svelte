<script lang="ts">
	interface Step {
		number: number;
		label: string;
		shortLabel: string;
	}

	interface Props {
		currentStep: number;
		totalSteps?: number;
	}

	let { currentStep, totalSteps = 3 }: Props = $props();

	const steps: Step[] = [
		{ number: 1, label: 'Service & Location', shortLabel: 'Service' },
		{ number: 2, label: 'Vehicle & Schedule', shortLabel: 'Details' },
		{ number: 3, label: 'Contact & Review', shortLabel: 'Review' }
	];

	// Calculate progress percentage
	const progressPercent = $derived((currentStep / totalSteps) * 100);
</script>

<div class="progress-bar">
	<div class="progress-header">
		<h2 class="step-title">
			Step {currentStep} of {totalSteps}
		</h2>
		<div class="step-label">
			{steps[currentStep - 1]?.label}
		</div>
	</div>

	<div class="progress-track">
		<div class="progress-fill" style="width: {progressPercent}%"></div>
	</div>

	<div class="steps-indicator">
		{#each steps as step}
			<div
				class="step-dot"
				class:completed={currentStep > step.number}
				class:active={currentStep === step.number}
				aria-label={`Step ${step.number}: ${step.label}`}
			>
				{#if currentStep > step.number}
					<span class="checkmark">✓</span>
				{:else}
					<span class="number">{step.number}</span>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Mobile-friendly step labels -->
	<div class="steps-labels">
		{#each steps as step}
			<div
				class="step-label-item"
				class:completed={currentStep > step.number}
				class:active={currentStep === step.number}
			>
				<span class="desktop-label">{step.label}</span>
				<span class="mobile-label">{step.shortLabel}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.progress-bar {
		position: sticky;
		top: 0;
		z-index: 10;
		background: white;
		padding: 1.5rem;
		border-bottom: 2px solid var(--border-light);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.progress-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
		text-align: center;
	}

	.step-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.step-label {
		font-size: 1rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.progress-track {
		position: relative;
		width: 100%;
		height: 8px;
		background: var(--bg-secondary);
		border-radius: 999px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
		border-radius: 999px;
		transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}

	.progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 50px;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.steps-indicator {
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: relative;
		margin-bottom: 0.75rem;
	}

	.step-dot {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--bg-secondary);
		border: 3px solid var(--border-light);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.125rem;
		transition: all 0.3s;
		position: relative;
		z-index: 1;
	}

	.step-dot.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
		box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
		transform: scale(1.1);
	}

	.step-dot.completed {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	.checkmark {
		font-size: 1.25rem;
	}

	.number {
		font-size: 1.125rem;
		color: var(--text-secondary);
	}

	.step-dot.active .number,
	.step-dot.completed .number {
		color: white;
	}

	.steps-labels {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.step-label-item {
		flex: 1;
		text-align: center;
		font-size: 0.875rem;
		color: var(--text-muted);
		font-weight: 500;
		transition: all 0.3s;
	}

	.step-label-item.active {
		color: var(--color-primary);
		font-weight: 700;
	}

	.step-label-item.completed {
		color: var(--text-secondary);
		font-weight: 600;
	}

	.mobile-label {
		display: none;
	}

	.desktop-label {
		display: inline;
	}

	/* Mobile optimization */
	@media (max-width: 640px) {
		.progress-bar {
			padding: 1rem;
		}

		.step-title {
			font-size: 1.25rem;
		}

		.step-label {
			font-size: 0.875rem;
		}

		.step-dot {
			width: 40px;
			height: 40px;
			font-size: 1rem;
		}

		.checkmark {
			font-size: 1rem;
		}

		.step-label-item {
			font-size: 0.75rem;
		}

		.mobile-label {
			display: inline;
		}

		.desktop-label {
			display: none;
		}
	}

	/* Tablet optimization */
	@media (min-width: 641px) and (max-width: 1024px) {
		.progress-bar {
			padding: 1.25rem;
		}

		.step-title {
			font-size: 1.375rem;
		}
	}
</style>
