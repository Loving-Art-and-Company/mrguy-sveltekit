<script lang="ts">
  import { Check, Gift, MapPin, Car, ArrowRight, CheckCircle } from 'lucide-svelte';

  const freeService = {
    name: "Exterior Wash",
    value: 47,
    includes: ["Foam cannon bath", "Spot-free rinse", "Tire shine", "Window cleaning"]
  };

  const upgrades = [
    {
      id: "interior",
      name: "Add Interior Wash",
      price: 37,
      description: "Full vacuum, dashboard wipe, door panels"
    },
    {
      id: "wax",
      name: "Add Full Wax",
      price: 127,
      description: "Hand wax application, UV protection, water beading"
    },
    {
      id: "ceramic_windows",
      name: "Add Window Ceramic",
      price: 77,
      description: "Rain repellent, easy cleaning, UV protection"
    }
  ];

  let selectedUpgrades = $state<string[]>([]);
  let formData = $state({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  let submitting = $state(false);
  let success = $state(false);
  let error = $state('');

  function toggleUpgrade(id: string) {
    if (selectedUpgrades.includes(id)) {
      selectedUpgrades = selectedUpgrades.filter(u => u !== id);
    } else {
      selectedUpgrades = [...selectedUpgrades, id];
    }
  }

  function getTotal() {
    return selectedUpgrades.reduce((sum, id) => {
      const upgrade = upgrades.find(u => u.id === id);
      return sum + (upgrade?.price || 0);
    }, 0);
  }

  async function handleSubmit() {
    submitting = true;
    error = '';

    try {
      const response = await fetch('/api/bookings/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promo_code: 'kores',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          upgrades: selectedUpgrades
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Free Car Wash | KoRes Realty x Mr. Guy Mobile Detail</title>
  <meta name="description" content="Wishing you a wonderful New Year! Enjoy a complimentary car wash from Mr. Guy Mobile Detail." />
  <meta name="theme-color" content="#ffffff" />
  <style>
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
  </style>
</svelte:head>

<main class="promo-page">
  <!-- Hero Section -->
  <section class="hero">
    <p class="greeting">Wishing you a wonderful New Year!</p>
    <p class="offer-text">Enjoy a complimentary car wash</p>
    <p class="thank-you">Just a small thank you from us to you</p>
    <p class="appreciation">With appreciation,</p>
    <p class="signatures">Carilin + Monica</p>
    <img src="/logo/kores-realty.jpg" alt="KoRes Realty" class="hero-logo" />
  </section>

  <!-- Hero Image -->
  <section class="hero-image">
    <img src="/images/process/step-2-wash.webp" alt="Professional car detailing in progress" />
  </section>

  <!-- What's Included -->
  <section class="included-section">
    <div class="included-card">
      <h2>What's Included</h2>
      <h3 class="service-name">{freeService.name}</h3>
      <p class="service-value">A ${freeService.value} Value — FREE</p>
      
      <ul class="includes-list">
        {#each freeService.includes as item}
          <li>
            <Check size={18} />
            <span>{item}</span>
          </li>
        {/each}
      </ul>

      <div class="mobile-note">
        <Car size={18} />
        <span>We come to you — no trip needed</span>
      </div>
    </div>
  </section>

  <!-- Upgrades -->
  <section class="upgrades-section">
    <h2>Want More? Add an Upgrade</h2>
    <p class="upgrades-subtitle">Exclusive discounted rates for KoRes Realty clients</p>

    <div class="upgrades-grid">
      {#each upgrades as upgrade}
        <button 
          class="upgrade-card"
          class:selected={selectedUpgrades.includes(upgrade.id)}
          onclick={() => toggleUpgrade(upgrade.id)}
        >
          <div class="upgrade-header">
            <span class="upgrade-name">{upgrade.name}</span>
            <span class="upgrade-price">+${upgrade.price}</span>
          </div>
          <p class="upgrade-desc">{upgrade.description}</p>
          <div class="upgrade-check">
            {#if selectedUpgrades.includes(upgrade.id)}
              <Check size={20} />
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </section>

  <!-- Redemption Form -->
  <section class="redemption-section">
    {#if success}
      <!-- Success State -->
      <div class="success-message">
        <CheckCircle size={64} />
        <h2>You're All Set!</h2>
        <p class="success-text">
          We've received your request and will contact you within <strong>24 hours</strong> to schedule your free wash.
        </p>
        <p class="success-subtext">
          Check your email (<strong>{formData.email}</strong>) for confirmation details.
        </p>
        <div class="success-contact">
          <p>Questions? Call or text us:</p>
          <a href="tel:9548044747" class="phone-link">954-804-4747</a>
        </div>
      </div>
    {:else}
      <!-- Form -->
      <h2>Redeem Your Free Wash</h2>
      
      {#if error}
        <div class="error-message">
          <p>{error}</p>
        </div>
      {/if}
      
      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-grid">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              bind:value={formData.name}
              placeholder="John Smith"
              disabled={submitting}
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              bind:value={formData.email}
              placeholder="john@email.com"
              disabled={submitting}
              required
            />
          </div>

          <div class="form-group">
            <label for="phone">Phone</label>
            <input 
              type="tel" 
              id="phone" 
              bind:value={formData.phone}
              placeholder="(954) 555-1234"
              disabled={submitting}
              required
            />
          </div>

          <div class="form-group full-width">
            <label for="address">Service Address (West Broward)</label>
            <input 
              type="text" 
              id="address" 
              bind:value={formData.address}
              placeholder="123 Main St, Weston, FL"
              disabled={submitting}
              required
            />
          </div>
        </div>

        <div class="form-footer">
          <div class="total">
            {#if getTotal() > 0}
              <span class="total-label">Upgrades Total:</span>
              <span class="total-amount">${getTotal()}</span>
            {:else}
              <span class="total-free">100% Free — No Card Required</span>
            {/if}
          </div>

          <button type="submit" class="submit-btn" disabled={submitting}>
            {#if submitting}
              <span>Processing...</span>
            {:else}
              <span>Claim My Free Wash</span>
              <ArrowRight size={20} />
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </section>

  <!-- Terms -->
  <section class="terms">
    <h4>Terms & Conditions</h4>
    <ul>
      <li><MapPin size={14} /> Service area limited to <strong>West Broward</strong></li>
      <li><Car size={14} /> Limited to <strong>one vehicle per person</strong></li>
      <li><Gift size={14} /> Must be a KoRes Realty client to redeem</li>
      <li>Offer valid while supplies last</li>
    </ul>
  </section>

  <!-- Red Bar -->
  <div class="red-bar"></div>
</main>

<style>
  .promo-page {
    min-height: 100vh;
    background: #ffffff;
    color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* Hero - matching postcard style */
  .hero {
    text-align: center;
    padding: 3rem 2rem 2rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .hero-logo {
    max-width: 280px;
    width: 100%;
    height: auto;
    object-fit: contain;
    margin-top: 2rem;
  }

  .greeting {
    font-size: 1.5rem;
    font-style: italic;
    margin: 0 0 0.5rem;
    color: #333;
  }

  .offer-text {
    font-size: 1.25rem;
    margin: 0 0 0.5rem;
    color: #333;
  }

  .thank-you {
    font-size: 1.25rem;
    margin: 0 0 0.5rem;
    color: #333;
  }

  .appreciation {
    font-size: 1.125rem;
    margin: 0 0 0.25rem;
    color: #333;
  }

  .signatures {
    font-family: 'Brush Script MT', 'Segoe Script', cursive;
    font-size: 2.5rem;
    color: #000;
    margin: 0;
  }

  /* Hero Image */
  .hero-image {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 1.5rem 2rem;
  }

  .hero-image img {
    width: 100%;
    height: auto;
    border-radius: 1rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  /* Included Section */
  .included-section {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 1.5rem 2rem;
  }

  .included-card {
    background: #f8f8f8;
    border: 1px solid #e5e5e5;
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
  }

  .included-card h2 {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #666;
    margin: 0 0 0.5rem;
  }

  .service-name {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: #000;
  }

  .service-value {
    font-size: 1.125rem;
    color: #c41e3a;
    font-weight: 600;
    margin: 0 0 1.5rem;
  }

  .includes-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
    display: grid;
    gap: 0.75rem;
    text-align: left;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }

  .includes-list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
    color: #333;
  }

  .includes-list li :global(svg) {
    color: #c41e3a;
    flex-shrink: 0;
  }

  .mobile-note {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 2rem;
    font-size: 0.9rem;
    color: #666;
  }

  .mobile-note :global(svg) {
    color: #c41e3a;
  }

  /* Upgrades */
  .upgrades-section {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    text-align: center;
  }

  .upgrades-section h2 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
    color: #000;
  }

  .upgrades-subtitle {
    color: #666;
    margin: 0 0 1.5rem;
  }

  .upgrades-grid {
    display: grid;
    gap: 1rem;
  }

  .upgrade-card {
    position: relative;
    background: #fff;
    border: 2px solid #e5e5e5;
    border-radius: 0.75rem;
    padding: 1.25rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #333;
  }

  .upgrade-card:hover {
    border-color: #c41e3a;
  }

  .upgrade-card.selected {
    border-color: #c41e3a;
    background: #fef7f8;
  }

  .upgrade-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .upgrade-name {
    font-weight: 600;
    font-size: 1rem;
    color: #000;
  }

  .upgrade-price {
    color: #c41e3a;
    font-weight: 700;
  }

  .upgrade-desc {
    margin: 0;
    font-size: 0.875rem;
    color: #666;
  }

  .upgrade-check {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #c41e3a;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transform: scale(0);
    transition: all 0.2s ease;
  }

  .upgrade-card.selected .upgrade-check {
    opacity: 1;
    transform: scale(1);
  }

  /* Redemption Form */
  .redemption-section {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .redemption-section h2 {
    font-size: 1.5rem;
    margin: 0 0 1.5rem;
    text-align: center;
    color: #000;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
  }

  .form-group input {
    padding: 0.875rem 1rem;
    background: #fff;
    border: 2px solid #e5e5e5;
    border-radius: 0.5rem;
    color: #000;
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }

  .form-group input::placeholder {
    color: #999;
  }

  .form-group input:focus {
    outline: none;
    border-color: #c41e3a;
  }

  .form-footer {
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .total {
    text-align: center;
    padding: 1rem;
    background: #f8f8f8;
    border-radius: 0.5rem;
  }

  .total-label {
    color: #666;
    margin-right: 0.5rem;
  }

  .total-amount {
    font-size: 1.5rem;
    font-weight: 700;
    color: #c41e3a;
  }

  .total-free {
    color: #c41e3a;
    font-weight: 600;
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 1rem 2rem;
    background: #c41e3a;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background: #a01830;
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Success Message */
  .success-message {
    text-align: center;
    padding: 3rem 2rem;
    max-width: 500px;
    margin: 0 auto;
  }

  .success-message :global(svg) {
    color: #10b981;
    margin-bottom: 1.5rem;
  }

  .success-message h2 {
    font-size: 2rem;
    margin: 0 0 1rem;
    color: #000;
  }

  .success-text {
    font-size: 1.125rem;
    color: #333;
    margin: 0 0 0.5rem;
    line-height: 1.6;
  }

  .success-subtext {
    font-size: 0.95rem;
    color: #666;
    margin: 0 0 2rem;
  }

  .success-contact {
    background: #f8f8f8;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-top: 2rem;
  }

  .success-contact p {
    margin: 0 0 0.5rem;
    color: #666;
    font-size: 0.95rem;
  }

  .phone-link {
    display: inline-block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #c41e3a;
    text-decoration: none;
  }

  .phone-link:hover {
    text-decoration: underline;
  }

  /* Error Message */
  .error-message {
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .error-message p {
    margin: 0;
    color: #c00;
    font-weight: 500;
  }

  /* Terms */
  .terms {
    max-width: 600px;
    margin: 0 auto;
    padding: 1.5rem;
    text-align: center;
  }

  .terms h4 {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .terms ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }

  .terms li {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #666;
  }

  .terms li :global(svg) {
    color: #999;
    flex-shrink: 0;
  }

  .terms li strong {
    color: #333;
  }

  /* Red Bar at bottom */
  .red-bar {
    height: 8px;
    background: #c41e3a;
    margin-top: 2rem;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .hero {
      padding: 2rem 1.5rem 1.5rem;
    }

    .hero-logo {
      max-width: 220px;
      margin-top: 1.5rem;
    }

    .greeting {
      font-size: 1.25rem;
    }

    .signatures {
      font-size: 2rem;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-group.full-width {
      grid-column: 1;
    }
  }
</style>
