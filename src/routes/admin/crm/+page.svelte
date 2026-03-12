<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedSegmentId = $state('');
	let selectedTemplateId = $state('');
	let confirmation = $state('');

	const selectedSegment = $derived(
		data.segments.find((segment) => segment.id === selectedSegmentId) ?? data.segments[0]
	);
	const compatibleTemplates = $derived(
		data.templates.filter((template) => template.segmentId === selectedSegmentId)
	);
	const selectedTemplate = $derived(
		compatibleTemplates.find((template) => template.id === selectedTemplateId) ?? compatibleTemplates[0]
	);
	const recipientPreview = $derived(
		data.recipientsBySegment[selectedSegmentId]?.sampleRecipients ?? []
	);

	$effect(() => {
		if (!selectedSegmentId) {
			selectedSegmentId = data.segments[0]?.id ?? '';
		}

		if (!compatibleTemplates.some((template) => template.id === selectedTemplateId)) {
			selectedTemplateId = compatibleTemplates[0]?.id ?? '';
		}
	});

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}
	
</script>

<svelte:head>
	<title>CRM - Mr. Guy Admin</title>
</svelte:head>

<div class="crm-page">
	<div class="hero">
		<div>
			<h2>CRM & Campaigns</h2>
			<p>
				Use bookings as your customer base, segment them by detailing lifecycle, and launch
				built-in best-practice campaigns from admin.
			</p>
		</div>
	</div>

	<section class="stats-grid">
		<div class="stat-card">
			<span class="stat-label">Emailable contacts</span>
			<span class="stat-value">{data.stats.emailableContacts}</span>
		</div>
		<div class="stat-card">
			<span class="stat-label">Repeat customers</span>
			<span class="stat-value">{data.stats.repeatCustomers}</span>
		</div>
		<div class="stat-card">
			<span class="stat-label">Pending leads needing attention</span>
			<span class="stat-value">{data.stats.upcomingActionNeeded}</span>
		</div>
		<div class="stat-card">
			<span class="stat-label">Unsubscribed contacts</span>
			<span class="stat-value">{data.stats.unsubscribedContacts}</span>
		</div>
	</section>

	<section class="segments-card">
		<div class="card-heading">
			<h3>Built-in detailing segments</h3>
			<p>These are designed around common detailing business email plays.</p>
		</div>
		<div class="segments-grid">
			{#each data.segments as segment}
				<button
					type="button"
					class="segment-card"
					class:selected={selectedSegmentId === segment.id}
					onclick={() => (selectedSegmentId = segment.id)}
				>
					<div class="segment-topline">
						<strong>{segment.name}</strong>
						<span>{segment.count}</span>
					</div>
					<p>{segment.description}</p>
					<small>{segment.bestPractice}</small>
				</button>
			{/each}
		</div>
	</section>

	<div class="crm-grid">
		<section class="campaign-card">
			<div class="card-heading">
				<h3>Launch campaign</h3>
				<p>Manual send only. Best for review asks, rebooks, win-backs, and plan upsells.</p>
			</div>

			{#if form?.campaignError}
				<p class="banner error">{form.campaignError}</p>
			{/if}

			{#if form?.campaignResult}
				<p class="banner success">
					Sent {form.campaignResult.sentCount} emails for {form.campaignResult.templateName}.
					{#if form.campaignResult.suppressedCount > 0}
						Skipped {form.campaignResult.suppressedCount} unsubscribed contact(s).
					{/if}
					{#if form.campaignResult.failedCount > 0}
						{form.campaignResult.failedCount} failed.
					{/if}
				</p>
			{/if}

			<form method="POST" action="?/sendCampaign" class="campaign-form">
				<label class="field">
					<span>Segment</span>
					<select name="segmentId" bind:value={selectedSegmentId}>
						{#each data.segments as segment}
							<option value={segment.id}>{segment.name} ({segment.count})</option>
						{/each}
					</select>
				</label>

				<label class="field">
					<span>Template</span>
					<select name="templateId" bind:value={selectedTemplateId}>
						{#each compatibleTemplates as template}
							<option value={template.id}>{template.name}</option>
						{/each}
					</select>
				</label>

				<div class="confirmation-box">
					<p>
						Type <strong>SEND</strong> to send this campaign to
						<strong>{data.recipientsBySegment[selectedSegmentId]?.count ?? 0}</strong> recipients.
						Unsubscribe links are added automatically.
					</p>
					<input
						type="text"
						name="confirmation"
						bind:value={confirmation}
						placeholder="SEND"
						autocomplete="off"
					/>
				</div>

				<button type="submit" class="send-btn" disabled={confirmation !== 'SEND'}>
					Send campaign
				</button>
			</form>
		</section>

		<section class="preview-card">
			<div class="card-heading">
				<h3>Template preview</h3>
				<p>{selectedTemplate?.goal}</p>
			</div>

			{#if selectedTemplate}
				<div class="preview-block">
					<span class="preview-label">Subject</span>
					<p>{selectedTemplate.subjectPreview}</p>
				</div>

				<div class="preview-block">
					<span class="preview-label">Best practice</span>
					<p>{selectedTemplate.bestPractice}</p>
				</div>

				<div class="preview-block">
					<span class="preview-label">Body structure</span>
					<ul>
						{#each selectedTemplate.bodyPreview as item}
							<li>{item}</li>
						{/each}
					</ul>
				</div>

				<div class="preview-block">
					<span class="preview-label">CTA</span>
					<p>{selectedTemplate.ctaLabel}</p>
				</div>
			{/if}

			<div class="preview-block">
				<span class="preview-label">Sample recipients</span>
				{#if recipientPreview.length > 0}
					<ul>
						{#each recipientPreview as recipient}
							<li>
								<strong>{recipient.name}</strong> · {recipient.email}<br />
								<small>{recipient.lastServiceName} on {recipient.lastServiceDate}</small>
							</li>
						{/each}
					</ul>
				{:else}
					<p>No recipients currently match this segment.</p>
				{/if}
			</div>

			<div class="preview-block">
				<span class="preview-label">Suppression safety</span>
				<p>
					Anyone who unsubscribes is automatically removed from future CRM campaign sends, while
					transactional booking emails continue normally.
				</p>
			</div>
		</section>
	</div>

	<div class="history-grid">
		<section class="history-card">
			<div class="card-heading">
				<h3>Recent campaign sends</h3>
				<p>Track what went out, how many were suppressed, and whether anything failed.</p>
			</div>

			{#if data.recentCampaigns.length > 0}
				<div class="history-list">
					{#each data.recentCampaigns as campaign}
						<div class="history-item">
							<div class="history-item__topline">
								<strong>{campaign.templateName}</strong>
								<span class:status-pill={true} class:partial={campaign.status === 'partial'} class:failed={campaign.status === 'failed'}>
									{campaign.status}
								</span>
							</div>
							<p>
								{campaign.segmentName} · Sent {campaign.sentCount}/{campaign.requestedRecipientCount}
								{#if campaign.suppressedRecipientCount > 0}
									· Skipped {campaign.suppressedRecipientCount}
								{/if}
							</p>
							<small>
								Started {new Date(campaign.createdAt).toLocaleString()}
								{#if campaign.completedAt}
									· Completed {new Date(campaign.completedAt).toLocaleString()}
								{/if}
							</small>
						</div>
					{/each}
				</div>
			{:else}
				<p>No CRM campaigns have been sent yet.</p>
			{/if}
		</section>

		<section class="history-card">
			<div class="card-heading">
				<h3>Recent unsubscribes</h3>
				<p>These contacts are suppressed from future CRM campaigns.</p>
			</div>

			{#if data.recentUnsubscribes.length > 0}
				<div class="history-list">
					{#each data.recentUnsubscribes as row}
						<div class="history-item">
							<div class="history-item__topline">
								<strong>{row.email}</strong>
								<span class="status-pill">{row.source}</span>
							</div>
							<small>{new Date(row.unsubscribedAt).toLocaleString()}</small>
						</div>
					{/each}
				</div>
			{:else}
				<p>No one has unsubscribed from CRM campaigns yet.</p>
			{/if}
		</section>
	</div>

	<section class="contacts-card">
		<div class="card-heading">
			<h3>Recent CRM contacts</h3>
			<p>Derived from booking history. This keeps the CRM lightweight and always in sync.</p>
		</div>

		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Phone</th>
						<th>City</th>
						<th>Last service</th>
						<th>Status</th>
						<th>CRM</th>
						<th>Completed</th>
						<th>Revenue</th>
					</tr>
				</thead>
				<tbody>
					{#each data.contacts as contact}
						<tr>
							<td>{contact.name}</td>
							<td>{contact.email}</td>
							<td>{contact.phone}</td>
							<td>{contact.city ?? '—'}</td>
							<td>{contact.lastServiceName}<br /><small>{contact.lastServiceDate}</small></td>
							<td>{contact.lastServiceStatus}</td>
							<td>{contact.unsubscribed ? 'Unsubscribed' : 'Subscribed'}</td>
							<td>{contact.completedBookings}</td>
							<td>{formatCurrency(contact.totalRevenue)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</div>

<style>
	.crm-page {
		max-width: 1280px;
	}

	.hero {
		margin-bottom: 1.5rem;
	}

	.hero h2,
	.card-heading h3 {
		margin: 0 0 0.5rem 0;
		color: #1a1a2e;
	}

	.hero p,
	.card-heading p,
	.segment-card p,
	.segment-card small {
		color: #6b7280;
	}

	.stats-grid,
	.segments-grid,
	.crm-grid,
	.history-grid {
		display: grid;
		gap: 1rem;
	}

	.stats-grid {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		margin-bottom: 1.5rem;
	}

	.crm-grid {
		grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
		margin-bottom: 1.5rem;
	}

	.history-grid {
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		margin-bottom: 1.5rem;
	}

	.stat-card,
	.segments-card,
	.campaign-card,
	.preview-card,
	.contacts-card,
	.history-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.stat-label,
	.preview-label {
		display: block;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		margin-bottom: 0.4rem;
	}

	.stat-value {
		font-size: 1.8rem;
		font-weight: 700;
		color: #111827;
	}

	.segments-grid {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.segment-card {
		text-align: left;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1rem;
		background: #f9fafb;
		cursor: pointer;
		transition: border-color 0.2s, transform 0.2s;
	}

	.segment-card.selected {
		border-color: #e94560;
		background: #fff5f7;
	}

	.segment-card:hover {
		transform: translateY(-1px);
	}

	.segment-topline {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: #111827;
	}

	.card-heading {
		margin-bottom: 1rem;
	}

	.campaign-form {
		display: grid;
		gap: 1rem;
	}

	.field span {
		display: block;
		font-size: 0.9rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.35rem;
	}

	.field select,
	.confirmation-box input {
		width: 100%;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		padding: 0.75rem 0.9rem;
		font: inherit;
	}

	.confirmation-box {
		background: #f9fafb;
		border: 1px dashed #d1d5db;
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.send-btn {
		background: #e94560;
		color: white;
		border: none;
		border-radius: 0.6rem;
		padding: 0.85rem 1rem;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.send-btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.banner {
		border-radius: 0.6rem;
		padding: 0.85rem 1rem;
		margin-bottom: 1rem;
	}

	.banner.success {
		background: #ecfdf5;
		color: #065f46;
	}

	.banner.error {
		background: #fef2f2;
		color: #991b1b;
	}

	.preview-block + .preview-block {
		margin-top: 1rem;
	}

	.history-list {
		display: grid;
		gap: 0.85rem;
	}

	.history-item {
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 0.9rem 1rem;
		background: #f9fafb;
	}

	.history-item p,
	.history-item small {
		margin: 0.35rem 0 0;
		color: #6b7280;
	}

	.history-item__topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		background: #eef2ff;
		color: #4338ca;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: capitalize;
	}

	.status-pill.partial {
		background: #fff7ed;
		color: #c2410c;
	}

	.status-pill.failed {
		background: #fef2f2;
		color: #b91c1c;
	}

	.preview-block ul {
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
		color: #374151;
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.85rem 0.75rem;
		border-bottom: 1px solid #e5e7eb;
		text-align: left;
		vertical-align: top;
	}

	th {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
	}

	td {
		color: #111827;
	}

	td small {
		color: #6b7280;
	}

	@media (max-width: 960px) {
		.crm-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
