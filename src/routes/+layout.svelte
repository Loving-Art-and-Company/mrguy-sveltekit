<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import PWAInstaller from '$lib/components/PWAInstaller.svelte';
  import Agentation from '$lib/components/Agentation.svelte';
  import { dev } from '$app/environment';
  import { trackPageview } from '$lib/analytics';
  import { MRGUY_CANONICAL_ORIGIN } from '$lib/constants/site';

  let { children } = $props();

  // Hide header/footer for standalone promo pages and admin routes
  const isStandalone = $derived(page.url.pathname.startsWith('/promo'));
  const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
  const showChrome = $derived(!isStandalone && !isAdmin);

  const canonicalUrl = $derived(`${MRGUY_CANONICAL_ORIGIN}${page.url.pathname}`);

  // Track pageviews on navigation (must be in component context)
  afterNavigate(({ to }) => {
    if (!to?.url) return;
    trackPageview(to.url.href);
  });
</script>

<svelte:head>
  <meta name="description" content="Mr. Guy Mobile Detail — Professional mobile car detailing in West Broward, South Florida. We come to you." />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="icon" type="image/x-icon" href="/favicons/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
  <link rel="manifest" href="/favicons/site.webmanifest" />
  <meta name="theme-color" content="#0EA5E9" />

  <!-- Open Graph defaults (pages can override) -->
  <meta property="og:site_name" content="Mr. Guy Mobile Detail" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter Card defaults -->
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

{#if showChrome}
  <Header />
{/if}
{@render children()}
{#if showChrome}
  <Footer />
  <PWAInstaller />
{/if}

{#if dev}
  <Agentation />
{/if}
