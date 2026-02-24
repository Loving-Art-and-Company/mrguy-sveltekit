<script lang="ts">
  import { BUSINESS_INFO } from '$lib/data/services';
  import PhoneInput from '$lib/components/PhoneInput.svelte';
  import { Phone, Calendar, ChevronLeft, Check, Loader2, AlertCircle, PartyPopper } from 'lucide-svelte';

  type Step = 'phone' | 'bookings' | 'date_select' | 'confirmation';

  interface Booking {
    id: string;
    serviceName: string;
    price: number;
    date: string;
    time: string | null;
    status: string;
  }

  // State
  let step = $state<Step>('phone');
  let phone = $state('');
  let isLoading = $state(false);
  let errorMessage = $state('');

  let bookings = $state<Booking[]>([]);
  let selectedBooking = $state<Booking | null>(null);
  let newDate = $state('');
  let newTime = $state('');
  let rescheduledBooking = $state<Booking | null>(null);

  // Look up bookings by phone number
  async function lookupBookings() {
    if (phone.length !== 10) {
      errorMessage = 'Please enter a valid 10-digit phone number';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to look up bookings');
      }

      const data = await response.json();
      bookings = data.bookings || [];
      step = 'bookings';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Failed to look up bookings';
    } finally {
      isLoading = false;
    }
  }

  // Proceed to date selection
  function selectBookingForReschedule(booking: Booking) {
    selectedBooking = booking;
    newDate = '';
    newTime = booking.time || '10:00';
    step = 'date_select';
  }

  // Reschedule booking
  async function rescheduleBooking() {
    if (!selectedBooking || !newDate) {
      errorMessage = 'Please select a new date';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/bookings/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          newDate,
          newTime: newTime || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reschedule booking');
      }

      const data = await response.json();
      rescheduledBooking = data.booking;
      step = 'confirmation';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Reschedule failed';
    } finally {
      isLoading = false;
    }
  }

  // Reset flow
  function startOver() {
    step = 'phone';
    phone = '';
    bookings = [];
    selectedBooking = null;
    newDate = '';
    newTime = '';
    rescheduledBooking = null;
    errorMessage = '';
  }

  // Go back to bookings list
  function backToBookings() {
    step = 'bookings';
    selectedBooking = null;
    newDate = '';
    newTime = '';
    errorMessage = '';
  }

  // Formatting helpers
  function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatTime(timeStr: string | null): string {
    if (!timeStr) return 'TBD';
    const hour = parseInt(timeStr);
    if (isNaN(hour)) return timeStr;
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:00 ${period}`;
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  }

  // Available times for rescheduling (8 AM - 5 PM)
  const availableTimes = Array.from({ length: 10 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Get available dates (next 30 days, excluding Sundays)
  function getAvailableDates(): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0) {
        // Exclude Sundays
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  }

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

  <!-- Step indicators -->
  <div class="steps">
    <div class="step-dot" class:active={step === 'phone'} class:completed={['bookings', 'date_select', 'confirmation'].includes(step)}></div>
    <div class="step-line" class:completed={['bookings', 'date_select', 'confirmation'].includes(step)}></div>
    <div class="step-dot" class:active={step === 'bookings' || step === 'date_select'} class:completed={step === 'confirmation'}></div>
    <div class="step-line" class:completed={step === 'confirmation'}></div>
    <div class="step-dot" class:active={step === 'confirmation'}></div>
  </div>

  {#if step === 'phone'}
    <!-- Step 1: Phone Entry -->
    <section class="card">
      <div class="icon">
        <Phone size={32} />
      </div>
      <h2>Enter Your Phone Number</h2>
      <p class="desc">We'll look up your bookings using the phone number on file.</p>

      <form onsubmit={(e) => { e.preventDefault(); lookupBookings(); }}>
        <PhoneInput bind:value={phone} error={errorMessage && phone.length > 0 && phone.length < 10 ? errorMessage : ''} />

        {#if errorMessage && (phone.length === 0 || phone.length === 10)}
          <p class="error">{errorMessage}</p>
        {/if}

        <button type="submit" class="btn primary" disabled={isLoading || phone.length !== 10}>
          {#if isLoading}
            <Loader2 size={18} class="spinner" />
            Sending...
          {:else}
            Look Up My Booking
          {/if}
        </button>
      </form>
    </section>

  {:else if step === 'bookings'}
    <!-- Step 3: Booking List -->
    <section class="card">
      <div class="icon success">
        <Check size={32} />
      </div>
      <h2>Your Bookings</h2>
      <p class="desc">Select a booking to reschedule</p>

      {#if bookings.length === 0}
        <div class="empty">
          <AlertCircle size={48} class="empty-icon" />
          <p>No upcoming bookings found for this phone number.</p>
          <a href="/book" class="btn primary">Book Now</a>
        </div>
      {:else}
        <div class="bookings-list">
          {#each bookings as booking (booking.id)}
            {@const canReschedule = booking.status === 'confirmed' || booking.status === 'pending'}
            <button
              class="booking-card"
              disabled={!canReschedule}
              onclick={() => canReschedule && selectBookingForReschedule(booking)}
            >
              <div class="booking-info">
                <span class="package">{booking.serviceName}</span>
                <span class="datetime">
                  <Calendar size={14} />
                  {formatDate(booking.date)} at {formatTime(booking.time)}
                </span>
                <span class="price">{formatPrice(booking.price)} (paid)</span>
              </div>
              <div class="booking-actions">
                <span class="status" class:confirmed={booking.status === 'confirmed'} class:pending={booking.status === 'pending'}>
                  {booking.status}
                </span>
                {#if canReschedule}
                  <span class="reschedule-hint">Tap to reschedule</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {/if}

      <button type="button" class="btn secondary" onclick={startOver}>
        Start Over
      </button>
    </section>

  {:else if step === 'date_select'}
    <!-- Step 4: Date Selection -->
    <section class="card">
      <div class="icon">
        <Calendar size={32} />
      </div>
      <h2>Select New Date</h2>

      {#if selectedBooking}
        <div class="current-booking">
          <p class="label">Current booking:</p>
          <p class="value">{selectedBooking.serviceName}</p>
          <p class="value">{formatDate(selectedBooking.date)} at {formatTime(selectedBooking.time)}</p>
        </div>
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); rescheduleBooking(); }}>
        <div class="form-group">
          <label for="new-date">New Date</label>
          <select id="new-date" bind:value={newDate} class="select-input">
            <option value="">Select a date...</option>
            {#each getAvailableDates() as date}
              <option value={date}>{formatDate(date)}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="new-time">Preferred Time</label>
          <select id="new-time" bind:value={newTime} class="select-input">
            {#each availableTimes as time}
              <option value={time}>{formatTime(time)}</option>
            {/each}
          </select>
        </div>

        {#if errorMessage}
          <p class="error">{errorMessage}</p>
        {/if}

        <button type="submit" class="btn primary" disabled={isLoading || !newDate}>
          {#if isLoading}
            <Loader2 size={18} class="spinner" />
            Rescheduling...
          {:else}
            Confirm Reschedule
          {/if}
        </button>

        <button type="button" class="btn secondary" onclick={backToBookings}>
          Cancel
        </button>
      </form>
    </section>

  {:else if step === 'confirmation'}
    <!-- Step 5: Confirmation -->
    <section class="card">
      <div class="icon success">
        <PartyPopper size={32} />
      </div>
      <h2>Booking Rescheduled!</h2>
      <p class="desc">Your appointment has been updated.</p>

      {#if rescheduledBooking}
        <div class="confirmation-details">
          <div class="detail-row">
            <span class="label">Service</span>
            <span class="value">{rescheduledBooking.serviceName}</span>
          </div>
          <div class="detail-row">
            <span class="label">New Date</span>
            <span class="value highlight">{formatDate(rescheduledBooking.date)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Time</span>
            <span class="value highlight">{formatTime(rescheduledBooking.time)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Amount Paid</span>
            <span class="value">{formatPrice(rescheduledBooking.price)}</span>
          </div>
        </div>
      {/if}

      <p class="note">We'll send you a confirmation text shortly.</p>

      <a href="/" class="btn primary">Done</a>
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
    margin-bottom: 1.5rem;
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

  .back-link:hover {
    color: var(--text-primary);
  }

  /* Step indicators */
  .steps {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    gap: 0;
  }

  .step-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #e5e7eb;
    transition: all 0.3s;
  }

  .step-dot.active {
    background: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2);
  }

  .step-dot.completed {
    background: #10b981;
  }

  .step-line {
    width: 40px;
    height: 2px;
    background: #e5e7eb;
    transition: all 0.3s;
  }

  .step-line.completed {
    background: #10b981;
  }

  /* Card */
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
    color: var(--text-primary);
  }

  .icon.success {
    background: #d1fae5;
    color: #10b981;
  }

  h2 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }

  .desc {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0 0 1.5rem 0;
  }

  /* Forms */
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    text-align: left;
  }

  .form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .select-input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    background: white;
    cursor: pointer;
  }

  .select-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }

  /* Buttons */
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
    text-decoration: none;
  }

  .btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn.primary {
    background: var(--color-primary);
    color: var(--text-inverse);
  }

  .btn.primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .btn.secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn.secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .btn.link {
    background: transparent;
    color: #6b7280;
    font-weight: 400;
    font-size: 0.85rem;
    padding: 0.5rem;
  }

  .btn.link:hover:not(:disabled) {
    color: var(--text-primary);
    text-decoration: underline;
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
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Bookings list */
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
    align-items: flex-start;
    padding: 1rem;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .booking-card:not(:disabled):hover {
    border-color: var(--color-primary);
    background: var(--color-bg-lighter);
  }

  .booking-card:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .booking-info {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .package {
    font-weight: 600;
    color: var(--text-primary);
  }

  .datetime {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #6b7280;
  }

  .price {
    font-size: 0.85rem;
    color: #059669;
    font-weight: 500;
  }

  .booking-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
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

  .status.pending {
    background: #fef3c7;
    color: #d97706;
  }

  .reschedule-hint {
    font-size: 0.7rem;
    color: var(--color-primary);
  }

  /* Empty state */
  .empty {
    padding: 2rem 0;
  }

  .empty :global(.empty-icon) {
    color: #d1d5db;
    margin-bottom: 1rem;
  }

  .empty p {
    color: #6b7280;
    margin: 0 0 1.5rem 0;
  }

  /* Current booking display */
  .current-booking {
    background: #f3f4f6;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .current-booking .label {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .current-booking .value {
    margin: 0;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  /* Confirmation details */
  .confirmation-details {
    background: #f9fafb;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-row .label {
    color: #6b7280;
    font-size: 0.9rem;
  }

  .detail-row .value {
    color: var(--text-primary);
    font-weight: 500;
    font-size: 0.9rem;
  }

  .detail-row .value.highlight {
    color: var(--color-primary);
  }

  .note {
    font-size: 0.85rem;
    color: #6b7280;
    margin: 0 0 1.5rem 0;
  }
</style>
