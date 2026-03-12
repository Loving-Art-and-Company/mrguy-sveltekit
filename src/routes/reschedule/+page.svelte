<script lang="ts">
  import { BUSINESS_INFO } from '$lib/data/services';
  import PhoneInput from '$lib/components/PhoneInput.svelte';
  import OtpInput from '$lib/components/OtpInput.svelte';
  import { Phone, Calendar, ChevronLeft, Check, Loader2, AlertCircle, PartyPopper } from 'lucide-svelte';
  import { track } from '$lib/analytics';
  import { buildBookableDates, buildBookableTimeSlots, type AvailabilitySlot } from '$lib/scheduling';

  type Step = 'phone' | 'verify' | 'bookings' | 'date_select' | 'confirmation';

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
  let verificationCode = $state('');
  let verificationDestination = $state('');
  let isLoading = $state(false);
  let errorMessage = $state('');

  let bookings = $state<Booking[]>([]);
  let selectedBooking = $state<Booking | null>(null);
  let newDate = $state('');
  let newTime = $state('');
  let rescheduledBooking = $state<Booking | null>(null);
  let availabilityLoading = $state(false);
  let availabilityError = $state('');
  let availableTimes = $state<AvailabilitySlot[]>([]);

  async function sendVerificationCode() {
    if (phone.length !== 10) {
      errorMessage = 'Please enter a valid 10-digit phone number';
      return;
    }

    isLoading = true;
    errorMessage = '';
    track('reschedule_lookup_submitted');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to look up bookings');
      }

      const data = await response.json();
      verificationCode = '';
      verificationDestination = data.maskedDestination || '';
      step = 'verify';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Failed to look up bookings';
      track('reschedule_lookup_failed');
    } finally {
      isLoading = false;
    }
  }

  async function verifyCodeAndLoadBookings() {
    if (verificationCode.length !== 6) {
      errorMessage = 'Please enter the 6-digit verification code';
      return;
    }

    isLoading = true;
    errorMessage = '';

    try {
      const verifyResponse = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: verificationCode }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid or expired verification code');
      }

      const bookingsResponse = await fetch('/api/bookings/mine');
      if (!bookingsResponse.ok) {
        const data = await bookingsResponse.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load your bookings');
      }

      const data = await bookingsResponse.json();
      bookings = data.bookings || [];
      track('reschedule_lookup_success', { booking_count: bookings.length });
      step = 'bookings';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Verification failed';
      track('reschedule_lookup_failed');
    } finally {
      isLoading = false;
    }
  }

  // Proceed to date selection
  function selectBookingForReschedule(booking: Booking) {
    selectedBooking = booking;
    newDate = '';
    newTime = booking.time || '';
    availabilityError = '';
    availableTimes = [];
    track('reschedule_booking_selected', {
      booking_id: booking.id,
      service_name: booking.serviceName,
      booking_status: booking.status,
    });
    step = 'date_select';
  }

  async function loadAvailability(date: string) {
    availabilityLoading = true;
    availabilityError = '';

    try {
      const params = new URLSearchParams({ date });
      if (selectedBooking) {
        params.set('excludeBookingId', selectedBooking.id);
      }

      const response = await fetch(`/api/bookings/availability?${params.toString()}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Could not load available times right now.');
      }

      availableTimes = Array.isArray(data.slots)
        ? data.slots
        : buildBookableTimeSlots(date).map((slot) => ({ ...slot, available: true }));

      if (!availableTimes.some((slot) => slot.available)) {
        availabilityError = 'That day is fully booked. Please pick another date.';
      }

      if (!availableTimes.some((slot) => slot.value === newTime && slot.available)) {
        newTime = availableTimes.find((slot) => slot.available)?.value || '';
      }
    } catch (err) {
      availableTimes = buildBookableTimeSlots(date).map((slot) => ({ ...slot, available: true }));
      availabilityError = err instanceof Error ? err.message : 'Could not load availability.';
    } finally {
      availabilityLoading = false;
    }
  }

  function selectNewDate(date: string) {
    newDate = date;
    newTime = '';
    availableTimes = buildBookableTimeSlots(date).map((slot) => ({ ...slot, available: true }));
    void loadAvailability(date);
  }

  // Reschedule booking
  async function rescheduleBooking() {
    if (!selectedBooking || !newDate) {
      errorMessage = 'Please select a new date';
      return;
    }

    isLoading = true;
    errorMessage = '';
    track('reschedule_submit', {
      booking_id: selectedBooking.id,
      old_date: selectedBooking.date,
      new_date: newDate,
      new_time: newTime || undefined,
    });

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
      track('reschedule_success', {
        booking_id: data.booking?.id,
        new_date: data.booking?.date,
        new_time: data.booking?.time,
      });
      step = 'confirmation';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Reschedule failed';
      track('reschedule_failed', { booking_id: selectedBooking.id });
    } finally {
      isLoading = false;
    }
  }

  // Reset flow
  function startOver() {
    track('reschedule_flow_reset', { from_step: step });
    step = 'phone';
    phone = '';
    verificationCode = '';
    verificationDestination = '';
    bookings = [];
    selectedBooking = null;
    newDate = '';
    newTime = '';
    rescheduledBooking = null;
    errorMessage = '';
    availabilityLoading = false;
    availabilityError = '';
    availableTimes = [];
  }

  // Go back to bookings list
  function backToBookings() {
    track('reschedule_back_clicked');
    step = 'bookings';
    selectedBooking = null;
    newDate = '';
    newTime = '';
    errorMessage = '';
    availabilityLoading = false;
    availabilityError = '';
    availableTimes = [];
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

  const availableDates = buildBookableDates();

  function bookingStatusLabel(status: string): string {
    if (status === 'pending') return 'Awaiting Pablo';
    if (status === 'confirmed') return 'Confirmed';
    if (status === 'rescheduled') return 'Reschedule Requested';
    return status;
  }
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
    <div class="step-dot" class:active={step === 'phone' || step === 'verify'} class:completed={['bookings', 'date_select', 'confirmation'].includes(step)}></div>
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
      <p class="desc">Start with the phone number on your booking. We’ll use it to find the email address on file, then send your verification code there.</p>

      <form onsubmit={(e) => { e.preventDefault(); sendVerificationCode(); }}>
        <PhoneInput bind:value={phone} error={errorMessage && phone.length > 0 && phone.length < 10 ? errorMessage : ''} />

        {#if errorMessage && (phone.length === 0 || phone.length === 10)}
          <p class="error">{errorMessage}</p>
        {/if}

        <button type="submit" class="btn primary" disabled={isLoading || phone.length !== 10}>
          {#if isLoading}
            <Loader2 size={18} class="spinner" />
            Sending...
          {:else}
            Send Verification Code
          {/if}
        </button>
      </form>
    </section>

  {:else if step === 'verify'}
    <section class="card">
      <div class="icon">
        <Check size={32} />
      </div>
      <h2>Enter Verification Code</h2>
      <p class="desc">We found the email linked to that phone number and sent a 6-digit code to {verificationDestination || 'the email on file'}. Enter it to view your bookings.</p>

      <form onsubmit={(e) => { e.preventDefault(); verifyCodeAndLoadBookings(); }}>
        <OtpInput bind:value={verificationCode} error={errorMessage} disabled={isLoading} />

        <button type="submit" class="btn primary" disabled={isLoading || verificationCode.length !== 6}>
          {#if isLoading}
            <Loader2 size={18} class="spinner" />
            Verifying...
          {:else}
            Verify and Continue
          {/if}
        </button>

        <button type="button" class="btn secondary" onclick={sendVerificationCode} disabled={isLoading}>
          Resend Code
        </button>

        <button type="button" class="btn secondary" onclick={startOver} disabled={isLoading}>
          Use a Different Number
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
      <p class="desc">Select the booking request you want Pablo to review again.</p>

      {#if bookings.length === 0}
        <div class="empty">
          <AlertCircle size={48} class="empty-icon" />
          <p>No upcoming bookings found for this phone number.</p>
          <a href="/book" class="btn primary">Book Now</a>
        </div>
      {:else}
        <div class="bookings-list">
          {#each bookings as booking (booking.id)}
            {@const canReschedule = booking.status === 'confirmed' || booking.status === 'pending' || booking.status === 'rescheduled'}
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
                <span class="price">{formatPrice(booking.price)} paid</span>
              </div>
              <div class="booking-actions">
                <span class="status" class:confirmed={booking.status === 'confirmed'} class:pending={booking.status === 'pending'}>
                  {bookingStatusLabel(booking.status)}
                </span>
                {#if canReschedule}
                  <span class="reschedule-hint">Tap to request a new time</span>
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
      <p class="desc">Choose a new preferred time. Pablo still needs to confirm the reschedule request.</p>

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
          <select id="new-date" bind:value={newDate} class="select-input" onchange={(e) => selectNewDate((e.currentTarget as HTMLSelectElement).value)}>
            <option value="">Select a date...</option>
            {#each availableDates as date}
              <option value={date.value}>{formatDate(date.value)}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="new-time">Preferred Time</label>
          <select id="new-time" bind:value={newTime} class="select-input" disabled={availabilityLoading || !newDate}>
            {#each availableTimes.filter((slot) => slot.available) as slot}
              <option value={slot.value}>{slot.label}</option>
            {/each}
          </select>
          {#if availabilityLoading}
            <p class="helper">Checking the latest availability...</p>
          {/if}
          {#if availabilityError}
            <p class="error">{availabilityError}</p>
          {/if}
        </div>

        {#if errorMessage}
          <p class="error">{errorMessage}</p>
        {/if}

        <button type="submit" class="btn primary" disabled={isLoading || !newDate}>
          {#if isLoading}
            <Loader2 size={18} class="spinner" />
            Sending request...
          {:else}
            Request Reschedule
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
      <h2>Reschedule Request Received!</h2>
      <p class="desc">Your new preferred time is being held while Pablo reviews it.</p>

      {#if rescheduledBooking}
        <div class="confirmation-details">
          <div class="detail-row">
            <span class="label">Service</span>
            <span class="value">{rescheduledBooking.serviceName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Requested Date</span>
            <span class="value highlight">{formatDate(rescheduledBooking.date)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Requested Time</span>
            <span class="value highlight">{formatTime(rescheduledBooking.time)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Amount Paid</span>
            <span class="value">{formatPrice(rescheduledBooking.price)}</span>
          </div>
        </div>
      {/if}

      <p class="note">Pablo will send you a confirmation once the new time is approved.</p>

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

  .helper {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    color: #6b7280;
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
