<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Derive booking from props so it updates reactively if data changes
	const booking = $derived(data.booking);

	// Parse notes field for vehicle and address info
	function parseNotes(notes: string | null): { vehicle?: string; address?: string; extra?: string } {
		if (!notes) return {};

		const result: { vehicle?: string; address?: string; extra?: string } = {};

		// Try to extract vehicle info (common patterns)
		const vehicleMatch = notes.match(/vehicle[:\s]+([^\n]+)/i) ||
			notes.match(/((?:\d{4}\s+)?\w+\s+\w+(?:\s+\w+)?)/i);
		if (vehicleMatch) {
			result.vehicle = vehicleMatch[1].trim();
		}

		// Try to extract address (common patterns)
		const addressMatch = notes.match(/address[:\s]+([^\n]+)/i) ||
			notes.match(/(\d+[^,\n]+,\s*[^,\n]+,\s*(?:FL|Florida)[^,\n]*)/i);
		if (addressMatch) {
			result.address = addressMatch[1].trim();
		}

		// Store any remaining notes
		let extra = notes;
		if (result.vehicle) extra = extra.replace(vehicleMatch![0], '');
		if (result.address) extra = extra.replace(addressMatch![0], '');
		extra = extra.trim();
		if (extra && extra !== notes) {
			result.extra = extra;
		} else if (!result.vehicle && !result.address) {
			result.extra = notes;
		}

		return result;
	}

	const parsedNotes = $derived(parseNotes(booking.notes));

	// Format price as currency
	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(price);
	}

	// Format date for display
	function formatDate(dateStr: string): string {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	}

	// Format timestamp
	function formatTimestamp(ts: string | null): string {
		if (!ts) return 'N/A';
		return new Date(ts).toLocaleString('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short',
		});
	}

	// Get status badge class
	function getStatusClass(status: string | null): string {
		switch (status) {
			case 'confirmed':
				return 'badge-blue';
			case 'completed':
				return 'badge-green';
			case 'cancelled':
				return 'badge-red';
			default:
				return 'badge-gray';
		}
	}

	// Get payment status badge class
	function getPaymentStatusClass(status: string | null): string {
		switch (status) {
			case 'paid':
				return 'badge-green';
			case 'pending':
				return 'badge-yellow';
			case 'refunded':
				return 'badge-red';
			default:
				return 'badge-gray';
		}
	}
</script>

<svelte:head>
	<title>Booking {booking.id} - Mr. Guy Admin</title>
</svelte:head>

