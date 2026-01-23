<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Booking } from '$lib/types/database';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Parse current month from data
	const [currentYear, currentMonthNum] = $derived(data.currentMonth.split('-').map(Number));

	// Day of week headers
	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// Month names for display
	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	// Generate calendar days for the current month
	interface CalendarDay {
		date: Date;
		dateStr: string;
		isCurrentMonth: boolean;
		isToday: boolean;
	}

	const calendarDays = $derived.by(() => {
		const year = currentYear;
		const month = currentMonthNum - 1; // Convert to 0-indexed

		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startDayOfWeek = firstDay.getDay();
		const daysInMonth = lastDay.getDate();

		const today = new Date();
		const todayStr = formatDate(today);

		const days: CalendarDay[] = [];

		// Previous month padding
		const prevMonth = new Date(year, month, 0);
		for (let i = startDayOfWeek - 1; i >= 0; i--) {
			const d = new Date(year, month - 1, prevMonth.getDate() - i);
			days.push({
				date: d,
				dateStr: formatDate(d),
				isCurrentMonth: false,
				isToday: false,
			});
		}

		// Current month days
		for (let d = 1; d <= daysInMonth; d++) {
			const date = new Date(year, month, d);
			const dateStr = formatDate(date);
			days.push({
				date,
				dateStr,
				isCurrentMonth: true,
				isToday: dateStr === todayStr,
			});
		}

		// Next month padding (fill to 42 cells = 6 rows)
		const remaining = 42 - days.length;
		for (let d = 1; d <= remaining; d++) {
			const date = new Date(year, month + 1, d);
			days.push({
				date,
				dateStr: formatDate(date),
				isCurrentMonth: false,
				isToday: false,
			});
		}

		return days;
	});

	// Format date as YYYY-MM-DD
	function formatDate(date: Date): string {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	}

	// Navigate to previous month
	function prevMonth() {
		const year = currentYear;
		const month = currentMonthNum - 1; // 0-indexed
		const prevDate = new Date(year, month - 1, 1);
		const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
		goto(`/admin/calendar?month=${newMonth}`);
	}

	// Navigate to next month
	function nextMonth() {
		const year = currentYear;
		const month = currentMonthNum - 1;
		const nextDate = new Date(year, month + 1, 1);
		const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
		goto(`/admin/calendar?month=${newMonth}`);
	}

	// Jump to today
	function goToToday() {
		const now = new Date();
		const todayMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
		goto(`/admin/calendar?month=${todayMonth}`);
	}

	// Navigate to bookings page for a specific date
	function viewDayBookings(dateStr: string) {
		goto(`/admin/bookings?from=${dateStr}&to=${dateStr}`);
	}

	// Get bookings for a specific date
	function getBookingsForDate(dateStr: string): Booking[] {
		return data.bookings[dateStr] ?? [];
	}

	// Count bookings by status for a date
	function getStatusCounts(bookings: Booking[]): { confirmed: number; completed: number; cancelled: number } {
		return bookings.reduce(
			(acc, b) => {
				if (b.status === 'confirmed') acc.confirmed++;
				else if (b.status === 'completed') acc.completed++;
				else if (b.status === 'cancelled') acc.cancelled++;
				return acc;
			},
			{ confirmed: 0, completed: 0, cancelled: 0 }
		);
	}
</script>

<svelte:head>
	<title>Calendar - Mr. Guy Admin</title>
</svelte:head>

