<script lang="ts">
  import { BUSINESS_INFO } from '$lib/data/services';
  import { Phone, KeyRound, Calendar, ChevronLeft, Check, Loader2 } from 'lucide-svelte';

  type Step = 'phone' | 'otp' | 'bookings';

  let step = $state<Step>('phone');
  let phone = $state('');
  let otpCode = $state('');
  let isLoading = $state(false);
  let errorMessage = $state('');

  // Mock bookings - will be replaced with Supabase fetch
  let bookings = $state<Booking[]>([]);
  let selectedBooking = $state<Booking | null>(null);
  let newDate = $state('');
  let newTime = $state('');

  interface Booking {
    id: string;
    date: string;
    time: string;
    packageName: string;
    status: string;
  }

  async function sendOtp() {
    if (!phone || phone.length < 10) {
      errorMessage = 'Please enter a valid phone number';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send code');
      }

      step = 'otp';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Failed to send verification code';
    } finally {
      isLoading = false;
    }
  }

  async function verifyOtp() {
    if (!otpCode || otpCode.length < 4) {
      errorMessage = 'Please enter the verification code';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid code');
      }

      // Fetch bookings for this phone
      await fetchBookings();
      step = 'bookings';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Verification failed';
    } finally {
      isLoading = false;
    }
  }

  async function fetchBookings() {
    // TODO: Fetch from Supabase based on verified phone
    // For now, use mock data
    bookings = [
      {
        id: '1',
        date: '2026-01-25',
        time: '10:00',
        packageName: 'The "Quick Refresh"',
        status: 'confirmed',
      },
    ];
  }

  async function rescheduleBooking() {
    if (!selectedBooking || !newDate || !newTime) {
      errorMessage = 'Please select a new date and time';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      const bookingToUpdate = selectedBooking;
      // TODO: Update booking in Supabase
      console.log('Rescheduling:', {
        bookingId: bookingToUpdate.id,
        newDate,
        newTime,
      });

      // Update local state
      const idx = bookings.findIndex((b) => b.id === bookingToUpdate.id);
      if (idx !== -1) {
        bookings[idx] = {
          ...bookings[idx],
          date: newDate,
          time: newTime,
        };
      }

      selectedBooking = null;
      newDate = '';
      newTime = '';
      errorMessage = '';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Reschedule failed';
    } finally {
      isLoading = false;
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatTime(timeStr: string): string {
    const hour = parseInt(timeStr);
    return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  // Available times for rescheduling
  const availableTimes = Array.from({ length: 10 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Get min date (tomorrow)
  const minDate = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  })();
</script>

<svelte:head>
  <title>Reschedule | {BUSINESS_INFO.name}</title>
</svelte:head>

<main>
  <header>
    <a href="/" class="back-link">
      <ChevronLeft size={20} />
      Back
    </a>
    <h1>Reschedule Booking</h1>
  </header>

  {#if step === 'phone'}
    <!-- Step 1: Phone Number -->
    <section class="card">
      <div class="icon">
        <Phone size={32} />
      </div>
      <h2>Enter Your Phone Number</h2>
      <p class="desc">We'll send you a verification code to access your bookings.</p>

      <form onsubmit={(e) => { e.preventDefault(); sendOtp(); }}>
        <input
          type="tel"
          placeholder="(954) 555-1234"
          bind:value={phone}
          class="phone-input"
          maxlength="14"
        />

        {#if errorMessage}
          <p class="error">{errorMessage}</p>
        {/if}

        <button type="submit" class="btn primary" disabled={isLoading}>
          {#if isLoading}
            <Loader2 size={18} class="spinner" />
            Sending...
          {:else}
            Send Code
          {/if}
        </button>
      </form>
    </section>
  {:else if step === 'otp'}
    <!-- Step 2: OTP Verification -->
    <section class="card">
      <div class="icon">
        <KeyRound size={32} />
      </div>
      <h2>Enter Verification Code</h2>
      <p class="desc">Enter the 6-digit code we sent to {phone}</p>

      <form onsubmit={(e) => { e.preventDefault(); verifyOtp(); }}>
        <input
          type="text"
          placeholder="000000"
          bind:value={otpCode}
          class="otp-input"
          maxlength="6"
          inputmode="numeric"
          pattern="[0-9]*"
        />

        {#if errorMessage}
          <p class="error">{errorMessage}</p>
        {/if}

        <button type="submit" class="btn primary" disabled={isLoading}>
          {#if isLoading}
            <Loader2 size={18} class="spinner" />
            Verifying...
          {:else}
            Verify
          {/if}
        </button>

        <button type="button" class="btn secondary" onclick={() => { step = 'phone'; otpCode = ''; }}>
          Change Phone Number
        </button>
      </form>
    </section>
  {:else if step === 'bookings'}
    <!-- Step 3: Bookings List -->
    <section class="card">
      <div class="icon success">
        <Check size={32} />
      </div>
      <h2>Your Bookings</h2>
      <p class="desc">Select a booking to reschedule</p>

      {#if bookings.length === 0}
        <div class="empty">
          <p>No upcoming bookings found for this phone number.</p>
          <a href="/book" class="btn primary">Book Now</a>
        </div>
      {:else}
        <div class="bookings-list">
          {#each bookings as booking (booking.id)}
            <button
              class="booking-card"
              class:selected={selectedBooking?.id === booking.id}
              onclick={() => selectedBooking = booking}
            >
              <div class="booking-info">
                <span class="package">{booking.packageName}</span>
                <span class="datetime">
                  <Calendar size={14} />
                  {formatDate(booking.date)} at {formatTime(booking.time)}
                </span>
              </div>
              <span class="status" class:confirmed={booking.status === 'confirmed'}>
                {booking.status}
              </span>
            </button>
          {/each}
        </div>

        {#if selectedBooking}
          <div class="reschedule-form">
            <h3>New Date & Time</h3>
            <div class="form-row">
              <label>
                <span>Date</span>
                <input type="date" bind:value={newDate} min={minDate} />
              </label>
              <label>
                <span>Time</span>
                <select bind:value={newTime}>
                  <option value="">Select time</option>
                  {#each availableTimes as time}
                    <option value={time}>{formatTime(time)}</option>
                  {/each}
                </select>
              </label>
            </div>

            {#if errorMessage}
              <p class="error">{errorMessage}</p>
            {/if}

            <button class="btn primary" onclick={rescheduleBooking} disabled={isLoading}>
              {#if isLoading}
                <Loader2 size={18} class="spinner" />
                Updating...
              {:else}
                Confirm Reschedule
              {/if}
            </button>
          </div>
        {/if}
      {/if}
    </section>
  {/if}
</main>

<style>
  main {
    max-width: 500px;
    margin: 0 auto;
    padding: 1rem;
    min-height: 100vh;
  }

  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  header h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    text-decoration: none;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
  }

  .icon {
    width: 64px;
    height: 64px;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    color: #1a1a2e;
  }

  .icon.success {
    background: #d1fae5;
    color: #10b981;
  }

  h2 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    color: #1a1a2e;
  }

  .desc {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0 0 1.5rem 0;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .phone-input,
  .otp-input {
    padding: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1.25rem;
    text-align: center;
    font-family: inherit;
  }

  .phone-input:focus,
  .otp-input:focus {
    outline: none;
    border-color: #1a1a2e;
    box-shadow: 0 0 0 3px rgba(26, 26, 46, 0.1);
  }

  .otp-input {
    letter-spacing: 0.5rem;
    font-family: monospace;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn.primary {
    background: #e94560;
    color: white;
  }

  .btn.primary:hover:not(:disabled) {
    background: #d63850;
  }

  .btn.secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn.secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .error {
    color: #dc2626;
    font-size: 0.85rem;
    margin: 0;
    text-align: center;
  }

  :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .bookings-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .booking-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .booking-card:hover {
    border-color: #1a1a2e;
  }

  .booking-card.selected {
    border-color: #e94560;
    background: #fef2f2;
  }

  .booking-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .package {
    font-weight: 600;
    color: #1a1a2e;
  }

  .datetime {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #6b7280;
  }

  .status {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    background: #f3f4f6;
    color: #6b7280;
    text-transform: capitalize;
  }

  .status.confirmed {
    background: #d1fae5;
    color: #059669;
  }

  .reschedule-form {
    border-top: 1px solid #e5e7eb;
    padding-top: 1.5rem;
    text-align: left;
  }

  .reschedule-form h3 {
    font-size: 1rem;
    margin: 0 0 1rem 0;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-row label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-row label span {
    font-size: 0.85rem;
    font-weight: 500;
    color: #374151;
  }

  .form-row input,
  .form-row select {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
  }

  .empty {
    padding: 2rem 0;
  }

  .empty p {
    color: #6b7280;
    margin: 0 0 1.5rem 0;
  }
</style>