<div class="detail-page">
	<!-- Back Button -->
	<a href="/admin/bookings" class="back-link">
		<span class="back-arrow">&larr;</span> Back to Bookings
	</a>

	<!-- Header -->
	<header class="detail-header">
		<div class="header-info">
			<h1>Booking #{booking.id}</h1>
			<p class="created-at">Created {formatTimestamp(booking.created_at)}</p>
		</div>
		<div class="header-badges">
			<span class="status-badge {getStatusClass(booking.status)}">
				{booking.status || 'pending'}
			</span>
			<span class="status-badge {getPaymentStatusClass(booking.paymentStatus)}">
				{booking.paymentStatus || 'unpaid'}
			</span>
		</div>
	</header>

	<div class="detail-grid">
		<!-- Appointment Details -->
		<section class="detail-card">
			<h2>Appointment Details</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Date</span>
					<span class="info-value">{formatDate(booking.date)}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Time</span>
					<span class="info-value">{booking.time || 'TBD'}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Service</span>
					<span class="info-value">{booking.serviceName}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Price</span>
					<span class="info-value price">{formatPrice(booking.price)}</span>
				</div>
			</div>
		</section>

		<!-- Client Information -->
		<section class="detail-card">
			<h2>Client Information</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Name</span>
					<span class="info-value">{booking.clientName}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Phone</span>
					<span class="info-value">
						<a href="tel:{booking.contact}" class="contact-link">{booking.contact}</a>
					</span>
				</div>
			</div>
		</section>

		<!-- Vehicle & Location -->
		<section class="detail-card">
			<h2>Vehicle & Location</h2>
			<div class="info-grid">
				{#if parsedNotes.vehicle}
					<div class="info-item">
						<span class="info-label">Vehicle</span>
						<span class="info-value">{parsedNotes.vehicle}</span>
					</div>
				{/if}
				{#if parsedNotes.address}
					<div class="info-item full-width">
						<span class="info-label">Address</span>
						<span class="info-value">{parsedNotes.address}</span>
					</div>
				{/if}
				{#if !parsedNotes.vehicle && !parsedNotes.address}
					<div class="info-item full-width">
						<span class="info-value muted">No vehicle or location info available</span>
					</div>
				{/if}
			</div>
		</section>

		<!-- Payment Information -->
		<section class="detail-card">
			<h2>Payment Information</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Payment Method</span>
					<span class="info-value">{booking.paymentMethod || 'N/A'}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Payment Status</span>
					<span class="status-badge {getPaymentStatusClass(booking.paymentStatus)}">
						{booking.paymentStatus || 'unpaid'}
					</span>
				</div>
				{#if booking.transactionId}
					<div class="info-item full-width">
						<span class="info-label">Transaction ID</span>
						<span class="info-value mono">{booking.transactionId}</span>
					</div>
				{/if}
			</div>
		</section>

		<!-- Additional Notes -->
		{#if parsedNotes.extra || booking.notes}
			<section class="detail-card full-width">
				<h2>Notes</h2>
				<div class="notes-content">
					{parsedNotes.extra || booking.notes}
				</div>
			</section>
		{/if}

		<!-- System Info -->
		<section class="detail-card full-width system-info">
			<h2>System Information</h2>
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Booking ID</span>
					<span class="info-value mono">{booking.id}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Created At</span>
					<span class="info-value">{formatTimestamp(booking.created_at)}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Reminder Sent</span>
					<span class="info-value">{booking.reminderSent ? 'Yes' : 'No'}</span>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	.detail-page {
		max-width: 1000px;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		text-decoration: none;
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #e94560;
	}

	.back-arrow {
		font-size: 1.2em;
	}

	/* Header */
	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-info h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.75rem;
		color: #1a1a2e;
	}

	.created-at {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.header-badges {
		display: flex;
		gap: 0.5rem;
	}

	/* Grid Layout */
	.detail-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.detail-card {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.detail-card.full-width {
		grid-column: span 2;
	}

	.detail-card h2 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-item.full-width {
		grid-column: span 2;
	}

	.info-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		font-weight: 500;
	}

	.info-value {
		font-size: 0.9375rem;
		color: #1f2937;
	}

	.info-value.price {
		font-weight: 600;
		color: #059669;
		font-size: 1.125rem;
	}

	.info-value.mono {
		font-family: monospace;
		font-size: 0.8125rem;
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		word-break: break-all;
	}

	.info-value.muted {
		color: #9ca3af;
		font-style: italic;
	}

	.contact-link {
		color: #e94560;
		text-decoration: none;
	}

	.contact-link:hover {
		text-decoration: underline;
	}

	/* Notes */
	.notes-content {
		background: #f9fafb;
		padding: 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: #4b5563;
		white-space: pre-wrap;
		line-height: 1.6;
	}

	/* Status Badges */
	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.badge-blue {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-green {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-red {
		background: #fee2e2;
		color: #991b1b;
	}

	.badge-yellow {
		background: #fef3c7;
		color: #92400e;
	}

	.badge-gray {
		background: #f3f4f6;
		color: #4b5563;
	}

	/* System Info */
	.system-info {
		background: #fafafa;
	}

	.system-info h2 {
		color: #6b7280;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}

		.detail-card.full-width {
			grid-column: span 1;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}

		.info-item.full-width {
			grid-column: span 1;
		}

		.detail-header {
			flex-direction: column;
		}
	}
</style>
