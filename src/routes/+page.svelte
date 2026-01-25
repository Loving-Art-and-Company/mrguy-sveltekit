<script lang="ts">
  import { PackageMenu, BUSINESS_INFO, type ServicePackage } from '$lib';
  import { goto } from '$app/navigation';
  import Sparkle from '$lib/components/Sparkle.svelte';
  import OptimizedImage from '$lib/components/OptimizedImage.svelte';
  import AnimatedSection from '$lib/components/AnimatedSection.svelte';
  import BeforeAfterSlider from '$lib/components/BeforeAfterSlider.svelte';
  import ProcessTimeline from '$lib/components/ProcessTimeline.svelte';
  import ZipCheckHero from '$lib/components/ZipCheckHero.svelte';
  import { ripple } from '$lib/actions/ripple';

  function handlePackageSelect(pkg: ServicePackage) {
    goto(`/book?package=${pkg.id}`);
  }

  const processSteps = [
    {
      title: '1. We Show Up',
      description: 'Book online, pick your time. We pull up with everything.',
      imageSrc: '/images/process/step-2-wash',
      imageAlt: 'Mobile detailing van arrives at your location'
    },
    {
      title: '2. We Detail',
      description: 'Wash, polish, protect. Whatever you picked.',
      imageSrc: '/images/process/step-3-polish',
      imageAlt: 'Professional detailing in progress'
    },
    {
      title: '3. You\'re Done',
      description: 'Car looks good. You didn\'t have to go anywhere.',
      imageSrc: '/images/process/step-5-final',
      imageAlt: 'Clean detailed car ready to go'
    }
  ];
</script>

<svelte:head>
  <title>{BUSINESS_INFO.name} - {BUSINESS_INFO.tagline}</title>
  <meta name="description" content={BUSINESS_INFO.subTagline} />
</svelte:head>

<main>
  <!-- ZIP-First Hero - PWA Optimized -->
  <ZipCheckHero />

  <!-- Before/After Transformation - Hidden until real photos available -->
  <!-- <AnimatedSection animation="fade-in-up" threshold={0.3}>
    <section class="before-after-section">
      <h2 class="section-title">See The Transformation</h2>
      <p class="section-subtitle">Real results from our professional detailing services</p>
      
      <div class="before-after-container">
        <BeforeAfterSlider 
          beforeSrc="/images/before-after/exterior-before"
          afterSrc="/images/before-after/exterior-after"
          beforeAlt="Car exterior before professional detailing"
          afterAlt="Car exterior after professional detailing showing mirror finish"
        />
      </div>
    </section>
  </AnimatedSection> -->

  <!-- Services Showcase - Visual Grid -->
  <AnimatedSection animation="fade-in-up" threshold={0.2}>
    <section class="services-showcase">
      <h2 class="section-title">What We Do</h2>
      <p class="section-subtitle">Exterior, interior, or both</p>
      
      <div class="services-grid">
        <AnimatedSection animation="fade-in-up" threshold={0.15} delay={100}>
          <div class="service-card card-hover">
            <div class="service-image">
              <OptimizedImage src="/images/service-exterior" alt="Exterior detailing" />
            </div>
            <h3>Exterior</h3>
            <p>Wash, wax, polish</p>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-in-up" threshold={0.15} delay={200}>
          <div class="service-card card-hover">
            <div class="service-image">
              <OptimizedImage src="/images/service-interior" alt="Interior detailing" />
            </div>
            <h3>Interior</h3>
            <p>Vacuum, clean, condition</p>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-in-up" threshold={0.15} delay={300}>
          <div class="service-card card-hover">
            <div class="service-image">
              <OptimizedImage src="/images/service-ceramic" alt="Ceramic coating" />
            </div>
            <h3>Protection</h3>
            <p>Ceramic or wax coating</p>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-in-up" threshold={0.15} delay={400}>
          <div class="service-card card-hover">
            <div class="service-image">
              <OptimizedImage src="/images/service-polish" alt="Paint correction" />
            </div>
            <h3>Paint Fix</h3>
            <p>Remove swirls and scratches</p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  </AnimatedSection>

  <!-- Our Process Timeline -->
  <AnimatedSection animation="fade-in" threshold={0.2}>
    <section class="process-section">
      <h2 class="section-title">How It Works</h2>
      <p class="section-subtitle">Like a car wash, but we come to you</p>
      
      <ProcessTimeline steps={processSteps} />
    </section>
  </AnimatedSection>

  <!-- Packages Section -->
  <section class="packages-section">
    <h2 class="section-title">Pick What Works</h2>
    <p class="section-subtitle">We pull up. You stay busy. {BUSINESS_INFO.priceRange}</p>
    <PackageMenu onSelect={handlePackageSelect} />
  </section>

  <!-- Why Choose Us -->
  <section class="why-us">
    <h2>Why People Use Us</h2>
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

  .service-card:hover .service-image :global(img) {
    transform: scale(1.05);
  }

  /* Before/After Section */
  .before-after-section {
    max-width: 1400px;
    margin: 0 auto;
    padding: 8rem 2rem;
    background: var(--color-bg-lighter);
  }

  .before-after-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  /* Process Section */
  .process-section {
    max-width: 1400px;
    margin: 0 auto;
    padding: 8rem 2rem;
    background: var(--color-bg-white);
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
    .services-grid {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
  }

  @media (max-width: 640px) {
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

  /* Responsive adjustments for new sections */
  @media (max-width: 1024px) {
    .before-after-section,
    .process-section {
      padding: 5rem 2rem;
    }
  }

  @media (max-width: 640px) {
    .before-after-section,
    .process-section {
      padding: 3rem 1rem;
    }
  }
</style>
