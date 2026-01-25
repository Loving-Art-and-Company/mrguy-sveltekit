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
            <span class="original">${pkg.priceLow}-${pkg.priceHigh}</span>
            <span class="discounted">
              ${getPromoPrice(pkg.priceLow)}-${getPromoPrice(pkg.priceHigh)}
            </span>
          {:else}
            <span>${pkg.priceLow}-${pkg.priceHigh}</span>
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
          Select Package
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
          <span class="amount">${tier.priceLow}-${tier.priceHigh}</span>
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

        <button class="select-btn" onclick={() => handleSelectSubscription(tier)}>
          Subscribe
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
            <span class="original">${pkg.priceLow}-${pkg.priceHigh}</span>
            <span class="discounted">
              ${getPromoPrice(pkg.priceLow)}-${getPromoPrice(pkg.priceHigh)}
            </span>
          {:else}
            <span>${pkg.priceLow}-${pkg.priceHigh}</span>
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
          Select Package
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
    background: var(--color-primary);
    color: var(--text-inverse);
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    margin-bottom: 2rem;
    font-size: 0.95rem;
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
    background: var(--color-primary-deep);
    color: var(--text-inverse);
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .select-btn:hover {
    background: var(--color-primary-hover);
  }

  .card.featured .select-btn {
    background: var(--color-primary);
  }

  .card.featured .select-btn:hover {
    background: var(--color-primary-hover);
  }

  .card.subscription .select-btn {
    background: var(--color-primary);
  }

  .card.subscription .select-btn:hover {
    background: var(--color-primary-hover);
  }

  .card.subscription.featured .select-btn {
    background: var(--color-primary);
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