<div class="calendar-page">
	<!-- Month Navigation Header -->
	<header class="calendar-header">
		<div class="nav-controls">
			<button class="nav-btn" onclick={prevMonth} aria-label="Previous month">
				<span class="arrow">‹</span>
			</button>
			<h2 class="month-title">
				{monthNames[currentMonthNum - 1]} {currentYear}
			</h2>
			<button class="nav-btn" onclick={nextMonth} aria-label="Next month">
				<span class="arrow">›</span>
			</button>
		</div>
		<button class="today-btn" onclick={goToToday}>Today</button>
	</header>

	<!-- Calendar Grid -->
	<div class="calendar-container">
		<!-- Weekday Headers -->
		<div class="weekday-header">
			{#each weekdays as day}
				<div class="weekday">{day}</div>
			{/each}
		</div>

		<!-- Days Grid -->
		<div class="days-grid">
			{#each calendarDays as day}
				{@const bookings = getBookingsForDate(day.dateStr)}
				{@const hasBookings = bookings.length > 0}
				{@const statusCounts = getStatusCounts(bookings)}
				<button
					class="day-cell"
					class:outside-month={!day.isCurrentMonth}
					class:today={day.isToday}
					class:has-bookings={hasBookings}
					onclick={() => viewDayBookings(day.dateStr)}
					type="button"
				>
					<span class="day-number">{day.date.getDate()}</span>
					{#if hasBookings}
						<div class="booking-indicators">
							<span class="booking-count">{bookings.length}</span>
							<div class="status-dots">
								{#if statusCounts.confirmed > 0}
									<span class="dot dot-confirmed" title="{statusCounts.confirmed} confirmed"></span>
								{/if}
								{#if statusCounts.completed > 0}
									<span class="dot dot-completed" title="{statusCounts.completed} completed"></span>
								{/if}
								{#if statusCounts.cancelled > 0}
									<span class="dot dot-cancelled" title="{statusCounts.cancelled} cancelled"></span>
								{/if}
							</div>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Legend -->
	<div class="legend">
		<div class="legend-item">
			<span class="dot dot-confirmed"></span>
			<span>Confirmed</span>
		</div>
		<div class="legend-item">
			<span class="dot dot-completed"></span>
			<span>Completed</span>
		</div>
		<div class="legend-item">
			<span class="dot dot-cancelled"></span>
			<span>Cancelled</span>
		</div>
	</div>
</div>

<style>
	.calendar-page {
		max-width: 1000px;
	}

	/* Header */
	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		background: white;
		padding: 1rem 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.nav-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.nav-btn {
		width: 36px;
		height: 36px;
		border: 1px solid #d1d5db;
		background: white;
		border-radius: 0.375rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s, border-color 0.2s;
	}

	.nav-btn:hover {
		background: #f3f4f6;
		border-color: #9ca3af;
	}

	.arrow {
		font-size: 1.5rem;
		line-height: 1;
		color: #374151;
	}

	.month-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a2e;
		min-width: 180px;
		text-align: center;
	}

	.today-btn {
		padding: 0.5rem 1rem;
		background: #e94560;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.today-btn:hover {
		background: #d63651;
	}

	/* Calendar Container */
	.calendar-container {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	/* Weekday Header */
	.weekday-header {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}

	.weekday {
		padding: 0.75rem;
		text-align: center;
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
	}

	/* Days Grid */
	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.day-cell {
		min-height: 80px;
		padding: 0.5rem;
		border: none;
		border-right: 1px solid #e5e7eb;
		border-bottom: 1px solid #e5e7eb;
		background: white;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		transition: background 0.2s;
		text-align: left;
	}

	.day-cell:nth-child(7n) {
		border-right: none;
	}

	.day-cell:nth-last-child(-n+7) {
		border-bottom: none;
	}

	.day-cell:hover {
		background: #f9fafb;
	}

	.day-cell.outside-month {
		background: #fafafa;
	}

	.day-cell.outside-month .day-number {
		color: #9ca3af;
	}

	.day-cell.today {
		background: rgba(233, 69, 96, 0.08);
		box-shadow: inset 0 0 0 2px #e94560;
	}

	.day-cell.today .day-number {
		color: #e94560;
		font-weight: 700;
	}

	.day-number {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1f2937;
	}

	/* Booking Indicators */
	.booking-indicators {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: auto;
	}

	.booking-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: #374151;
		background: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.status-dots {
		display: flex;
		gap: 3px;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.dot-confirmed {
		background: #3b82f6;
	}

	.dot-completed {
		background: #10b981;
	}

	.dot-cancelled {
		background: #ef4444;
	}

	/* Legend */
	.legend {
		display: flex;
		gap: 1.5rem;
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.legend .dot {
		width: 8px;
		height: 8px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.calendar-header {
			flex-direction: column;
			gap: 1rem;
		}

		.month-title {
			font-size: 1.1rem;
			min-width: auto;
		}

		.day-cell {
			min-height: 60px;
			padding: 0.25rem;
		}

		.day-number {
			font-size: 0.75rem;
		}

		.booking-count {
			font-size: 0.65rem;
			padding: 0.1rem 0.25rem;
		}

		.dot {
			width: 4px;
			height: 4px;
		}

		.weekday {
			padding: 0.5rem 0.25rem;
			font-size: 0.65rem;
		}

		.legend {
			flex-wrap: wrap;
			gap: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.day-cell {
			min-height: 50px;
		}

		.booking-indicators {
			flex-direction: row;
			align-items: center;
			gap: 0.25rem;
		}

		.status-dots {
			display: none;
		}
	}
</style>
