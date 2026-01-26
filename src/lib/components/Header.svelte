<script lang="ts">
  import { BUSINESS_INFO } from '$lib/data/services';
  import { LogIn } from 'lucide-svelte';

  interface Props {
    showLogin?: boolean;
  }

  let { showLogin = true }: Props = $props();
</script>

<header class="header">
  <div class="header-content">
    <a href="/" class="logo">
      <img src="/logo/mrguylogo-full.png" alt="Mr. Guy Detail Logo" class="logo-img" />
      <span class="logo-text">{BUSINESS_INFO.name}</span>
    </a>

    <nav class="nav">
      <a href="/book" class="nav-link">Book Now</a>
      <a href="/reschedule" class="nav-link">My Booking</a>
      {#if showLogin}
        <a href="/login" class="login-btn">
          <LogIn size={18} />
          <span>Login</span>
        </a>
      {/if}
    </nav>
  </div>
</header>

<style>
  .header {
    background: var(--color-primary-deep);
    padding: 0 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow-md);
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
    height: 48px;
    width: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    filter: brightness(1.2) saturate(1.1);
  }

  .logo-text {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--text-inverse);
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .nav-link {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
    transition: color 0.2s;
  }

  .nav-link:hover {
    color: var(--text-inverse);
  }

  .login-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-primary);
    color: var(--text-inverse);
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: background 0.2s, transform 0.2s;
  }

  .login-btn:hover {
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
      gap: 1rem;
    }

    .nav-link {
      display: none;
    }

    .login-btn span {
      display: none;
    }

    .login-btn {
      padding: 0.5rem;
    }
  }
</style>
