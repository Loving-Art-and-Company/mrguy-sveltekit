<script lang="ts">
  import { PackageMenu, BUSINESS_INFO, type ServicePackage } from '$lib';
  import { goto } from '$app/navigation';
  import Sparkle from '$lib/components/Sparkle.svelte';

  function handlePackageSelect(pkg: ServicePackage) {
    goto(`/book?package=${pkg.id}`);
  }
</script>

<svelte:head>
  <title>{BUSINESS_INFO.name} - {BUSINESS_INFO.tagline}</title>
  <meta name="description" content={BUSINESS_INFO.subTagline} />
</svelte:head>

<main>
  <section class="hero">
    <Sparkle size={24} opacity={0.2} top="10%" left="10%" delay={0} />
    <Sparkle size={18} opacity={0.15} top="15%" right="15%" delay={1} />
    <Sparkle size={20} opacity={0.18} bottom="20%" left="20%" delay={0.5} />
    <Sparkle size={16} opacity={0.15} bottom="25%" right="25%" delay={1.5} />
    
    <h1>{BUSINESS_INFO.name}</h1>
    <p class="tagline">{BUSINESS_INFO.tagline}</p>
    <p class="sub">{BUSINESS_INFO.subTagline}</p>
    <a href="/book" class="cta">Book Now</a>
  </section>

  <section class="packages-section">
    <h2>Our Packages</h2>
    <p class="section-sub">Mobile detailing that comes to you. {BUSINESS_INFO.priceRange}</p>
    <PackageMenu onSelect={handlePackageSelect} />
  </section>

  <section class="why-us">
    <h2>Why Choose Us</h2>
    <div class="features">
      {#each BUSINESS_INFO.valueProps as prop}
        <div class="feature">
          <span class="check">✓</span>
          {prop}
        </div>
      {/each}
    </div>
    <p class="location">Serving {BUSINESS_INFO.location}</p>
  </section>
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .hero {
    position: relative;
    text-align: center;
    padding: 5rem 2rem;
    background: var(--color-primary-deep);
    color: var(--text-inverse);
    border-radius: 0 0 2rem 2rem;
    margin-bottom: 3rem;
    overflow: hidden;
  }

  .hero h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    margin: 0 0 0.5rem 0;
    font-weight: 800;
  }

  .tagline {
    font-size: 1.5rem;
    color: var(--color-primary);
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }

  .sub {
    color: var(--text-muted);
    font-size: 1.1rem;
    margin: 0 0 2rem 0;
  }

  .cta {
    display: inline-block;
    background: var(--color-primary);
    color: var(--text-inverse);
    padding: 1rem 2.5rem;
    border-radius: var(--radius-md);
    text-decoration: none;
    font-weight: 700;
    font-size: 1.1rem;
    transition: background 0.2s, transform 0.2s;
  }

  .cta:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
  }

  .packages-section {
    padding: 3rem 1rem;
  }

  .packages-section h2 {
    text-align: center;
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }

  .section-sub {
    text-align: center;
    color: var(--text-secondary);
    margin: 0 0 2rem 0;
  }

  .why-us {
    background: var(--color-bg-lighter);
    padding: 3rem 2rem;
    border-radius: var(--radius-xl);
    margin: 2rem 0 4rem 0;
    text-align: center;
  }

  .why-us h2 {
    font-size: 1.75rem;
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
  }

  .features {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-bg-white);
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-full);
    font-weight: 500;
    box-shadow: var(--shadow-sm);
  }

  .check {
    color: var(--color-success);
    font-weight: bold;
  }

  .location {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin: 0;
  }

  @media (max-width: 640px) {
    .hero {
      padding: 3rem 1rem;
    }

    .packages-section {
      padding: 2rem 0;
    }

    .why-us {
      padding: 2rem 1rem;
    }
  }
</style>
