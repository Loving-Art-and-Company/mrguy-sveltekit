<script lang="ts">
  import { X, Calendar, MapPin, User, Check, ChevronRight } from 'lucide-svelte';
  import type { ServicePackage } from '$lib/data/services';
  import { getPromoPrice } from '$lib/data/services';
  import { track } from '$lib/analytics';

  interface Props {
    service: ServicePackage;
    isOpen: boolean;
    showPromo?: boolean;
    onClose: () => void;
    onEditService: () => void;
  }

  let { service, isOpen, showPromo = false, onClose, onEditService }: Props = $props();

  const displayPrice = $derived(showPromo ? getPromoPrice(service.priceHigh) : service.priceHigh);

  // Step management (0=Date/Time, 1=Location, 2=Contact)
  let currentStep = $state(0);
  let isSubmitting = $state(false);
  let showSuccess = $state(false);
  let successCountdown = $state(3);
  let errors = $state<Record<string, string>>({});

  // Form data
  let schedule = $state({ date: '', time: '' });
  let address = $state({ street: '', city: 'Weston', state: 'FL', zip: '', instructions: '' });
  let contact = $state({ name: '', phone: '', email: '' });

  // Generate available dates (next 30 days, no Sundays)
  function getAvailableDates(): { value: string; label: string }[] {
    const dates: { value: string; label: string }[] = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0) { // Skip Sundays
        const value = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        dates.push({ value, label });
      }
    }
    return dates;
  }

  const availableDates = getAvailableDates();

  // Time slots
  const timeSlots = [
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
  ];

  // Format date for display
  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format time for display
  function formatTime(timeStr: string): string {
    const slot = timeSlots.find(t => t.value === timeStr);
    return slot?.label || timeStr;
  }

  // Format phone number as user types
  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function handlePhoneInput(e: Event) {
    const input = e.target as HTMLInputElement;
    contact.phone = formatPhone(input.value);
  }

  function handleEditServiceClick() {
    track('booking_edit_service', { service: service.name });
    onEditService();
  }

  // Validation
  function validateStep(step: number): boolean {
    errors = {};
    
    if (step === 0) {
      if (!schedule.date) errors.date = 'Please select a date';
      if (!schedule.time) errors.time = 'Please select a time';
    } else if (step === 1) {
      if (!address.street || address.street.length < 5) errors.street = 'Please enter a valid street address';
      if (!address.city || address.city.length < 2) errors.city = 'Please enter a city';
      if (!address.zip || !/^\d{5}$/.test(address.zip)) errors.zip = 'Please enter a valid 5-digit ZIP code';
    } else if (step === 2) {
      if (!contact.name || contact.name.length < 2) errors.name = 'Please enter your name';
      const phoneDigits = contact.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) errors.phone = 'Please enter a valid 10-digit phone number';
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    
    if (currentStep < 2) {
      track('booking_step_completed', { step: currentStep + 1, service: service.name });
      currentStep++;
    } else {
      submitBooking();
    }
  }

  function editStep(step: number) {
    if (step < currentStep) {
      currentStep = step;
    }
  }

  async function submitBooking() {
    if (!validateStep(2)) return;
    
    isSubmitting = true;
    errors = {};
    track('booking_submit', { service: service.name, price: displayPrice });

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: {
            id: service.id,
            name: service.name,
            price: service.priceHigh
          },
          schedule,
          address,
          contact
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Booking failed');
      }

      // Show success message
      showSuccess = true;
      successCountdown = 3;
      track('booking_success', { service: service.name, price: displayPrice });
      
      // Countdown and auto-close
      const interval = setInterval(() => {
        successCountdown--;
        if (successCountdown <= 0) {
          clearInterval(interval);
          handleClose();
        }
      }, 1000);

    } catch (err) {
      errors.submit = err instanceof Error ? err.message : 'Booking failed. Please try again or call 954-804-4747.';
      track('booking_error', { service: service.name });
    } finally {
      isSubmitting = false;
    }
  }

  function handleClose() {
    track('booking_modal_closed', { step: currentStep + 1, success: showSuccess });
    // Reset state
    currentStep = 0;
    showSuccess = false;
    schedule = { date: '', time: '' };
    address = { street: '', city: 'Weston', state: 'FL', zip: '', instructions: '' };
    contact = { name: '', phone: '', email: '' };
    errors = {};
    onClose();
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClose();
    }
  }

  // Lock body scroll when modal is open
  $effect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      track('booking_modal_opened', { service: service.name });
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="modal-overlay" onclick={handleOverlayClick} onkeydown={handleKeydown} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
    <div class="modal-container">
      
      {#if showSuccess}
        <!-- Success State -->
        <div class="success-screen">
          <div class="success-icon">
            <Check size={48} />
          </div>
          <h2>Booking Confirmed!</h2>
          <p>We've sent a confirmation to your phone. Check your texts!</p>
          <div class="countdown">Closing in {successCountdown}...</div>
        </div>
      {:else}
        <!-- Header -->
        <header class="modal-header">
          <button class="close-btn" onclick={handleClose} aria-label="Close">
            <X size={24} />
          </button>
          <h2 id="modal-title">Book Appointment</h2>
          <div class="step-indicator">Step {currentStep + 1} of 3</div>
        </header>

        <!-- Service Summary -->
        <div class="service-summary">
          <div class="service-info">
            <h3>{service.name}</h3>
            <span class="price">${displayPrice}</span>
          </div>
          <ul class="includes">
            {#each service.includes.slice(0, 3) as item}
              <li>{item}</li>
            {/each}
          </ul>
          <button class="edit-service-btn" onclick={handleEditServiceClick}>
            Change Service
          </button>
        </div>

        <!-- Steps Container -->
        <div class="steps">
          <!-- Step 1: Date & Time -->
          <section class="step" class:active={currentStep === 0} class:completed={currentStep > 0}>
            <button 
              class="step-header" 
              onclick={() => editStep(0)}
              disabled={currentStep === 0}
              type="button"
            >
              <div class="step-title">
                {#if currentStep > 0}
                  <span class="step-check"><Check size={16} /></span>
                {:else}
                  <span class="step-icon"><Calendar size={20} /></span>
                {/if}
                <span>Date & Time</span>
              </div>
              {#if currentStep > 0}
                <div class="step-summary-text">
                  {formatDate(schedule.date)} at {formatTime(schedule.time)}
                  <span class="edit-link">Edit</span>
                </div>
              {/if}
            </button>
            
            {#if currentStep === 0}
              <div class="step-content">
                <fieldset class="form-section">
                  <legend class="form-label">Select Date *</legend>
                  <div class="date-grid">
                    {#each availableDates.slice(0, 14) as date}
                      <button
                        type="button"
                        class="date-btn"
                        class:selected={schedule.date === date.value}
                        onclick={() => schedule.date = date.value}
                      >
                        {date.label}
                      </button>
                    {/each}
                  </div>
                  {#if errors.date}<span class="error">{errors.date}</span>{/if}
                </fieldset>

                {#if schedule.date}
                  <fieldset class="form-section">
                    <legend class="form-label">Select Time *</legend>
                    <div class="time-grid">
                      {#each timeSlots as slot}
                        <button
                          type="button"
                          class="time-btn"
                          class:selected={schedule.time === slot.value}
                          onclick={() => schedule.time = slot.value}
                        >
                          {slot.label}
                        </button>
                      {/each}
                    </div>
                    {#if errors.time}<span class="error">{errors.time}</span>{/if}
                  </fieldset>
                {/if}

                <button 
                  class="continue-btn" 
                  onclick={nextStep} 
                  disabled={!schedule.date || !schedule.time}
                >
                  Continue
                  <ChevronRight size={18} />
                </button>
              </div>
            {/if}
          </section>

          <!-- Step 2: Location -->
          <section class="step" class:active={currentStep === 1} class:completed={currentStep > 1} class:locked={currentStep < 1}>
            <button 
              class="step-header" 
              onclick={() => editStep(1)}
              disabled={currentStep <= 1}
              type="button"
            >
              <div class="step-title">
                {#if currentStep > 1}
                  <span class="step-check"><Check size={16} /></span>
                {:else}
                  <span class="step-icon"><MapPin size={20} /></span>
                {/if}
                <span>Service Location</span>
              </div>
              {#if currentStep > 1}
                <div class="step-summary-text">
                  {address.street}, {address.city}
                  <span class="edit-link">Edit</span>
                </div>
              {/if}
            </button>
            
            {#if currentStep === 1}
              <div class="step-content">
                <div class="form-grid">
                  <label class="form-field full-width">
                    <span class="form-label">Street Address *</span>
                    <input 
                      type="text" 
                      bind:value={address.street} 
                      placeholder="123 Main St"
                      class:error={errors.street}
                    />
                    {#if errors.street}<span class="error">{errors.street}</span>{/if}
                  </label>
                  
                  <label class="form-field">
                    <span class="form-label">City *</span>
                    <input 
                      type="text" 
                      bind:value={address.city} 
                      placeholder="Weston"
                      class:error={errors.city}
                    />
                    {#if errors.city}<span class="error">{errors.city}</span>{/if}
                  </label>
                  
                  <label class="form-field">
                    <span class="form-label">State</span>
                    <input 
                      type="text" 
                      bind:value={address.state} 
                      maxlength="2"
                      placeholder="FL"
                    />
                  </label>
                  
                  <label class="form-field">
                    <span class="form-label">ZIP Code *</span>
                    <input 
                      type="text" 
                      bind:value={address.zip} 
                      placeholder="33326"
                      maxlength="5"
                      inputmode="numeric"
                      class:error={errors.zip}
                    />
                    {#if errors.zip}<span class="error">{errors.zip}</span>{/if}
                  </label>
                  
                  <label class="form-field full-width">
                    <span class="form-label">Parking Instructions (optional)</span>
                    <textarea 
                      bind:value={address.instructions} 
                      placeholder="Gate code, parking spot, etc."
                      rows="2"
                    ></textarea>
                  </label>
                </div>

                <button 
                  class="continue-btn" 
                  onclick={nextStep} 
                  disabled={!address.street || !address.city || !address.zip}
                >
                  Continue
                  <ChevronRight size={18} />
                </button>
              </div>
            {/if}
          </section>

          <!-- Step 3: Contact -->
          <section class="step" class:active={currentStep === 2} class:locked={currentStep < 2}>
            <div class="step-header">
              <div class="step-title">
                <span class="step-icon"><User size={20} /></span>
                <span>Your Information</span>
              </div>
            </div>
            
            {#if currentStep === 2}
              <div class="step-content">
                <div class="form-grid">
                  <label class="form-field">
                    <span class="form-label">Full Name *</span>
                    <input 
                      type="text" 
                      bind:value={contact.name} 
                      placeholder="John Doe"
                      autocomplete="name"
                      class:error={errors.name}
                    />
                    {#if errors.name}<span class="error">{errors.name}</span>{/if}
                  </label>
                  
                  <label class="form-field">
                    <span class="form-label">Phone Number *</span>
                    <input 
                      type="tel" 
                      value={contact.phone}
                      oninput={handlePhoneInput}
                      placeholder="(954) 555-1234"
                      autocomplete="tel"
                      class:error={errors.phone}
                    />
                    {#if errors.phone}<span class="error">{errors.phone}</span>{/if}
                  </label>
                  
                  <label class="form-field full-width">
                    <span class="form-label">Email (optional)</span>
                    <input 
                      type="email" 
                      bind:value={contact.email} 
                      placeholder="you@email.com"
                      autocomplete="email"
                      class:error={errors.email}
                    />
                    {#if errors.email}<span class="error">{errors.email}</span>{/if}
                  </label>
                </div>

                <!-- Booking Summary -->
                <div class="booking-summary">
                  <h4>Booking Summary</h4>
                  <div class="summary-row">
                    <span>{service.name}</span>
                    <span class="summary-price">${displayPrice}</span>
                  </div>
                  <div class="summary-row light">
                    <span>{formatDate(schedule.date)} at {formatTime(schedule.time)}</span>
                  </div>
                  <div class="summary-row light">
                    <span>{address.street}, {address.city} FL {address.zip}</span>
                  </div>
                </div>

                <p class="sms-note">
                  We'll text you to confirm vehicle details before your appointment
                </p>

                {#if errors.submit}
                  <div class="submit-error">{errors.submit}</div>
                {/if}

                <button 
                  class="submit-btn" 
                  onclick={nextStep} 
                  disabled={isSubmitting || !contact.name || !contact.phone}
                >
                  {#if isSubmitting}
                    Processing...
                  {:else}
                    Book Appointment - ${displayPrice}
                  {/if}
                </button>
              </div>
            {/if}
          </section>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Modal Overlay */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Modal Container */
  .modal-container {
    background: white;
    width: 100%;
    max-width: 560px;
    max-height: calc(100vh - 2rem);
    border-radius: 1.5rem;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    overflow-y: auto;
    animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(30px) scale(0.98);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Mobile: Full screen from bottom */
  @media (max-width: 640px) {
    .modal-overlay {
      padding: 0;
      align-items: flex-end;
    }

    .modal-container {
      max-width: 100%;
      max-height: 95vh;
      border-radius: 1.5rem 1.5rem 0 0;
      animation: slideUpMobile 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUpMobile {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  }

  /* Header */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: #f3f4f6;
    border-radius: 50%;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .step-indicator {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  /* Service Summary */
  .service-summary {
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-bottom: 1px solid #e5e7eb;
  }

  .service-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .service-info h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .service-info .price {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-primary);
  }

  .includes {
    list-style: none;
    padding: 0;
    margin: 0 0 0.75rem 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .includes li {
    font-size: 0.75rem;
    color: #6b7280;
    background: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  .edit-service-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  .edit-service-btn:hover {
    color: var(--color-primary-hover);
  }

  /* Steps */
  .steps {
    padding: 0 1.5rem 1.5rem;
  }

  .step {
    border-bottom: 1px solid #e5e7eb;
  }

  .step:last-child {
    border-bottom: none;
  }

  .step.locked {
    opacity: 0.4;
    pointer-events: none;
  }

  .step-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem 0;
    width: 100%;
    background: none;
    border: none;
    text-align: left;
    cursor: default;
  }

  .step.completed .step-header {
    cursor: pointer;
  }

  .step.completed .step-header:hover {
    background: #f9fafb;
    margin: 0 -1.5rem;
    padding: 1rem 1.5rem;
    width: calc(100% + 3rem);
  }

  .step-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .step-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #f3f4f6;
    border-radius: 50%;
    color: #6b7280;
  }

  .step.active .step-icon {
    background: var(--color-primary);
    color: white;
  }

  .step-check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #10b981;
    border-radius: 50%;
    color: white;
  }

  .step-summary-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin-left: 2.75rem;
  }

  .edit-link {
    color: var(--color-primary);
    margin-left: 0.5rem;
    text-decoration: underline;
  }

  .step-content {
    padding-bottom: 1.5rem;
    animation: expandIn 0.2s ease;
  }

  @keyframes expandIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Form Elements */
  .form-section {
    margin-bottom: 1.5rem;
    border: none;
    padding: 0;
  }

  .form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-field.full-width {
    grid-column: 1 / -1;
  }

  input, textarea {
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }

  input.error {
    border-color: #ef4444;
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  .error {
    font-size: 0.75rem;
    color: #ef4444;
    margin-top: 0.25rem;
  }

  /* Date & Time Grids */
  .date-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .date-btn, .time-btn {
    padding: 0.625rem 0.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .date-btn:hover, .time-btn:hover {
    border-color: var(--color-primary);
    background: #f0f9ff;
  }

  .date-btn.selected, .time-btn.selected {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: white;
  }

  .time-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
  }

  @media (max-width: 640px) {
    .date-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .time-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .form-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Continue Button */
  .continue-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 1rem;
  }

  .continue-btn:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
  }

  .continue-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Booking Summary */
  .booking-summary {
    background: #f9fafb;
    border-radius: 0.75rem;
    padding: 1rem;
    margin: 1.5rem 0 1rem;
  }

  .booking-summary h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 0.375rem 0;
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  .summary-row.light {
    color: #6b7280;
    font-size: 0.85rem;
  }

  .summary-price {
    font-weight: 700;
    color: var(--color-primary);
  }

  .sms-note {
    font-size: 0.8rem;
    color: #6b7280;
    text-align: center;
    margin: 0 0 1rem 0;
    padding: 0.75rem;
    background: #fef3c7;
    border-radius: 0.5rem;
  }

  .submit-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  /* Submit Button */
  .submit-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1.125rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Success Screen */
  .success-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    min-height: 400px;
  }

  .success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: #10b981;
    border-radius: 50%;
    color: white;
    margin-bottom: 1.5rem;
    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes scaleIn {
    from {
      transform: scale(0);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .success-screen h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: var(--text-primary);
  }

  .success-screen p {
    margin: 0 0 1.5rem 0;
    color: #6b7280;
    font-size: 1rem;
  }

  .countdown {
    font-size: 0.875rem;
    color: #9ca3af;
  }
</style>
