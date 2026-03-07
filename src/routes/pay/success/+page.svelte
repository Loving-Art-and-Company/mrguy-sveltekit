<script lang="ts">
  import { page } from '$app/stores';
  import { CheckCircle } from 'lucide-svelte';
  import { BUSINESS_INFO } from '$lib/data/services';

  const bookingId = $page.url.searchParams.get('booking_id');
  const sessionId = $page.url.searchParams.get('session_id');
</script>

<svelte:head>
  <title>Payment Received | {BUSINESS_INFO.name}</title>
</svelte:head>

<main>
  <div class="card">
    <div class="icon">
      <CheckCircle size={64} />
    </div>
    <h1>Payment Received</h1>
    <p class="lead">Thanks for paying with {BUSINESS_INFO.name}.</p>
    <p class="body">Your detail service payment went through successfully. If you need anything else, call or text 954-804-4747.</p>

    {#if bookingId}
      <p class="meta">Booking: {bookingId}</p>
    {/if}

    {#if sessionId}
      <p class="meta">Receipt: {sessionId.slice(-8).toUpperCase()}</p>
    {/if}

    <a href="/" class="button">Back to Home</a>
  </div>
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: var(--color-primary-deep);
  }

  .card {
    width: 100%;
    max-width: 32rem;
    background: white;
    border-radius: 1.25rem;
    padding: 2.5rem 2rem;
    text-align: center;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.12);
  }

  .icon {
    color: #10b981;
    margin-bottom: 1.25rem;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 2rem;
    color: var(--text-primary);
  }

  .lead {
    margin: 0 0 1rem;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  .body {
    margin: 0;
    color: #4b5563;
    line-height: 1.6;
  }

  .meta {
    margin: 1rem 0 0;
    color: #6b7280;
    font-family: monospace;
    font-size: 0.85rem;
  }

  .button {
    display: inline-block;
    margin-top: 1.5rem;
    padding: 0.875rem 1.5rem;
    border-radius: 0.5rem;
    background: var(--color-primary);
    color: var(--text-inverse);
    text-decoration: none;
    font-weight: 700;
  }
</style>
