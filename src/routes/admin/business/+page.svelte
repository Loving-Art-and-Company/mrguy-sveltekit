<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  type FormState = Partial<{
    mileageError: string;
    mileageSuccess: string;
    mileageValues: Record<string, string>;
    inventoryItemError: string;
    inventoryItemSuccess: string;
    inventoryItemValues: Record<string, string>;
    inventorySettingsError: string;
    inventorySettingsSuccess: string;
    movementError: string;
    movementSuccess: string;
    movementValues: Record<string, string>;
    financeError: string;
    financeSuccess: string;
    financeValues: Record<string, string>;
  }>;

  let { data, form }: { data: PageData; form?: FormState } = $props();

  const periodOptions = ['month', 'quarter', 'year'] as const;

  function selectPeriod(period: string) {
    const url = new URL($page.url);
    url.searchParams.set('period', period);
    const search = url.searchParams.toString();
    goto(`${resolve('/admin/business')}${search ? `?${search}` : ''}`, {
      replaceState: true,
      invalidateAll: true,
    });
  }

  function formatCurrency(cents: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }

  function formatDate(dateStr: string): string {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function financeLabel(type: string): string {
    if (type === 'owner_draw') return 'Owner draw';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  function movementLabel(type: string, quantityDelta: number): string {
    if (type === 'purchase') return 'Purchase';
    if (type === 'usage') return 'Usage';
    return quantityDelta >= 0 ? 'Adjustment +' : 'Adjustment -';
  }

  function formatOdometer(start: number | null, end: number | null): string {
    if (start === null && end === null) return '—';
    if (start !== null && end !== null) return `${start.toLocaleString()} → ${end.toLocaleString()}`;
    return `${(start ?? end)?.toLocaleString()}`;
  }

  const mileageValues = $derived(form?.mileageValues ?? {});
  const inventoryItemValues = $derived(form?.inventoryItemValues ?? {});
  const movementValues = $derived(form?.movementValues ?? {});
  const financeValues = $derived(form?.financeValues ?? {});
  let selectedMovementType = $derived(movementValues.movementType ?? 'purchase');
  let selectedAdjustmentDirection = $derived(movementValues.adjustmentDirection ?? 'increase');
</script>

<svelte:head>
  <title>Business - Mr. Guy Admin</title>
</svelte:head>

<div class="business-page">
  <section class="hero-card">
    <div>
      <p class="eyebrow">Back-office suite</p>
      <h2>Business operations</h2>
      <p class="hero-copy">
        Keep miles, supplies, and cash-basis bookkeeping in one admin workflow. Revenue still
        auto-pulls from paid bookings so you can focus on the missing inputs.
      </p>
    </div>

    <div class="period-selector">
      {#each periodOptions as period (period)}
        <button
          type="button"
          class="period-btn"
          class:active={data.period === period}
          onclick={() => selectPeriod(period)}
        >
          {period === 'quarter' ? 'Quarter' : period.charAt(0).toUpperCase() + period.slice(1)}
        </button>
      {/each}
    </div>
  </section>

  <section class="stats-grid">
    <article class="stat-card">
      <span class="stat-label">Auto-booked revenue</span>
      <strong class="stat-value">{formatCurrency(data.summary.bookingRevenueCents)}</strong>
      <small>{data.periodLabel}</small>
    </article>
    <article class="stat-card">
      <span class="stat-label">Supply spend</span>
      <strong class="stat-value">{formatCurrency(data.summary.supplySpendCents)}</strong>
      <small>Inventory purchases in {data.periodLabel.toLowerCase()}</small>
    </article>
    <article class="stat-card">
      <span class="stat-label">Cash-basis profit</span>
      <strong class="stat-value" class:profit-positive={data.summary.cashBasisProfitCents >= 0} class:profit-negative={data.summary.cashBasisProfitCents < 0}>
        {formatCurrency(data.summary.cashBasisProfitCents)}
      </strong>
      <small>Revenue minus supply + manual expenses</small>
    </article>
    <article class="stat-card">
      <span class="stat-label">Business miles</span>
      <strong class="stat-value">{data.summary.totalMiles.toLocaleString()}</strong>
      <small>{data.summary.mileageEntryCount} log entries</small>
    </article>
    <article class="stat-card">
      <span class="stat-label">Inventory value</span>
      <strong class="stat-value">{formatCurrency(data.summary.inventoryValueCents)}</strong>
      <small>{data.summary.activeInventoryItems} active supply items</small>
    </article>
    <article class="stat-card">
      <span class="stat-label">Low-stock items</span>
      <strong class="stat-value">{data.summary.lowStockCount}</strong>
      <small>At or below reorder threshold</small>
    </article>
  </section>

  <section class="section-card">
    <div class="section-heading">
      <div>
        <h3>Mileage tracker</h3>
        <p>Capture the business miles that are hardest to reconstruct later.</p>
      </div>
      <div class="section-meta">
        <span>{data.summary.totalMiles.toLocaleString()} miles</span>
        <span>{data.periodLabel}</span>
      </div>
    </div>

    {#if form?.mileageError}
      <p class="banner error">{form.mileageError}</p>
    {/if}
    {#if form?.mileageSuccess}
      <p class="banner success">{form.mileageSuccess}</p>
    {/if}

    <form method="POST" action="?/addMileage" class="data-form">
      <div class="form-grid">
        <label class="field">
          <span>Date</span>
          <input
            type="date"
            name="entryDate"
            value={mileageValues.entryDate ?? data.today}
            required
          />
        </label>
        <label class="field">
          <span>Miles</span>
          <input type="number" name="miles" min="1" step="1" value={mileageValues.miles ?? ''} required />
        </label>
        <label class="field field-wide">
          <span>Purpose</span>
          <input
            type="text"
            name="purpose"
            placeholder="Supply run, client pickup, mobile job commute..."
            value={mileageValues.purpose ?? ''}
            required
          />
        </label>
        <label class="field">
          <span>Starting odometer</span>
          <input
            type="number"
            name="startOdometer"
            min="0"
            step="1"
            value={mileageValues.startOdometer ?? ''}
          />
        </label>
        <label class="field">
          <span>Ending odometer</span>
          <input
            type="number"
            name="endOdometer"
            min="0"
            step="1"
            value={mileageValues.endOdometer ?? ''}
          />
        </label>
        <label class="field field-wide">
          <span>Link to booking (optional)</span>
          <select name="bookingId">
            <option value="">No linked booking</option>
            {#each data.linkedBookings as booking (booking.id)}
              <option value={booking.id} selected={mileageValues.bookingId === booking.id}>
                {booking.date} · {booking.clientName} · {booking.serviceName}
              </option>
            {/each}
          </select>
        </label>
        <label class="field field-wide">
          <span>Notes</span>
          <textarea
            name="notes"
            rows="3"
            placeholder="Anything worth keeping for tax prep or internal notes"
          >{mileageValues.notes ?? ''}</textarea>
        </label>
      </div>

      <button type="submit" class="primary-btn">Save mileage entry</button>
    </form>

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Purpose</th>
            <th>Miles</th>
            <th>Odometer</th>
            <th>Booking</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#if data.mileage.entries.length === 0}
            <tr>
              <td colspan="6" class="empty-row">No mileage logged yet.</td>
            </tr>
          {:else}
            {#each data.mileage.entries as entry (entry.id)}
              <tr>
                <td>{formatDate(entry.entryDate)}</td>
                <td>
                  <strong>{entry.purpose}</strong>
                  {#if entry.notes}
                    <small>{entry.notes}</small>
                  {/if}
                </td>
                <td>{entry.miles}</td>
                <td>{formatOdometer(entry.startOdometer, entry.endOdometer)}</td>
                <td>
                  {#if entry.bookingId}
                    <a href={resolve(`/admin/bookings/${entry.bookingId}`)}>
                      {entry.bookingClientName ?? 'Linked booking'}
                    </a>
                    <small>{entry.bookingServiceName ?? ''}</small>
                  {:else}
                    —
                  {/if}
                </td>
                <td class="action-cell">
                  <form method="POST" action="?/deleteMileage">
                    <input type="hidden" name="mileageId" value={entry.id} />
                    <button type="submit" class="ghost-btn danger">Delete</button>
                  </form>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </section>

  <section class="section-card">
    <div class="section-heading">
      <div>
        <h3>Supply inventory</h3>
        <p>Track what is on hand, what it costs, and what needs a reorder.</p>
      </div>
      <div class="section-meta">
        <span>{data.summary.lowStockCount} low stock</span>
        <span>{formatCurrency(data.summary.inventoryValueCents)} on hand</span>
      </div>
    </div>

    {#if form?.inventoryItemError}
      <p class="banner error">{form.inventoryItemError}</p>
    {/if}
    {#if form?.inventoryItemSuccess}
      <p class="banner success">{form.inventoryItemSuccess}</p>
    {/if}
    {#if form?.inventorySettingsError}
      <p class="banner error">{form.inventorySettingsError}</p>
    {/if}
    {#if form?.inventorySettingsSuccess}
      <p class="banner success">{form.inventorySettingsSuccess}</p>
    {/if}
    {#if form?.movementError}
      <p class="banner error">{form.movementError}</p>
    {/if}
    {#if form?.movementSuccess}
      <p class="banner success">{form.movementSuccess}</p>
    {/if}

    <div class="split-grid">
      <form method="POST" action="?/addInventoryItem" class="data-form card-in-card">
        <div class="card-heading">
          <h4>Add supply item</h4>
          <p>Create a reusable item with default cost and reorder threshold.</p>
        </div>
        <div class="form-grid">
          <label class="field">
            <span>Name</span>
            <input type="text" name="name" value={inventoryItemValues.name ?? ''} required />
          </label>
          <label class="field">
            <span>SKU / label (optional)</span>
            <input type="text" name="sku" value={inventoryItemValues.sku ?? ''} />
          </label>
          <label class="field">
            <span>Unit label</span>
            <input
              type="text"
              name="unitLabel"
              placeholder="bottles, towels, gallons"
              value={inventoryItemValues.unitLabel ?? 'units'}
              required
            />
          </label>
          <label class="field">
            <span>Starting quantity</span>
            <input
              type="number"
              name="quantityOnHand"
              min="0"
              step="1"
              value={inventoryItemValues.quantityOnHand ?? '0'}
              required
            />
          </label>
          <label class="field">
            <span>Reorder threshold</span>
            <input
              type="number"
              name="reorderThreshold"
              min="0"
              step="1"
              value={inventoryItemValues.reorderThreshold ?? '0'}
              required
            />
          </label>
          <label class="field">
            <span>Unit cost</span>
            <input
              type="text"
              name="unitCost"
              inputmode="decimal"
              placeholder="12.50"
              value={inventoryItemValues.unitCost ?? ''}
              required
            />
          </label>
          <label class="field field-wide">
            <span>Notes</span>
            <textarea name="notes" rows="3">{inventoryItemValues.notes ?? ''}</textarea>
          </label>
        </div>

        <button type="submit" class="primary-btn">Add item</button>
      </form>

      <form method="POST" action="?/recordInventoryMovement" class="data-form card-in-card">
        <div class="card-heading">
          <h4>Record stock movement</h4>
          <p>Use purchases, job usage, and adjustments to keep quantity and supply spend current.</p>
        </div>
        <div class="form-grid">
          <label class="field field-wide">
            <span>Inventory item</span>
            <select name="itemId" required>
              <option value="">Select an item</option>
              {#each data.inventory.items as item (item.id)}
                <option value={item.id} selected={movementValues.itemId === item.id}>
                  {item.name} · {item.quantityOnHand} {item.unitLabel}
                </option>
              {/each}
            </select>
          </label>
          <label class="field">
            <span>Date</span>
            <input
              type="date"
              name="occurredOn"
              value={movementValues.occurredOn ?? data.today}
              required
            />
          </label>
          <label class="field">
            <span>Type</span>
            <select name="movementType" bind:value={selectedMovementType}>
              <option value="purchase">Purchase / restock</option>
              <option value="usage">Usage on a job</option>
              <option value="adjustment">Manual adjustment</option>
            </select>
          </label>
          <label class="field">
            <span>Quantity</span>
            <input type="number" name="quantity" min="1" step="1" value={movementValues.quantity ?? ''} required />
          </label>

          {#if selectedMovementType === 'adjustment'}
            <label class="field">
              <span>Adjustment direction</span>
              <select name="adjustmentDirection" bind:value={selectedAdjustmentDirection}>
                <option value="increase">Increase on hand</option>
                <option value="decrease">Decrease on hand</option>
              </select>
            </label>
          {/if}

          {#if selectedMovementType === 'purchase'}
            <label class="field">
              <span>Total purchase cost</span>
              <input
                type="text"
                name="totalCost"
                inputmode="decimal"
                placeholder="40.00"
                value={movementValues.totalCost ?? ''}
              />
            </label>
          {/if}

          <label class="field field-wide">
            <span>Linked booking (optional)</span>
            <select name="bookingId">
              <option value="">No linked booking</option>
              {#each data.linkedBookings as booking (booking.id)}
                <option value={booking.id} selected={movementValues.bookingId === booking.id}>
                  {booking.date} · {booking.clientName} · {booking.serviceName}
                </option>
              {/each}
            </select>
          </label>
          <label class="field field-wide">
            <span>Notes</span>
            <textarea name="notes" rows="3">{movementValues.notes ?? ''}</textarea>
          </label>
        </div>

        <button type="submit" class="primary-btn">Record movement</button>
      </form>
    </div>

    {#if data.inventory.lowStockItems.length > 0}
      <div class="callout warning">
        <strong>Low stock:</strong>
        {#each data.inventory.lowStockItems as item, index (item.id)}
          {item.name} ({item.quantityOnHand} / reorder at {item.reorderThreshold} {item.unitLabel}){index < data.inventory.lowStockItems.length - 1 ? ', ' : ''}
        {/each}
      </div>
    {/if}

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>On hand</th>
            <th>Reorder at</th>
            <th>Unit cost</th>
            <th>Est. value</th>
            <th>Settings</th>
          </tr>
        </thead>
        <tbody>
          {#if data.inventory.items.length === 0}
            <tr>
              <td colspan="6" class="empty-row">No inventory items yet.</td>
            </tr>
          {:else}
            {#each data.inventory.items as item (item.id)}
              <tr class:low-stock-row={item.isLowStock}>
                <td>
                  <strong>{item.name}</strong>
                  <small>{item.sku ?? item.notes ?? item.unitLabel}</small>
                </td>
                <td>{item.quantityOnHand} {item.unitLabel}</td>
                <td>{item.reorderThreshold} {item.unitLabel}</td>
                <td>{formatCurrency(item.unitCostCents)}</td>
                <td>{formatCurrency(item.inventoryValueCents)}</td>
                <td>
                  <form method="POST" action="?/updateInventoryItem" class="inline-settings-form">
                    <input type="hidden" name="itemId" value={item.id} />
                    <label>
                      <span>Reorder</span>
                      <input type="number" name="reorderThreshold" min="0" step="1" value={item.reorderThreshold} />
                    </label>
                    <label>
                      <span>Unit cost</span>
                      <input
                        type="text"
                        name="unitCost"
                        inputmode="decimal"
                        value={(item.unitCostCents / 100).toFixed(2)}
                      />
                    </label>
                    <button type="submit" class="ghost-btn">Save</button>
                  </form>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>Movement</th>
            <th>Qty delta</th>
            <th>Cost</th>
            <th>Linked booking</th>
          </tr>
        </thead>
        <tbody>
          {#if data.inventory.recentMovements.length === 0}
            <tr>
              <td colspan="6" class="empty-row">No stock movements yet.</td>
            </tr>
          {:else}
            {#each data.inventory.recentMovements as movement (movement.id)}
              <tr>
                <td>{formatDate(movement.occurredOn)}</td>
                <td>
                  <strong>{movement.itemName}</strong>
                  {#if movement.notes}
                    <small>{movement.notes}</small>
                  {/if}
                </td>
                <td>{movementLabel(movement.movementType, movement.quantityDelta)}</td>
                <td class:negative-qty={movement.quantityDelta < 0}>
                  {movement.quantityDelta > 0 ? '+' : ''}{movement.quantityDelta}
                </td>
                <td>{movement.totalCostCents > 0 ? formatCurrency(movement.totalCostCents) : '—'}</td>
                <td>
                  {#if movement.bookingId}
                    <a href={resolve(`/admin/bookings/${movement.bookingId}`)}>
                      {movement.bookingClientName ?? 'Linked booking'}
                    </a>
                  {:else}
                    —
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </section>

  <section class="section-card">
    <div class="section-heading">
      <div>
        <h3>Simple bookkeeping</h3>
        <p>Cash-basis revenue from bookings plus manual expenses, taxes, draws, and other entries.</p>
      </div>
      <div class="section-meta">
        <span>{formatCurrency(data.summary.netCashAfterOutflowsCents)} after tax/draw logs</span>
        <span>{data.periodLabel}</span>
      </div>
    </div>

    {#if form?.financeError}
      <p class="banner error">{form.financeError}</p>
    {/if}
    {#if form?.financeSuccess}
      <p class="banner success">{form.financeSuccess}</p>
    {/if}

    <div class="stats-grid bookkeeping-grid">
      <article class="stat-card compact">
        <span class="stat-label">Manual revenue</span>
        <strong class="stat-value">{formatCurrency(data.summary.manualRevenueCents)}</strong>
      </article>
      <article class="stat-card compact">
        <span class="stat-label">Other expenses</span>
        <strong class="stat-value">{formatCurrency(data.summary.otherExpenseCents)}</strong>
      </article>
      <article class="stat-card compact">
        <span class="stat-label">Taxes logged</span>
        <strong class="stat-value">{formatCurrency(data.summary.taxesPaidCents)}</strong>
      </article>
      <article class="stat-card compact">
        <span class="stat-label">Owner draws</span>
        <strong class="stat-value">{formatCurrency(data.summary.ownerDrawsCents)}</strong>
      </article>
    </div>

    <form method="POST" action="?/addFinanceEntry" class="data-form card-in-card">
      <div class="card-heading">
        <h4>Add bookkeeping entry</h4>
        <p>Use this for non-booking revenue, expenses, taxes paid, and owner draws.</p>
      </div>
      <div class="form-grid">
        <label class="field">
          <span>Date</span>
          <input type="date" name="entryDate" value={financeValues.entryDate ?? data.today} required />
        </label>
        <label class="field">
          <span>Type</span>
          <select name="entryType">
            <option value="expense" selected={(financeValues.entryType ?? 'expense') === 'expense'}>Expense</option>
            <option value="revenue" selected={financeValues.entryType === 'revenue'}>Revenue</option>
            <option value="tax" selected={financeValues.entryType === 'tax'}>Tax payment</option>
            <option value="owner_draw" selected={financeValues.entryType === 'owner_draw'}>Owner draw</option>
          </select>
        </label>
        <label class="field">
          <span>Category</span>
          <input
            type="text"
            name="category"
            placeholder="Supplies, fuel, marketing, software..."
            value={financeValues.category ?? ''}
            required
          />
        </label>
        <label class="field">
          <span>Amount</span>
          <input type="text" name="amount" inputmode="decimal" placeholder="125.00" value={financeValues.amount ?? ''} required />
        </label>
        <label class="field field-wide">
          <span>Link to booking (optional)</span>
          <select name="bookingId">
            <option value="">No linked booking</option>
            {#each data.linkedBookings as booking (booking.id)}
              <option value={booking.id} selected={financeValues.bookingId === booking.id}>
                {booking.date} · {booking.clientName} · {booking.serviceName}
              </option>
            {/each}
          </select>
        </label>
        <label class="field field-wide">
          <span>Notes</span>
          <textarea name="notes" rows="3">{financeValues.notes ?? ''}</textarea>
        </label>
      </div>

      <button type="submit" class="primary-btn">Save entry</button>
    </form>

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Booking</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#if data.bookkeeping.recentFinanceEntries.length === 0}
            <tr>
              <td colspan="6" class="empty-row">No bookkeeping entries yet.</td>
            </tr>
          {:else}
            {#each data.bookkeeping.recentFinanceEntries as entry (entry.id)}
              <tr>
                <td>{formatDate(entry.entryDate)}</td>
                <td>{financeLabel(entry.entryType)}</td>
                <td>
                  <strong>{entry.category}</strong>
                  {#if entry.notes}
                    <small>{entry.notes}</small>
                  {/if}
                </td>
                <td>{formatCurrency(entry.amountCents)}</td>
                <td>
                  {#if entry.bookingId}
                    <a href={resolve(`/admin/bookings/${entry.bookingId}`)}>
                      {entry.bookingClientName ?? 'Linked booking'}
                    </a>
                  {:else}
                    —
                  {/if}
                </td>
                <td class="action-cell">
                  <form method="POST" action="?/deleteFinanceEntry">
                    <input type="hidden" name="financeId" value={entry.id} />
                    <button type="submit" class="ghost-btn danger">Delete</button>
                  </form>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>Paid booking feed</th>
            <th>Date</th>
            <th>Service</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {#if data.bookkeeping.recentPaidBookings.length === 0}
            <tr>
              <td colspan="4" class="empty-row">No paid bookings yet.</td>
            </tr>
          {:else}
            {#each data.bookkeeping.recentPaidBookings as booking (booking.id)}
              <tr>
                <td>
                  <a href={resolve(`/admin/bookings/${booking.id}`)}>{booking.clientName}</a>
                </td>
                <td>{formatDate(booking.date)}</td>
                <td>{booking.serviceName}</td>
                <td>{formatCurrency(booking.amountCents)}</td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <div class="callout neutral">
      <strong>How to use this:</strong> booking revenue auto-feeds from paid jobs, mileage stays separate
      for tax support, and supply purchases flow in from inventory restocks. That keeps this simple, cash-basis,
      and grounded in real inputs instead of guesses.
    </div>
  </section>
</div>

<style>
  .business-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1280px;
  }

  .hero-card,
  .section-card,
  .stat-card,
  .card-in-card {
    background: white;
    border-radius: 0.85rem;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  }

  .hero-card,
  .section-card {
    padding: 1.5rem;
  }

  .hero-card {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .eyebrow {
    margin: 0 0 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.75rem;
    font-weight: 700;
    color: #e94560;
  }

  h2,
  h3,
  h4 {
    margin: 0;
    color: #1a1a2e;
  }

  .hero-copy,
  .section-heading p,
  .card-heading p {
    margin: 0.4rem 0 0;
    color: #6b7280;
  }

  .period-selector {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .period-btn {
    border: 1px solid #d1d5db;
    background: #f9fafb;
    color: #4b5563;
    border-radius: 999px;
    padding: 0.55rem 1rem;
    font-weight: 600;
    cursor: pointer;
  }

  .period-btn.active {
    background: #1a1a2e;
    border-color: #1a1a2e;
    color: white;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .bookkeeping-grid {
    margin-bottom: 1rem;
  }

  .stat-card {
    padding: 1.1rem 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-card.compact {
    min-height: auto;
  }

  .stat-label {
    color: #6b7280;
    font-size: 0.82rem;
  }

  .stat-value {
    color: #111827;
    font-size: 1.35rem;
    line-height: 1.2;
  }

  .profit-positive {
    color: #166534;
  }

  .profit-negative {
    color: #b91c1c;
  }

  .section-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-heading {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .section-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    color: #4b5563;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .banner {
    margin: 0;
    padding: 0.9rem 1rem;
    border-radius: 0.65rem;
    font-weight: 600;
  }

  .banner.error {
    background: #fee2e2;
    color: #991b1b;
  }

  .banner.success {
    background: #dcfce7;
    color: #166534;
  }

  .split-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .card-in-card {
    padding: 1rem;
  }

  .card-heading {
    margin-bottom: 1rem;
  }

  .data-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .field-wide {
    grid-column: 1 / -1;
  }

  .field span {
    font-size: 0.82rem;
    font-weight: 600;
    color: #374151;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.7rem 0.8rem;
    border: 1px solid #d1d5db;
    border-radius: 0.6rem;
    font: inherit;
    color: #111827;
    background: white;
  }

  textarea {
    resize: vertical;
  }

  .primary-btn,
  .ghost-btn {
    border-radius: 0.65rem;
    padding: 0.7rem 1rem;
    font-weight: 700;
    cursor: pointer;
    font: inherit;
  }

  .primary-btn {
    border: none;
    background: #e94560;
    color: white;
    align-self: flex-start;
  }

  .ghost-btn {
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
  }

  .ghost-btn.danger {
    border-color: #fecaca;
    color: #b91c1c;
  }

  .table-shell {
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 0.8rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 720px;
  }

  th,
  td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
    text-align: left;
  }

  th {
    background: #f9fafb;
    color: #6b7280;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td strong,
  td a {
    color: #111827;
    text-decoration: none;
  }

  td a:hover {
    color: #e94560;
  }

  td small {
    display: block;
    margin-top: 0.2rem;
    color: #6b7280;
  }

  .empty-row {
    color: #6b7280;
    text-align: center;
    padding: 1.5rem;
  }

  .action-cell {
    width: 1%;
    white-space: nowrap;
  }

  .inline-settings-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(100px, 1fr)) auto;
    gap: 0.5rem;
    align-items: end;
  }

  .inline-settings-form label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 100px;
  }

  .inline-settings-form span {
    color: #6b7280;
    font-size: 0.72rem;
    font-weight: 600;
  }

  .inline-settings-form input {
    padding: 0.55rem 0.6rem;
  }

  .callout {
    border-radius: 0.75rem;
    padding: 0.95rem 1rem;
    font-size: 0.92rem;
  }

  .callout.warning {
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #fdba74;
  }

  .callout.neutral {
    background: #f8fafc;
    color: #334155;
    border: 1px solid #cbd5e1;
  }

  .negative-qty {
    color: #b91c1c;
    font-weight: 700;
  }

  .low-stock-row {
    background: #fff7ed;
  }

  @media (max-width: 1024px) {
    .split-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }

    .field-wide {
      grid-column: auto;
    }

    .section-meta {
      align-items: flex-start;
    }
  }

  @media (max-width: 640px) {
    .hero-card,
    .section-card {
      padding: 1rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .inline-settings-form {
      grid-template-columns: 1fr;
    }
  }
</style>
