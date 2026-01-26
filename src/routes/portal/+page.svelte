<script lang="ts">
  import { Calendar, Package, History, CreditCard, LogOut, Plus, RefreshCw } from 'lucide-svelte';
  
  let { data } = $props();
  
  // Active tab state
  let activeTab = $state('dashboard');
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Package },
    { id: 'book', label: 'Book Appointment', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'packages', label: 'Buy Credits', icon: CreditCard },
  ];
  
  // Calculate total credits across all active subscriptions
  const totalCredits = $derived(
    data.subscriptions?.reduce((sum: number, sub: any) => 
      sub.status === 'active' ? sum + sub.credits_remaining : sum, 0) ?? 0
  );
  
  // Get upcoming appointments
  const upcomingAppointments = $derived(
    data.bookings?.filter((b: any) => new Date(b.date) >= new Date()) ?? []
  );
</script>

<svelte:head>
  <title>My Account - Mr. Guy Mobile Detail</title>
</svelte:head>

<div class="portal">
  <header class="portal-header">
    <div class="header-content">
      <img src="/logo/mrguylogo-full-square.png" alt="Mr. Guy Detail" class="logo" />
      <div class="header-right">
        <span class="welcome">Welcome, {data.client?.name}</span>
        <form action="/api/auth/client-logout" method="POST">
          <button type="submit" class="logout-btn">
            <LogOut size={18} />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  </header>

  <div class="portal-body">
    <nav class="sidebar">
      {#each tabs as tab}
        <button
          class="nav-btn"
          class:active={activeTab === tab.id}
          onclick={() => activeTab = tab.id}
        >
          <svelte:component this={tab.icon} size={20} />
          {tab.label}
        </button>
      {/each}
    </nav>

    <main class="main-content">
      {#if activeTab === 'dashboard'}
        <div class="dashboard">
          <h1>Your Account</h1>
          
          <div class="stats-grid">
            <div class="stat-card credits">
              <div class="stat-icon">
                <Package size={32} />
              </div>
              <div class="stat-info">
                <span class="stat-value">{totalCredits}</span>
                <span class="stat-label">Credits Remaining</span>
              </div>
            </div>
            
            <div class="stat-card appointments">
              <div class="stat-icon">
                <Calendar size={32} />
              </div>
              <div class="stat-info">
                <span class="stat-value">{upcomingAppointments.length}</span>
                <span class="stat-label">Upcoming Appointments</span>
              </div>
            </div>
          </div>

          {#if totalCredits > 0}
            <div class="quick-actions">
              <button class="action-btn primary" onclick={() => activeTab = 'book'}>
                <Plus size={20} />
                Book Appointment
              </button>
            </div>
          {:else}
            <div class="no-credits-banner">
              <p>You don't have any credits. Purchase a package to book appointments!</p>
              <button class="action-btn primary" onclick={() => activeTab = 'packages'}>
                <CreditCard size={20} />
                View Packages
              </button>
            </div>
          {/if}

          {#if upcomingAppointments.length > 0}
            <section class="upcoming-section">
              <h2>Upcoming Appointments</h2>
              <div class="appointments-list">
                {#each upcomingAppointments as appointment}
                  <div class="appointment-card">
                    <div class="appointment-date">
                      <span class="date">{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span class="time">{appointment.time || 'TBD'}</span>
                    </div>
                    <div class="appointment-info">
                      <h3>{appointment.serviceName}</h3>
                      <p class="status">{appointment.status}</p>
                    </div>
                    <button class="reschedule-btn">
                      <RefreshCw size={16} />
                      Reschedule
                    </button>
                  </div>
                {/each}
              </div>
            </section>
          {/if}

          {#if data.subscriptions?.length > 0}
            <section class="subscriptions-section">
              <h2>Your Packages</h2>
              <div class="subscriptions-list">
                {#each data.subscriptions as sub}
                  <div class="subscription-card" class:exhausted={sub.credits_remaining === 0}>
                    <div class="sub-header">
                      <h3>{sub.package?.name || 'Package'}</h3>
                      <span class="sub-status" class:active={sub.status === 'active'}>
                        {sub.status}
                      </span>
                    </div>
                    <div class="sub-credits">
                      <span class="remaining">{sub.credits_remaining}</span>
                      <span class="total">/ {sub.credits_total} credits</span>
                    </div>
                    <div class="sub-progress">
                      <div 
                        class="progress-bar" 
                        style="width: {(sub.credits_remaining / sub.credits_total) * 100}%"
                      ></div>
                    </div>
                    <p class="purchased-date">
                      Purchased {new Date(sub.purchased_at).toLocaleDateString()}
                    </p>
                  </div>
                {/each}
              </div>
            </section>
          {/if}
        </div>

      {:else if activeTab === 'book'}
        <div class="book-section">
          <h1>Book Appointment</h1>
          {#if totalCredits > 0}
            <p class="credits-notice">You have {totalCredits} credit{totalCredits !== 1 ? 's' : ''} available.</p>
            <!-- TODO: Integrate booking form here -->
            <p>Booking form coming soon...</p>
          {:else}
            <div class="no-credits">
              <p>You need credits to book an appointment.</p>
              <button class="action-btn primary" onclick={() => activeTab = 'packages'}>
                Purchase a Package
              </button>
            </div>
          {/if}
        </div>

      {:else if activeTab === 'history'}
        <div class="history-section">
          <h1>Appointment History</h1>
          {#if data.bookings?.length > 0}
            <div class="history-list">
              {#each data.bookings as booking}
                <div class="history-card">
                  <div class="history-date">
                    {new Date(booking.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div class="history-details">
                    <h3>{booking.serviceName}</h3>
                    <p>{booking.status} - {booking.paymentStatus}</p>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="empty-state">No appointments yet.</p>
          {/if}
        </div>

      {:else if activeTab === 'packages'}
        <div class="packages-section">
          <h1>Purchase Credits</h1>
          <p class="packages-intro">Save money with our prepaid packages!</p>
          
          <div class="packages-grid">
            {#each data.packages ?? [] as pkg}
              <div class="package-card">
                <h3>{pkg.name}</h3>
                <p class="package-desc">{pkg.description}</p>
                <div class="package-credits">
                  <span class="credits-num">{pkg.credits}</span>
                  <span class="credits-label">appointments</span>
                </div>
                <div class="package-price">
                  ${(pkg.price_cents / 100).toFixed(0)}
                </div>
                <p class="price-per">
                  ${((pkg.price_cents / 100) / pkg.credits).toFixed(0)} per visit
                </p>
                <button class="buy-btn">
                  Purchase
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>

<style>
  .portal {
    min-height: 100vh;
    background: #f3f4f6;
  }

  .portal-header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 1rem 2rem;
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    height: 48px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .welcome {
    color: #6b7280;
    font-size: 0.9rem;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    color: #6b7280;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .logout-btn:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .portal-body {
    display: flex;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    gap: 2rem;
  }

  .sidebar {
    width: 220px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    color: #374151;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    text-align: left;
    transition: all 0.2s;
  }

  .nav-btn:hover {
    background: #f9fafb;
  }

  .nav-btn.active {
    background: #e94560;
    color: white;
    border-color: #e94560;
  }

  .main-content {
    flex: 1;
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  h1 {
    margin: 0 0 1.5rem 0;
    font-size: 1.75rem;
    color: #1a1a2e;
  }

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: #1a1a2e;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 1rem;
    background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
    color: white;
  }

  .stat-card.appointments {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }

  .stat-icon {
    opacity: 0.9;
  }

  .stat-value {
    display: block;
    font-size: 2rem;
    font-weight: 700;
  }

  .stat-label {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .quick-actions {
    margin-bottom: 2rem;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn.primary {
    background: #e94560;
    color: white;
  }

  .action-btn.primary:hover {
    background: #d63850;
    transform: translateY(-2px);
  }

  .no-credits-banner {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    text-align: center;
  }

  .no-credits-banner p {
    margin: 0 0 1rem 0;
    color: #92400e;
  }

  .upcoming-section, .subscriptions-section {
    margin-top: 2rem;
  }

  .appointments-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .appointment-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
  }

  .appointment-date {
    text-align: center;
    padding: 0.5rem 1rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .appointment-date .date {
    display: block;
    font-weight: 700;
    color: #1a1a2e;
  }

  .appointment-date .time {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .appointment-info {
    flex: 1;
  }

  .appointment-info h3 {
    margin: 0;
    font-size: 1rem;
    color: #1a1a2e;
  }

  .appointment-info .status {
    margin: 0.25rem 0 0 0;
    font-size: 0.85rem;
    color: #6b7280;
    text-transform: capitalize;
  }

  .reschedule-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    color: #374151;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .reschedule-btn:hover {
    border-color: #e94560;
    color: #e94560;
  }

  .subscriptions-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }

  .subscription-card {
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
  }

  .subscription-card.exhausted {
    opacity: 0.6;
  }

  .sub-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .sub-header h3 {
    margin: 0;
    font-size: 1rem;
  }

  .sub-status {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    background: #e5e7eb;
    color: #6b7280;
    text-transform: capitalize;
  }

  .sub-status.active {
    background: #d1fae5;
    color: #059669;
  }

  .sub-credits {
    margin-bottom: 0.5rem;
  }

  .sub-credits .remaining {
    font-size: 2rem;
    font-weight: 700;
    color: #e94560;
  }

  .sub-credits .total {
    color: #6b7280;
  }

  .sub-progress {
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .progress-bar {
    height: 100%;
    background: #e94560;
    border-radius: 3px;
    transition: width 0.3s;
  }

  .purchased-date {
    margin: 0;
    font-size: 0.8rem;
    color: #9ca3af;
  }

  .packages-intro {
    color: #6b7280;
    margin-bottom: 2rem;
  }

  .packages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .package-card {
    padding: 2rem;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 1rem;
    text-align: center;
    transition: all 0.2s;
  }

  .package-card:hover {
    border-color: #e94560;
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(233, 69, 96, 0.15);
  }

  .package-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: #1a1a2e;
  }

  .package-desc {
    color: #6b7280;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .package-credits {
    margin-bottom: 1rem;
  }

  .credits-num {
    font-size: 3rem;
    font-weight: 700;
    color: #e94560;
  }

  .credits-label {
    display: block;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .package-price {
    font-size: 2rem;
    font-weight: 700;
    color: #1a1a2e;
  }

  .price-per {
    color: #059669;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .buy-btn {
    width: 100%;
    padding: 0.875rem;
    background: #e94560;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .buy-btn:hover {
    background: #d63850;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .history-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .history-date {
    color: #6b7280;
    font-size: 0.9rem;
    min-width: 140px;
  }

  .history-details h3 {
    margin: 0;
    font-size: 1rem;
  }

  .history-details p {
    margin: 0.25rem 0 0 0;
    font-size: 0.85rem;
    color: #6b7280;
    text-transform: capitalize;
  }

  .empty-state {
    color: #9ca3af;
    text-align: center;
    padding: 3rem;
  }

  .no-credits {
    text-align: center;
    padding: 3rem;
  }

  .no-credits p {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  .credits-notice {
    background: #d1fae5;
    color: #059669;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 768px) {
    .portal-body {
      flex-direction: column;
      padding: 1rem;
    }

    .sidebar {
      width: 100%;
      flex-direction: row;
      overflow-x: auto;
    }

    .nav-btn {
      white-space: nowrap;
    }

    .main-content {
      padding: 1.5rem;
    }

    .header-content {
      padding: 0 1rem;
    }

    .welcome {
      display: none;
    }
  }
</style>
