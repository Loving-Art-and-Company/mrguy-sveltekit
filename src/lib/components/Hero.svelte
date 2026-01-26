<script lang="ts">
	import { ripple } from '$lib/actions/ripple';

	function scrollToServices() {
		document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<section class="hero">
	<div class="hero-content">
		<div class="hero-logo">
			<img src="/logo/mrguylogo-full-square.png" alt="MrGuy Detail Logo" />
		</div>
		<h1 class="hero-title">Detailing at Your Driveway</h1>
		<p class="hero-subtitle">West Broward's #1 Mobile Detail</p>
		
		<button
			class="btn btn-primary hero-cta"
			use:ripple
			on:click={scrollToServices}
		>
			Book Now
			<span class="arrow-slide">→</span>
		</button>


	</div>
</section>

<style>
	.hero {
		position: relative;
		background: linear-gradient(135deg, var(--color-bg-main) 0%, var(--color-bg-lighter) 100%);
		overflow: hidden;
		padding: 4rem 2rem 6rem;
	}

	.hero-content {
		max-width: 900px;
		margin: 0 auto;
		text-align: center;
	}

	.hero-logo {
		margin: 0 auto 2rem;
		width: 200px;
		height: 200px;
	}

	.hero-logo img {
		width: 100%;
		height: 100%;
		display: block;
		border-radius: 50%;
		object-fit: cover;
	}

	.hero-title {
		font-size: clamp(2.5rem, 7vw, 4rem);
		font-weight: 800;
		line-height: 1.1;
		margin: 0 0 1rem 0;
		color: var(--text-primary);
		letter-spacing: -0.03em;
	}

	.hero-subtitle {
		font-size: clamp(1.125rem, 2.5vw, 1.5rem);
		color: var(--text-secondary);
		margin: 0 0 2.5rem 0;
		font-weight: 500;
	}

	.hero-cta {
		padding: 1.25rem 3rem;
		font-size: 1.25rem;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-full);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.hero-cta:hover {
		background: var(--color-primary-deep);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
	}



	/* Mobile responsive */
	@media (max-width: 640px) {
		.hero {
			padding: 3rem 1rem 4rem;
		}

		.hero-logo {
			width: 150px;
			height: 150px;
			margin-bottom: 1.5rem;
		}

		.hero-cta {
			width: 100%;
			justify-content: center;
		}


	}
</style>
