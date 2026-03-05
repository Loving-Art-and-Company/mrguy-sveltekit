<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let submitting = $state(false);

	// Pre-fill with form values on validation error, or defaults
	let clientName = $state(form?.values?.clientName ?? '');
	let phone = $state(form?.values?.phone ?? '');
	let email = $state(form?.values?.email ?? '');
	let serviceId = $state(form?.values?.serviceId ?? '');
	let date = $state(form?.values?.date ?? '');
	let time = $state(form?.values?.time ?? '');
	let street = $state(form?.values?.street ?? '');
	let city = $state(form?.values?.city ?? '');
	let addressState = $state(form?.values?.state ?? 'FL');
	let zip = $state(form?.values?.zip ?? '');
	let notes = $state(form?.values?.notes ?? '');

	// Restore form values on validation error
	$effect(() => {
		if (form?.values) {
			clientName = form.values.clientName ?? '';
			phone = form.values.phone ?? '';
			email = form.values.email ?? '';
			serviceId = form.values.serviceId ?? '';
			date = form.values.date ?? '';
			time = form.values.time ?? '';
			street = form.values.street ?? '';
			city = form.values.city ?? '';
			addressState = form.values.state ?? 'FL';
			zip = form.values.zip ?? '';
			notes = form.values.notes ?? '';
		}
	});

	const selectedService = $derived(data.services.find((s: { id: string }) => s.id === serviceId));

	// Existing bookings for the selected date (overbooking prevention)
	type DayBooking = { id: string; time: string | null; clientName: string; serviceName: string; status: string | null };
	let dayBookings = $state<DayBooking[]>([]);
	let loadingDay = $state(false);

	async function fetchDayBookings(selectedDate: string) {
		if (!selectedDate) {
			dayBookings = [];
			return;
		}
		loadingDay = true;
		try {
			const res = await fetch(`/api/bookings/by-date?date=${selectedDate}`);
			if (res.ok) {
				dayBookings = await res.json();
			}
		} catch {
			dayBookings = [];
		}
		loadingDay = false;
	}

	// Available time slots (8 AM - 6 PM)
	const timeSlots = Array.from({ length: 11 }, (_, i) => {
		const hour = i + 8;
		const value = `${String(hour).padStart(2, '0')}:00`;
		const period = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour > 12 ? hour - 12 : hour;
		return { value, label: `${displayHour}:00 ${period}` };
	});

	// Get today's date for min attribute
	const today = new Date().toISOString().split('T')[0];

	function getFieldErrors(field: string): string[] {
		if (!form?.errors) return [];
		return (form.errors as Record<string, string[]>)[field] ?? [];
	}

	const formError = $derived(
		((form?.errors as Record<string, string[]> | undefined)?._form)?.[0] ?? null
	);
</script>

<svelte:head>
	<title>Add Booking - Mr. Guy Admin</title>
</svelte:head>

