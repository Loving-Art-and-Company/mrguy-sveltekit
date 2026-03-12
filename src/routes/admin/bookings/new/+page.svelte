<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { buildBookableTimeSlots } from '$lib/scheduling';

	let { data, form } = $props();

	let submitting = $state(false);

	let clientName = $state('');
	let phone = $state('');
	let email = $state('');
	let serviceId = $state('');
	let date = $state('');
	let time = $state('');
	let street = $state('');
	let city = $state('');
	let addressState = $state('FL');
	let zip = $state('');
	let notes = $state('');

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
			return;
		}

		const prefilledDate = page.url.searchParams.get('date');
		if (prefilledDate && !date) {
			date = prefilledDate;
			fetchDayBookings(prefilledDate);
		}
	});

	const selectedService = $derived(data.services.find((s: { id: string }) => s.id === serviceId));

	// Existing bookings for overbooking prevention
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

	const timeSlots = $derived(buildBookableTimeSlots(date));

	function formatTime(t: string | null): string {
		if (!t) return 'TBD';
		const [h, m] = t.split(':').map(Number);
		const period = h >= 12 ? 'PM' : 'AM';
		const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
		return `${hour}:${String(m).padStart(2, '0')} ${period}`;
	}

	const today = new Date().toISOString().split('T')[0];

	function getFieldErrors(field: string): string[] {
		if (!form?.errors) return [];
		return (form.errors as Record<string, string[]>)[field] ?? [];
	}

	const formError = $derived(
		((form?.errors as Record<string, string[]> | undefined)?._form)?.[0] ?? null
	);

	const inputStyle = 'width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background: white; color: #1f2937; font-family: inherit;';
	const labelStyle = 'display: block; font-size: 0.8125rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem;';
	const cardStyle = 'background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1.25rem;';
</script>

<svelte:head>
	<title>Add Booking - Mr. Guy Admin</title>
</svelte:head>

