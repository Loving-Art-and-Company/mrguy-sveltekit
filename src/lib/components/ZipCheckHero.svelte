<script lang="ts">
	import { goto } from '$app/navigation';
	import { ripple } from '$lib/actions/ripple';

	let zipCode = '';
	let isChecking = false;
	let errorMessage = '';

	// West Broward ZIP codes (simplified - you can expand this)
	const SERVICED_ZIPS = [
		'33023', '33024', '33025', '33026', '33027', '33028', '33029',
		'33312', '33313', '33314', '33315', '33316', '33317', '33319',
		'33020', '33021', '33009', '33442', '33441'
	];

	async function checkAvailability() {
		errorMessage = '';
		
		// Remove non-digits
		const cleanZip = zipCode.replace(/\D/g, '');
		
		if (cleanZip.length !== 5) {
			errorMessage = 'Please enter a valid 5-digit ZIP code';
			return;
		}

		isChecking = true;

		// Simulate API check (replace with actual check if needed)
		setTimeout(() => {
			if (SERVICED_ZIPS.includes(cleanZip)) {
				// Store ZIP for booking flow
				sessionStorage.setItem('serviceZip', cleanZip);
				goto('/book?zip=' + cleanZip);
			} else {
				errorMessage = "Sorry, we don't service this area yet. We serve West Broward only.";
			}
			isChecking = false;
		}, 500);
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			checkAvailability();
		}
	}
</script>

<section class="zip-hero">
	<div class="zip-hero-content">
		<div class="zip-hero-text">
			<div class="zip-hero-logo">
				<img src="/logo/mrguylogo-full.png" alt="MrGuy Detail Logo" />
			</div>
			<h1 class="zip-hero-title">Detailing at Your Driveway</h1>
			<p class="zip-hero-subtitle">West Broward's #1 Mobile Detail • Same-Day Available</p>
			
			<div class="zip-check-container">
				<div class="zip-input-wrapper">
					<input
						type="text"
						class="zip-input"
						placeholder="Enter your ZIP code"
						bind:value={zipCode}
						on:keypress={handleKeyPress}
						maxlength="5"
						pattern="[0-9]*"
						inputmode="numeric"
						aria-label="ZIP code"
					/>
					<button
						class="btn btn-primary zip-cta"
						use:ripple
						on:click={checkAvailability}
						disabled={isChecking}
					>
						{isChecking ? 'Checking...' : 'See Availability'}
						<span class="arrow-slide">→</span>
					</button>
				</div>
				
				{#if errorMessage}
					<p class="zip-error" role="alert">{errorMessage}</p>
				{/if}
			</div>

			<div class="trust-line">
				<span class="trust-stars">★★★★★</span>
				<span class="trust-text">500+ 5-star reviews • Fully insured</span>
			</div>
		</div>
	</div>
</section>

<style>
	.zip-hero {
		position: relative;
		background: linear-gradient(135deg, var(--color-bg-main) 0%, var(--color-bg-lighter) 100%);
		overflow: hidden;
		padding: 4rem 2rem 6rem;
	}

	.zip-hero-content {
		max-width: 900px;
		margin: 0 auto;
		text-align: center;
	}

	.zip-hero-logo {
		margin: 0 auto 2rem;
		width: 200px;
		height: 200px;
	}

	.zip-hero-logo img {
		width: 100%;
		height: 100%;
		display: block;
		border-radius: 50%;
		object-fit: cover;
	}

	.zip-hero-title {
		font-size: clamp(2.5rem, 7vw, 4rem);
		font-weight: 800;
		line-height: 1.1;
		margin: 0 0 1rem 0;
		color: var(--text-primary);
		letter-spacing: -0.03em;
	}

	.zip-hero-subtitle {
		font-size: clamp(1.125rem, 2.5vw, 1.5rem);
		color: var(--text-secondary);
		margin: 0 0 3rem 0;
		font-weight: 500;
	}

	.zip-check-container {
		max-width: 600px;
		margin: 0 auto 2rem;
	}

	.zip-input-wrapper {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.zip-input {
		flex: 1;
		min-width: 200px;
		max-width: 300px;
		padding: 1.25rem 1.5rem;
		font-size: 1.125rem;
		border: 2px solid var(--border-light);
		border-radius: var(--radius-full);
		background: white;
		transition: all 0.3s ease;
		font-weight: 500;
		text-align: center;
		letter-spacing: 0.05em;
	}

	.zip-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.zip-input::placeholder {
		color: var(--text-muted);
		font-weight: 400;
	}

	.zip-cta {
		padding: 1.25rem 2.5rem;
		font-size: 1.125rem;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.zip-cta:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.zip-error {
		margin-top: 1rem;
		padding: 1rem 1.5rem;
		background: var(--color-error-bg);
		color: var(--color-error);
		border-radius: var(--radius-lg);
		font-weight: 500;
		animation: shake 0.3s ease;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-5px); }
		75% { transform: translateX(5px); }
	}

	.trust-line {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.trust-stars {
		color: #f59e0b;
		font-size: 1rem;
		letter-spacing: 0.1em;
	}

	.trust-text {
		font-weight: 500;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.zip-hero {
			padding: 3rem 1rem 4rem;
		}

		.zip-hero-logo {
			width: 150px;
			height: 150px;
			margin-bottom: 1.5rem;
		}

		.zip-input-wrapper {
			flex-direction: column;
			gap: 0.75rem;
		}

		.zip-input {
			max-width: 100%;
		}

		.zip-cta {
			width: 100%;
			justify-content: center;
		}

		.trust-line {
			flex-direction: column;
			gap: 0.25rem;
		}
	}
</style>
