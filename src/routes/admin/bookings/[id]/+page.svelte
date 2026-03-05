<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const booking = $derived(data.booking);

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
		});
	}

	function formatTime(t: string | null): string {
		if (!t) return 'TBD';
		const [h, m] = t.split(':').map(Number);
		const period = h >= 12 ? 'PM' : 'AM';
		const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
		return `${hour}:${String(m).padStart(2, '0')} ${period}`;
	}

	function formatTimestamp(ts: Date | string | null): string {
		if (!ts) return 'N/A';
		const d = ts instanceof Date ? ts : new Date(ts);
		return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
	}

	// Parse address from notes
	function parseAddress(notes: string | null): string | null {
		if (!notes) return null;
		const match = notes.match(/Address:\s*([^\n]+)/i);
		return match ? match[1].trim() : null;
	}

	const address = $derived(parseAddress(booking.notes));

	// Status styling
	const statuses = [
		{ value: 'pending', label: 'Pending', bg: '#fef3c7', fg: '#92400e', ring: '#f59e0b' },
		{ value: 'confirmed', label: 'Confirmed', bg: '#dbeafe', fg: '#1e40af', ring: '#3b82f6' },
		{ value: 'rescheduled', label: 'Rescheduled', bg: '#e0e7ff', fg: '#3730a3', ring: '#6366f1' },
		{ value: 'cancelled', label: 'Cancelled', bg: '#fee2e2', fg: '#991b1b', ring: '#ef4444' },
		{ value: 'completed', label: 'Completed', bg: '#d1fae5', fg: '#065f46', ring: '#10b981' },
	];

	const paymentStatuses = [
		{ value: 'unpaid', label: 'Unpaid', bg: '#f3f4f6', fg: '#4b5563' },
		{ value: 'paid', label: 'Paid', bg: '#d1fae5', fg: '#065f46' },
		{ value: 'refunded', label: 'Refunded', bg: '#fee2e2', fg: '#991b1b' },
	];

	function getStatus(s: string | null) {
		return statuses.find(st => st.value === s) ?? statuses[0];
	}

	function getPaymentStatus(s: string | null) {
		return paymentStatuses.find(ps => ps.value === s) ?? paymentStatuses[0];
	}

	let updating = $state(false);

	const cardStyle = 'background: white; padding: 1.25rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08);';
	const labelStyle = 'font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 0.25rem;';
	const valueStyle = 'font-size: 0.9375rem; color: #1f2937;';
</script>

<svelte:head>
	<title>Booking {booking.id} - Mr. Guy Admin</title>
</svelte:head>

