<script lang="ts">
	import { onMount } from 'svelte';
	import { isGoogleConnected, googleUser } from '$lib/stores/google';
	import { fetchDocs, type Doc } from '$lib/google/api-client';

	let docs: Doc[] = [];
	let loading = true;
	let error: string | null = null;
	let nextPageToken: string | undefined;

	onMount(async () => {
		if ($isGoogleConnected) {
			await loadDocs();
		} else {
			loading = false;
		}
	});

	async function loadDocs(pageToken?: string) {
		loading = true;
		error = null;

		try {
			const response = await fetchDocs(pageToken);
			if (pageToken) {
				docs = [...docs, ...response.files];
			} else {
				docs = response.files;
			}
			nextPageToken = response.nextPageToken;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load documents';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Google Docs - Mr. Guy Admin</title>
</svelte:head>

<div class="docs-page">
	{#if !$isGoogleConnected}
		<div class="connect-prompt">
			<div class="connect-card">
				<div class="connect-icon">📄</div>
				<h2>Connect Google Docs</h2>
				<p>Connect your Google account to access shared documents.</p>
				<a href="/auth/google?returnTo=/admin/docs" class="connect-btn">
					<svg viewBox="0 0 24 24" class="google-icon">
						<path
							fill="#4285F4"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="#34A853"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="#FBBC05"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="#EA4335"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					Connect with Google
				</a>
			</div>
		</div>
	{:else}
		<div class="page-header">
			<div class="header-info">
				<h2>Documents</h2>
				{#if $googleUser}
					<p class="connected-as">Connected as {$googleUser.email}</p>
				{/if}
			</div>
			<button class="refresh-btn" onclick={() => loadDocs()} disabled={loading}>
				{loading ? 'Loading...' : 'Refresh'}
			</button>
		</div>

		{#if error}
			<div class="error-message">
				<p>{error}</p>
				<button onclick={() => loadDocs()}>Try Again</button>
			</div>
		{:else if loading && docs.length === 0}
			<div class="loading">
				<div class="spinner"></div>
				<p>Loading documents...</p>
			</div>
		{:else if docs.length === 0}
			<div class="empty-state">
				<p>No documents found in the shared drive.</p>
			</div>
		{:else}
			<div class="docs-grid">
				{#each docs as doc}
					<a
						href={doc.webViewLink}
						target="_blank"
						rel="noopener"
						class="doc-card"
					>
						<div class="doc-icon">📄</div>
						<div class="doc-info">
							<h3 class="doc-name">{doc.name}</h3>
							<p class="doc-date">Modified {formatDate(doc.modifiedTime)}</p>
						</div>
					</a>
				{/each}
			</div>

			{#if nextPageToken}
				<div class="load-more">
					<button onclick={() => loadDocs(nextPageToken)} disabled={loading}>
						{loading ? 'Loading...' : 'Load More'}
					</button>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.docs-page {
		max-width: 1200px;
	}

	.connect-prompt {
		display: flex;
		justify-content: center;
		padding: 4rem 1rem;
	}

	.connect-card {
		background: white;
		padding: 3rem;
		border-radius: 1rem;
		text-align: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-width: 400px;
	}

	.connect-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.connect-card h2 {
		margin: 0 0 0.5rem 0;
		color: #1a1a2e;
	}

	.connect-card p {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
	}

	.connect-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		font-weight: 500;
		color: #374151;
		text-decoration: none;
		transition: box-shadow 0.2s, border-color 0.2s;
	}

	.connect-btn:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-color: #d1d5db;
	}

	.google-icon {
		width: 20px;
		height: 20px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
	}

	.header-info h2 {
		margin: 0 0 0.25rem 0;
		color: #1a1a2e;
	}

	.connected-as {
		margin: 0;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.refresh-btn {
		padding: 0.5rem 1rem;
		background: #e94560;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.refresh-btn:hover:not(:disabled) {
		background: #d63d56;
	}

	.refresh-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		padding: 1.5rem;
		border-radius: 0.5rem;
		text-align: center;
	}

	.error-message p {
		margin: 0 0 1rem 0;
		color: #dc2626;
	}

	.error-message button {
		padding: 0.5rem 1rem;
		background: #dc2626;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.loading {
		text-align: center;
		padding: 3rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top-color: #e94560;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading p {
		color: #6b7280;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
	}

	.docs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.doc-card {
		background: white;
		padding: 1.25rem;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		text-decoration: none;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.2s, transform 0.2s;
	}

	.doc-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
	}

	.doc-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.doc-info {
		flex: 1;
		min-width: 0;
	}

	.doc-name {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #1a1a2e;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.doc-date {
		margin: 0;
		font-size: 0.8rem;
		color: #6b7280;
	}

	.load-more {
		text-align: center;
		padding: 1.5rem;
	}

	.load-more button {
		padding: 0.625rem 1.5rem;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		color: #374151;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.load-more button:hover:not(:disabled) {
		background: #e5e7eb;
	}

	.load-more button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
