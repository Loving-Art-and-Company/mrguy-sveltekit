<script lang="ts">
	import { goto } from '$app/navigation';
	import type { BookingRow } from '$lib/repositories/bookingRepo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let statusFilter = $state('all');
	let fromDate = $state('');
	let toDate = $state('');
	let searchQuery = $state('');

	$effect(() => {
		statusFilter = data.filters.status ?? 'all';
		fromDate = data.filters.from ?? '';
		toDate = data.filters.to ?? '';
		searchQuery = data.filters.search ?? '';
	});

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(price);
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
		});
	}

	function formatTime(time: string | null): string {
		if (!time) return 'TBD';
		const [h, m] = time.split(':').map(Number);
		const period = h >= 12 ? 'PM' : 'AM';
		const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
		return `${hour}:${String(m).padStart(2, '0')} ${period}`;
	}

	function getStatusColor(status: string | null): { bg: string; text: string } {
		switch (status) {
			case 'confirmed':
				return { bg: '#dbeafe', text: '#1e40af' };
			case 'completed':
				return { bg: '#d1fae5', text: '#065f46' };
			case 'cancelled':
				return { bg: '#fee2e2', text: '#991b1b' };
			default:
				return { bg: '#fef3c7', text: '#92400e' };
		}
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		if (searchQuery) params.set('search', searchQuery);

		const queryString = params.toString();
		goto(`/admin/bookings${queryString ? '?' + queryString : ''}`, { replaceState: true });
	}

	function clearFilters() {
		statusFilter = 'all';
		fromDate = '';
		toDate = '';
		searchQuery = '';
		goto('/admin/bookings', { replaceState: true });
	}

	function viewBooking(booking: BookingRow) {
		goto(`/admin/bookings/${booking.id}`);
	}

	const hasFilters = $derived(
		data.filters.status || data.filters.from || data.filters.to || data.filters.search
	);
</script>

<svelte:head>
	<title>Bookings - Mr. Guy Admin</title>
</svelte:head>

