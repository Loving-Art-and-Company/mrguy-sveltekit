<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import PWAInstaller from '$lib/components/PWAInstaller.svelte';
  import Agentation from '$lib/components/Agentation.svelte';
  import { dev } from '$app/environment';

  let { children } = $props();
</script>

<svelte:head>
  <meta name="description" content="Mr. Guy Mobile Detail - Professional mobile car detailing in South Florida" />
  <link rel="icon" type="image/x-icon" href="/favicons/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
  <link rel="manifest" href="/favicons/site.webmanifest" />
  <meta name="theme-color" content="#0EA5E9" />
</svelte:head>

<Header />
{@render children()}
<PWAInstaller />

{#if dev}
  <Agentation />
{/if}
