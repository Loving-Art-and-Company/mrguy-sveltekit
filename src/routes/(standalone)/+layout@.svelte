<script>
  import '../../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <meta name="theme-color" content="#ffffff" />
</svelte:head>

{@render children()}

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
</style>
