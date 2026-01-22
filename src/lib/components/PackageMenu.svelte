<script lang="ts">
  import { SERVICE_PACKAGES, BUSINESS_INFO, getPromoPrice, type ServicePackage } from '$lib/data/services';
  import { Sparkles, Check, Zap } from 'lucide-svelte';

  interface Props {
    showPromo?: boolean;
    onSelect?: (pkg: ServicePackage) => void;
  }

  let { showPromo = true, onSelect }: Props = $props();

  function handleSelect(pkg: ServicePackage) {
    if (onSelect) {
      onSelect(pkg);
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

  <div class="grid">
    {#each SERVICE_PACKAGES as pkg (pkg.id)}
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
    background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
    font-size: 0.95rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .card {
    position: relative;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }

  .card.featured {
    border-color: #e94560;
    box-shadow: 0 0 0 2px rgba(233, 69, 96, 0.2);
  }

  .badge {
    position: absolute;
    top: -0.75rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: #e94560;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: #1a1a2e;
  }

  .price {
    font-size: 1.5rem;
    font-weight: 700;
    color: #16213e;
    margin-bottom: 1rem;
  }

  .price .original {
    text-decoration: line-through;
    color: #9ca3af;
    font-size: 1rem;
    margin-right: 0.5rem;
  }

  .price .discounted {
    color: #e94560;
  }

  .description {
    color: #6b7280;
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
    color: #374151;
  }

  .includes li :global(svg) {
    color: #10b981;
    flex-shrink: 0;
  }

  .select-btn {
    width: 100%;
    padding: 0.875rem 1.5rem;
    background: #1a1a2e;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .select-btn:hover {
    background: #16213e;
  }

  .card.featured .select-btn {
    background: #e94560;
  }

  .card.featured .select-btn:hover {
    background: #d63850;
  }

  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }

    .card {
      padding: 1.25rem;
    }
  }
</style>
