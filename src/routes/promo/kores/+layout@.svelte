<script>
  // Reset layout - standalone promo page without header/footer
  import '../../../app.css';
  
  let { children } = $props();
</script>

<svelte:head>
  <meta name="theme-color" content="#0f172a" />
</svelte:head>

{@render children()}

<style>
  :global(body) {
    background: #0f172a !important;
  }
</style>
