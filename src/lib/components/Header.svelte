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
      {BUSINESS_INFO.name}
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
    background: #1a1a2e;
    padding: 0 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
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
    font-weight: 700;
    font-size: 1.25rem;
    color: white;
    text-decoration: none;
  }

  .logo:hover {
    color: #e94560;
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .nav-link {
    color: #9ca3af;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
    transition: color 0.2s;
  }

  .nav-link:hover {
    color: white;
  }

  .login-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #e94560;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: background 0.2s, transform 0.2s;
  }

  .login-btn:hover {
    background: #ff6b6b;
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    .header-content {
      height: 56px;
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