<div style="max-width: 720px;">
	<div style="margin-bottom: 1.5rem;">
		<a href="/admin/bookings" style="display: inline-flex; align-items: center; gap: 0.375rem; color: #6b7280; text-decoration: none; font-size: 0.875rem; margin-bottom: 0.5rem;">
			&#8592; Back to Bookings
		</a>
		<h2 style="margin: 0.25rem 0 0.375rem; font-size: 1.5rem; color: #1a1a2e;">Add Booking</h2>
		<p style="margin: 0; color: #6b7280; font-size: 0.875rem;">Create a new booking for a client.</p>
	</div>

	{#if formError}
		<div style="background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.25rem; font-weight: 500; font-size: 0.875rem;">
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
		<input type="hidden" name="returnTo" value={page.url.searchParams.get('returnTo') ?? '/admin/bookings'} />
		<!-- Client Info -->
		<div style={cardStyle}>
			<h3 style="margin: 0 0 1rem; font-size: 1rem; color: #1a1a2e; font-weight: 700;">Client Information</h3>

			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
				<div>
					<label for="clientName" style={labelStyle}>Client Name *</label>
					<input type="text" id="clientName" name="clientName" bind:value={clientName} placeholder="Full name" required style={inputStyle} />
					{#each getFieldErrors('clientName') as err}
						<span style="color: #dc2626; font-size: 0.75rem;">{err}</span>
					{/each}
				</div>

				<div>
					<label for="phone" style={labelStyle}>Phone *</label>
					<input type="tel" id="phone" name="phone" bind:value={phone} placeholder="(954) 555-1234" required style={inputStyle} />
					{#each getFieldErrors('phone') as err}
						<span style="color: #dc2626; font-size: 0.75rem;">{err}</span>
					{/each}
				</div>

				<div style="grid-column: 1 / -1;">
					<label for="email" style={labelStyle}>Email (optional)</label>
					<input type="email" id="email" name="email" bind:value={email} placeholder="client@email.com" style={inputStyle} />
					{#each getFieldErrors('email') as err}
						<span style="color: #dc2626; font-size: 0.75rem;">{err}</span>
					{/each}
				</div>
			</div>
		</div>

		<!-- Service -->
		<div style={cardStyle}>
			<h3 style="margin: 0 0 1rem; font-size: 1rem; color: #1a1a2e; font-weight: 700;">Service</h3>

			<div>
				<label for="serviceId" style={labelStyle}>Service Package *</label>
				<select id="serviceId" name="serviceId" bind:value={serviceId} required style={inputStyle}>
					<option value="" disabled>Select a service...</option>
					{#each data.services as service}
						<option value={service.id}>
							{service.name} (${service.priceLow} - ${service.priceHigh})
						</option>
					{/each}
				</select>
				{#each getFieldErrors('serviceId') as err}
					<span style="color: #dc2626; font-size: 0.75rem;">{err}</span>
				{/each}
			</div>

			{#if selectedService}
				<div style="margin-top: 0.75rem; padding: 0.625rem 1rem; background: #f0fdf4; border-radius: 0.375rem; color: #065f46; font-size: 0.875rem;">
					Price: <strong style="font-size: 1.1rem;">${selectedService.priceHigh}</strong>
					<span style="color: #6b7280; font-size: 0.75rem;">(booking at high-end price)</span>
				</div>
			{/if}
		</div>

		<!-- Schedule -->
		<div style={cardStyle}>
			<h3 style="margin: 0 0 1rem; font-size: 1rem; color: #1a1a2e; font-weight: 700;">Schedule</h3>

			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
				<div>
					<label for="date" style={labelStyle}>Date *</label>
					<input
						type="date"
						id="date"
						name="date"
						bind:value={date}
						min={today}
						required
						onchange={(e) => {
							time = '';
							fetchDayBookings(e.currentTarget.value);
						}}
						style={inputStyle}
					/>
					{#each getFieldErrors('date') as err}
						<span style="color: #dc2626; font-size: 0.75rem;">{err}</span>
					{/each}
				</div>

				<div>
					<label for="time" style={labelStyle}>Time *</label>
					<select id="time" name="time" bind:value={time} required style={inputStyle}>
						<option value="" disabled>Select a time...</option>
						{#each timeSlots as slot}
							<option value={slot.value}>{slot.label}</option>
						{/each}
					</select>
					{#each getFieldErrors('time') as err}
						<span style="color: #dc2626; font-size: 0.75rem;">{err}</span>
					{/each}
				</div>
			</div>

			<!-- Existing bookings for this date -->
			{#if loadingDay}
				<div style="margin-top: 1rem; padding: 0.75rem 1rem; background: #f3f4f6; border-radius: 0.375rem; font-size: 0.8125rem; color: #6b7280;">
					Loading bookings for this date...
				</div>
			{:else if date && dayBookings.length > 0}
				<div style="margin-top: 1rem; padding: 0.75rem 1rem; background: #fef3c7; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 0.375rem; font-size: 0.875rem; color: #92400e;">
					<strong>{dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''} on this day:</strong>
					<div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.375rem;">
						{#each dayBookings as b}
							<div style="display: flex; gap: 0.75rem; align-items: center; font-size: 0.8125rem;">
								<span style="font-weight: 700; min-width: 5rem;">{formatTime(b.time)}</span>
								<span style="color: #78350f;">{b.serviceName}</span>
								<span style="color: #92400e; opacity: 0.7;">{b.clientName}</span>
								{#if b.status === 'cancelled'}
									<span style="color: #991b1b; font-size: 0.75rem; font-style: italic;">(cancelled)</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{:else if date}
				<div style="margin-top: 1rem; padding: 0.75rem 1rem; background: #f0fdf4; border-radius: 0.375rem; font-size: 0.8125rem; color: #065f46;">
					No bookings on this date yet — wide open.
				</div>
			{/if}
		</div>

		<!-- Address -->
		<div style={cardStyle}>
			<h3 style="margin: 0 0 1rem; font-size: 1rem; color: #1a1a2e; font-weight: 700;">Address</h3>

			<div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
				<div>
					<label for="street" style={labelStyle}>Street Address *</label>
					<input type="text" id="street" name="street" bind:value={street} placeholder="123 Main St" required style={inputStyle} />
					{#each getFieldErrors('street') as err}
						<span style="color: #dc2626; font-size: 0.75rem;">{err}</span>
					{/each}
				</div>

				<div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem;">
					<div>
						<label for="city" style={labelStyle}>City *</label>
						<input type="text" id="city" name="city" bind:value={city} placeholder="Weston" required style={inputStyle} />
						{#each getFieldErrors('city') as err}
							<span style="color: #dc2626; font-size: 0.75rem;">{err}</span>
						{/each}
					</div>

					<div>
						<label for="state" style={labelStyle}>State</label>
						<input type="text" id="state" name="state" bind:value={addressState} maxlength="2" style={inputStyle} />
					</div>

					<div>
						<label for="zip" style={labelStyle}>ZIP *</label>
						<input type="text" id="zip" name="zip" bind:value={zip} placeholder="33326" maxlength="5" required style={inputStyle} />
						{#each getFieldErrors('zip') as err}
							<span style="color: #dc2626; font-size: 0.75rem;">{err}</span>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Notes -->
		<div style={cardStyle}>
			<h3 style="margin: 0 0 1rem; font-size: 1rem; color: #1a1a2e; font-weight: 700;">Notes (optional)</h3>
			<textarea
				id="notes"
				name="notes"
				bind:value={notes}
				rows="3"
				placeholder="Vehicle info, special instructions, etc."
				style="{inputStyle} resize: vertical;"
			></textarea>
		</div>

		<!-- Actions -->
		<div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 0.5rem;">
			<a
				href="/admin/bookings"
				style="display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; background: white; border: 1px solid #d1d5db; border-radius: 0.5rem; color: #374151; font-weight: 500; text-decoration: none; font-size: 0.875rem;"
			>Cancel</a>
			<button
				type="submit"
				disabled={submitting}
				style="padding: 0.75rem 2rem; background: {submitting ? '#f3a3b3' : '#e94560'}; color: white; border: none; border-radius: 0.5rem; font-weight: 700; font-size: 0.875rem; cursor: {submitting ? 'not-allowed' : 'pointer'}; box-shadow: 0 1px 3px rgba(233, 69, 96, 0.3);"
			>
				{submitting ? 'Creating...' : 'Create Booking'}
			</button>
		</div>
	</form>
</div>
