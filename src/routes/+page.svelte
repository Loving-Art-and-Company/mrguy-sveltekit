<script lang="ts">
  import { PackageMenu, BUSINESS_INFO, type ServicePackage } from '$lib';
  import Sparkle from '$lib/components/Sparkle.svelte';
  import OptimizedImage from '$lib/components/OptimizedImage.svelte';
  import AnimatedSection from '$lib/components/AnimatedSection.svelte';
  import BeforeAfterSlider from '$lib/components/BeforeAfterSlider.svelte';
  import ProcessTimeline from '$lib/components/ProcessTimeline.svelte';

  import BentoSlideshow from '$lib/components/BentoSlideshow.svelte';
  import BookingModal from '$lib/components/BookingModal.svelte';
  import { ripple } from '$lib/actions/ripple';

  // Booking modal state
  let showBookingModal = $state(false);
  let selectedService = $state<ServicePackage | null>(null);

  function handlePackageSelect(pkg: ServicePackage) {
    selectedService = pkg;
    showBookingModal = true;
  }

  function closeBookingModal() {
    showBookingModal = false;
  }

  function handleEditService() {
    showBookingModal = false;
    // Scroll to services section
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
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


  <!-- Bento Slideshow -->
  <BentoSlideshow />

  <!-- Packages Section -->
  <section id="services" class="packages-section">
    <h2 class="section-title">Skip the Car Wash Line. Forever.</h2>
    <p class="section-subtitle">Book in 60 seconds. We show up. You never leave home.</p>
    <PackageMenu onSelect={handlePackageSelect} />
  </section>

  <!-- Why Choose Us -->
  <section class="why-us">
    <h2>Why People Choose Us</h2>
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

<!-- Booking Modal -->
{#if showBookingModal && selectedService}
  <BookingModal 
    service={selectedService}
    isOpen={showBookingModal}
    onClose={closeBookingModal}
    onEditService={handleEditService}
  />
{/if}

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
    letter-spacing: -0.03em;
    background: linear-gradient(
      135deg,
      var(--text-primary) 0%,
      var(--color-primary-deep) 50%,
      var(--text-primary) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .section-subtitle {
    text-align: center;
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: var(--text-secondary);
    margin: 0 0 4rem 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    opacity: 0.9;
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

  /* Packages Section - Liquid Gradient */
  .packages-section {
    max-width: 1400px;
    margin: 0 auto;
    padding: 8rem 2rem;
    background: linear-gradient(
      180deg,
      var(--color-bg-white) 0%,
      var(--color-bg-main) 30%,
      var(--color-bg-lighter) 70%,
      var(--color-bg-main) 100%
    );
    position: relative;
    overflow: hidden;
  }

  .packages-section::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at 30% 20%,
      rgba(14, 165, 233, 0.08) 0%,
      transparent 50%
    );
    animation: float 20s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(2%, 2%) rotate(1deg); }
    66% { transform: translate(-1%, 1%) rotate(-1deg); }
  }

  /* Why Choose Us - Apple Glass Style */
  .why-us {
    max-width: 1200px;
    margin: 0 auto;
    background: linear-gradient(
      135deg,
      rgba(224, 242, 254, 0.8) 0%,
      rgba(240, 249, 255, 0.9) 50%,
      rgba(224, 242, 254, 0.8) 100%
    );
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 5rem 2rem;
    border-radius: 2.5rem;
    text-align: center;
    margin-bottom: 6rem;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 
      0 20px 60px rgba(14, 165, 233, 0.1),
      0 8px 24px rgba(0, 0, 0, 0.06),
      inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  }

  .why-us h2 {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    margin: 0 0 3rem 0;
    color: var(--text-primary);
    letter-spacing: -0.03em;
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
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 1rem 2rem;
    border-radius: var(--radius-full);
    font-weight: 500;
    font-size: 1.125rem;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 
      0 4px 16px rgba(0, 0, 0, 0.06),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .feature:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 
      0 12px 32px rgba(14, 165, 233, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.08),
      inset 0 0 0 1px rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.95);
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
