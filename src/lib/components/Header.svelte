<script lang="ts">
  import { BUSINESS_INFO } from '$lib/data/services';
  import { Phone, CalendarCheck } from 'lucide-svelte';
</script>

<header class="header">
  <div class="header-content">
    <a href="/" class="logo">
      <img src="/logo/mrguylogo-full-square.png" alt="Mr. Guy Detail Logo" class="logo-img" />
      <span class="logo-text">{BUSINESS_INFO.name}</span>
    </a>

    <nav class="nav">
      <a href="tel:+19548044747" class="phone-link" aria-label="Call us at 954-804-4747">
        <Phone size={18} />
        <span class="phone-text">954-804-4747</span>
      </a>
      <a href="/reschedule" class="nav-link">
        <CalendarCheck size={16} />
        <span>My Booking</span>
      </a>
      <a href="/#services" class="book-btn">Book Now</a>
    </nav>
  </div>
</header>

<style>
  .header {
    background: #ffffff;
    padding: 0 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    transition: opacity 0.2s;
  }

  .logo:hover {
    opacity: 0.9;
  }

  .logo-img {
    height: 56px;
    width: auto;
    object-fit: contain;
  }

  .logo-text {
    font-weight: 700;
    font-size: 1.25rem;
    color: #1a1a1a;
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .phone-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
    transition: color 0.2s;
  }

  .phone-link:hover {
    color: var(--color-primary);
  }

  .phone-link :global(svg) {
    flex-shrink: 0;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
    transition: color 0.2s;
  }

  .nav-link:hover {
    color: var(--color-primary);
  }

  .nav-link :global(svg) {
    flex-shrink: 0;
  }

  .book-btn {
    display: flex;
    align-items: center;
    background: var(--color-primary);
    color: var(--text-inverse);
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: background 0.2s, transform 0.2s;
  }

  .book-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    .header-content {
      height: 56px;
    }

    .logo-img {
      height: 40px;
      width: 40px;
    }

    .logo-text {
      font-size: 1rem;
    }

    .nav {
      gap: 0.75rem;
    }

    .phone-text {
      display: none;
    }

    .nav-link span {
      display: none;
    }

    .book-btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
    }
  }
</style>
