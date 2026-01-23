<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { RevenueData } from './+page.server';

	let { data } = $props();

	const revenue: RevenueData = $derived(data.revenue);

	const periods = ['week', 'month', 'year'] as const;

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}

	function selectPeriod(period: string) {
		const url = new URL($page.url);
		url.searchParams.set('period', period);
		goto(url.toString(), { replaceState: true, invalidateAll: true });
	}

	// Find max revenue for scaling time chart bars
	const maxTimeRevenue = $derived(
		revenue.timeData.length > 0 ? Math.max(...revenue.timeData.map((d) => d.revenue)) : 0
	);
</script>

<div class="revenue-dashboard">
	<!-- Period Selector -->
	<div class="period-selector">
		{#each periods as period}
			<button
				class="period-btn"
				class:active={revenue.period === period}
				onclick={() => selectPeriod(period)}
			>
				{period.charAt(0).toUpperCase() + period.slice(1)}
			</button>
		{/each}
	</div>

	<!-- Summary Cards -->
	<div class="summary-cards">
		<div class="card">
			<div class="card-icon revenue-icon">💵</div>
			<div class="card-content">
				<span class="card-label">Total Revenue</span>
				<span class="card-value">{formatCurrency(revenue.totalRevenue)}</span>
				<span class="card-change" class:positive={revenue.revenueChange >= 0} class:negative={revenue.revenueChange < 0}>
					{revenue.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenue.revenueChange)}%
					<span class="change-label">vs previous</span>
				</span>
			</div>
		</div>

		<div class="card">
			<div class="card-icon bookings-icon">📋</div>
			<div class="card-content">
				<span class="card-label">Total Bookings</span>
				<span class="card-value">{revenue.bookingCount}</span>
				<span class="card-change" class:positive={revenue.countChange >= 0} class:negative={revenue.countChange < 0}>
					{revenue.countChange >= 0 ? '↑' : '↓'} {Math.abs(revenue.countChange)}%
					<span class="change-label">vs previous</span>
				</span>
			</div>
		</div>

		<div class="card">
			<div class="card-icon avg-icon">📊</div>
			<div class="card-content">
				<span class="card-label">Average Value</span>
				<span class="card-value">{formatCurrency(revenue.averageValue)}</span>
				<span class="card-change neutral">per booking</span>
			</div>
		</div>

		<div class="card">
			<div class="card-icon top-icon">🏆</div>
			<div class="card-content">
				<span class="card-label">Top Service</span>
				<span class="card-value top-service">{revenue.topService ?? 'N/A'}</span>
				{#if revenue.serviceBreakdown.length > 0}
					<span class="card-change neutral">
						{formatCurrency(revenue.serviceBreakdown[0]?.revenue ?? 0)} revenue
					</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Revenue by Service -->
	<section class="section">
		<h2 class="section-title">Revenue by Service</h2>
		{#if revenue.serviceBreakdown.length === 0}
			<p class="empty-state">No paid bookings in this period</p>
		{:else}
			<div class="service-chart">
				{#each revenue.serviceBreakdown as service}
					<div class="service-row">
						<span class="service-name">{service.serviceName}</span>
						<div class="service-bar-container">
							<div class="service-bar" style="width: {service.percentage}%"></div>
						</div>
						<span class="service-amount">{formatCurrency(service.revenue)}</span>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Revenue Over Time -->
	<section class="section">
		<h2 class="section-title">Revenue Over Time</h2>
		{#if revenue.timeData.length === 0}
			<p class="empty-state">No paid bookings in this period</p>
		{:else}
			<div class="time-chart">
				<div class="time-bars">
					{#each revenue.timeData as point}
						<div class="time-bar-group">
							<div class="time-bar-wrapper">
								<div
									class="time-bar"
									style="height: {maxTimeRevenue > 0 ? (point.revenue / maxTimeRevenue) * 100 : 0}%"
								></div>
							</div>
							<span class="time-label">{point.label}</span>
							<span class="time-value">{formatCurrency(point.revenue)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</section>

	<!-- Recent Paid Bookings -->
	<section class="section">
		<h2 class="section-title">Recent Paid Bookings</h2>
		{#if revenue.recentBookings.length === 0}
			<p class="empty-state">No paid bookings yet</p>
		{:else}
			<div class="table-container">
				<table class="bookings-table">
					<thead>
						<tr>
							<th>Date</th>
							<th>Client</th>
							<th>Service</th>
							<th>Amount</th>
						</tr>
					</thead>
					<tbody>
						{#each revenue.recentBookings as booking}
							<tr>
								<td>{formatDate(booking.date)}</td>
								<td>
									<a href="/admin/bookings/{booking.id}" class="client-link">
										{booking.clientName}
									</a>
								</td>
								<td>{booking.serviceName}</td>
								<td class="amount">{formatCurrency(booking.price)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>

<style>
	.revenue-dashboard {
		max-width: 1200px;
	}

	/* Period Selector */
	.period-selector {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.period-btn {
		padding: 0.5rem 1.25rem;
		border: 1px solid #e5e7eb;
		background: white;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		color: #6b7280;
		transition: all 0.2s;
	}

	.period-btn:hover {
		border-color: #e94560;
		color: #e94560;
	}

	.period-btn.active {
		background: #e94560;
		border-color: #e94560;
		color: white;
	}

	/* Summary Cards */
	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.card {
		background: white;
		border-radius: 0.5rem;
		padding: 1.25rem;
		display: flex;
		gap: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.card-icon {
		font-size: 2rem;
		width: 48px;
		height: 48px;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.revenue-icon {
		background: rgba(34, 197, 94, 0.1);
	}

	.bookings-icon {
		background: rgba(59, 130, 246, 0.1);
	}

	.avg-icon {
		background: rgba(168, 85, 247, 0.1);
	}

	.top-icon {
		background: rgba(245, 158, 11, 0.1);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.card-label {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.card-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.card-value.top-service {
		font-size: 1rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 150px;
	}

	.card-change {
		font-size: 0.8rem;
		font-weight: 500;
	}

	.card-change.positive {
		color: #22c55e;
	}

	.card-change.negative {
		color: #ef4444;
	}

	.card-change.neutral {
		color: #6b7280;
	}

	.change-label {
		font-weight: 400;
		color: #9ca3af;
		margin-left: 0.25rem;
	}

	/* Sections */
	.section {
		background: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1a2e;
		margin: 0 0 1rem 0;
	}

	.empty-state {
		color: #9ca3af;
		text-align: center;
		padding: 2rem;
	}

	/* Service Chart */
	.service-chart {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.service-row {
		display: grid;
		grid-template-columns: 150px 1fr 100px;
		align-items: center;
		gap: 1rem;
	}

	.service-name {
		font-size: 0.875rem;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.service-bar-container {
		height: 24px;
		background: #f3f4f6;
		border-radius: 0.25rem;
		overflow: hidden;
	}

	.service-bar {
		height: 100%;
		background: #e94560;
		border-radius: 0.25rem;
		min-width: 4px;
		transition: width 0.3s ease;
	}

	.service-amount {
		font-size: 0.875rem;
		font-weight: 600;
		color: #1a1a2e;
		text-align: right;
	}

	/* Time Chart */
	.time-chart {
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.time-bars {
		display: flex;
		gap: 0.5rem;
		min-width: max-content;
		align-items: flex-end;
		height: 200px;
		padding-top: 1rem;
	}

	.time-bar-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		min-width: 80px;
	}

	.time-bar-wrapper {
		height: 150px;
		width: 40px;
		background: #f3f4f6;
		border-radius: 0.25rem;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
	}

	.time-bar {
		width: 100%;
		background: #e94560;
		border-radius: 0.25rem 0.25rem 0 0;
		min-height: 4px;
		transition: height 0.3s ease;
	}

	.time-label {
		font-size: 0.7rem;
		color: #6b7280;
		text-align: center;
		white-space: nowrap;
	}

	.time-value {
		font-size: 0.75rem;
		font-weight: 600;
		color: #1a1a2e;
	}

	/* Bookings Table */
	.table-container {
		overflow-x: auto;
	}

	.bookings-table {
		width: 100%;
		border-collapse: collapse;
	}

	.bookings-table th,
	.bookings-table td {
		text-align: left;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.bookings-table th {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.bookings-table td {
		font-size: 0.875rem;
		color: #374151;
	}

	.bookings-table tbody tr:hover {
		background: #f9fafb;
	}

	.client-link {
		color: #e94560;
		text-decoration: none;
		font-weight: 500;
	}

	.client-link:hover {
		text-decoration: underline;
	}

	.amount {
		font-weight: 600;
		color: #1a1a2e;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.summary-cards {
			grid-template-columns: 1fr 1fr;
		}

		.service-row {
			grid-template-columns: 100px 1fr 80px;
		}

		.time-bar-group {
			min-width: 60px;
		}

		.time-bar-wrapper {
			width: 30px;
		}
	}

	@media (max-width: 480px) {
		.summary-cards {
			grid-template-columns: 1fr;
		}

		.service-row {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}

		.service-bar-container {
			width: 100%;
		}

		.service-amount {
			text-align: left;
		}
	}
</style>
