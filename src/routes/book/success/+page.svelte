<script lang="ts">
  import { page } from '$app/stores';
  import { BUSINESS_INFO } from '$lib/data/services';
  import { CheckCircle, Calendar, Phone } from 'lucide-svelte';
  import Sparkle from '$lib/components/Sparkle.svelte';

  const sessionId = $page.url.searchParams.get('session_id');
</script>

<svelte:head>
  <title>Booking Confirmed | {BUSINESS_INFO.name}</title>
</svelte:head>

<main>
  <div class="success-card">
    <Sparkle size={20} opacity={0.2} top="5%" left="5%" delay={0} />
    <Sparkle size={16} opacity={0.15} top="10%" right="8%" delay={0.8} />
    <Sparkle size={18} opacity={0.18} bottom="10%" left="10%" delay={0.4} />
    
    <div class="icon">
      <CheckCircle size={64} />
    </div>

    <h1>Booking Confirmed!</h1>
    <p class="tagline">We know a guy. He's on his way.</p>

    <div class="details">
      <p>
        Thank you for choosing {BUSINESS_INFO.name}! You'll receive a confirmation text shortly with your appointment details.
      </p>
    </div>

    <div class="next-steps">
      <h2>What's Next?</h2>
      <ul>
        <li>
          <Calendar size={20} />
          <span>You'll get an SMS reminder 24 hours before your appointment</span>
        </li>
        <li>
          <Phone size={20} />
          <span>Our detailer will call when they're on the way</span>
        </li>
      </ul>
    </div>

    <div class="actions">
      <a href="/" class="btn primary">Back to Home</a>
      <a href="/reschedule" class="btn secondary">Need to Reschedule?</a>
    </div>

    {#if sessionId}
      <p class="confirmation-id">Confirmation: {sessionId.slice(-8).toUpperCase()}</p>
    {/if}
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

  .success-card {
    position: relative;
    background: white;
    border-radius: 1.5rem;
    padding: 3rem 2rem;
    max-width: 500px;
    width: 100%;
    text-align: center;
    overflow: hidden;
  }

  .icon {
    color: #10b981;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }

  .tagline {
    color: var(--color-primary);
    font-weight: 600;
    font-size: 1.1rem;
    margin: 0 0 1.5rem 0;
  }

  .details {
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 2rem;
  }

  .next-steps {
    background: #f9fafb;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    text-align: left;
  }

  .next-steps h2 {
    font-size: 1rem;
    margin: 0 0 1rem 0;
    color: var(--text-primary);
  }

  .next-steps ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .next-steps li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
    font-size: 0.9rem;
    color: #374151;
  }

  .next-steps li :global(svg) {
    color: var(--color-primary);
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn {
    display: block;
    padding: 0.875rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    text-align: center;
    transition: all 0.2s;
  }

  .btn.primary {
    background: var(--color-primary);
    color: var(--text-inverse);
  }

  .btn.primary:hover {
    background: var(--color-primary-hover);
  }

  .btn.secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn.secondary:hover {
    background: #e5e7eb;
  }

  .confirmation-id {
    font-size: 0.8rem;
    color: #9ca3af;
    margin-top: 1.5rem;
    font-family: monospace;
  }
</style>
