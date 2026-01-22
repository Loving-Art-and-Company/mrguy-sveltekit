<script lang="ts">
  import Header from '$lib/components/Header.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <meta name="description" content="Mr. Guy Mobile Detail - Professional mobile car detailing in South Florida" />
</svelte:head>

<Header />
{@render children()}

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #ffffff;
    color: #1a1a2e;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  :global(a) {
    color: inherit;
  }

  :global(button) {
    font-family: inherit;
  }
</style>
