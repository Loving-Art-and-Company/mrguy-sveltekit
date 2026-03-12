<script lang="ts">
  import { page } from '$app/stores';

  let { children, data } = $props();
  let menuOpen = $state(false);

  const isLoginPage = $derived($page.url.pathname === '/admin/login');

   const navItems = [
     { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
     { href: '/admin/bookings', label: 'Bookings', icon: '📅', exact: false },
     { href: '/admin/crm', label: 'CRM', icon: '📣', exact: false },
     { href: '/admin/revenue', label: 'Revenue', icon: '💰', exact: false },
     { href: '/admin/drive', label: 'Drive', icon: '📁', exact: false },
     { href: '/admin/sheets', label: 'Sheets', icon: '📗', exact: false },
     { href: '/admin/docs', label: 'Docs', icon: '📄', exact: false },
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

  $effect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('admin-menu-open', menuOpen);

    return () => {
      document.body.classList.remove('admin-menu-open');
    };
  });
</script>

{#if isLoginPage}
  {@render children()}
{:else}
  <div class="admin-layout">
    <aside class="sidebar" class:open={menuOpen} aria-hidden={!menuOpen}>
      <div class="logo">
        <h2>Mr. Guy Admin</h2>
      </div>

      <div class="mobile-header">
        <p>Mr. Guy Admin</p>
        <button type="button" class="close-btn" onclick={() => (menuOpen = false)}>Close</button>
      </div>

      <nav>
        {#each navItems as item}
          <a
            href={item.href}
            class="nav-item"
            class:active={isActive(item)}
            onclick={() => (menuOpen = false)}
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

    <button
      type="button"
      class="sidebar-backdrop"
      class:visible={menuOpen}
      onclick={() => (menuOpen = false)}
      aria-label="Close navigation"
    ></button>

    <main class="main-content">
      <header class="top-bar">
        <button
          class="menu-btn"
          type="button"
          onclick={() => (menuOpen = !menuOpen)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
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
  :global(html) {
    min-height: 100%;
  }

  :global(body) {
    min-height: 100dvh;
    background: #f3f4f6;
    overscroll-behavior-y: none;
  }

  :global(body.admin-menu-open) {
    overflow: hidden;
    touch-action: none;
  }

  .admin-layout {
    display: flex;
    min-height: 100dvh;
    background: #f3f4f6;
    flex-direction: column;
  }

  .sidebar {
    width: min(82vw, 320px);
    background: #1a1a2e;
    color: white;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100dvh;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    z-index: 20;
    box-shadow: 18px 0 48px rgba(15, 23, 42, 0.28);
  }

  .sidebar.open {
    transform: translateX(0);
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

  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #f3f4f6;
    font-size: 0.875rem;
    cursor: pointer;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    min-width: 72px;
    min-height: 40px;
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

  .sidebar-backdrop {
    display: none;
    border: none;
    padding: 0;
    background: transparent;
  }

  .main-content {
    flex: 1;
    margin-left: 0;
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    overflow-x: clip;
  }

  .top-bar {
    background: white;
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 15;
    gap: 1rem;
  }

  .menu-btn {
    background: #1a1a2e;
    color: white;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
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
    padding: 1.5rem;
    flex: 1;
    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  }

  @media (min-width: 1024px) {
    .admin-layout {
      flex-direction: row;
    }

    .sidebar {
      position: fixed;
      width: 250px;
      transform: translateX(0);
    }

    .main-content {
      margin-left: 250px;
    }

    .sidebar-backdrop {
      display: none;
    }
  }

  @media (max-width: 1023px) {
    .top-bar {
      position: static;
    }

    .content {
      padding: 1rem;
      padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 10;
      display: block;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .sidebar-backdrop.visible {
      opacity: 1;
      pointer-events: auto;
    }
  }
</style>
