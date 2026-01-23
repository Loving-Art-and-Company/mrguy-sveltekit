# Ralph Loop PRD: Phase 2 - Admin Bookings List

## Overview
Create the bookings management page for the admin dashboard. Display all bookings from Supabase with filtering capabilities.

## Tech Stack
- SvelteKit (existing)
- Supabase (existing `supabaseAdmin` client)
- Existing admin layout from Phase 1

## Database Schema Reference
The `bookings` table has these columns:
- `id` (text, primary key) - e.g., "BK-20260125-ABCD"
- `brand_id` (uuid)
- `clientName` (text)
- `serviceName` (text)
- `price` (numeric)
- `date` (date)
- `time` (text)
- `contact` (text) - phone number
- `transactionId` (text) - Stripe session ID
- `paymentMethod` (text)
- `notes` (text)
- `status` (text) - "confirmed", "completed", "cancelled"
- `paymentStatus` (text) - "paid", "pending", "refunded"
- `reminderSent` (boolean)
- `created_at` (timestamp)

## Files to Create/Modify

### 1. `/src/routes/admin/bookings/+page.server.ts`
Server load function:
- Fetch bookings from Supabase using `supabaseAdmin`
- Support query params: `?status=confirmed&from=2026-01-01&to=2026-01-31&search=john`
- Order by date DESC, then time
- Return bookings array to page

### 2. `/src/routes/admin/bookings/+page.svelte`
Bookings list page:
- Filter controls at top:
  - Status dropdown (All, Confirmed, Completed, Cancelled)
  - Date range picker (from/to)
  - Search input (searches clientName, contact)
- Table with columns:
  - Date & Time
  - Client Name
  - Service
  - Price
  - Status (with colored badge)
  - Actions (View details)
- Empty state when no bookings
- Loading state

### 3. `/src/routes/admin/bookings/[id]/+page.server.ts`
Booking detail load:
- Fetch single booking by ID
- Return 404 if not found

### 4. `/src/routes/admin/bookings/[id]/+page.svelte`
Booking detail page:
- Full booking information display
- Vehicle details (from notes field, parse it)
- Address (from notes field)
- Payment info (transaction ID, status)
- Back button to bookings list

### 5. Update `/src/routes/admin/+page.svelte`
Dashboard home updates:
- Fetch actual counts from Supabase
- Today's bookings count
- This week's revenue
- Pending bookings count (if any with pending payment)

### 6. Update `/src/routes/admin/+layout.svelte`
Add navigation link:
- Bookings link in sidebar should go to `/admin/bookings`

## Styling Guidelines
- Match existing admin layout dark theme
- Use consistent spacing and typography
- Status badges: confirmed=blue, completed=green, cancelled=red
- Table should be responsive (horizontal scroll on mobile)

## Acceptance Criteria

### AC1: Bookings Page Loads
- [ ] Navigate to `/admin/bookings` (while logged in)
- [ ] Page renders with table structure
- [ ] Shows "No bookings found" if empty

### AC2: Bookings Display Correctly
- [ ] Table shows all bookings from database
- [ ] Date, client name, service, price columns visible
- [ ] Status shows with colored badge

### AC3: Filters Work
- [ ] Status filter changes displayed bookings
- [ ] Date range filter limits results
- [ ] Search filters by client name or phone

### AC4: Booking Detail Works
- [ ] Click on a booking row/view button
- [ ] Navigates to `/admin/bookings/[id]`
- [ ] Shows full booking details

### AC5: Dashboard Shows Stats
- [ ] `/admin` shows today's booking count
- [ ] Shows this week's revenue total
- [ ] Numbers are accurate from database

### AC6: Navigation Works
- [ ] Sidebar "Bookings" link goes to bookings page
- [ ] Back button on detail page returns to list

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
- Parse the notes field to extract vehicle/address info for detail view
- Handle the case where the bookings table might be empty
- Price is stored as number, format as currency ($XX.XX)
- Use the MRGUY_BRAND_ID constant for filtering if needed

## Exit Conditions for Ralph
1. `npm run build` succeeds with no errors
2. `npm run check` passes TypeScript validation
3. All 6 acceptance criteria can be verified