<div style="max-width: 1200px;">
	<!-- Header Row -->
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
		<div>
			<p style="margin: 0; color: #6b7280; font-size: 0.875rem;">
				{data.bookings.length} booking{data.bookings.length !== 1 ? 's' : ''}
				{#if hasFilters}
					(filtered)
				{/if}
			</p>
		</div>
		<a
			href="/admin/bookings/new"
			style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; background: #e94560; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.875rem; box-shadow: 0 1px 3px rgba(233, 69, 96, 0.3); transition: background 0.2s;"
		>
			+ Add Booking
		</a>
	</div>

	<!-- Filters Card -->
	<div style="background: white; padding: 1.25rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1.5rem;">
		<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; align-items: end;">
			<div>
				<label for="status-filter" style="display: block; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem;">Status</label>
				<select
					id="status-filter"
					bind:value={statusFilter}
					onchange={applyFilters}
					style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem; background: white; color: #374151; appearance: auto;"
				>
					<option value="all">All Statuses</option>
					<option value="confirmed">Confirmed</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>

			<div>
				<label for="from-date" style="display: block; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem;">From</label>
				<input
					type="date"
					id="from-date"
					bind:value={fromDate}
					onchange={applyFilters}
					style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem; background: white; color: #374151;"
				/>
			</div>

			<div>
				<label for="to-date" style="display: block; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem;">To</label>
				<input
					type="date"
					id="to-date"
					bind:value={toDate}
					onchange={applyFilters}
					style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem; background: white; color: #374151;"
				/>
			</div>

			<div>
				<label for="search" style="display: block; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem;">Search</label>
				<div style="display: flex; gap: 0.5rem;">
					<input
						type="text"
						id="search"
						placeholder="Name or phone..."
						bind:value={searchQuery}
						onkeydown={(e) => e.key === 'Enter' && applyFilters()}
						style="flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem; background: white; color: #374151;"
					/>
					<button
						onclick={applyFilters}
						style="padding: 0.5rem 1rem; background: #1a1a2e; color: white; border: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; cursor: pointer;"
					>Go</button>
				</div>
			</div>
		</div>

		{#if hasFilters}
			<button
				onclick={clearFilters}
				style="margin-top: 0.75rem; padding: 0.375rem 0.75rem; background: transparent; border: 1px solid #d1d5db; border-radius: 0.375rem; color: #6b7280; font-size: 0.8125rem; cursor: pointer;"
			>
				Clear filters
			</button>
		{/if}
	</div>

	<!-- Bookings List -->
	{#if data.bookings.length === 0}
		<div style="background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 4rem 2rem; text-align: center;">
			<div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
			<h3 style="margin: 0 0 0.5rem; color: #1f2937; font-size: 1.25rem;">No bookings found</h3>
			<p style="margin: 0 0 1.5rem; color: #6b7280;">
				{#if hasFilters}
					Try adjusting your filters
				{:else}
					Bookings will appear here once customers make appointments
				{/if}
			</p>
			<a
				href="/admin/bookings/new"
				style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; background: #e94560; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.875rem;"
			>
				+ Create First Booking
			</a>
		</div>
	{:else}
		<div style="background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
			<div style="overflow-x: auto;">
				<table style="width: 100%; border-collapse: collapse;">
					<thead>
						<tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
							<th style="padding: 0.875rem 1rem; text-align: left; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280;">Date & Time</th>
							<th style="padding: 0.875rem 1rem; text-align: left; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280;">Client</th>
							<th style="padding: 0.875rem 1rem; text-align: left; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280;">Service</th>
							<th style="padding: 0.875rem 1rem; text-align: right; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280;">Price</th>
							<th style="padding: 0.875rem 1rem; text-align: center; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280;">Status</th>
							<th style="padding: 0.875rem 1rem; text-align: center; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280;"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.bookings as booking}
							{@const statusColor = getStatusColor(booking.status)}
							<tr style="border-bottom: 1px solid #f3f4f6; cursor: pointer;" onclick={() => viewBooking(booking)}>
								<td style="padding: 1rem; white-space: nowrap;">
									<div style="font-weight: 600; color: #1f2937; font-size: 0.875rem;">{formatDate(booking.date)}</div>
									<div style="color: #6b7280; font-size: 0.75rem; margin-top: 0.125rem;">{formatTime(booking.time)}</div>
								</td>
								<td style="padding: 1rem;">
									<div style="font-weight: 500; color: #1f2937; font-size: 0.875rem;">{booking.clientName}</div>
									<div style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.125rem;">{booking.contact}</div>
								</td>
								<td style="padding: 1rem; font-size: 0.875rem; color: #374151;">{booking.serviceName}</td>
								<td style="padding: 1rem; text-align: right; font-weight: 700; color: #059669; font-size: 0.9375rem;">
									{formatPrice(booking.price)}
								</td>
								<td style="padding: 1rem; text-align: center;">
									<span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 600; text-transform: capitalize; background: {statusColor.bg}; color: {statusColor.text};">
										{booking.status || 'pending'}
									</span>
								</td>
								<td style="padding: 1rem; text-align: center;">
									<button
										onclick={(e) => { e.stopPropagation(); viewBooking(booking); }}
										style="padding: 0.375rem 0.875rem; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 0.375rem; color: #374151; font-size: 0.8125rem; font-weight: 500; cursor: pointer;"
									>
										View
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<style>
	@media (max-width: 768px) {
		div[style*="grid-template-columns: repeat(4"] {
			grid-template-columns: 1fr 1fr !important;
		}
	}

	@media (max-width: 480px) {
		div[style*="grid-template-columns: repeat(4"] {
			grid-template-columns: 1fr !important;
		}
	}

	tr:hover {
		background: #f9fafb;
	}

	button:hover {
		opacity: 0.9;
	}

	a[style*="background: #e94560"]:hover {
		filter: brightness(0.95);
	}
</style>
