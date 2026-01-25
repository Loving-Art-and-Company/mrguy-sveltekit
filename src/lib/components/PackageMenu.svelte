<script lang="ts">
  import {
    SERVICE_PACKAGES,
    SUBSCRIPTION_TIERS,
    BUSINESS_INFO,
    getPromoPrice,
    type ServicePackage,
    type SubscriptionTier
  } from '$lib/data/services';
  import { Sparkles, Check, Zap, Crown, Star } from 'lucide-svelte';

  interface Props {
    showPromo?: boolean;
    onSelect?: (pkg: ServicePackage) => void;
    onSelectSubscription?: (tier: SubscriptionTier) => void;
  }

  let { showPromo = true, onSelect, onSelectSubscription }: Props = $props();

  function handleSelect(pkg: ServicePackage) {
    if (onSelect) {
      onSelect(pkg);
    }
  }

  function handleSelectSubscription(tier: SubscriptionTier) {
    if (onSelectSubscription) {
      onSelectSubscription(tier);
    }
  }
</script>

<section class="packages">
  {#if showPromo}
    <div class="promo-banner">
      <Sparkles size={20} />
      <span><strong>{BUSINESS_INFO.promo.name}</strong> — {BUSINESS_INFO.promo.description}</span>
    </div>
  {/if}

  <!-- Top 3 One-Time Services -->
  <div class="section-header">
    <Star size={24} />
    <div>
      <h3>Most Popular</h3>
      <p>One-time services</p>
    </div>
  </div>

  <div class="grid">
    {#each SERVICE_PACKAGES.slice(0, 3) as pkg (pkg.id)}
      <article class="card" class:featured={pkg.badge}>
        {#if pkg.badge}
          <div class="badge">
            <Zap size={14} />
            {pkg.badge}
          </div>
        {/if}

        <h3>{pkg.name}</h3>

        <div class="price">
          {#if showPromo}
            <span class="original">${pkg.priceHigh}</span>
            <span class="discounted">
              ${getPromoPrice(pkg.priceHigh)}
            </span>
          {:else}
            <span>${pkg.priceHigh}</span>
          {/if}
        </div>

        <p class="description">{pkg.description}</p>

        <ul class="includes">
          {#each pkg.includes as item}
            <li>
              <Check size={16} />
              {item}
            </li>
          {/each}
        </ul>

        <button class="select-btn" onclick={() => handleSelect(pkg)}>
          Book Now →
        </button>
      </article>
    {/each}
  </div>

  <!-- Monthly Subscriptions -->
  <div class="section-header">
    <Crown size={24} />
    <div>
      <h3>Monthly Plans</h3>
      <p>For people who actually use their car</p>
    </div>
  </div>

  <div class="grid subscriptions">
    {#each SUBSCRIPTION_TIERS as tier (tier.id)}
      <article class="card subscription" class:featured={tier.badge}>
        {#if tier.badge}
          <div class="badge">
            <Zap size={14} />
            {tier.badge}
          </div>
        {/if}

        <h3>{tier.name}</h3>

        <div class="price">
          <span class="amount">${tier.priceHigh}</span>
          <span class="frequency">/month</span>
        </div>

        <p class="description">{tier.description}</p>

        <ul class="includes">
          {#each tier.includes as item}
            <li>
              <Check size={16} />
              {item}
            </li>
          {/each}
        </ul>

        <button class="select-btn subscription-btn" onclick={() => handleSelectSubscription(tier)}>
          Start Saving →
        </button>
      </article>
    {/each}
  </div>

  <!-- Remaining One-Time Services -->
  <div class="section-header">
    <Star size={24} />
    <div>
      <h3>More Services</h3>
      <p>Everything else we do</p>
    </div>
  </div>

  <div class="grid">
    {#each SERVICE_PACKAGES.slice(3) as pkg (pkg.id)}
      <article class="card" class:featured={pkg.badge}>
        {#if pkg.badge}
          <div class="badge">
            <Zap size={14} />
            {pkg.badge}
          </div>
        {/if}

        <h3>{pkg.name}</h3>

        <div class="price">
          {#if showPromo}
            <span class="original">${pkg.priceHigh}</span>
            <span class="discounted">
              ${getPromoPrice(pkg.priceHigh)}
            </span>
          {:else}
            <span>${pkg.priceHigh}</span>
          {/if}
        </div>

        <p class="description">{pkg.description}</p>

        <ul class="includes">
          {#each pkg.includes as item}
            <li>
              <Check size={16} />
              {item}
            </li>
          {/each}
        </ul>

        <button class="select-btn" onclick={() => handleSelect(pkg)}>
          Book Now →
        </button>
      </article>
    {/each}
  </div>
</section>

<style>
  .packages {
    padding: 2rem 0;
  }

  .promo-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: var(--radius-md);
    margin-bottom: 2rem;
    font-size: 1rem;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    border: 2px solid #fca5a5;
    animation: urgencyPulse 3s ease-in-out infinite;
  }

  @keyframes urgencyPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 2.5rem 0 1.5rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--border-light);
  }

  .section-header:first-of-type {
    margin-top: 0;
  }

  .section-header :global(svg) {
    color: var(--color-primary);
  }

  .section-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text-primary);
  }

  .section-header p {
    margin: 0.25rem 0 0 0;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    padding-top: 1rem;
  }

  .grid.subscriptions {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  .card {
    position: relative;
    background: var(--color-bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s, box-shadow 0.2s;
    overflow: visible;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  .card.featured {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
  }

  .card.subscription {
    background: var(--color-bg-lighter);
    border-color: var(--border-medium);
  }

  .card.subscription.featured {
    border-color: var(--color-primary);
    background: var(--color-bg-lighter);
  }

  .badge {
    position: absolute;
    top: -0.75rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: var(--color-primary);
    color: var(--text-inverse);
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }

  .price {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary-deep);
    margin-bottom: 1rem;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .price .amount {
    color: var(--color-primary);
  }

  .price .frequency {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .price .original {
    text-decoration: line-through;
    color: var(--text-muted);
    font-size: 1rem;
    margin-right: 0.5rem;
  }

  .price .discounted {
    color: var(--color-primary);
  }

  .description {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 1rem;
    flex-grow: 1;
  }

  .includes {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem 0;
  }

  .includes li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0;
    font-size: 0.85rem;
    color: var(--text-primary);
  }

  .includes li :global(svg) {
    color: var(--color-success);
    flex-shrink: 0;
  }

  .select-btn {
    width: 100%;
    padding: 0.875rem 1.5rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.9rem;
  }

  .select-btn:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .card.featured .select-btn {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    animation: pulse 2s ease-in-out infinite;
  }

  .card.featured .select-btn:hover {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
  }

  .subscription-btn {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  }

  .subscription-btn:hover {
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
  }

  .card.subscription.featured .select-btn {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }
    50% {
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
    }
  }

  @media (max-width: 640px) {
    .grid {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      gap: 1rem;
      padding: 0 1rem 1rem 1rem;
      margin: 0 -1rem;
      -webkit-overflow-scrolling: touch;
    }

    .grid::-webkit-scrollbar {
      display: none;
    }

    .card {
      min-width: 280px;
      scroll-snap-align: center;
      padding: 1.25rem;
    }
  }
</style>
