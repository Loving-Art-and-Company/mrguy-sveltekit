<script lang="ts">
	import { goto } from '$app/navigation';
	import type { BookingRow } from '$lib/repositories/bookingRepo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ─── Filters ────────────────────────────
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

	function applyFilters() {
		const params = new URLSearchParams();
		if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		if (searchQuery) params.set('search', searchQuery);
		if (data.currentMonth) params.set('month', data.currentMonth);
		goto(`/admin/bookings${params.toString() ? '?' + params : ''}`, { replaceState: true });
	}

	function clearFilters() {
		statusFilter = 'all';
		fromDate = '';
		toDate = '';
		searchQuery = '';
		goto(`/admin/bookings?month=${data.currentMonth}`, { replaceState: true });
	}

	const hasFilters = $derived(
		data.filters.status || data.filters.from || data.filters.to || data.filters.search
	);

	// ─── Calendar ───────────────────────────
	const [currentYear, currentMonthNum] = $derived(data.currentMonth.split('-').map(Number));
	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	interface CalDay {
		day: number;
		dateStr: string;
		isCurrent: boolean;
		isToday: boolean;
	}

	const calendarDays = $derived.by(() => {
		const year = currentYear;
		const month = currentMonthNum - 1;
		const first = new Date(year, month, 1);
		const last = new Date(year, month + 1, 0);
		const startDow = first.getDay();
		const daysInMonth = last.getDate();

		const todayStr = fmtDate(new Date());
		const days: CalDay[] = [];

		// Prev month padding
		const prevLast = new Date(year, month, 0).getDate();
		for (let i = startDow - 1; i >= 0; i--) {
			const d = prevLast - i;
			const date = new Date(year, month - 1, d);
			days.push({ day: d, dateStr: fmtDate(date), isCurrent: false, isToday: false });
		}

		// Current month
		for (let d = 1; d <= daysInMonth; d++) {
			const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			days.push({ day: d, dateStr: ds, isCurrent: true, isToday: ds === todayStr });
		}

		// Next month padding
		const rem = 42 - days.length;
		for (let d = 1; d <= rem; d++) {
			const date = new Date(year, month + 1, d);
			days.push({ day: d, dateStr: fmtDate(date), isCurrent: false, isToday: false });
		}

		return days;
	});

	function fmtDate(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function prevMonth() {
		const d = new Date(currentYear, currentMonthNum - 2, 1);
		const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		goto(`/admin/bookings?month=${m}`);
	}

	function nextMonth() {
		const d = new Date(currentYear, currentMonthNum, 1);
		const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		goto(`/admin/bookings?month=${m}`);
	}

	function goToToday() {
		const n = new Date();
		const m = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
		goto(`/admin/bookings?month=${m}`);
	}

	function selectDay(dateStr: string) {
		goto(`/admin/bookings?from=${dateStr}&to=${dateStr}&month=${data.currentMonth}`);
	}

	function getBookingCount(dateStr: string): number {
		return (data.calendarByDate[dateStr] ?? []).length;
	}

	function hasConfirmed(dateStr: string): boolean {
		return (data.calendarByDate[dateStr] ?? []).some(b => b.status === 'confirmed' || b.status === 'pending');
	}

	function hasCompleted(dateStr: string): boolean {
		return (data.calendarByDate[dateStr] ?? []).some(b => b.status === 'completed');
	}

	// ─── Table helpers ──────────────────────
	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
	}

	function formatDisplayDate(dateStr: string): string {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			weekday: 'short', month: 'short', day: 'numeric',
		});
	}

	function formatTime(t: string | null): string {
		if (!t) return 'TBD';
		const [h, m] = t.split(':').map(Number);
		const period = h >= 12 ? 'PM' : 'AM';
		const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
		return `${hour}:${String(m).padStart(2, '0')} ${period}`;
	}

	function statusBg(s: string | null): string {
		if (s === 'pending') return '#fef3c7';
		if (s === 'confirmed') return '#dbeafe';
		if (s === 'rescheduled') return '#e0e7ff';
		if (s === 'completed') return '#d1fae5';
		if (s === 'cancelled') return '#fee2e2';
		return '#fef3c7';
	}

	function statusFg(s: string | null): string {
		if (s === 'pending') return '#92400e';
		if (s === 'confirmed') return '#1e40af';
		if (s === 'rescheduled') return '#3730a3';
		if (s === 'completed') return '#065f46';
		if (s === 'cancelled') return '#991b1b';
		return '#92400e';
	}

	function viewBooking(b: BookingRow) {
		goto(`/admin/bookings/${b.id}`);
	}
