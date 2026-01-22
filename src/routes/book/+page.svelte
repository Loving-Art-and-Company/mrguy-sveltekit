<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { SERVICE_PACKAGES, getPromoPrice, BUSINESS_INFO } from '$lib/data/services';
  import {
    BOOKING_STEPS,
    serviceStepSchema,
    vehicleStepSchema,
    dateStepSchema,
    addressStepSchema,
    paymentStepSchema,
    type BookingData,
    type StepId,
  } from '$lib/types/booking';
  import { ChevronLeft, ChevronRight, Check, Car, Calendar, MapPin, User, Sparkles } from 'lucide-svelte';
  import type { ZodError } from 'zod';

  // Get pre-selected package from URL
  const preselectedPackage = $page.url.searchParams.get('package');

  // Step management
  let currentStep = $state(0);
  let errors = $state<Record<string, string>>({});

  // Form data
  let formData = $state<BookingData>({
    service: {
      packageId: preselectedPackage || '',
      addons: [],
    },
    vehicle: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      notes: '',
    },
    schedule: {
      date: '',
      time: '10:00',
    },
    address: {
      street: '',
      city: '',
      state: 'FL',
      zip: '',
      instructions: '',
    },
    contact: {
      name: '',
      phone: '',
      email: '',
      promoCode: '',
    },
  });

  // Derived states
  let selectedPackage = $derived(SERVICE_PACKAGES.find((p) => p.id === formData.service.packageId));
  let isLastStep = $derived(currentStep === BOOKING_STEPS.length - 1);
  let canGoBack = $derived(currentStep > 0);

  // Validation
  function validateCurrentStep(): boolean {
    errors = {};
    const schemas = [
      serviceStepSchema,
      vehicleStepSchema,
      dateStepSchema,
      addressStepSchema,
      paymentStepSchema,
    ];
    const dataKeys: (keyof BookingData)[] = ['service', 'vehicle', 'schedule', 'address', 'contact'];

    try {
      schemas[currentStep].parse(formData[dataKeys[currentStep]]);
      return true;
    } catch (e) {
      const zodError = e as ZodError;
      zodError.issues.forEach((issue) => {
        const field = issue.path.join('.');
        errors[field] = issue.message;
      });
      return false;
    }
  }

  function nextStep() {
    if (validateCurrentStep()) {
      if (isLastStep) {
        handleSubmit();
      } else {
        currentStep++;
      }
    }
  }

  function prevStep() {
    if (canGoBack) {
      currentStep--;
    }
  }

  function selectPackage(packageId: string) {
    formData.service.packageId = packageId;
  }

  let isSubmitting = $state(false);
  let submitError = $state('');

  async function handleSubmit() {
    if (isSubmitting) return;
    isSubmitting = true;
    submitError = '';

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: formData.service.packageId,
          customerName: formData.contact.name,
          customerPhone: formData.contact.phone,
          customerEmail: formData.contact.email,
          bookingData: formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create checkout');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      submitError = err instanceof Error ? err.message : 'Something went wrong';
      isSubmitting = false;
    }
  }

  // Generate available times
  const availableTimes = Array.from({ length: 10 }, (_, i) => {
    const hour = 8 + i; // 8 AM to 5 PM
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Generate dates for next 30 days (excluding Sundays)
  function getAvailableDates() {
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
</script>

<svelte:head>
  <title>Book Your Detail | {BUSINESS_INFO.name}</title>
</svelte:head>

<main>
  <header>
    <a href="/" class="back-link">
      <ChevronLeft size={20} />
      Back
    </a>
    <h1>Book Your Detail</h1>
  </header>

  <!-- Progress bar -->
  <div class="progress">
    {#each BOOKING_STEPS as step, i}
      <div class="step-indicator" class:active={i === currentStep} class:completed={i < currentStep}>
        <span class="step-number">
          {#if i < currentStep}
            <Check size={14} />
          {:else}
            {i + 1}
          {/if}
        </span>
        <span class="step-label">{step.label}</span>
      </div>
      {#if i < BOOKING_STEPS.length - 1}
        <div class="step-connector" class:active={i < currentStep}></div>
      {/if}
    {/each}
  </div>

  <!-- Step content -->
  <section class="step-content">
    {#if currentStep === 0}
      <!-- Service Selection -->
      <h2>
        <Sparkles size={24} />
        Choose Your Package
      </h2>
      <div class="package-grid">
        {#each SERVICE_PACKAGES as pkg (pkg.id)}
          <button
            class="package-card"
            class:selected={formData.service.packageId === pkg.id}
            onclick={() => selectPackage(pkg.id)}
          >
            {#if pkg.badge}
              <span class="badge">{pkg.badge}</span>
            {/if}
            <h3>{pkg.name}</h3>
            <p class="price">${pkg.priceLow} - ${pkg.priceHigh}</p>
            <p class="desc">{pkg.description}</p>
          </button>
        {/each}
      </div>
      {#if errors['packageId']}
        <p class="error">{errors['packageId']}</p>
      {/if}
    {:else if currentStep === 1}
      <!-- Vehicle Info -->
      <h2>
        <Car size={24} />
        Vehicle Information
      </h2>
      <div class="form-grid">
        <label>
          <span>Make *</span>
          <input type="text" bind:value={formData.vehicle.make} placeholder="e.g., Tesla" />
          {#if errors['make']}<span class="error">{errors['make']}</span>{/if}
        </label>
        <label>
          <span>Model *</span>
          <input type="text" bind:value={formData.vehicle.model} placeholder="e.g., Model 3" />
          {#if errors['model']}<span class="error">{errors['model']}</span>{/if}
        </label>
        <label>
          <span>Year *</span>
          <input type="number" bind:value={formData.vehicle.year} min="1990" max={new Date().getFullYear() + 1} />
          {#if errors['year']}<span class="error">{errors['year']}</span>{/if}
        </label>
        <label>
          <span>Color</span>
          <input type="text" bind:value={formData.vehicle.color} placeholder="Optional" />
        </label>
      </div>
      <label class="full-width">
        <span>Special Notes</span>
        <textarea bind:value={formData.vehicle.notes} placeholder="Any details we should know?"></textarea>
      </label>
    {:else if currentStep === 2}
      <!-- Date/Time -->
      <h2>
        <Calendar size={24} />
        Pick a Date & Time
      </h2>
      <div class="form-grid">
        <label>
          <span>Date *</span>
          <select bind:value={formData.schedule.date}>
            <option value="">Select a date</option>
            {#each getAvailableDates() as date}
              <option value={date}>{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</option>
            {/each}
          </select>
          {#if errors['date']}<span class="error">{errors['date']}</span>{/if}
        </label>
        <label>
          <span>Time *</span>
          <select bind:value={formData.schedule.time}>
            {#each availableTimes as time}
              <option value={time}>{time.replace(/^0/, '')} {parseInt(time) < 12 ? 'AM' : 'PM'}</option>
            {/each}
          </select>
          {#if errors['time']}<span class="error">{errors['time']}</span>{/if}
        </label>
      </div>
      <p class="note">We service Mon-Sat, 8 AM - 6 PM</p>
    {:else if currentStep === 3}
      <!-- Address -->
      <h2>
        <MapPin size={24} />
        Service Location
      </h2>
      <div class="form-grid">
        <label class="full-width">
          <span>Street Address *</span>
          <input type="text" bind:value={formData.address.street} placeholder="123 Main St" />
          {#if errors['street']}<span class="error">{errors['street']}</span>{/if}
        </label>
        <label>
          <span>City *</span>
          <input type="text" bind:value={formData.address.city} placeholder="Weston" />
          {#if errors['city']}<span class="error">{errors['city']}</span>{/if}
        </label>
        <label>
          <span>State</span>
          <input type="text" bind:value={formData.address.state} maxlength="2" />
        </label>
        <label>
          <span>ZIP Code *</span>
          <input type="text" bind:value={formData.address.zip} placeholder="33326" />
          {#if errors['zip']}<span class="error">{errors['zip']}</span>{/if}
        </label>
      </div>
      <label class="full-width">
        <span>Parking Instructions</span>
        <textarea bind:value={formData.address.instructions} placeholder="Gate code, parking spot, etc."></textarea>
      </label>
    {:else if currentStep === 4}
      <!-- Contact -->
      <h2>
        <User size={24} />
        Contact Information
      </h2>
      <div class="form-grid">
        <label>
          <span>Name *</span>
          <input type="text" bind:value={formData.contact.name} placeholder="Your name" />
          {#if errors['name']}<span class="error">{errors['name']}</span>{/if}
        </label>
        <label>
          <span>Phone *</span>
          <input type="tel" bind:value={formData.contact.phone} placeholder="(954) 555-1234" />
          {#if errors['phone']}<span class="error">{errors['phone']}</span>{/if}
        </label>
        <label class="full-width">
          <span>Email (for receipt)</span>
          <input type="email" bind:value={formData.contact.email} placeholder="you@email.com" />
          {#if errors['email']}<span class="error">{errors['email']}</span>{/if}
        </label>
        <label class="full-width">
          <span>Promo Code</span>
          <input type="text" bind:value={formData.contact.promoCode} placeholder="Enter code" />
        </label>
      </div>

      <!-- Order Summary -->
      {#if selectedPackage}
        <div class="summary">
          <h3>Order Summary</h3>
          <div class="summary-row">
            <span>{selectedPackage.name}</span>
            <span>${selectedPackage.avgPrice}</span>
          </div>
          <div class="summary-row promo">
            <span>Fresh Start Discount (25%)</span>
            <span>-${Math.round(selectedPackage.avgPrice * 0.25)}</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span>${getPromoPrice(selectedPackage.avgPrice)}</span>
          </div>
        </div>
      {/if}
    {/if}
  </section>

  {#if submitError}
    <div class="submit-error">{submitError}</div>
  {/if}

  <!-- Navigation -->
  <div class="nav-buttons">
    {#if canGoBack}
      <button class="btn secondary" onclick={prevStep} disabled={isSubmitting}>
        <ChevronLeft size={18} />
        Back
      </button>
    {:else}
      <div></div>
    {/if}
    <button class="btn primary" onclick={nextStep} disabled={isSubmitting}>
      {#if isSubmitting}
        Processing...
      {:else if isLastStep}
        Continue to Payment
      {:else}
        Next
        <ChevronRight size={18} />
      {/if}
    </button>
  </div>
</main>

<style>
  main {
    max-width: 700px;
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

  .progress {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .step-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .step-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .step-indicator.active .step-number {
    background: #1a1a2e;
    color: white;
  }

  .step-indicator.completed .step-number {
    background: #10b981;
    color: white;
  }

  .step-label {
    font-size: 0.7rem;
    color: #9ca3af;
    text-align: center;
  }

  .step-indicator.active .step-label {
    color: #1a1a2e;
    font-weight: 600;
  }

  .step-connector {
    width: 30px;
    height: 2px;
    background: #e5e7eb;
    margin: 0 0.25rem;
    margin-bottom: 1rem;
  }

  .step-connector.active {
    background: #10b981;
  }

  .step-content {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .step-content h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    margin: 0 0 1.5rem 0;
    color: #1a1a2e;
  }

  .package-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .package-card {
    position: relative;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
  }

  .package-card:hover {
    border-color: #1a1a2e;
  }

  .package-card.selected {
    border-color: #e94560;
    background: #fef2f2;
  }

  .package-card .badge {
    position: absolute;
    top: -0.5rem;
    right: 0.5rem;
    background: #e94560;
    color: white;
    font-size: 0.6rem;
    padding: 0.2rem 0.5rem;
    border-radius: 1rem;
    font-weight: 600;
  }

  .package-card h3 {
    margin: 0 0 0.25rem 0;
    font-size: 0.95rem;
  }

  .package-card .price {
    color: #e94560;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .package-card .desc {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.4;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  label span {
    font-size: 0.85rem;
    font-weight: 500;
    color: #374151;
  }

  label.full-width {
    grid-column: 1 / -1;
  }

  input,
  select,
  textarea {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #1a1a2e;
    box-shadow: 0 0 0 3px rgba(26, 26, 46, 0.1);
  }

  textarea {
    min-height: 80px;
    resize: vertical;
  }

  .error {
    color: #dc2626;
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }

  .note {
    font-size: 0.85rem;
    color: #6b7280;
    margin-top: 1rem;
  }

  .summary {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.75rem;
  }

  .summary h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    font-size: 0.95rem;
  }

  .summary-row.promo {
    color: #10b981;
  }

  .summary-row.total {
    border-top: 1px solid #e5e7eb;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .nav-buttons {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn.primary {
    background: #e94560;
    color: white;
  }

  .btn.primary:hover {
    background: #d63850;
  }

  .btn.secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn.secondary:hover {
    background: #e5e7eb;
  }

  .submit-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .package-grid {
      grid-template-columns: 1fr;
    }

    .step-label {
      display: none;
    }

    .step-connector {
      width: 20px;
    }
  }
</style>
