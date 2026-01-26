<script lang="ts">
  import { page } from '$app/stores';

  let { children, data } = $props();

  const isLoginPage = $derived($page.url.pathname === '/admin/login');

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    { href: '/admin/bookings', label: 'Bookings', icon: '📅', exact: false },
    { href: '/admin/calendar', label: 'Calendar', icon: '🗓️', exact: false },
    { href: '/admin/revenue', label: 'Revenue', icon: '💰', exact: false },
    { href: '/admin/content', label: 'AI Content', icon: '✨', exact: false },
  ];

  // Check if nav item is active (exact match for dashboard, prefix match for others)
  function isActive(item: typeof navItems[0]): boolean {
    if (item.exact) {
      return $page.url.pathname === item.href;
    }
    return $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/');
  }

  // Get current page title
  const pageTitle = $derived(
    navItems.find((i) => isActive(i))?.label || 'Admin'
  );
</script>

{#if isLoginPage}
  {@render children()}
{:else}
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">
        <h2>Mr. Guy Admin</h2>
      </div>

      <nav>
        {#each navItems as item}
          <a
            href={item.href}
            class="nav-item"
            class:active={isActive(item)}
          >
            <span class="icon">{item.icon}</span>
            {item.label}
          </a>
        {/each}
      </nav>

      <div class="sidebar-footer">
        <p class="user-email">{data.user?.email}</p>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" class="logout-btn">Logout</button>
        </form>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-bar">
        <h1 class="page-title">
          {pageTitle}
        </h1>
        <div class="header-actions">
          <span class="welcome">Welcome, {data.user?.email?.split('@')[0]}</span>
        </div>
      </header>

      <div class="content">
        {@render children()}
      </div>
    </main>
  </div>
{/if}

<style>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: #f3f4f6;
  }

  .sidebar {
    width: 250px;
    background: #1a1a2e;
    color: white;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    left: 0;
    top: 0;
  }

  .logo {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .logo h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
  }

  nav {
    padding: 1rem 0;
    flex: 1;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.5rem;
    color: #9ca3af;
    text-decoration: none;
    transition: background 0.2s, color 0.2s;
    font-weight: 500;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .nav-item.active {
    background: rgba(233, 69, 96, 0.15);
    color: #e94560;
    border-right: 3px solid #e94560;
  }

  .icon {
    font-size: 1.1rem;
  }

  .sidebar-footer {
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .user-email {
    font-size: 0.8rem;
    color: #9ca3af;
    margin: 0 0 0.75rem 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .logout-btn {
    width: 100%;
    padding: 0.625rem 1rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #9ca3af;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }

  .logout-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-color: rgba(255, 255, 255, 0.3);
  }

  .main-content {
    flex: 1;
    margin-left: 250px;
    display: flex;
    flex-direction: column;
  }

  .top-bar {
    background: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .page-title {
    margin: 0;
    font-size: 1.5rem;
    color: #1a1a2e;
  }

  .welcome {
    color: #6b7280;
    font-size: 0.9rem;
  }

  .content {
    padding: 2rem;
    flex: 1;
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 200px;
    }

    .main-content {
      margin-left: 200px;
    }

    .top-bar {
      padding: 1rem;
    }

    .content {
      padding: 1rem;
    }
  }
</style>
