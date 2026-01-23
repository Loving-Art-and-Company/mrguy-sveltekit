# Ralph Loop PRD: Phase 4 - Revenue Dashboard

## Overview
Create a revenue analytics dashboard for the admin panel. Display revenue metrics, trends, and breakdowns by service type and time period.

## Tech Stack
- SvelteKit (existing)
- Supabase (existing `supabaseAdmin` client)
- Existing admin layout from Phase 1-3
- No external charting libraries - use CSS-based bar charts

## Files to Create/Modify

### 1. `/src/routes/admin/revenue/+page.server.ts`
Server load function:
- Accept query params: `?period=week|month|year` (default: month)
- Fetch bookings with `paymentStatus = 'paid'` for the selected period
- Calculate:
  - Total revenue for period
  - Booking count for period
  - Average booking value
  - Revenue by service type (breakdown)
  - Daily/weekly revenue for chart data
  - Comparison to previous period (% change)

### 2. `/src/routes/admin/revenue/+page.svelte`
Revenue dashboard page with:

**Period Selector:**
- Toggle buttons: Week | Month | Year
- Updates URL param and reloads data

**Summary Cards (top row):**
- Total Revenue (with % change from previous period)
- Total Bookings (with % change)
- Average Booking Value
- Top Service (highest revenue service)

**Revenue by Service (section):**
- Horizontal bar chart showing each service's revenue
- Service name, bar (percentage of total), dollar amount
- Sorted by revenue descending

**Revenue Over Time (section):**
- Simple bar chart showing daily (week), weekly (month), or monthly (year) revenue
- X-axis: date labels
- Y-axis: implied by bar height
- CSS-only implementation

**Recent Paid Bookings (section):**
- Table of last 10 paid bookings
- Columns: Date, Client, Service, Amount
- Link to booking detail

### 3. Update `/src/routes/admin/+layout.svelte`
- Ensure "Revenue" link in sidebar points to `/admin/revenue`
- Add active state styling when on revenue page

## Data Calculations

```typescript
// Period ranges
function getPeriodRange(period: 'week' | 'month' | 'year') {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start: Date;

  switch (period) {
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { start: start.toISOString().split('T')[0], end };
}

// Previous period for comparison
function getPreviousPeriodRange(period: 'week' | 'month' | 'year') {
  // Returns the period before the current one
  // e.g., if current is last 7 days, previous is 7 days before that
}
```

## Styling Guidelines
- Summary cards: white background, colored icons/accents
- Positive change: green text with ↑ arrow
- Negative change: red text with ↓ arrow
- Bar charts: brand color (#e94560) for bars
- Service bars: show percentage width, max 100%
- Responsive: stack cards on mobile, horizontal scroll for chart if needed

## Acceptance Criteria

### AC1: Revenue Page Loads
- [ ] Navigate to `/admin/revenue`
- [ ] Shows summary cards with current period data
- [ ] Default period is "Month"

### AC2: Period Toggle Works
- [ ] Click Week/Month/Year to change period
- [ ] Data updates to reflect selected period
- [ ] URL updates with period param

### AC3: Summary Cards Display
- [ ] Total Revenue shows formatted currency
- [ ] Booking count displays
- [ ] Average value calculated correctly
- [ ] Percentage change from previous period shown

### AC4: Revenue by Service
- [ ] Bar chart shows all services with bookings
- [ ] Bars proportional to revenue
- [ ] Dollar amounts displayed

### AC5: Revenue Over Time
- [ ] Bar chart shows revenue trend
- [ ] Appropriate time intervals for period (daily/weekly/monthly)
- [ ] Bars reflect actual revenue data

### AC6: Recent Bookings Table
- [ ] Shows last 10 paid bookings
- [ ] Displays date, client, service, amount
- [ ] Can click to view booking detail

## Verification Commands

```bash
# Build succeeds
npm run build

# Type check passes
npm run check

# Dev server starts
npm run dev
```

## Notes
- Use Svelte 5 runes syntax (`$state`, `$derived`)
- Format all currency as USD with `Intl.NumberFormat`
- Handle empty states gracefully (no bookings = $0, show message)
- Use `MRGUY_BRAND_ID` constant for filtering
- Only count bookings with `paymentStatus = 'paid'`

## Exit Conditions for Ralph
1. `npm run build` succeeds with no errors
2. `npm run check` passes TypeScript validation
3. All 6 acceptance criteria can be verified
