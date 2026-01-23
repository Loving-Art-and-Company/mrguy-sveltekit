# Ralph Loop PRD: Phase 3 - Admin Calendar View

## Overview
Create a calendar view for the admin dashboard showing bookings visually by date. Allow navigation between months and clicking dates to view that day's bookings.

## Tech Stack
- SvelteKit (existing)
- Supabase (existing `supabaseAdmin` client)
- Existing admin layout from Phase 1-2
- No external calendar libraries - build simple custom calendar

## Files to Create/Modify

### 1. `/src/routes/admin/calendar/+page.server.ts`
Server load function:
- Accept query param `?month=2026-01` for month navigation (defaults to current month)
- Fetch all bookings for that month from Supabase
- Group bookings by date for easy rendering
- Return: `{ bookings: Record<string, Booking[]>, currentMonth: string }`

### 2. `/src/routes/admin/calendar/+page.svelte`
Calendar page with:
- Month/year header with prev/next navigation arrows
- "Today" button to jump to current month
- 7-column grid for days of week (Sun-Sat)
- Calendar grid showing all days of the month
- Each day cell shows:
  - Day number
  - Count of bookings (if any)
  - Color dot indicators by status (blue=confirmed, green=completed, red=cancelled)
- Click on a day to navigate to `/admin/bookings?from=DATE&to=DATE`
- Days outside current month shown grayed out
- Today's date highlighted

### 3. Update `/src/routes/admin/+layout.svelte`
- Ensure "Calendar" link in sidebar points to `/admin/calendar`
- Add active state styling when on calendar page

## Calendar Grid Logic

```typescript
// Generate calendar grid for a month
function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  const days = [];

  // Previous month padding
  const prevMonth = new Date(year, month, 0);
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonth.getDate() - i),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: new Date(year, month, d),
      isCurrentMonth: true
    });
  }

  // Next month padding (fill to 42 cells = 6 rows)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false
    });
  }

  return days;
}
```

## Styling Guidelines
- Calendar grid: white background, subtle borders between cells
- Day cells: min-height 80px, padding for content
- Today: highlighted with brand color border or background
- Non-current-month days: light gray text
- Booking indicators: small colored dots (3-4px circles)
- Hover state on clickable days
- Mobile: smaller cells, stack booking count

## Acceptance Criteria

### AC1: Calendar Page Loads
- [ ] Navigate to `/admin/calendar`
- [ ] Shows current month calendar grid
- [ ] Days of week headers visible (Sun-Sat)

### AC2: Month Navigation Works
- [ ] Click next arrow to go to next month
- [ ] Click prev arrow to go to previous month
- [ ] "Today" button returns to current month
- [ ] URL updates with month param

### AC3: Bookings Display on Calendar
- [ ] Days with bookings show count
- [ ] Color dots indicate booking statuses
- [ ] Empty days show no indicators

### AC4: Day Click Navigation
- [ ] Click on a day with bookings
- [ ] Navigates to `/admin/bookings?from=DATE&to=DATE`
- [ ] Bookings page shows filtered results for that day

### AC5: Today Highlighting
- [ ] Today's date has visual distinction
- [ ] Easy to identify current day

### AC6: Responsive Layout
- [ ] Calendar displays properly on mobile
- [ ] Navigation controls accessible on small screens

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
- Format dates as YYYY-MM-DD for URL params and Supabase queries
- Month param format: YYYY-MM (e.g., "2026-01")
- Handle edge cases: months starting on Sunday, months with 6 weeks
- Use `MRGUY_BRAND_ID` constant for filtering bookings

## Exit Conditions for Ralph
1. `npm run build` succeeds with no errors
2. `npm run check` passes TypeScript validation
3. All 6 acceptance criteria can be verified
