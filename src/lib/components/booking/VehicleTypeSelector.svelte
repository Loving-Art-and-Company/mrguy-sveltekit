<script lang="ts">
	type VehicleType = 'sedan' | 'suv' | 'truck';

	interface VehicleOption {
		type: VehicleType;
		icon: string;
		label: string;
		description: string;
		priceMultiplier: number;
	}

	interface Props {
		value?: VehicleType;
		onchange?: (type: VehicleType) => void;
		error?: string | null;
	}

	let { value = $bindable(), onchange, error }: Props = $props();

	const vehicles: VehicleOption[] = [
		{
			type: 'sedan',
			icon: '🚗',
			label: 'Sedan / Coupe',
			description: 'Standard cars, compacts, sedans',
			priceMultiplier: 1.0
		},
		{
			type: 'suv',
			icon: '🚙',
			label: 'SUV / Crossover',
			description: 'SUVs, crossovers, minivans',
			priceMultiplier: 1.25
		},
		{
			type: 'truck',
			icon: '🚛',
			label: 'Truck / Large',
			description: 'Pickup trucks, large SUVs',
			priceMultiplier: 1.5
		}
	];

	function selectVehicle(type: VehicleType) {
		value = type;
		onchange?.(type);
	}
</script>

<div class="vehicle-selector">
	<label class="label">
		Vehicle Type
		<span class="required">*</span>
	</label>

	<div class="vehicle-grid">
		{#each vehicles as vehicle}
			<button
				type="button"
				class="vehicle-option"
				class:selected={value === vehicle.type}
				onclick={() => selectVehicle(vehicle.type)}
				aria-pressed={value === vehicle.type}
			>
				<div class="icon">{vehicle.icon}</div>
				<div class="content">
					<div class="label-text">{vehicle.label}</div>
					<div class="description">{vehicle.description}</div>
					{#if vehicle.priceMultiplier !== 1.0}
						<div class="multiplier">
							+{Math.round((vehicle.priceMultiplier - 1) * 100)}% pricing
						</div>
					{/if}
				</div>
				{#if value === vehicle.type}
					<div class="checkmark">✓</div>
				{/if}
			</button>
		{/each}
	</div>

	{#if error}
		<span class="error-message">{error}</span>
	{/if}
</div>

<style>
	.vehicle-selector {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.label {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.required {
		color: var(--color-error);
	}

	.vehicle-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.vehicle-option {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		background: white;
		border: 3px solid var(--border-light);
		border-radius: 1rem;
		padding: 1.5rem 1rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
		min-height: 72px;
	}

	.vehicle-option:hover {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.vehicle-option.selected {
		border-color: var(--color-primary);
		background: linear-gradient(to bottom, rgba(14, 165, 233, 0.05), white);
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.vehicle-option:focus {
		outline: 3px solid var(--color-primary);
		outline-offset: 2px;
	}

	.vehicle-option:active {
		transform: translateY(0);
	}

	.icon {
		font-size: 3rem;
		line-height: 1;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label-text {
		font-weight: 700;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.multiplier {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-accent);
		margin-top: 0.25rem;
	}

	.checkmark {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		width: 28px;
		height: 28px;
		background: var(--color-primary);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		font-weight: 700;
		box-shadow: 0 2px 8px rgba(14, 165, 233, 0.4);
	}

	.error-message {
		color: var(--color-error);
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	/* Mobile optimization - ensure 44px touch targets */
	@media (max-width: 640px) {
		.vehicle-grid {
			grid-template-columns: 1fr;
		}

		.vehicle-option {
			flex-direction: row;
			text-align: left;
			min-height: 72px;
		}

		.icon {
			font-size: 2.5rem;
			flex-shrink: 0;
		}

		.content {
			flex: 1;
			align-items: flex-start;
		}
	}
</style>
