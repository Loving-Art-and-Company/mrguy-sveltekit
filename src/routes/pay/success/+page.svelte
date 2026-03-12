<!-- src/routes/pay/success/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';

  const bookingId = $derived($page.url.searchParams.get('booking_id'));
  const isExistingBookingPayment = $derived(Boolean(bookingId));
</script>

<div class="success-container">
  <svg xmlns="http://www.w3.org/2000/svg" class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
  <h1>Payment Received!</h1>
  {#if isExistingBookingPayment}
    <p>Thank you for your payment. Your balance has been recorded, and a receipt has been sent to your email.</p>
  {:else}
    <p>Thank you for your payment. Your requested appointment time is still pending Pablo’s confirmation, and a receipt has been sent to your email.</p>
  {/if}
  <a href="/" class="home-button">Back to Homepage</a>
</div>

<style>
  .success-container {
    max-width: 520px;
    margin: 4rem auto;
    padding: 3rem 2rem;
    text-align: center;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    background-color: #f8fafc; /* slate-50 */
  }
  .success-icon {
    width: 60px;
    height: 60px;
    color: #10b981; /* emerald-500 */
    margin-bottom: 1rem;
  }
  h1 {
    color: #1e293b; /* slate-800 */
    margin-bottom: 0.5rem;
  }
  p {
    color: #475569; /* slate-600 */
    margin-bottom: 2rem;
  }
  .home-button {
    background: #0ea5e9; /* sky-500 */
    font-family: Inter, sans-serif;
    color: #ffffff;
    border-radius: 6px;
    border: 0;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    transition: all 0.2s ease;
  }
  .home-button:hover {
    filter: brightness(1.1);
  }
</style>