<div style="max-width: 900px;">
	<!-- Back -->
	<a href="/admin/bookings" style="display: inline-flex; align-items: center; gap: 0.375rem; color: #6b7280; text-decoration: none; font-size: 0.875rem; margin-bottom: 1rem;">
		&#8592; Back to Bookings
	</a>

	<!-- Header -->
	<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
		<div>
			<h1 style="margin: 0 0 0.25rem; font-size: 1.5rem; color: #1a1a2e;">
				{booking.clientName}
			</h1>
			<p style="margin: 0; color: #9ca3af; font-size: 0.8125rem;">
				{booking.id} &middot; Created {formatTimestamp(booking.createdAt)}
			</p>
		</div>
		<div style="display: flex; gap: 0.5rem;">
			<span style="display: inline-block; padding: 0.3125rem 0.875rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; background: {getStatus(booking.status).bg}; color: {getStatus(booking.status).fg};">
				{booking.status || 'pending'}
			</span>
			<span style="display: inline-block; padding: 0.3125rem 0.875rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; background: {getPaymentStatus(booking.paymentStatus).bg}; color: {getPaymentStatus(booking.paymentStatus).fg};">
				{booking.paymentStatus || 'unpaid'}
			</span>
		</div>
	</div>

	<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
		<!-- Appointment -->
		<div style={cardStyle}>
			<h2 style="margin: 0 0 1rem; font-size: 0.9375rem; font-weight: 700; color: #374151; padding-bottom: 0.625rem; border-bottom: 1px solid #f3f4f6;">Appointment</h2>
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
				<div>
					<div style={labelStyle}>Date</div>
					<div style="{valueStyle} font-weight: 600;">{formatDate(booking.date)}</div>
				</div>
				<div>
					<div style={labelStyle}>Time</div>
					<div style={valueStyle}>{formatTime(booking.time)}</div>
				</div>
				<div>
					<div style={labelStyle}>Service</div>
					<div style={valueStyle}>{booking.serviceName}</div>
				</div>
				<div>
					<div style={labelStyle}>Price</div>
					<div style="{valueStyle} font-weight: 700; color: #059669; font-size: 1.125rem;">{formatPrice(booking.price)}</div>
				</div>
			</div>
		</div>

		<!-- Client -->
		<div style={cardStyle}>
			<h2 style="margin: 0 0 1rem; font-size: 0.9375rem; font-weight: 700; color: #374151; padding-bottom: 0.625rem; border-bottom: 1px solid #f3f4f6;">Client</h2>
			<div style="display: grid; gap: 1rem;">
				<div>
					<div style={labelStyle}>Name</div>
					<div style="{valueStyle} font-weight: 600;">{booking.clientName}</div>
				</div>
				<div>
					<div style={labelStyle}>Phone</div>
					<div style={valueStyle}>
						<a href="tel:{booking.contact}" style="color: #e94560; text-decoration: none; font-weight: 500;">{booking.contact}</a>
					</div>
				</div>
				{#if address}
					<div>
						<div style={labelStyle}>Address</div>
						<div style={valueStyle}>{address}</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Status Controls -->
		<div style="{cardStyle} grid-column: 1 / -1;">
			<h2 style="margin: 0 0 1rem; font-size: 0.9375rem; font-weight: 700; color: #374151; padding-bottom: 0.625rem; border-bottom: 1px solid #f3f4f6;">Update Status</h2>

			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
				<!-- Booking Status -->
				<div>
					<div style="{labelStyle} margin-bottom: 0.625rem;">Booking Status</div>
					<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
						{#each statuses as s}
							{@const isActive = booking.status === s.value || (!booking.status && s.value === 'pending')}
							<form
								method="POST"
								action="?/updateStatus"
								use:enhance={() => {
									updating = true;
									return async ({ update }) => {
										updating = false;
										await update();
									};
								}}
							>
								<input type="hidden" name="status" value={s.value} />
								<button
									type="submit"
									disabled={isActive || updating}
									style="
										padding: 0.4375rem 0.875rem;
										border-radius: 0.375rem;
										font-size: 0.8125rem;
										font-weight: 600;
										cursor: {isActive ? 'default' : 'pointer'};
										border: 2px solid {isActive ? s.ring : 'transparent'};
										background: {isActive ? s.bg : '#f9fafb'};
										color: {isActive ? s.fg : '#6b7280'};
										opacity: {updating && !isActive ? '0.5' : '1'};
										transition: all 0.15s;
									"
								>{s.label}</button>
							</form>
						{/each}
					</div>
				</div>

				<!-- Payment Status -->
				<div>
					<div style="{labelStyle} margin-bottom: 0.625rem;">Payment Status</div>
					<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
						{#each paymentStatuses as ps}
							{@const isActive = booking.paymentStatus === ps.value || (!booking.paymentStatus && ps.value === 'unpaid')}
							<form
								method="POST"
								action="?/updatePaymentStatus"
								use:enhance={() => {
									updating = true;
									return async ({ update }) => {
										updating = false;
										await update();
									};
								}}
							>
								<input type="hidden" name="paymentStatus" value={ps.value} />
								<button
									type="submit"
									disabled={isActive || updating}
									style="
										padding: 0.4375rem 0.875rem;
										border-radius: 0.375rem;
										font-size: 0.8125rem;
										font-weight: 600;
										cursor: {isActive ? 'default' : 'pointer'};
										border: 2px solid {isActive ? (ps.value === 'paid' ? '#10b981' : ps.value === 'refunded' ? '#ef4444' : '#9ca3af') : 'transparent'};
										background: {isActive ? ps.bg : '#f9fafb'};
										color: {isActive ? ps.fg : '#6b7280'};
										opacity: {updating && !isActive ? '0.5' : '1'};
										transition: all 0.15s;
									"
								>{ps.label}</button>
							</form>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Notes -->
		{#if booking.notes}
			<div style="{cardStyle} grid-column: 1 / -1;">
				<h2 style="margin: 0 0 1rem; font-size: 0.9375rem; font-weight: 700; color: #374151; padding-bottom: 0.625rem; border-bottom: 1px solid #f3f4f6;">Notes</h2>
				<div style="background: #f9fafb; padding: 0.875rem; border-radius: 0.5rem; font-size: 0.875rem; color: #4b5563; white-space: pre-wrap; line-height: 1.6;">
					{booking.notes}
				</div>
			</div>
		{/if}

		<!-- Payment Info -->
		<div style="{cardStyle} grid-column: 1 / -1; background: #fafafa;">
			<h2 style="margin: 0 0 1rem; font-size: 0.9375rem; font-weight: 700; color: #9ca3af; padding-bottom: 0.625rem; border-bottom: 1px solid #f3f4f6;">Payment & System</h2>
			<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
				<div>
					<div style={labelStyle}>Payment Method</div>
					<div style={valueStyle}>{booking.paymentMethod || 'N/A'}</div>
				</div>
				{#if booking.transactionId}
					<div>
						<div style={labelStyle}>Transaction ID</div>
						<div style="font-family: monospace; font-size: 0.8125rem; color: #374151; background: #e5e7eb; padding: 0.25rem 0.5rem; border-radius: 0.25rem; word-break: break-all;">{booking.transactionId}</div>
					</div>
				{/if}
				{#if booking.promoCode}
					<div>
						<div style={labelStyle}>Promo Code</div>
						<div style="{valueStyle} font-weight: 600; color: #7c3aed;">{booking.promoCode}</div>
					</div>
				{/if}
				<div>
					<div style={labelStyle}>Reminder Sent</div>
					<div style={valueStyle}>{booking.reminderSent ? 'Yes' : 'No'}</div>
				</div>
			</div>
		</div>
	</div>
</div>
