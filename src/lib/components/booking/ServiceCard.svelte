<script lang="ts">
	import { getServiceImages } from '$lib/utils/serviceImageMapper';

	interface Service {
		id: string;
		name: string;
		priceLow: number;
		priceHigh: number;
		description: string;
		badge?: string;
		memberPrice?: { low: number; high: number };
	}

	interface Props {
		service: Service;
		selected?: boolean;
		onclick?: () => void;
	}

	let { service, selected = false, onclick }: Props = $props();

	let showAfter = $state(false);
	const images = getServiceImages(service.id);

	// Toggle between before/after images
	function toggleImage() {
		showAfter = !showAfter;
	}

	// Get the package icon
	function getIcon(serviceId: string): string {
		const iconMap: Record<string, string> = {
			gold: '💧',
			silver: '⭐',
			platinum: '👑'
		};
		return iconMap[serviceId] || '✨';
	}
</script>

<button
	type="button"
	class="service-card"
	class:selected
	onclick={onclick}
	aria-pressed={selected}
>
	{#if service.badge}
		<div class="badge">{service.badge}</div>
	{/if}

	<!-- Before/After Image Toggle -->
	<div class="image-container" onclick={(e) => { e.stopPropagation(); toggleImage(); }}>
		{#if images}
			<img
				src={showAfter ? images.after : images.before}
				alt={showAfter ? `${service.name} - After` : `${service.name} - Before`}
				class="service-image"
			/>
			<div class="image-toggle-hint">
				<span class="toggle-icon">🔄</span>
				<span class="toggle-text">{showAfter ? 'Before' : 'After'}</span>
			</div>
		{:else}
			<div class="icon-placeholder">
				{getIcon(service.id)}
			</div>
		{/if}
	</div>

	<!-- Service Info -->
	<div class="content">
		<h3 class="name">
			<span class="icon">{getIcon(service.id)}</span>
			{service.name}
		</h3>

		<p class="description">{service.description}</p>

		<!-- Pricing -->
		<div class="pricing">
			<div class="price-row">
				<span class="label">One-time:</span>
				<span class="price">${service.priceLow} - ${service.priceHigh}</span>
			</div>
			{#if service.memberPrice}
				<div class="price-row member">
					<span class="label">
						<span class="member-icon">⭐</span>
						Member:
					</span>
					<span class="price">${service.memberPrice.low} - ${service.memberPrice.high}/mo</span>
				</div>
			{/if}
		</div>
	</div>

	{#if selected}
		<div class="checkmark">✓</div>
	{/if}
</button>

<style>
	.service-card {
		position: relative;
		display: flex;
		flex-direction: column;
		background: white;
		border: 3px solid var(--border-light);
		border-radius: 1rem;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		overflow: hidden;
		width: 100%;
		min-height: 360px;
	}

	.service-card:hover {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	}

	.service-card.selected {
		border-color: var(--color-primary);
		background: linear-gradient(to bottom, rgba(14, 165, 233, 0.05), white);
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: var(--color-accent);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		z-index: 2;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.image-container {
		position: relative;
		width: 100%;
		height: 180px;
		overflow: hidden;
		background: var(--bg-secondary);
		cursor: pointer;
	}

	.service-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity 0.3s;
	}

	.icon-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-size: 4rem;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
	}

	.image-toggle-hint {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		backdrop-filter: blur(4px);
	}

	.toggle-icon {
		font-size: 1rem;
	}

	.toggle-text {
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		flex: 1;
	}

	.name {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.icon {
		font-size: 1.75rem;
	}

	.description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
	}

	.pricing {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: auto;
	}

	.price-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
	}

	.price-row.member {
		background: linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.05));
		border: 1px solid rgba(234, 179, 8, 0.3);
	}

	.label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.member-icon {
		font-size: 1rem;
	}

	.price {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.checkmark {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		width: 32px;
		height: 32px;
		background: var(--color-primary);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: 700;
		box-shadow: 0 2px 8px rgba(14, 165, 233, 0.4);
		z-index: 2;
	}

	/* Mobile optimization */
	@media (max-width: 640px) {
		.service-card {
			min-height: 340px;
		}

		.image-container {
			height: 160px;
		}

		.name {
			font-size: 1.25rem;
		}

		.icon {
			font-size: 1.5rem;
		}

		.content {
			padding: 1rem;
		}
	}

	/* Accessibility */
	.service-card:focus {
		outline: 3px solid var(--color-primary);
		outline-offset: 2px;
	}

	.service-card:active {
		transform: translateY(0);
	}
</style>
