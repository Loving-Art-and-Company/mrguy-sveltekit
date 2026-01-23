<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		SUBSCRIPTION_TIERS,
		type SubscriptionTier,
	} from '$lib/data/services';
	import {
		BOOKING_3_STEPS,
		serviceLocationStepSchema,
		vehicleScheduleStepSchema,
		contactReviewStepSchema,
		type ServiceLocationStep,
		type VehicleScheduleStep,
		type ContactReviewStep,
	} from '$lib/types/booking';
	import BookingProgressBar from '$lib/components/booking/BookingProgressBar.svelte';
	import ServiceCard from '$lib/components/booking/ServiceCard.svelte';
	import AddressAutocomplete from '$lib/components/booking/AddressAutocomplete.svelte';
	import VehicleTypeSelector from '$lib/components/booking/VehicleTypeSelector.svelte';
	import TimeSlotPicker from '$lib/components/booking/TimeSlotPicker.svelte';
	import { ChevronLeft, ChevronRight, Check } from 'lucide-svelte';
	import type { ZodError } from 'zod';

	// Step management
	let currentStep = $state(1);
	let errors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);

	// Form data for 3 steps
	let step1Data = $state<Partial<ServiceLocationStep>>({
		packageId: '',
		street: '',
		city: '',
		state: 'FL',
		zip: '',
		placeId: '',
	});

	let step2Data = $state<Partial<VehicleScheduleStep>>({
		vehicleType: undefined,
		date: '',
		time: '',
	});

	let step3Data = $state<Partial<ContactReviewStep>>({
		name: '',
		phone: '',
		email: '',
		notes: '',
		promoCode: '',
	});

	// Derived states
	let selectedService = $derived(
		SUBSCRIPTION_TIERS.find((t) => t.id === step1Data.packageId)
	);

	// Transform subscription tiers for ServiceCard component
	const serviceOptions = SUBSCRIPTION_TIERS.map((tier) => ({
		id: tier.id,
		name: tier.name,
		priceLow: tier.priceLow,
		priceHigh: tier.priceHigh,
		description: tier.description,
		badge: tier.badge,
		memberPrice: { low: tier.priceLow, high: tier.priceHigh },
	}));

	// Validation functions
	function validateStep1(): boolean {
		try {
			serviceLocationStepSchema.parse(step1Data);
			errors = {};
			return true;
		} catch (err: any) {
			errors = {};
			err.errors?.forEach((error: any) => {
				const key = error.path.join('.');
				errors[key] = error.message;
			});
			return false;
		}
	}

	function validateStep2(): boolean {
		try {
			vehicleScheduleStepSchema.parse(step2Data);
			errors = {};
			return true;
		} catch (err: any) {
			errors = {};
			err.errors?.forEach((error: any) => {
				const key = error.path.join('.');
				errors[key] = error.message;
			});
			return false;
		}
	}

	function validateStep3(): boolean {
		try {
			contactReviewStepSchema.parse(step3Data);
			errors = {};
			return true;
		} catch (err: any) {
			errors = {};
			err.errors?.forEach((error: any) => {
				const key = error.path.join('.');
				errors[key] = error.message;
			});
			return false;
		}
	}

	// Navigation
	function nextStep() {
		// Validate current step
		let isValid = false;
		if (currentStep === 1) isValid = validateStep1();
		else if (currentStep === 2) isValid = validateStep2();
		else if (currentStep === 3) isValid = validateStep3();

		if (!isValid) {
			// Scroll to first error
			const firstError = document.querySelector('.error-message');
			firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			return;
		}

		if (currentStep < 3) {
			currentStep++;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
			errors = {};
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	// Price calculation
	function calculateTotal(): number {
		if (!selectedService) return 0;
		
		// Use average price
		const basePrice = (selectedService.priceLow + selectedService.priceHigh) / 2;
		
		// Apply vehicle multiplier
		const vehicleMultipliers: Record<string, number> = { sedan: 1.0, suv: 1.25, truck: 1.5 };
		const multiplier = step2Data.vehicleType ? vehicleMultipliers[step2Data.vehicleType] : 1.0;
		
		return Math.round(basePrice * multiplier);
	}

	// Submit booking
	async function submitBooking() {
		if (!validateStep3()) {
			const firstError = document.querySelector('.error-message');
			firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			return;
		}

		isSubmitting = true;
		errors = {};

		try {
			// Create checkout session
			const response = await fetch('/api/payments/create-checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					packageId: step1Data.packageId,
					serviceType: 'subscription',
					customerInfo: {
						name: step3Data.name,
						email: step3Data.email || undefined,
						phone: step3Data.phone,
					},
					bookingDetails: {
						date: step2Data.date,
						time: step2Data.time,
						vehicleType: step2Data.vehicleType,
						address: {
							street: step1Data.street,
							city: step1Data.city,
							state: step1Data.state,
							zip: step1Data.zip,
						},
						notes: step3Data.notes,
					},
					amount: calculateTotal(),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to create checkout session');
			}

			// Redirect to Stripe Checkout
			if (data.url) {
				window.location.href = data.url;
			}
		} catch (err) {
			console.error('Booking error:', err);
			errors.submit = err instanceof Error ? err.message : 'Failed to process booking';
			isSubmitting = false;
		}
	}

	// Handle address autocomplete
	function handleAddressSelected(place: any) {
		step1Data.street = place.address;
		step1Data.city = place.city;
		step1Data.state = place.state;
		step1Data.zip = place.zip;
		step1Data.placeId = place.placeId;
	}
</script>

<svelte:head>
	<title>Book Detailing Service - Mr. Guy Mobile Detail</title>
	<meta name="description" content="Book your mobile car detailing service in West Broward. Choose your package, schedule, and pay securely online." />
</svelte:head>

<div class="booking-page">
	<BookingProgressBar currentStep={currentStep} totalSteps={3} />

	<div class="container">
		<form class="booking-form" onsubmit={(e) => e.preventDefault()}>
			
			<!-- STEP 1: Service & Location -->
			{#if currentStep === 1}
				<div class="step-content">
					<h2 class="step-heading">Choose Your Service & Location</h2>

					<!-- Service Selection -->
					<div class="form-section">
						<label class="section-label">Select Package</label>
						<div class="service-grid">
							{#each serviceOptions as service}
								<ServiceCard
									{service}
									selected={step1Data.packageId === service.id}
									onclick={() => { step1Data.packageId = service.id; }}
								/>
							{/each}
						</div>
						{#if errors.packageId}
							<p class="error-message">{errors.packageId}</p>
						{/if}
					</div>

					<!-- Address -->
					<div class="form-section">
						<label class="section-label">Service Address</label>
						<AddressAutocomplete
							bind:value={step1Data.street}
							bind:city={step1Data.city}
							bind:state={step1Data.state}
							bind:zip={step1Data.zip}
							error={errors.street || errors.city || errors.state || errors.zip}
							onPlaceSelected={handleAddressSelected}
						/>
					</div>
				</div>
			{/if}

			<!-- STEP 2: Vehicle & Schedule -->
			{#if currentStep === 2}
				<div class="step-content">
					<h2 class="step-heading">Vehicle Type & Schedule</h2>

					<!-- Vehicle Type -->
					<div class="form-section">
						<VehicleTypeSelector
							bind:value={step2Data.vehicleType}
							error={errors.vehicleType}
						/>
					</div>

					<!-- Date Selection -->
					<div class="form-section">
						<label for="date" class="label">
							Preferred Date
							<span class="required">*</span>
						</label>
						<input
							id="date"
							type="date"
							bind:value={step2Data.date}
							min={new Date().toISOString().split('T')[0]}
							class="input"
							class:error={!!errors.date}
						/>
						{#if errors.date}
							<p class="error-message">{errors.date}</p>
						{/if}
					</div>

					<!-- Time Selection -->
					<div class="form-section">
						<TimeSlotPicker
							date={step2Data.date || ''}
							bind:selectedTime={step2Data.time}
							error={errors.time}
						/>
					</div>
				</div>
			{/if}

			<!-- STEP 3: Contact & Review -->
			{#if currentStep === 3}
				<div class="step-content">
					<h2 class="step-heading">Contact Info & Review</h2>

					<!-- Contact Information -->
					<div class="form-section">
						<h3 class="subsection-label">Contact Information</h3>
						
						<div class="form-grid">
							<div class="form-field">
								<label for="name" class="label">
									Full Name
									<span class="required">*</span>
								</label>
								<input
									id="name"
									type="text"
									bind:value={step3Data.name}
									placeholder="John Doe"
									class="input"
									class:error={!!errors.name}
								/>
								{#if errors.name}
									<p class="error-message">{errors.name}</p>
								{/if}
							</div>

							<div class="form-field">
								<label for="phone" class="label">
									Phone Number
									<span class="required">*</span>
								</label>
								<input
									id="phone"
									type="tel"
									bind:value={step3Data.phone}
									placeholder="(954) 555-1234"
									class="input"
									class:error={!!errors.phone}
								/>
								{#if errors.phone}
									<p class="error-message">{errors.phone}</p>
								{/if}
							</div>

							<div class="form-field full-width">
								<label for="email" class="label">
									Email (Optional)
								</label>
								<input
									id="email"
									type="email"
									bind:value={step3Data.email}
									placeholder="john@example.com"
									class="input"
									class:error={!!errors.email}
								/>
								{#if errors.email}
									<p class="error-message">{errors.email}</p>
								{/if}
							</div>

							<div class="form-field full-width">
								<label for="notes" class="label">
									Special Instructions (Optional)
								</label>
								<textarea
									id="notes"
									bind:value={step3Data.notes}
									placeholder="Gate code, parking instructions, specific requests..."
									rows="3"
									class="input"
									maxlength="500"
								></textarea>
							</div>

							<div class="form-field full-width">
								<label for="promo" class="label">
									Promo Code (Optional)
								</label>
								<input
									id="promo"
									type="text"
									bind:value={step3Data.promoCode}
									placeholder="FRESH25"
									class="input"
								/>
							</div>
						</div>
					</div>

					<!-- Booking Summary -->
					<div class="form-section">
						<div class="booking-summary">
							<h3 class="summary-title">Booking Summary</h3>
							
							<div class="summary-section">
								<h4 class="summary-heading">Service</h4>
								<div class="summary-row">
									<span>{selectedService?.name} Package</span>
									<span class="amount">${selectedService?.priceLow} - ${selectedService?.priceHigh}/mo</span>
								</div>
							</div>

							<div class="summary-section">
								<h4 class="summary-heading">Details</h4>
								<div class="summary-item">
									<strong>Vehicle:</strong> {step2Data.vehicleType?.toUpperCase() || 'Not selected'}
								</div>
								<div class="summary-item">
									<strong>Date:</strong> {step2Data.date || 'Not selected'}
								</div>
								<div class="summary-item">
									<strong>Time:</strong> {step2Data.time || 'Not selected'}
								</div>
								<div class="summary-item">
									<strong>Location:</strong> {step1Data.street}, {step1Data.city}, {step1Data.state} {step1Data.zip}
								</div>
							</div>

							<div class="summary-total">
								<span class="total-label">Estimated Total</span>
								<span class="total-amount">${calculateTotal()}</span>
							</div>

							<p class="summary-note">
								Final price may vary based on vehicle condition and size. You'll be charged after service completion.
							</p>
						</div>
					</div>

					{#if errors.submit}
						<div class="error-banner">
							<p>{errors.submit}</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Navigation Buttons -->
			<div class="form-actions">
				{#if currentStep > 1}
					<button type="button" class="btn btn-secondary" onclick={prevStep}>
						<ChevronLeft size={20} />
						Back
					</button>
				{:else}
					<div></div>
				{/if}

				{#if currentStep < 3}
					<button type="button" class="btn btn-primary" onclick={nextStep}>
						Continue
						<ChevronRight size={20} />
					</button>
				{:else}
					<button
						type="button"
						class="btn btn-primary btn-submit"
						onclick={submitBooking}
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							Processing...
						{:else}
							Complete Booking
							<Check size={20} />
						{/if}
					</button>
				{/if}
			</div>
		</form>
	</div>
</div>

<style>
	:global(:root) {
		--color-primary: #0ea5e9;
		--color-primary-hover: #0284c7;
		--color-accent: #f59e0b;
		--color-error: #ef4444;
		--text-primary: #1e293b;
		--text-secondary: #64748b;
		--text-muted: #94a3b8;
		--bg-secondary: #f8fafc;
		--border-light: #e2e8f0;
	}

	.booking-page {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f8fafc, white);
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.booking-form {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.step-content {
		padding: 2rem;
	}

	.step-heading {
		font-size: 1.875rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 2rem;
		text-align: center;
	}

	.form-section {
		margin-bottom: 2.5rem;
	}

	.section-label {
		display: block;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.subsection-label {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.service-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-field.full-width {
		grid-column: 1 / -1;
	}

	.label {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.required {
		color: var(--color-error);
	}

	.input {
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-light);
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
		background: white;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.input.error {
		border-color: var(--color-error);
	}

	textarea.input {
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
	}

	.error-message {
		color: var(--color-error);
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.error-banner {
		background: #fee;
		border: 2px solid var(--color-error);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.error-banner p {
		color: var(--color-error);
		font-weight: 600;
		margin: 0;
	}

	/* Booking Summary */
	.booking-summary {
		background: var(--bg-secondary);
		border-radius: 1rem;
		padding: 1.5rem;
		border: 2px solid var(--border-light);
	}

	.summary-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}

	.summary-section {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-light);
	}

	.summary-section:last-of-type {
		border-bottom: none;
	}

	.summary-heading {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.75rem;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1rem;
	}

	.summary-item {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
		line-height: 1.6;
	}

	.summary-item strong {
		color: var(--text-primary);
	}

	.amount {
		font-weight: 700;
		color: var(--color-primary);
	}

	.summary-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 0;
		margin-top: 1rem;
		border-top: 2px solid var(--border-light);
	}

	.total-label {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.total-amount {
		font-size: 1.875rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.summary-note {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-style: italic;
		margin: 1rem 0 0;
		line-height: 1.5;
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.5rem 2rem;
		background: var(--bg-secondary);
		border-top: 2px solid var(--border-light);
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.75rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		min-height: 48px;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-submit {
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		font-size: 1.125rem;
		padding: 1rem 2rem;
	}

	.btn-secondary {
		background: white;
		color: var(--text-primary);
		border: 2px solid var(--border-light);
	}

	.btn-secondary:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	/* Mobile Responsive */
	@media (max-width: 640px) {
		.container {
			padding: 1rem 0.5rem;
		}

		.step-content {
			padding: 1.5rem 1rem;
		}

		.step-heading {
			font-size: 1.5rem;
		}

		.service-grid {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-actions {
			padding: 1rem;
			flex-direction: column-reverse;
		}

		.btn {
			width: 100%;
			justify-content: center;
		}

		.booking-summary {
			padding: 1rem;
		}

		.total-amount {
			font-size: 1.5rem;
		}
	}
</style>
