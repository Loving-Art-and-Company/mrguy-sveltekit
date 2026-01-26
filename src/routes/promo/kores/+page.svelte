<script lang="ts">
  import { goto } from '$app/navigation';
  import { Check, Gift, MapPin, Car, Sparkles, ArrowRight } from 'lucide-svelte';

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

  function handleSubmit() {
    // Build URL params for booking
    const params = new URLSearchParams({
      promo: 'kores',
      package: 'exterior_wash',
      upgrades: selectedUpgrades.join(','),
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    });
    goto(`/book?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>Free Car Wash | Kores Realty x Mr. Guy Mobile Detail</title>
  <meta name="description" content="Exclusive offer for Kores Realty premier clients. Redeem your complimentary exterior wash." />
</svelte:head>

<main class="promo-page">
  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <div class="partner-badge">
        <Gift size={18} />
        <span>Exclusive Partner Offer</span>
      </div>
      
      <h1>Your Free Car Wash Awaits</h1>
      <p class="subtitle">
        As a valued <strong>Kores Realty</strong> client, enjoy a complimentary exterior wash on us.
      </p>

      <div class="value-badge">
        <span class="value-label">A $47 Value</span>
        <span class="value-free">FREE</span>
      </div>
    </div>

    <div class="hero-graphic">
      <div class="glow"></div>
    </div>
  </section>

  <!-- Main Content -->
  <section class="content">
    <!-- What's Included -->
    <div class="included-card glass">
      <div class="card-header">
        <Sparkles size={24} />
        <h2>What's Included</h2>
      </div>
      
      <h3 class="service-name">{freeService.name}</h3>
      
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

    <!-- Upgrades -->
    <div class="upgrades-section">
      <h2>Want More? Add an Upgrade</h2>
      <p class="upgrades-subtitle">Exclusive discounted rates for Kores Realty clients</p>

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
    </div>

    <!-- Redemption Form -->
    <div class="redemption-section glass">
      <h2>Redeem Your Free Wash</h2>
      
      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-grid">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              bind:value={formData.name}
              placeholder="John Smith"
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

          <button type="submit" class="submit-btn">
            <span>Claim My Free Wash</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </form>
    </div>

    <!-- Terms -->
    <div class="terms">
      <h4>Terms & Conditions</h4>
      <ul>
        <li><MapPin size={14} /> Service area limited to <strong>West Broward</strong></li>
        <li><Car size={14} /> Limited to <strong>one vehicle per person</strong></li>
        <li><Gift size={14} /> Must be a Kores Realty client to redeem</li>
        <li>Offer valid while supplies last</li>
      </ul>
    </div>
  </section>

  <!-- Footer -->
  <footer class="promo-footer">
    <p>A partnership between</p>
    <div class="partners">
      <span class="partner">Kores Realty</span>
      <span class="divider">×</span>
      <span class="partner">Mr. Guy Mobile Detail</span>
    </div>
  </footer>
</main>

<style>
  .promo-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    color: white;
  }

  /* Hero */
  .hero {
    position: relative;
    padding: 4rem 2rem 6rem;
    text-align: center;
    overflow: hidden;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 600px;
    margin: 0 auto;
  }

  .partner-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(14, 165, 233, 0.2);
    border: 1px solid rgba(14, 165, 233, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #7dd3fc;
    margin-bottom: 1.5rem;
  }

  .hero h1 {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 700;
    margin: 0 0 1rem;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 1.25rem;
    color: #94a3b8;
    margin: 0 0 2rem;
    line-height: 1.6;
  }

  .subtitle strong {
    color: #7dd3fc;
  }

  .value-badge {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 0.75rem 1.5rem;
    border-radius: 1rem;
  }

  .value-label {
    color: #6ee7b7;
    font-size: 1rem;
    text-decoration: line-through;
    opacity: 0.8;
  }

  .value-free {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    padding: 0.25rem 0.75rem;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1.125rem;
  }

  .hero-graphic {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%);
    animation: pulse 4s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
  }

  /* Content */
  .content {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1.5rem 4rem;
  }

  /* Glass Card */
  .glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.5rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  /* Included Card */
  .included-card {
    padding: 2rem;
    margin-bottom: 3rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    color: #7dd3fc;
  }

  .card-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .service-name {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 1.5rem;
  }

  .includes-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
    display: grid;
    gap: 0.75rem;
  }

  .includes-list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
    color: #e2e8f0;
  }

  .includes-list li :global(svg) {
    color: #10b981;
    flex-shrink: 0;
  }

  .mobile-note {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(14, 165, 233, 0.1);
    border-radius: 0.75rem;
    font-size: 0.9rem;
    color: #7dd3fc;
  }

  /* Upgrades */
  .upgrades-section {
    margin-bottom: 3rem;
  }

  .upgrades-section h2 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
    text-align: center;
  }

  .upgrades-subtitle {
    text-align: center;
    color: #94a3b8;
    margin: 0 0 1.5rem;
  }

  .upgrades-grid {
    display: grid;
    gap: 1rem;
  }

  .upgrade-card {
    position: relative;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 1.25rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    color: white;
  }

  .upgrade-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .upgrade-card.selected {
    background: rgba(14, 165, 233, 0.15);
    border-color: rgba(14, 165, 233, 0.5);
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
  }

  .upgrade-price {
    color: #7dd3fc;
    font-weight: 700;
  }

  .upgrade-desc {
    margin: 0;
    font-size: 0.875rem;
    color: #94a3b8;
  }

  .upgrade-check {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .upgrade-card.selected .upgrade-check {
    opacity: 1;
    transform: scale(1);
  }

  /* Redemption Form */
  .redemption-section {
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .redemption-section h2 {
    font-size: 1.5rem;
    margin: 0 0 1.5rem;
    text-align: center;
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
    color: #94a3b8;
  }

  .form-group input {
    padding: 0.875rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    color: white;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .form-group input::placeholder {
    color: #64748b;
  }

  .form-group input:focus {
    outline: none;
    border-color: #0ea5e9;
    background: rgba(14, 165, 233, 0.1);
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
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0.75rem;
  }

  .total-label {
    color: #94a3b8;
    margin-right: 0.5rem;
  }

  .total-amount {
    font-size: 1.5rem;
    font-weight: 700;
    color: #7dd3fc;
  }

  .total-free {
    color: #6ee7b7;
    font-weight: 600;
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
  }

  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4);
  }

  /* Terms */
  .terms {
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 1rem;
    margin-bottom: 3rem;
  }

  .terms h4 {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    color: #94a3b8;
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
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .terms li :global(svg) {
    color: #475569;
    flex-shrink: 0;
  }

  .terms li strong {
    color: #94a3b8;
  }

  /* Footer */
  .promo-footer {
    text-align: center;
    padding: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .promo-footer p {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .partners {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .partner {
    font-weight: 600;
    color: #94a3b8;
  }

  .divider {
    color: #475569;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .hero {
      padding: 3rem 1.5rem 4rem;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-group.full-width {
      grid-column: 1;
    }

    .included-card,
    .redemption-section {
      padding: 1.5rem;
    }
  }
</style>
