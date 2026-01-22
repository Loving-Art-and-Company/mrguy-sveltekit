<script lang="ts">
  import { PackageMenu, BUSINESS_INFO, type ServicePackage } from '$lib';
  import { goto } from '$app/navigation';

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
    text-align: center;
    padding: 5rem 2rem;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: white;
    border-radius: 0 0 2rem 2rem;
    margin-bottom: 3rem;
  }

  .hero h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    margin: 0 0 0.5rem 0;
    font-weight: 800;
  }

  .tagline {
    font-size: 1.5rem;
    color: #e94560;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }

  .sub {
    color: #9ca3af;
    font-size: 1.1rem;
    margin: 0 0 2rem 0;
  }

  .cta {
    display: inline-block;
    background: #e94560;
    color: white;
    padding: 1rem 2.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.1rem;
    transition: background 0.2s, transform 0.2s;
  }

  .cta:hover {
    background: #ff6b6b;
    transform: translateY(-2px);
  }

  .packages-section {
    padding: 3rem 1rem;
  }

  .packages-section h2 {
    text-align: center;
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    color: #1a1a2e;
  }

  .section-sub {
    text-align: center;
    color: #6b7280;
    margin: 0 0 2rem 0;
  }

  .why-us {
    background: #f9fafb;
    padding: 3rem 2rem;
    border-radius: 1rem;
    margin: 2rem 0 4rem 0;
    text-align: center;
  }

  .why-us h2 {
    font-size: 1.75rem;
    margin: 0 0 1.5rem 0;
    color: #1a1a2e;
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
    background: white;
    padding: 0.75rem 1.25rem;
    border-radius: 2rem;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .check {
    color: #10b981;
    font-weight: bold;
  }

  .location {
    color: #6b7280;
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