</script>

<svelte:head>
	<title>Bookings - Mr. Guy Admin</title>
</svelte:head>

<div style="max-width: 1200px;">
	<!-- Top: Add button -->
	<div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
		<a
			href="/admin/bookings/new"
			style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; background: #e94560; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.875rem; box-shadow: 0 2px 4px rgba(233,69,96,0.25);"
		>+ Add Booking</a>
	</div>

	<!-- Calendar -->
	<div style="background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1.5rem; overflow: hidden;">
		<!-- Month nav -->
		<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1.25rem; border-bottom: 1px solid #e5e7eb;">
			<div style="display: flex; align-items: center; gap: 0.75rem;">
				<button onclick={prevMonth} style="width: 32px; height: 32px; border: 1px solid #e5e7eb; background: white; border-radius: 0.375rem; cursor: pointer; font-size: 1.25rem; color: #374151; display: flex; align-items: center; justify-content: center;">&#8249;</button>
				<span style="font-weight: 700; font-size: 1.0625rem; color: #1a1a2e; min-width: 160px; text-align: center;">
					{monthNames[currentMonthNum - 1]} {currentYear}
				</span>
				<button onclick={nextMonth} style="width: 32px; height: 32px; border: 1px solid #e5e7eb; background: white; border-radius: 0.375rem; cursor: pointer; font-size: 1.25rem; color: #374151; display: flex; align-items: center; justify-content: center;">&#8250;</button>
			</div>
			<button onclick={goToToday} style="padding: 0.375rem 0.875rem; background: #1a1a2e; color: white; border: none; border-radius: 0.375rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer;">Today</button>
		</div>

		<!-- Weekday headers -->
		<div style="display: grid; grid-template-columns: repeat(7, 1fr); background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
			{#each weekdays as wd}
				<div style="padding: 0.5rem; text-align: center; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">{wd}</div>
			{/each}
		</div>

		<!-- Days grid -->
		<div style="display: grid; grid-template-columns: repeat(7, 1fr);">
			{#each calendarDays as day}
				{@const count = getBookingCount(day.dateStr)}
				{@const isSelected = data.filters.from === day.dateStr && data.filters.to === day.dateStr}
				<button
					onclick={() => selectDay(day.dateStr)}
					style="
						min-height: 64px;
						padding: 0.375rem;
						border: none;
						border-right: 1px solid #f3f4f6;
						border-bottom: 1px solid #f3f4f6;
						background: {isSelected ? '#e9456012' : day.isToday ? '#fef3c7' : day.isCurrent ? 'white' : '#fafafa'};
						cursor: pointer;
						display: flex;
						flex-direction: column;
						align-items: flex-start;
						text-align: left;
						position: relative;
						{isSelected ? 'box-shadow: inset 0 0 0 2px #e94560;' : ''}
						{day.isToday ? 'box-shadow: inset 0 0 0 2px #f59e0b;' : ''}
					"
				>
					<span style="
						font-size: 0.8125rem;
						font-weight: {day.isToday ? '800' : '500'};
						color: {!day.isCurrent ? '#c4c4c4' : day.isToday ? '#92400e' : '#374151'};
					">{day.day}</span>
					{#if count > 0}
						<div style="margin-top: auto; display: flex; gap: 3px; align-items: center;">
							<span style="
								font-size: 0.625rem;
								font-weight: 700;
								color: white;
								background: {hasConfirmed(day.dateStr) ? '#3b82f6' : hasCompleted(day.dateStr) ? '#10b981' : '#6b7280'};
								padding: 0.0625rem 0.3125rem;
								border-radius: 0.25rem;
								line-height: 1.4;
							">{count}</span>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Filters -->
	<div style="background: white; padding: 1rem 1.25rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1rem;">
		<div style="display: flex; gap: 0.75rem; align-items: end; flex-wrap: wrap;">
			<div style="min-width: 120px;">
				<label for="sf" style="display: block; font-size: 0.6875rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.25rem;">Status</label>
				<select id="sf" bind:value={statusFilter} onchange={applyFilters} style="width: 100%; padding: 0.4375rem 0.625rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.8125rem; background: white; color: #374151;">
					<option value="all">All</option>
					<option value="pending">Pending</option>
					<option value="confirmed">Confirmed</option>
					<option value="rescheduled">Rescheduled</option>
					<option value="cancelled">Cancelled</option>
					<option value="completed">Completed</option>
				</select>
			</div>
			<div style="min-width: 130px;">
				<label for="fd" style="display: block; font-size: 0.6875rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.25rem;">From</label>
				<input type="date" id="fd" bind:value={fromDate} onchange={applyFilters} style="width: 100%; padding: 0.4375rem 0.625rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.8125rem; background: white; color: #374151;" />
			</div>
			<div style="min-width: 130px;">
				<label for="td" style="display: block; font-size: 0.6875rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.25rem;">To</label>
				<input type="date" id="td" bind:value={toDate} onchange={applyFilters} style="width: 100%; padding: 0.4375rem 0.625rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.8125rem; background: white; color: #374151;" />
			</div>
			<div style="flex: 1; min-width: 160px;">
				<label for="sq" style="display: block; font-size: 0.6875rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.25rem;">Search</label>
				<div style="display: flex; gap: 0.375rem;">
					<input type="text" id="sq" placeholder="Name or phone..." bind:value={searchQuery} onkeydown={(e) => e.key === 'Enter' && applyFilters()} style="flex: 1; padding: 0.4375rem 0.625rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.8125rem; background: white; color: #374151;" />
					<button onclick={applyFilters} style="padding: 0.4375rem 0.75rem; background: #1a1a2e; color: white; border: none; border-radius: 0.375rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer;">Go</button>
				</div>
			</div>
			{#if hasFilters}
				<button onclick={clearFilters} style="padding: 0.4375rem 0.625rem; background: transparent; border: 1px solid #d1d5db; border-radius: 0.375rem; color: #6b7280; font-size: 0.75rem; cursor: pointer; white-space: nowrap;">Clear</button>
			{/if}
		</div>
	</div>

	<!-- Count -->
	<div style="margin-bottom: 0.75rem; font-size: 0.8125rem; color: #6b7280;">
		{data.bookings.length} booking{data.bookings.length !== 1 ? 's' : ''}
		{#if hasFilters}(filtered){/if}
	</div>

	<!-- Table -->
	{#if data.bookings.length === 0}
		<div style="background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 3rem 2rem; text-align: center;">
			<div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📅</div>
			<h3 style="margin: 0 0 0.375rem; color: #1f2937; font-size: 1.125rem;">No bookings found</h3>
			<p style="margin: 0 0 1.25rem; color: #6b7280; font-size: 0.875rem;">
				{#if hasFilters}Try adjusting your filters or click a day on the calendar{:else}Bookings will appear here once customers make appointments{/if}
			</p>
			<a href="/admin/bookings/new" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; background: #e94560; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.875rem;">+ Create First Booking</a>
		</div>
	{:else}
		<div style="background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
			<div style="overflow-x: auto;">
				<table style="width: 100%; border-collapse: collapse;">
					<thead>
						<tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
							<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Date & Time</th>
							<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Client</th>
							<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Service</th>
							<th style="padding: 0.75rem 1rem; text-align: right; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Price</th>
							<th style="padding: 0.75rem 1rem; text-align: center; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Status</th>
							<th style="padding: 0.75rem 1rem;"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.bookings as booking}
							<tr style="border-bottom: 1px solid #f3f4f6; cursor: pointer;" onclick={() => viewBooking(booking)}>
								<td style="padding: 0.875rem 1rem; white-space: nowrap;">
									<div style="font-weight: 600; color: #1f2937; font-size: 0.875rem;">{formatDisplayDate(booking.date)}</div>
									<div style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.125rem;">{formatTime(booking.time)}</div>
								</td>
								<td style="padding: 0.875rem 1rem;">
									<div style="font-weight: 500; color: #1f2937; font-size: 0.875rem;">{booking.clientName}</div>
									<div style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.125rem;">{booking.contact}</div>
								</td>
								<td style="padding: 0.875rem 1rem; font-size: 0.875rem; color: #374151;">{booking.serviceName}</td>
								<td style="padding: 0.875rem 1rem; text-align: right; font-weight: 700; color: #059669; font-size: 0.9375rem;">{formatPrice(booking.price)}</td>
								<td style="padding: 0.875rem 1rem; text-align: center;">
									<span style="display: inline-block; padding: 0.1875rem 0.625rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 600; text-transform: capitalize; background: {statusBg(booking.status)}; color: {statusFg(booking.status)};">
										{booking.status || 'pending'}
									</span>
								</td>
								<td style="padding: 0.875rem 1rem; text-align: center;">
									<button
										onclick={(e) => { e.stopPropagation(); viewBooking(booking); }}
										style="padding: 0.3125rem 0.75rem; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 0.375rem; color: #374151; font-size: 0.8125rem; font-weight: 500; cursor: pointer;"
									>View</button>
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
	tr:hover {
		background: #f9fafb;
	}
</style>
