<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { BookingRow } from '$lib/repositories/bookingRepo';
	import type { PageData } from './$types';

	type CalendarBooking = Pick<
		BookingRow,
		'id' | 'date' | 'time' | 'clientName' | 'serviceName' | 'status' | 'price' | 'contact' | 'paymentStatus'
	>;

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

	const hasFilters = $derived(
		Boolean(data.filters.status || data.filters.from || data.filters.to || data.filters.search)
	);

	const calendarDays = $derived.by(() => {
		const year = currentYear;
		const month = currentMonthNum - 1;
		const first = new Date(year, month, 1);
		const last = new Date(year, month + 1, 0);
		const startDow = first.getDay();
		const daysInMonth = last.getDate();
		const todayStr = fmtDate(new Date());
		const days: CalDay[] = [];

		const prevLast = new Date(year, month, 0).getDate();
		for (let i = startDow - 1; i >= 0; i--) {
			const d = prevLast - i;
			const date = new Date(year, month - 1, d);
			days.push({ day: d, dateStr: fmtDate(date), isCurrent: false, isToday: false });
		}

		for (let d = 1; d <= daysInMonth; d++) {
			const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			days.push({ day: d, dateStr: ds, isCurrent: true, isToday: ds === todayStr });
		}

		const rem = 42 - days.length;
		for (let d = 1; d <= rem; d++) {
			const date = new Date(year, month + 1, d);
			days.push({ day: d, dateStr: fmtDate(date), isCurrent: false, isToday: false });
		}

		return days;
	});

	const selectedDate = $derived.by(() => {
		const from = data.filters.from;
		const to = data.filters.to;
		const selected = page.url.searchParams.get('selectedDate');
		if (selected) return selected;
		if (from && to && from === to) return from;

		const today = fmtDate(new Date());
		if (today.startsWith(data.currentMonth)) return today;
		return `${data.currentMonth}-01`;
	});

	const selectedDayBookings = $derived((data.calendarByDate[selectedDate] ?? []) as CalendarBooking[]);
	const selectedDayCountLabel = $derived(
		`${selectedDayBookings.length} booking${selectedDayBookings.length === 1 ? '' : 's'}`
	);
	const currentViewUrl = $derived(`${page.url.pathname}${page.url.search}`);
	const addBookingHref = $derived(
		`/admin/bookings/new?date=${selectedDate}&returnTo=${encodeURIComponent(currentViewUrl)}`
	);
	const isDayFiltered = $derived(data.filters.from === selectedDate && data.filters.to === selectedDate);

	function fmtDate(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function formatDisplayDate(dateStr: string): string {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatLongDate(dateStr: string): string {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
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

	function statusLabel(s: string | null): string {
		if (s === 'pending') return 'Awaiting Pablo';
		if (s === 'confirmed') return 'Confirmed';
		if (s === 'rescheduled') return 'Reschedule Requested';
		if (s === 'completed') return 'Completed';
		if (s === 'cancelled') return 'Cancelled';
		return 'Awaiting Pablo';
	}

	function buildBookingsUrl(overrides: Record<string, string | null>): string {
		const params = new URLSearchParams(page.url.search);
		for (const [key, value] of Object.entries(overrides)) {
			if (value) params.set(key, value);
			else params.delete(key);
		}
		return `/admin/bookings${params.toString() ? `?${params}` : ''}`;
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		if (searchQuery) params.set('search', searchQuery);
		if (data.currentMonth) params.set('month', data.currentMonth);
		params.set('selectedDate', selectedDate);
		goto(`/admin/bookings${params.toString() ? '?' + params : ''}`, { replaceState: true });
	}

	function clearFilters() {
		statusFilter = 'all';
		fromDate = '';
		toDate = '';
		searchQuery = '';
		goto(buildBookingsUrl({ from: null, to: null, status: null, search: null, month: data.currentMonth, selectedDate }), {
			replaceState: true
		});
	}

	function prevMonth() {
		const d = new Date(currentYear, currentMonthNum - 2, 1);
		const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		goto(buildBookingsUrl({ month, selectedDate: `${month}-01`, from: null, to: null }), { replaceState: true });
	}

	function nextMonth() {
		const d = new Date(currentYear, currentMonthNum, 1);
		const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		goto(buildBookingsUrl({ month, selectedDate: `${month}-01`, from: null, to: null }), { replaceState: true });
	}

	function goToToday() {
		const now = new Date();
		const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
		const today = fmtDate(now);
		goto(buildBookingsUrl({ month, selectedDate: today }), { replaceState: true });
	}

	function selectDay(dateStr: string) {
		goto(buildBookingsUrl({ selectedDate: dateStr }), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function handleCalendarDayKeydown(event: KeyboardEvent, dateStr: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectDay(dateStr);
		}
	}

	function showSelectedDayInList() {
		goto(buildBookingsUrl({ from: selectedDate, to: selectedDate }), { replaceState: true });
	}

	function clearSelectedDayFilter() {
		goto(buildBookingsUrl({ from: null, to: null }), { replaceState: true });
	}

	function bookingHref(bookingId: string) {
		return `/admin/bookings/${bookingId}?returnTo=${encodeURIComponent(currentViewUrl)}`;
	}

	function confirmDelete(event: SubmitEvent, booking: Pick<BookingRow, 'clientName' | 'time'>, dateStr: string) {
		const label = `${booking.clientName} on ${dateStr}${booking.time ? ` at ${formatTime(booking.time)}` : ''}`;
		if (!window.confirm(`Delete ${label}? This cannot be undone.`)) {
			event.preventDefault();
		}
	}

	function viewBooking(booking: Pick<BookingRow, 'id'>) {
		goto(bookingHref(booking.id));
	}
</script>

<svelte:head>
	<title>Bookings - Mr. Guy Admin</title>
</svelte:head>

<div class="bookings-page">
	<div class="topbar">
		<div class="topbar-copy">
			<h2>Bookings</h2>
			<p>Calendar-first scheduling with direct add, edit, and delete actions.</p>
		</div>
		<a href={addBookingHref} class="add-button">+ Add Booking</a>
	</div>

	<div class="calendar-shell">
		<section class="calendar-card">
			<div class="calendar-header">
				<div class="month-nav">
					<button type="button" class="nav-button" onclick={prevMonth} aria-label="Previous month">&#8249;</button>
					<h3>{monthNames[currentMonthNum - 1]} {currentYear}</h3>
					<button type="button" class="nav-button" onclick={nextMonth} aria-label="Next month">&#8250;</button>
				</div>
				<button type="button" class="today-button" onclick={goToToday}>Today</button>
			</div>

			<div class="weekday-row">
				{#each weekdays as wd}
					<div>{wd}</div>
				{/each}
			</div>

			<div class="calendar-grid">
				{#each calendarDays as day}
					{@const dayBookings = (data.calendarByDate[day.dateStr] ?? []) as CalendarBooking[]}
					{@const isSelected = selectedDate === day.dateStr}
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<div
						role="button"
						tabindex="0"
						class="calendar-day"
						class:outside-month={!day.isCurrent}
						class:selected={isSelected}
						class:today={day.isToday}
						aria-label={`Open details for ${day.dateStr}`}
						onclick={() => selectDay(day.dateStr)}
						onkeydown={(event) => handleCalendarDayKeydown(event, day.dateStr)}
					>
						<div class="calendar-day-head">
							<span class="calendar-day-number">{day.day}</span>
							{#if dayBookings.length > 0}
								<span class="calendar-day-count">{dayBookings.length}</span>
							{/if}
						</div>
						<div class="calendar-events">
							{#each dayBookings.slice(0, 3) as b}
								<div class="calendar-event-row">
									<a
										href={bookingHref(b.id)}
										class="calendar-event"
										aria-label={`Open booking ${b.id} for ${b.clientName}`}
										onclick={(event) => {
											event.stopPropagation();
										}}
										style={`background:${statusBg(b.status)};color:${statusFg(b.status)};border-left-color:${statusFg(b.status)};`}
									>{formatTime(b.time)} {b.clientName}</a>
									<form
										method="POST"
										action="?/deleteBooking"
										onsubmit={(event) => confirmDelete(event, b, day.dateStr)}
									>
										<input type="hidden" name="bookingId" value={b.id} />
										<input type="hidden" name="redirectTo" value={currentViewUrl} />
										<button
											type="submit"
											class="delete-chip"
											aria-label={`Delete booking for ${b.clientName}`}
											title={`Delete ${b.clientName}`}
											onclick={(event) => {
												event.stopPropagation();
											}}
										>x</button>
									</form>
								</div>
							{/each}
							{#if dayBookings.length > 3}
								<div class="calendar-more">+{dayBookings.length - 3} more</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<aside class="day-panel">
			<div class="day-panel-header">
				<div>
					<p class="eyebrow">Selected Day</p>
					<h3>{formatLongDate(selectedDate)}</h3>
					<p class="muted">{selectedDayCountLabel}</p>
				</div>
				<a href={addBookingHref} class="day-panel-add">+ Add Booking</a>
			</div>

			<div class="day-panel-actions">
				{#if isDayFiltered}
					<button type="button" class="secondary-button" onclick={clearSelectedDayFilter}>Show Full List</button>
				{:else}
					<button type="button" class="secondary-button" onclick={showSelectedDayInList}>Filter List to This Day</button>
				{/if}
			</div>

			{#if selectedDayBookings.length === 0}
				<div class="empty-day">
					<p>No bookings on this date yet.</p>
					<p>Click add to create one directly for {formatDisplayDate(selectedDate)}.</p>
				</div>
			{:else}
				<div class="day-booking-list">
					{#each selectedDayBookings as booking}
						<div class="day-booking-card">
							<div class="day-booking-main">
								<div>
									<div class="day-booking-time">{formatTime(booking.time)}</div>
									<div class="day-booking-name">{booking.clientName}</div>
									<div class="day-booking-service">{booking.serviceName}</div>
								</div>
								<div class="day-booking-meta">
									<span class="day-booking-price">{formatPrice(booking.price)}</span>
									<span
										class="status-pill"
										style={`background:${statusBg(booking.status)};color:${statusFg(booking.status)};`}
									>{statusLabel(booking.status)}</span>
								</div>
							</div>

							<div class="day-booking-subline">
								<span>{booking.contact}</span>
								<span>{booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</span>
							</div>

							<div class="day-booking-actions">
								<a href={bookingHref(booking.id)} class="card-action primary">Edit</a>
								<form method="POST" action="?/deleteBooking" onsubmit={(event) => confirmDelete(event, booking, selectedDate)}>
									<input type="hidden" name="bookingId" value={booking.id} />
									<input type="hidden" name="redirectTo" value={currentViewUrl} />
									<button type="submit" class="card-action danger">Delete</button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</aside>
	</div>

	<div class="filters-card">
		<div class="filters-grid">
			<div>
				<label for="sf">Status</label>
				<select id="sf" bind:value={statusFilter} onchange={applyFilters}>
					<option value="all">All</option>
					<option value="pending">Awaiting Pablo</option>
					<option value="confirmed">Confirmed</option>
					<option value="rescheduled">Reschedule Requested</option>
					<option value="cancelled">Cancelled</option>
					<option value="completed">Completed</option>
				</select>
			</div>
			<div>
				<label for="fd">From</label>
				<input type="date" id="fd" bind:value={fromDate} onchange={applyFilters} />
			</div>
			<div>
				<label for="td">To</label>
				<input type="date" id="td" bind:value={toDate} onchange={applyFilters} />
			</div>
			<div class="search-field">
				<label for="sq">Search</label>
				<div class="search-row">
					<input
						type="text"
						id="sq"
						placeholder="Name or phone..."
						bind:value={searchQuery}
						onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					/>
					<button type="button" onclick={applyFilters}>Go</button>
				</div>
			</div>
			{#if hasFilters}
				<button type="button" class="clear-button" onclick={clearFilters}>Clear</button>
			{/if}
		</div>
	</div>

	<div class="list-meta">
		<span>{data.bookings.length} booking{data.bookings.length !== 1 ? 's' : ''}</span>
		{#if hasFilters}
			<span>Filtered view</span>
		{/if}
	</div>

	{#if data.bookings.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📅</div>
			<h3>No bookings found</h3>
			<p>{hasFilters ? 'Adjust the filters or use the day panel to jump into a specific date.' : 'Bookings will appear here once customers make appointments.'}</p>
			<a href={addBookingHref} class="add-button">+ Create Booking</a>
		</div>
	{:else}
		<div class="table-card">
			<div class="table-scroll">
				<table>
					<thead>
						<tr>
							<th>Date & Time</th>
							<th>Client</th>
							<th>Service</th>
							<th>Price</th>
							<th>Status</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.bookings as booking}
							<tr onclick={() => viewBooking(booking)}>
								<td>
									<div class="table-primary">{formatDisplayDate(booking.date)}</div>
									<div class="table-secondary">{formatTime(booking.time)}</div>
								</td>
								<td>
									<div class="table-primary">{booking.clientName}</div>
									<div class="table-secondary">{booking.contact}</div>
								</td>
								<td>{booking.serviceName}</td>
								<td class="price-cell">{formatPrice(booking.price)}</td>
								<td>
									<span class="status-pill" style={`background:${statusBg(booking.status)};color:${statusFg(booking.status)};`}>
										{statusLabel(booking.status)}
									</span>
								</td>
								<td class="view-cell">
									<button
										type="button"
										onclick={(event) => {
											event.stopPropagation();
											viewBooking(booking);
										}}
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
	.bookings-page {
		max-width: 1280px;
		display: grid;
		gap: 1rem;
	}

	.topbar,
	.calendar-card,
	.day-panel,
	.filters-card,
	.table-card,
	.empty-state {
		background: white;
		border-radius: 0.9rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.topbar {
		padding: 1rem 1.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.topbar-copy h2,
	.day-panel-header h3,
	.empty-state h3 {
		margin: 0;
		color: #1a1a2e;
	}

	.topbar-copy p,
	.muted,
	.empty-state p {
		margin: 0.25rem 0 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.add-button,
	.day-panel-add {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.7rem 1.2rem;
		background: #e94560;
		color: white;
		border-radius: 0.65rem;
		text-decoration: none;
		font-weight: 700;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.calendar-shell {
		display: grid;
		grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.85fr);
		gap: 1rem;
		align-items: start;
	}

	.calendar-card {
		overflow: hidden;
	}

	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.9rem 1.15rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.month-nav {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.month-nav h3 {
		margin: 0;
		min-width: 180px;
		text-align: center;
		color: #1a1a2e;
		font-size: 1.05rem;
	}

	.nav-button,
	.today-button,
	.secondary-button,
	.search-row button,
	.clear-button,
	.view-cell button,
	.card-action {
		border: none;
		border-radius: 0.55rem;
		cursor: pointer;
		font: inherit;
	}

	.nav-button {
		width: 34px;
		height: 34px;
		background: white;
		border: 1px solid #e5e7eb;
		color: #374151;
		font-size: 1.2rem;
	}

	.today-button {
		padding: 0.5rem 0.9rem;
		background: #1a1a2e;
		color: white;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.weekday-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}

	.weekday-row div {
		padding: 0.55rem;
		text-align: center;
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #9ca3af;
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.calendar-day {
		min-height: 118px;
		padding: 0.45rem;
		border-right: 1px solid #f3f4f6;
		border-bottom: 1px solid #f3f4f6;
		background: white;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		cursor: pointer;
	}

	.calendar-day:nth-child(7n) {
		border-right: none;
	}

	.calendar-day.outside-month {
		background: #fafafa;
	}

	.calendar-day.today {
		box-shadow: inset 0 0 0 2px #f59e0b;
	}

	.calendar-day.selected {
		background: #fff4f6;
		box-shadow: inset 0 0 0 2px #e94560;
	}

	.calendar-day-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.calendar-day-number {
		font-size: 0.78rem;
		font-weight: 700;
		color: #374151;
	}

	.calendar-day.outside-month .calendar-day-number {
		color: #c4c4c4;
	}

	.calendar-day-count {
		font-size: 0.65rem;
		font-weight: 700;
		color: #6b7280;
	}

	.calendar-events {
		display: grid;
		gap: 0.18rem;
	}

	.calendar-event-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.2rem;
		align-items: stretch;
	}

	.calendar-event {
		display: block;
		min-width: 0;
		padding: 0.15rem 0.3rem;
		border-radius: 0.3rem;
		border-left: 2px solid;
		font-size: 0.58rem;
		font-weight: 700;
		line-height: 1.45;
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.delete-chip {
		background: #fff1f2;
		color: #be123c;
		border: 1px solid #fecdd3;
		border-radius: 0.3rem;
		padding: 0 0.3rem;
		font-size: 0.62rem;
		font-weight: 800;
		cursor: pointer;
	}

	.calendar-more {
		font-size: 0.58rem;
		font-weight: 700;
		color: #6b7280;
		padding: 0 0.2rem;
	}

	.day-panel {
		padding: 1rem;
		display: grid;
		gap: 1rem;
		position: sticky;
		top: 1rem;
	}

	.day-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 1rem;
	}

	.eyebrow,
	.filters-grid label {
		margin: 0 0 0.25rem;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #9ca3af;
	}

	.day-panel-actions {
		display: flex;
	}

	.secondary-button,
	.clear-button {
		padding: 0.65rem 0.9rem;
		background: #f3f4f6;
		color: #374151;
		font-weight: 600;
	}

	.empty-day {
		padding: 1rem;
		background: #f8fafc;
		border-radius: 0.8rem;
		color: #475569;
	}

	.empty-day p {
		margin: 0;
	}

	.empty-day p + p {
		margin-top: 0.4rem;
	}

	.day-booking-list {
		display: grid;
		gap: 0.75rem;
	}

	.day-booking-card {
		padding: 0.9rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.8rem;
		display: grid;
		gap: 0.75rem;
	}

	.day-booking-main,
	.day-booking-actions,
	.list-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.day-booking-time {
		font-size: 0.78rem;
		font-weight: 800;
		color: #0f172a;
	}

	.day-booking-name {
		margin-top: 0.15rem;
		font-size: 1rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.day-booking-service,
	.day-booking-subline,
	.table-secondary {
		font-size: 0.8rem;
		color: #6b7280;
	}

	.day-booking-meta {
		display: grid;
		justify-items: end;
		gap: 0.4rem;
	}

	.day-booking-price,
	.price-cell {
		font-weight: 800;
		color: #059669;
	}

	.day-booking-subline {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.card-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.6rem 0.9rem;
		min-width: 96px;
		font-size: 0.82rem;
		font-weight: 700;
		text-decoration: none;
	}

	.card-action.primary {
		background: #1a1a2e;
		color: white;
	}

	.card-action.danger {
		background: #fff1f2;
		color: #be123c;
		border: 1px solid #fecdd3;
	}

	.filters-card {
		padding: 1rem 1.15rem;
	}

	.filters-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: end;
	}

	.filters-grid > div {
		min-width: 130px;
	}

	.search-field {
		flex: 1;
		min-width: 200px;
	}

	.filters-grid input,
	.filters-grid select {
		width: 100%;
		padding: 0.55rem 0.7rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font: inherit;
		background: white;
		color: #1f2937;
	}

	.search-row {
		display: flex;
		gap: 0.4rem;
	}

	.search-row button,
	.view-cell button {
		padding: 0.55rem 0.85rem;
		background: #1a1a2e;
		color: white;
		font-size: 0.82rem;
		font-weight: 600;
	}

	.list-meta {
		font-size: 0.82rem;
		color: #6b7280;
	}

	.empty-state {
		padding: 2.5rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 2.4rem;
		margin-bottom: 0.7rem;
	}

	.table-card {
		overflow: hidden;
	}

	.table-scroll {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		padding: 0.8rem 1rem;
		text-align: left;
		font-size: 0.69rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #9ca3af;
		background: #f9fafb;
		border-bottom: 2px solid #e5e7eb;
	}

	td {
		padding: 0.9rem 1rem;
		border-bottom: 1px solid #f3f4f6;
		color: #374151;
		font-size: 0.88rem;
	}

	tbody tr {
		cursor: pointer;
	}

	tbody tr:hover {
		background: #f9fafb;
	}

	.table-primary {
		font-weight: 600;
		color: #1f2937;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.22rem 0.65rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 700;
	}

	.view-cell {
		text-align: center;
	}

	@media (max-width: 1024px) {
		.calendar-shell {
			grid-template-columns: 1fr;
		}

		.day-panel {
			position: static;
		}
	}

	@media (max-width: 720px) {
		.topbar,
		.day-panel-header,
		.day-booking-main,
		.day-booking-subline,
		.day-booking-actions,
		.list-meta {
			flex-direction: column;
			align-items: stretch;
		}

		.month-nav h3 {
			min-width: 120px;
			font-size: 0.95rem;
		}

		.calendar-day {
			min-height: 100px;
		}

		.day-panel {
			padding-bottom: calc(6rem + env(safe-area-inset-bottom, 0px));
		}

		.day-booking-actions {
			position: sticky;
			bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
			padding-top: 0.35rem;
			background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff 35%);
		}
	}
</style>
