<script lang="ts">
	import { goto } from '$app/navigation';
	import type { BookingRow } from '$lib/repositories/bookingRepo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Filter form state - syncs with URL params via $effect
	// When URL changes (navigation, back/forward), we update local state
	let statusFilter = $state('all');
	let fromDate = $state('');
	let toDate = $state('');
	let searchQuery = $state('');

	// Sync local state when URL params change (e.g., browser back/forward)
	$effect(() => {
		statusFilter = data.filters.status ?? 'all';
		fromDate = data.filters.from ?? '';
		toDate = data.filters.to ?? '';
		searchQuery = data.filters.search ?? '';
	});

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
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
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

	// Apply filters by updating URL
	function applyFilters() {
		const params = new URLSearchParams();
		if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		if (searchQuery) params.set('search', searchQuery);

		const queryString = params.toString();
		goto(`/admin/bookings${queryString ? '?' + queryString : ''}`, { replaceState: true });
	}

	// Clear all filters
	function clearFilters() {
		statusFilter = 'all';
		fromDate = '';
		toDate = '';
		searchQuery = '';
		goto('/admin/bookings', { replaceState: true });
	}

	// Navigate to booking detail
	function viewBooking(booking: BookingRow) {
		goto(`/admin/bookings/${booking.id}`);
	}
</script>

<svelte:head>
	<title>Bookings - Mr. Guy Admin</title>
</svelte:head>

<div class="bookings-page">
	<!-- Filters Section -->
	<section class="filters-section">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="status-filter">Status</label>
				<select id="status-filter" bind:value={statusFilter} onchange={applyFilters}>
					<option value="all">All Statuses</option>
					<option value="confirmed">Confirmed</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="from-date">From Date</label>
				<input
					type="date"
					id="from-date"
					bind:value={fromDate}
					onchange={applyFilters}
				/>
			</div>

			<div class="filter-group">
				<label for="to-date">To Date</label>
				<input
					type="date"
					id="to-date"
					bind:value={toDate}
					onchange={applyFilters}
				/>
			</div>

			<div class="filter-group search-group">
				<label for="search">Search</label>
				<div class="search-input-wrapper">
					<input
						type="text"
						id="search"
						placeholder="Client name or phone..."
						bind:value={searchQuery}
						onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					/>
					<button class="search-btn" onclick={applyFilters}>Search</button>
				</div>
			</div>
		</div>

		{#if data.filters.status || data.filters.from || data.filters.to || data.filters.search}
			<button class="clear-filters-btn" onclick={clearFilters}>
				Clear all filters
			</button>
		{/if}
	</section>

	<!-- Results Summary -->
	<div class="results-summary">
		<span>{data.bookings.length} booking{data.bookings.length !== 1 ? 's' : ''} found</span>
	</div>

	<!-- Bookings Table -->
	<section class="table-section">
		{#if data.bookings.length === 0}
			<div class="empty-state">
				<span class="empty-icon">📅</span>
				<h3>No bookings found</h3>
				<p>
					{#if data.filters.status || data.filters.from || data.filters.to || data.filters.search}
						Try adjusting your filters
					{:else}
						Bookings will appear here once customers make appointments
					{/if}
				</p>
			</div>
		{:else}
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>Date & Time</th>
							<th>Client Name</th>
							<th>Service</th>
							<th>Price</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.bookings as booking}
							<tr>
								<td class="date-cell">
									<div class="date-primary">{formatDate(booking.date)}</div>
									<div class="date-secondary">{booking.time || 'TBD'}</div>
								</td>
								<td>
									<div class="client-name">{booking.clientName}</div>
									<div class="client-contact">{booking.contact}</div>
								</td>
								<td>{booking.serviceName}</td>
								<td class="price-cell">{formatPrice(booking.price)}</td>
								<td>
									<span class="status-badge {getStatusClass(booking.status)}">
										{booking.status || 'pending'}
									</span>
								</td>
								<td>
									<button class="view-btn" onclick={() => viewBooking(booking)}>
										View
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>

<style>
	.bookings-page {
		max-width: 1400px;
	}

	/* Filters */
	.filters-section {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.filter-group select,
	.filter-group input {
		padding: 0.625rem 0.875rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		color: #1f2937;
	}

	.filter-group select:focus,
	.filter-group input:focus {
		outline: none;
		border-color: #e94560;
		box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
	}

	.search-group {
		grid-column: span 2;
	}

	.search-input-wrapper {
		display: flex;
		gap: 0.5rem;
	}

	.search-input-wrapper input {
		flex: 1;
	}

	.search-btn {
		padding: 0.625rem 1rem;
		background: #e94560;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.search-btn:hover {
		background: #d63651;
	}

	.clear-filters-btn {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		color: #6b7280;
		font-size: 0.875rem;
		cursor: pointer;
		transition: border-color 0.2s, color 0.2s;
	}

	.clear-filters-btn:hover {
		border-color: #9ca3af;
		color: #374151;
	}

	/* Results Summary */
	.results-summary {
		margin-bottom: 1rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	/* Table */
	.table-section {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: #f9fafb;
	}

	th {
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		border-bottom: 1px solid #e5e7eb;
		white-space: nowrap;
	}

	td {
		padding: 1rem;
		border-bottom: 1px solid #e5e7eb;
		font-size: 0.875rem;
		color: #374151;
	}

	tbody tr:hover {
		background: #f9fafb;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.date-cell {
		white-space: nowrap;
	}

	.date-primary {
		font-weight: 500;
		color: #1f2937;
	}

	.date-secondary {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.client-name {
		font-weight: 500;
		color: #1f2937;
	}

	.client-contact {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.price-cell {
		font-weight: 600;
		color: #059669;
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

	.badge-gray {
		background: #f3f4f6;
		color: #4b5563;
	}

	.view-btn {
		padding: 0.375rem 0.75rem;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		color: #374151;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s;
	}

	.view-btn:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	/* Empty State */
	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		color: #1f2937;
		font-size: 1.25rem;
	}

	.empty-state p {
		margin: 0;
		color: #6b7280;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.filters-grid {
			grid-template-columns: 1fr;
		}

		.search-group {
			grid-column: span 1;
		}

		th, td {
			padding: 0.75rem;
		}
	}
</style>
