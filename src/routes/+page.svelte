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
  <!-- Hero Section - Apple Style with Large Image -->
  <section class="hero">
    <div class="hero-content">
      <div class="hero-text">
        <Sparkle size={20} opacity={0.15} top="10%" left="5%" delay={0} />
        <Sparkle size={16} opacity={0.12} top="20%" right="10%" delay={1} />
        
        <h1 class="hero-title">{BUSINESS_INFO.name}</h1>
        <p class="hero-tagline">{BUSINESS_INFO.tagline}</p>
        <p class="hero-sub">{BUSINESS_INFO.subTagline}</p>
        <a href="/book" class="cta">Book Your Detail</a>
      </div>
      <div class="hero-image">
        <img src="/images/hero-car-detail.jpg" alt="Professional car detailing" />
      </div>
    </div>
  </section>

  <!-- Services Showcase - Visual Grid -->
  <section class="services-showcase">
    <h2 class="section-title">Premium Detailing Services</h2>
    <p class="section-subtitle">Professional care for every part of your vehicle</p>
    
    <div class="services-grid">
      <div class="service-card">
        <div class="service-image">
          <img src="/images/service-exterior.jpg" alt="Exterior detailing" />
        </div>
        <h3>Exterior Care</h3>
        <p>Hand wash, wax, and paint correction for a showroom finish</p>
      </div>

      <div class="service-card">
        <div class="service-image">
          <img src="/images/service-interior.jpg" alt="Interior detailing" />
        </div>
        <h3>Interior Perfection</h3>
        <p>Deep cleaning, leather care, and odor elimination</p>
      </div>

      <div class="service-card">
        <div class="service-image">
          <img src="/images/service-ceramic.jpg" alt="Ceramic coating" />
        </div>
        <h3>Ceramic Protection</h3>
        <p>Multi-year coating for ultimate paint protection</p>
      </div>

      <div class="service-card">
        <div class="service-image">
          <img src="/images/service-polish.jpg" alt="Paint correction" />
        </div>
        <h3>Paint Correction</h3>
        <p>Remove swirls and scratches for a flawless finish</p>
      </div>
    </div>
  </section>

  <!-- Packages Section -->
  <section class="packages-section">
    <h2 class="section-title">Choose Your Package</h2>
    <p class="section-subtitle">Mobile detailing that comes to you. {BUSINESS_INFO.priceRange}</p>
    <PackageMenu onSelect={handlePackageSelect} />
  </section>

  <!-- Why Choose Us -->
  <section class="why-us">
    <h2>Why Choose Mr. Guy</h2>
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
    background: var(--color-bg-white);
  }

  /* Hero Section - Apple Style */
  .hero {
    position: relative;
    background: var(--color-bg-white);
    overflow: hidden;
  }

  .hero-content {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    padding: 6rem 2rem;
    min-height: 85vh;
  }

  .hero-text {
    position: relative;
    z-index: 1;
  }

  .hero-title {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 700;
    line-height: 1.1;
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .hero-tagline {
    font-size: clamp(1.5rem, 3vw, 2.5rem);
    color: var(--color-primary);
    margin: 0 0 1rem 0;
    font-weight: 600;
  }

  .hero-sub {
    font-size: clamp(1.1rem, 2vw, 1.5rem);
    color: var(--text-secondary);
    margin: 0 0 2.5rem 0;
    line-height: 1.6;
  }

  .hero-image {
    position: relative;
    border-radius: 2rem;
    overflow: hidden;
    box-shadow: var(--shadow-xl);
  }

  .hero-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .cta {
    display: inline-block;
    background: var(--color-primary);
    color: var(--text-inverse);
    padding: 1.25rem 3rem;
    border-radius: var(--radius-full);
    text-decoration: none;
    font-weight: 600;
    font-size: 1.125rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-md);
  }

  .cta:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  /* Services Showcase */
  .services-showcase {
    max-width: 1400px;
    margin: 0 auto;
    padding: 8rem 2rem;
  }

  .section-title {
    text-align: center;
    font-size: clamp(2rem, 4vw, 3.5rem);
    font-weight: 700;
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .section-subtitle {
    text-align: center;
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: var(--text-secondary);
    margin: 0 0 4rem 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }

  .service-card {
    background: var(--color-bg-white);
    border-radius: 1.5rem;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--border-light);
  }

  .service-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-xl);
  }

  .service-image {
    width: 100%;
    height: 240px;
    overflow: hidden;
  }

  .service-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .service-card:hover .service-image img {
    transform: scale(1.05);
  }

  .service-card h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1.5rem 1.5rem 0.75rem;
    color: var(--text-primary);
  }

  .service-card p {
    color: var(--text-secondary);
    margin: 0 1.5rem 1.5rem;
    line-height: 1.6;
  }

  /* Packages Section */
  .packages-section {
    max-width: 1400px;
    margin: 0 auto;
    padding: 8rem 2rem;
    background: var(--color-bg-main);
  }

  /* Why Choose Us */
  .why-us {
    max-width: 1200px;
    margin: 0 auto;
    background: var(--color-bg-lighter);
    padding: 5rem 2rem;
    border-radius: 2rem;
    text-align: center;
    margin-bottom: 6rem;
  }

  .why-us h2 {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    margin: 0 0 3rem 0;
    color: var(--text-primary);
  }

  .features {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--color-bg-white);
    padding: 1rem 2rem;
    border-radius: var(--radius-full);
    font-weight: 500;
    font-size: 1.125rem;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .feature:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .check {
    color: var(--color-success);
    font-weight: bold;
    font-size: 1.25rem;
  }

  .location {
    color: var(--text-secondary);
    font-size: 1rem;
    margin: 0;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .hero-content {
      grid-template-columns: 1fr;
      gap: 3rem;
      padding: 4rem 2rem;
      text-align: center;
    }

    .hero-title {
      font-size: clamp(2rem, 8vw, 3.5rem);
    }

    .services-grid {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
  }

  @media (max-width: 640px) {
    .hero-content {
      padding: 3rem 1rem;
    }

    .services-showcase {
      padding: 4rem 1rem;
    }

    .packages-section {
      padding: 4rem 1rem;
    }

    .why-us {
      padding: 3rem 1rem;
      margin-bottom: 3rem;
    }

    .services-grid {
      grid-template-columns: 1fr;
    }

    .feature {
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
    }
  }

  /* Smooth Scroll Animations */
  @media (prefers-reduced-motion: no-preference) {
    .service-card,
    .feature {
      animation: fadeInUp 0.6s ease-out backwards;
    }

    .service-card:nth-child(1) { animation-delay: 0.1s; }
    .service-card:nth-child(2) { animation-delay: 0.2s; }
    .service-card:nth-child(3) { animation-delay: 0.3s; }
    .service-card:nth-child(4) { animation-delay: 0.4s; }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
</style>
