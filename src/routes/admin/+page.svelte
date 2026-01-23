<script lang="ts">
	let { data } = $props();

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	}

	const cards = $derived([
		{
			title: "Today's Bookings",
			value: String(data.stats.todaysBookings),
			icon: '📅',
			color: '#3b82f6',
			link: '/admin/bookings',
		},
		{
			title: "This Week's Revenue",
			value: formatCurrency(data.stats.weekRevenue),
			icon: '💰',
			color: '#10b981',
			link: '/admin/revenue',
		},
		{
			title: 'Pending Payments',
			value: String(data.stats.pendingBookings),
			icon: '⏳',
			color: '#f59e0b',
			link: '/admin/bookings?status=pending',
		},
	]);
</script>

<svelte:head>
	<title>Dashboard - Mr. Guy Admin</title>
</svelte:head>

<div class="dashboard">
	<section class="welcome-section">
		<h2>Welcome back!</h2>
		<p>Logged in as <strong>{data.user?.email}</strong></p>
	</section>

	<section class="stats-grid">
		{#each cards as card}
			<a href={card.link} class="stat-card">
				<div class="stat-icon" style="background: {card.color}20; color: {card.color}">
					{card.icon}
				</div>
				<div class="stat-info">
					<p class="stat-title">{card.title}</p>
					<p class="stat-value">{card.value}</p>
				</div>
			</a>
		{/each}
	</section>

	<section class="quick-links">
		<h3>Quick Actions</h3>
		<div class="links-grid">
			<a href="/admin/bookings" class="quick-link">
				<span class="ql-icon">📅</span>
				View All Bookings
			</a>
			<a href="/admin/calendar" class="quick-link">
				<span class="ql-icon">🗓️</span>
				Calendar View
			</a>
			<a href="/admin/revenue" class="quick-link">
				<span class="ql-icon">📊</span>
				Revenue Report
			</a>
		</div>
	</section>
</div>

<style>
	.dashboard {
		max-width: 1200px;
	}

	.welcome-section {
		margin-bottom: 2rem;
	}

	.welcome-section h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		color: #1a1a2e;
	}

	.welcome-section p {
		margin: 0;
		color: #6b7280;
	}

	.welcome-section strong {
		color: #374151;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		text-decoration: none;
		transition: box-shadow 0.2s, transform 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.stat-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
	}

	.stat-icon {
		width: 56px;
		height: 56px;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.stat-info {
		flex: 1;
	}

	.stat-title {
		margin: 0 0 0.25rem 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.stat-value {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.quick-links {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.quick-links h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #1a1a2e;
	}

	.links-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.quick-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 0.5rem;
		text-decoration: none;
		color: #374151;
		font-weight: 500;
		transition: background 0.2s;
	}

	.quick-link:hover {
		background: #f3f4f6;
	}

	.ql-icon {
		font-size: 1.25rem;
	}
</style>