<div class="new-booking-page">
	<div class="page-header">
		<a href="/admin/bookings" class="back-link">Back to Bookings</a>
		<h2>Add Booking</h2>
		<p>Manually create a new booking for a client.</p>
	</div>

	{#if formError}
		<div class="form-error-banner">
			{formError}
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
	>
		<!-- Client Info -->
		<section class="form-section">
			<h3>Client Information</h3>

			<div class="form-grid">
				<div class="form-group">
					<label for="clientName">Client Name *</label>
					<input
						type="text"
						id="clientName"
						name="clientName"
						bind:value={clientName}
						placeholder="Full name"
						required
					/>
					{#each getFieldErrors('clientName') as err}
						<span class="field-error">{err}</span>
					{/each}
				</div>

				<div class="form-group">
					<label for="phone">Phone *</label>
					<input
						type="tel"
						id="phone"
						name="phone"
						bind:value={phone}
						placeholder="(954) 555-1234"
						required
					/>
					{#each getFieldErrors('phone') as err}
						<span class="field-error">{err}</span>
					{/each}
				</div>

				<div class="form-group">
					<label for="email">Email (optional)</label>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={email}
						placeholder="client@email.com"
					/>
					{#each getFieldErrors('email') as err}
						<span class="field-error">{err}</span>
					{/each}
				</div>
			</div>
		</section>

		<!-- Service Selection -->
		<section class="form-section">
			<h3>Service</h3>

			<div class="form-group">
				<label for="serviceId">Service Package *</label>
				<select id="serviceId" name="serviceId" bind:value={serviceId} required>
					<option value="" disabled>Select a service...</option>
					{#each data.services as service}
						<option value={service.id}>
							{service.name} (${service.priceLow} - ${service.priceHigh})
						</option>
					{/each}
				</select>
				{#each getFieldErrors('serviceId') as err}
					<span class="field-error">{err}</span>
				{/each}
			</div>

			{#if selectedService}
				<div class="price-preview">
					Price: <strong>${selectedService.priceHigh}</strong>
					<span class="price-note">(booking at high-end price)</span>
				</div>
			{/if}
		</section>

		<!-- Schedule -->
		<section class="form-section">
			<h3>Schedule</h3>

			<div class="form-grid form-grid-2">
				<div class="form-group">
					<label for="date">Date *</label>
					<input
						type="date"
						id="date"
						name="date"
						bind:value={date}
						min={today}
						required
						onchange={(e) => fetchDayBookings(e.currentTarget.value)}
					/>
					{#each getFieldErrors('date') as err}
						<span class="field-error">{err}</span>
					{/each}
				</div>

				<div class="form-group">
					<label for="time">Time *</label>
					<select id="time" name="time" bind:value={time} required>
						<option value="" disabled>Select a time...</option>
						{#each timeSlots as slot}
							<option value={slot.value}>{slot.label}</option>
						{/each}
					</select>
					{#each getFieldErrors('time') as err}
						<span class="field-error">{err}</span>
					{/each}
				</div>
			</div>

			{#if loadingDay}
				<div class="day-bookings-notice">Loading bookings for this date...</div>
			{:else if date && dayBookings.length > 0}
				<div class="day-bookings-notice">
					<strong>{dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''} on this day:</strong>
					<ul class="day-bookings-list">
						{#each dayBookings as b}
							<li>
								<span class="db-time">{b.time || 'TBD'}</span>
								<span class="db-service">{b.serviceName}</span>
								<span class="db-client">{b.clientName}</span>
								{#if b.status === 'cancelled'}
									<span class="db-cancelled">(cancelled)</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{:else if date}
				<div class="day-bookings-clear">No bookings on this date yet.</div>
			{/if}
		</section>

		<!-- Address -->
		<section class="form-section">
			<h3>Address</h3>

			<div class="form-grid">
				<div class="form-group form-group-wide">
					<label for="street">Street Address *</label>
					<input
						type="text"
						id="street"
						name="street"
						bind:value={street}
						placeholder="123 Main St"
						required
					/>
					{#each getFieldErrors('street') as err}
						<span class="field-error">{err}</span>
					{/each}
				</div>

				<div class="form-group">
					<label for="city">City *</label>
					<input
						type="text"
						id="city"
						name="city"
						bind:value={city}
						placeholder="Weston"
						required
					/>
					{#each getFieldErrors('city') as err}
						<span class="field-error">{err}</span>
					{/each}
				</div>

				<div class="form-group">
					<label for="state">State</label>
					<input
						type="text"
						id="state"
						name="state"
						bind:value={addressState}
						maxlength="2"
					/>
				</div>

				<div class="form-group">
					<label for="zip">ZIP Code *</label>
					<input
						type="text"
						id="zip"
						name="zip"
						bind:value={zip}
						placeholder="33326"
						maxlength="5"
						required
					/>
					{#each getFieldErrors('zip') as err}
						<span class="field-error">{err}</span>
					{/each}
				</div>
			</div>
		</section>

		<!-- Notes -->
		<section class="form-section">
			<h3>Notes (optional)</h3>

			<div class="form-group">
				<textarea
					id="notes"
					name="notes"
					bind:value={notes}
					rows="3"
					placeholder="Vehicle info, special instructions, etc."
				></textarea>
			</div>
		</section>

		<!-- Submit -->
		<div class="form-actions">
			<a href="/admin/bookings" class="cancel-btn">Cancel</a>
			<button type="submit" class="submit-btn" disabled={submitting}>
				{submitting ? 'Creating...' : 'Create Booking'}
			</button>
		</div>
	</form>
</div>

<style>
	.new-booking-page {
		max-width: 800px;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 0.75rem;
		color: #6b7280;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #374151;
	}

	.page-header h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		color: #1a1a2e;
	}

	.page-header p {
		margin: 0;
		color: #6b7280;
	}

	.form-error-banner {
		background: #fee2e2;
		color: #991b1b;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	.form-section {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	.form-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #1a1a2e;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.form-grid-2 {
		grid-template-columns: repeat(2, 1fr);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group-wide {
		grid-column: 1 / -1;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 0.625rem 0.875rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		color: #1f2937;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #e94560;
		box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
	}

	.form-group textarea {
		resize: vertical;
	}

	.field-error {
		color: #dc2626;
		font-size: 0.75rem;
	}

	.price-preview {
		margin-top: 0.75rem;
		padding: 0.75rem 1rem;
		background: #f0fdf4;
		border-radius: 0.375rem;
		color: #065f46;
		font-size: 0.875rem;
	}

	.price-preview strong {
		font-size: 1.1rem;
	}

	.price-note {
		color: #6b7280;
		font-size: 0.75rem;
	}

	.day-bookings-notice {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: #fef3c7;
		border: 1px solid #f59e0b40;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #92400e;
	}

	.day-bookings-list {
		margin: 0.5rem 0 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.day-bookings-list li {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		font-size: 0.8125rem;
	}

	.db-time {
		font-weight: 600;
		min-width: 3.5rem;
	}

	.db-service {
		color: #78350f;
	}

	.db-client {
		color: #92400e;
		opacity: 0.7;
	}

	.db-cancelled {
		color: #991b1b;
		font-size: 0.75rem;
		font-style: italic;
	}

	.day-bookings-clear {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: #f0fdf4;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #065f46;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.cancel-btn {
		padding: 0.75rem 1.5rem;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		color: #374151;
		font-weight: 500;
		text-decoration: none;
		font-size: 0.875rem;
		transition: background 0.2s, border-color 0.2s;
		display: inline-flex;
		align-items: center;
	}

	.cancel-btn:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.submit-btn {
		padding: 0.75rem 1.5rem;
		background: #e94560;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		background: #d63651;
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.form-grid,
		.form-grid-2 {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column-reverse;
		}

		.cancel-btn,
		.submit-btn {
			text-align: center;
			justify-content: center;
		}
	}
</style>
