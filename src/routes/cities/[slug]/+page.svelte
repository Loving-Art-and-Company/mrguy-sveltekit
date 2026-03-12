<script lang="ts">
  import { onMount } from 'svelte';
  import { MapPin, Phone, ShieldCheck, Clock3, Sparkles } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { PackageMenu } from '$lib';
  import type { ServicePackage } from '$lib/data/services';
  import { BUSINESS_INFO, SERVICE_PACKAGES } from '$lib/data/services';
  import BookingModal from '$lib/components/BookingModal.svelte';
  import { track } from '$lib/analytics';
  import { MRGUY_CANONICAL_ORIGIN } from '$lib/constants/site';

  let { data }: { data: PageData } = $props();

  let showBookingModal = $state(false);
  let selectedService = $state<ServicePackage | null>(null);

  const pagePath = $derived(`/cities/${data.city.slug}`);
  const pageTitle = $derived(`Mobile Car Detailing in ${data.city.name}, FL | Mr. Guy Detail`);
  const offerCatalog = SERVICE_PACKAGES.map((pkg) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: pkg.name,
      description: pkg.description
    },
    priceSpecification: {
      '@type': 'PriceSpecification',
      minPrice: pkg.priceLow,
      maxPrice: pkg.priceHigh,
      priceCurrency: 'USD'
    }
  }));
  const citySchemaJson = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AutoDetailing',
      name: BUSINESS_INFO.name,
      description: data.city.metaDescription,
      url: `${MRGUY_CANONICAL_ORIGIN}${pagePath}`,
      telephone: '+19548044747',
      priceRange: BUSINESS_INFO.priceRange,
      image: `${MRGUY_CANONICAL_ORIGIN}/images/og-image.png`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: data.city.name,
        addressRegion: 'FL',
        addressCountry: 'US'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: data.city.latitude,
        longitude: data.city.longitude
      },
      areaServed: [
        { '@type': 'City', name: data.city.name },
        ...data.relatedCities.map((city) => ({ '@type': 'City', name: city.name }))
      ],
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '18:00'
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `Detailing services in ${data.city.name}, FL`,
        itemListElement: offerCatalog
      }
    })
  );

  function handlePackageSelect(pkg: ServicePackage) {
    selectedService = pkg;
    showBookingModal = true;
    track('package_selected', {
      service_id: pkg.id,
      service_name: pkg.name,
      quoted_price: pkg.priceHigh,
      location: `city_${data.city.slug}_packages`,
      city: data.city.slug
    });
  }

  function closeBookingModal() {
    showBookingModal = false;
  }

  function handleEditService() {
    showBookingModal = false;
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  }

  onMount(() => {
    track('city_landing_viewed', {
      city: data.city.slug,
      city_name: data.city.name
    });

    if (data.promoEnabled) {
      track('promo_banner_viewed', {
        location: `city_${data.city.slug}_hero`
      });
    }
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={data.city.metaDescription} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={data.city.metaDescription} />
  <meta property="og:url" content={`${MRGUY_CANONICAL_ORIGIN}${pagePath}`} />
  <meta property="og:image" content={`${MRGUY_CANONICAL_ORIGIN}/images/og-image.png`} />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={data.city.metaDescription} />
  <meta name="twitter:image" content={`${MRGUY_CANONICAL_ORIGIN}/images/og-image.png`} />
  <script type="application/ld+json">{citySchemaJson}</script>
</svelte:head>

<main class="city-page">
  <section class="hero">
    <p class="eyebrow">Mobile detailing in {data.city.name}, Florida</p>
    <h1>Mobile Car Detailing in {data.city.name}, FL</h1>
    <p class="hero-copy">
      {data.city.localPitch}
    </p>

    {#if data.promoEnabled}
      <div class="promo-banner" role="status" aria-live="polite">
        <Sparkles size={18} />
        <span><strong>Fresh Start:</strong> 25% off your first booking in {data.city.name}.</span>
      </div>
    {/if}

    <div class="hero-actions">
      <a
        href="#services"
        class="primary-btn"
        onclick={() => track('cta_clicked', { cta_type: 'book_now', location: 'city_hero', city: data.city.slug })}
      >
        Book in {data.city.name}
      </a>
      <a
        href="tel:+19548044747"
        class="secondary-btn"
        onclick={() => track('cta_clicked', { cta_type: 'phone_call', location: 'city_hero', city: data.city.slug })}
      >
        <Phone size={18} />
        <span>954-804-4747</span>
      </a>
    </div>

    <div class="hero-points">
      <div class="point">
        <ShieldCheck size={18} />
        <span>Insured, professional, driveway-first service</span>
      </div>
      <div class="point">
        <Clock3 size={18} />
        <span>Book in about 60 seconds and keep your day moving</span>
      </div>
      <div class="point">
        <MapPin size={18} />
        <span>Serving {data.city.name} and nearby West Broward neighborhoods</span>
      </div>
    </div>
  </section>

  <section class="local-section">
    <div class="local-copy">
      <h2>Why drivers in {data.city.name} book Mr. Guy Detail</h2>
      <p>
        We handle everything on-site, from quick maintenance washes to interior resets and ceramic
        coating prep, so your vehicle gets the attention it needs without disrupting your schedule.
      </p>

      <ul class="benefits">
        {#each BUSINESS_INFO.valueProps as valueProp}
          <li>{valueProp}</li>
        {/each}
      </ul>
    </div>

    <aside class="area-card">
      <h3>Nearby neighborhoods we cover</h3>
      <ul>
        {#each data.city.nearbyAreas as area}
          <li>{area}</li>
        {/each}
      </ul>
      <p>Need to confirm your address? Call or text and we will let you know before you book.</p>
    </aside>
  </section>

  <section id="services" class="services-section">
    <h2>Detailing packages available in {data.city.name}</h2>
    <p class="services-copy">
      Choose the package that fits your car right now. We will confirm the details and service
      address after you submit your request.
    </p>
    <PackageMenu showPromo={data.promoEnabled} onSelect={handlePackageSelect} />
  </section>

  <section class="faq-section">
    <h2>Questions about detailing in {data.city.name}?</h2>
    <div class="faq-grid">
      <details>
        <summary>Do you bring everything needed for the appointment?</summary>
        <p>
          Yes. We arrive with the products, tools, and detailing workflow needed to complete the
          service at your home or parking location.
        </p>
      </details>
      <details>
        <summary>Can I book if I am between {data.city.name} and another nearby area?</summary>
        <p>
          Usually, yes. If you are close to {data.city.name}, book your request and add any notes
          in the address instructions so Pablo can confirm the final fit.
        </p>
      </details>
      <details>
        <summary>What is the best service for a family or commuter vehicle?</summary>
        <p>
          Most families start with the Family Hauler package for interior recovery, then move to a
          maintenance wash cadence once the car is back under control.
        </p>
      </details>
    </div>
  </section>

  <section class="nearby-section">
    <h2>Also serving nearby Broward cities</h2>
    <div class="city-links">
      {#each data.relatedCities as city}
        <a
          href={`/cities/${city.slug}`}
          class="city-link"
          onclick={() => track('cta_clicked', { cta_type: 'service_area', location: 'city_nearby', city: city.slug })}
        >
          {city.name}
        </a>
      {/each}
    </div>
  </section>
</main>

{#if showBookingModal && selectedService}
  <BookingModal
    service={selectedService}
    isOpen={showBookingModal}
    showPromo={data.promoEnabled}
    initialCity={data.city.name}
    onClose={closeBookingModal}
    onEditService={handleEditService}
  />
{/if}

<style>
  .city-page {
    background: var(--color-bg-white);
  }

  .hero,
  .local-section,
  .services-section,
  .faq-section,
  .nearby-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 4rem 1.5rem;
  }

  .hero {
    padding-top: 5rem;
    text-align: center;
  }

  .eyebrow {
    margin: 0 0 1rem 0;
    color: var(--color-primary);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.85rem;
  }

  h1,
  h2 {
    color: var(--text-primary);
    letter-spacing: -0.03em;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.4rem, 5vw, 4.25rem);
  }

  .hero-copy,
  .services-copy,
  .local-copy p,
  .area-card p,
  .faq-grid p {
    color: var(--text-secondary);
    line-height: 1.7;
  }

  .hero-copy {
    max-width: 760px;
    margin: 1.25rem auto 0;
    font-size: 1.1rem;
  }

  .promo-banner {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.5rem;
    padding: 0.9rem 1.2rem;
    border-radius: 999px;
    background: rgba(14, 165, 233, 0.12);
    border: 1px solid rgba(14, 165, 233, 0.22);
    color: var(--text-primary);
    font-weight: 600;
  }

  .hero-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 2rem;
  }

  .primary-btn,
  .secondary-btn,
  .city-link {
    text-decoration: none;
    transition: transform 0.2s, background 0.2s, color 0.2s;
  }

  .primary-btn,
  .secondary-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.95rem 1.25rem;
    border-radius: var(--radius-lg);
    font-weight: 700;
  }

  .primary-btn {
    background: var(--color-primary);
    color: var(--text-inverse);
  }

  .secondary-btn {
    background: rgba(255, 255, 255, 0.9);
    color: var(--text-primary);
    border: 1px solid var(--border-light);
  }

  .primary-btn:hover,
  .secondary-btn:hover,
  .city-link:hover {
    transform: translateY(-1px);
  }

  .hero-points {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 2.5rem;
  }

  .point,
  .area-card,
  .faq-grid details {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid var(--border-light);
    border-radius: 1.25rem;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
  }

  .point {
    padding: 1rem 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: center;
    color: var(--text-primary);
    font-weight: 600;
  }

  .point :global(svg) {
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .local-section {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
    gap: 1.5rem;
    align-items: start;
  }

  .benefits {
    margin: 1.5rem 0 0;
    padding-left: 1.25rem;
    color: var(--text-primary);
    line-height: 1.8;
  }

  .area-card {
    padding: 1.5rem;
  }

  .area-card h3 {
    margin-top: 0;
    color: var(--text-primary);
  }

  .area-card ul {
    margin: 1rem 0;
    padding-left: 1.1rem;
    color: var(--text-primary);
    line-height: 1.8;
  }

  .services-section {
    background: linear-gradient(
      180deg,
      var(--color-bg-white) 0%,
      var(--color-bg-main) 45%,
      var(--color-bg-lighter) 100%
    );
    border-radius: 2rem;
  }

  .services-section h2,
  .services-copy,
  .faq-section h2,
  .nearby-section h2 {
    text-align: center;
  }

  .services-copy {
    max-width: 720px;
    margin: 0.75rem auto 0;
  }

  .faq-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .faq-grid details {
    padding: 1.25rem;
  }

  .faq-grid summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--text-primary);
  }

  .faq-grid p {
    margin-bottom: 0;
  }

  .city-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .city-link {
    padding: 0.8rem 1rem;
    border-radius: 999px;
    background: rgba(14, 165, 233, 0.1);
    color: var(--text-primary);
    border: 1px solid rgba(14, 165, 233, 0.18);
    font-weight: 600;
  }

  @media (max-width: 900px) {
    .hero-points,
    .faq-grid,
    .local-section {
      grid-template-columns: 1fr;
    }
  }
</style>
