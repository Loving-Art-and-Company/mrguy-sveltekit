<script lang="ts">
	import { browser } from '$app/environment';

	let deferredPrompt: any = $state(null);
	let showInstallBanner = $state(false);
	let isInstalled = $state(false);
	let visitCount = $state(0);

	$effect(() => {
		if (!browser) return;

		// Register service worker
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/sw.js')
				.catch((error) => {
					console.error('[PWA] Service Worker registration failed:', error);
				});
		}

		// Check if already installed
		if (window.matchMedia('(display-mode: standalone)').matches) {
			isInstalled = true;
			return;
		}

		// Track visit count (show install prompt on 2nd+ visit)
		const storedVisitCount = parseInt(localStorage.getItem('visitCount') || '0');
		visitCount = storedVisitCount + 1;
		localStorage.setItem('visitCount', visitCount.toString());

		// Check if user dismissed install prompt before
		const dismissedInstall = localStorage.getItem('dismissedInstall');
		if (dismissedInstall === 'true') {
			return;
		}

		// Listen for beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;

			// Show install banner on 2nd+ visit
			if (visitCount >= 2) {
				showInstallBanner = true;
			}
		});

		// Listen for app installed event
		window.addEventListener('appinstalled', () => {
			isInstalled = true;
			showInstallBanner = false;
			deferredPrompt = null;
		});
	});

	async function handleInstall() {
		if (!deferredPrompt) {
			return;
		}

		// Show install prompt
		deferredPrompt.prompt();

		// Wait for user choice
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			showInstallBanner = false;
		}

		deferredPrompt = null;
	}

	function dismissBanner() {
		showInstallBanner = false;
		localStorage.setItem('dismissedInstall', 'true');
	}
</script>

{#if showInstallBanner && !isInstalled}
	<div class="install-banner" role="dialog" aria-labelledby="install-title">
		<div class="install-content">
			<div class="install-text">
				<p id="install-title" class="install-title">
					<strong>Install MrGuy Detail</strong>
				</p>
				<p class="install-description">Book 50% faster with our app</p>
			</div>
			<div class="install-actions">
			<button class="install-btn" onclick={handleInstall}>Install</button>
			<button class="dismiss-btn" onclick={dismissBanner} aria-label="Dismiss install prompt">
					✕
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.install-banner {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-deep-blue);
		color: white;
		padding: 1rem;
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
		z-index: 9999;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.install-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.install-text {
		flex: 1;
	}

	.install-title {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.install-description {
		margin: 0;
		font-size: 0.875rem;
		opacity: 0.9;
	}

	.install-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.install-btn {
		background: white;
		color: var(--color-deep-blue);
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: var(--radius-full);
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.install-btn:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.install-btn:active {
		transform: scale(0.98);
	}

	.dismiss-btn {
		background: transparent;
		color: white;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		padding: 0.5rem;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.dismiss-btn:hover {
		opacity: 1;
	}

	@media (max-width: 640px) {
		.install-banner {
			padding: 0.75rem 1rem;
		}

		.install-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.install-actions {
			width: 100%;
		}

		.install-btn {
			flex: 1;
		}
	}
</style>
