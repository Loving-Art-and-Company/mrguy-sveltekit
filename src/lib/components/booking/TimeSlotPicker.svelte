<script lang="ts">
	interface TimeSlot {
		time: string;
		label: string;
		available: boolean;
	}

	interface Props {
		date: string;
		selectedTime?: string;
		onselect?: (time: string) => void;
		error?: string | null;
	}

	let { date, selectedTime = $bindable(), onselect, error }: Props = $props();

	// Generate time slots from 8am to 6pm (last slot starts at 5pm)
	const timeSlots: TimeSlot[] = [
		{ time: '08:00', label: '8:00 AM', available: true },
		{ time: '09:00', label: '9:00 AM', available: true },
		{ time: '10:00', label: '10:00 AM', available: true },
		{ time: '11:00', label: '11:00 AM', available: true },
		{ time: '12:00', label: '12:00 PM', available: true },
		{ time: '13:00', label: '1:00 PM', available: true },
		{ time: '14:00', label: '2:00 PM', available: true },
		{ time: '15:00', label: '3:00 PM', available: true },
		{ time: '16:00', label: '4:00 PM', available: true },
		{ time: '17:00', label: '5:00 PM', available: true }
	];

	function selectTime(time: string, available: boolean) {
		if (!available) return;
		selectedTime = time;
		onselect?.(time);
	}

	// Format the selected date for display
	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="time-picker">
	<div class="header">
		<label class="label">
			Select Time
			<span class="required">*</span>
		</label>
		{#if date}
			<div class="date-display">{formatDate(date)}</div>
		{/if}
	</div>

	<div class="time-grid">
		{#each timeSlots as slot}
			<button
				type="button"
				class="time-slot"
				class:selected={selectedTime === slot.time}
				class:unavailable={!slot.available}
				onclick={() => selectTime(slot.time, slot.available)}
				disabled={!slot.available}
				aria-pressed={selectedTime === slot.time}
				aria-label={`${slot.label} ${slot.available ? 'available' : 'unavailable'}`}
			>
				<span class="time-label">{slot.label}</span>
				{#if !slot.available}
					<span class="unavailable-icon">✗</span>
				{:else if selectedTime === slot.time}
					<span class="checkmark">✓</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if error}
		<span class="error-message">{error}</span>
	{/if}

	<div class="legend">
		<div class="legend-item">
			<div class="legend-box available"></div>
			<span>Available</span>
		</div>
		<div class="legend-item">
			<div class="legend-box unavailable"></div>
			<span>Unavailable</span>
		</div>
	</div>

	<p class="note">
		📅 We operate Mon-Sat, 8 AM - 6 PM. Service duration typically 1-3 hours depending on package.
	</p>
</div>

<style>
	.time-picker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.required {
		color: var(--color-error);
	}

	.date-display {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-primary);
		padding: 0.75rem 1rem;
		background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.05));
		border-radius: 0.5rem;
		border-left: 4px solid var(--color-primary);
	}

	.time-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
	}

	.time-slot {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		background: white;
		border: 2px solid var(--border-light);
		border-radius: 0.75rem;
		padding: 1rem 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		min-height: 72px;
		font-weight: 600;
	}

	.time-slot:hover:not(:disabled) {
		border-color: var(--color-primary);
		background: rgba(14, 165, 233, 0.05);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.time-slot.selected {
		border-color: var(--color-primary);
		background: var(--color-primary);
		color: white;
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
	}

	.time-slot.unavailable {
		background: var(--bg-secondary);
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.5;
	}

	.time-slot:focus {
		outline: 3px solid var(--color-primary);
		outline-offset: 2px;
	}

	.time-slot:active:not(:disabled) {
		transform: translateY(0);
	}

	.time-label {
		font-size: 1rem;
		font-weight: 700;
	}

	.checkmark {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		font-size: 0.875rem;
		width: 20px;
		height: 20px;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.unavailable-icon {
		font-size: 0.875rem;
		color: var(--color-error);
	}

	.error-message {
		color: var(--color-error);
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.legend {
		display: flex;
		gap: 1.5rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.legend-box {
		width: 24px;
		height: 24px;
		border-radius: 0.25rem;
		border: 2px solid var(--border-light);
	}

	.legend-box.available {
		background: white;
		border-color: var(--color-primary);
	}

	.legend-box.unavailable {
		background: var(--bg-secondary);
		opacity: 0.5;
	}

	.note {
		font-size: 0.875rem;
		color: var(--text-secondary);
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
		border-left: 4px solid var(--color-accent);
		margin: 0;
		line-height: 1.5;
	}

	/* Mobile optimization - 2 columns on mobile */
	@media (max-width: 640px) {
		.time-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.time-slot {
			min-height: 64px;
			padding: 0.75rem 0.5rem;
		}

		.time-label {
			font-size: 0.875rem;
		}

		.legend {
			flex-direction: column;
			gap: 0.75rem;
		}
	}

	/* Tablet optimization - 3 columns */
	@media (min-width: 641px) and (max-width: 1024px) {
		.time-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
