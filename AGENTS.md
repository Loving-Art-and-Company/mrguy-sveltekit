# Mr. Guy Mobile Detail - SvelteKit Port

Port from React version at `~/Projects/06_ARCHIVE/mrguy-react-archived-*`

## Tasks

### 1. Port PackageMenu Component
- [ ] Create `src/lib/components/PackageMenu.svelte`
- [ ] Display 5 service packages ($45-$2000)
- [ ] Include "Fresh Start" 25% promo badge
- [ ] Mobile-responsive grid layout

**Acceptance**: Packages render on landing page with correct pricing

### 2. Build Booking Flow
- [ ] Create `src/routes/book/+page.svelte`
- [ ] Multi-step form: service → vehicle → date → address → payment
- [ ] Use Svelte 5 runes for form state
- [ ] Zod validation on each step

**Acceptance**: Can navigate through all booking steps

### 3. Stripe Checkout Integration
- [ ] Create `src/routes/api/payments/create-checkout/+server.ts`
- [ ] Create `src/routes/api/payments/webhook/+server.ts`
- [ ] Redirect to Stripe Checkout (not embedded)
- [ ] Handle success/cancel returns

**Acceptance**: Test payment completes and booking is created

### 4. Twilio OTP Reschedule Portal
- [ ] Create `src/routes/reschedule/+page.svelte`
- [ ] Phone number input → OTP verification
- [ ] Show customer's bookings after auth
- [ ] Allow date/time changes

**Acceptance**: Customer can reschedule via SMS OTP

### 5. Supabase Connection
- [ ] Create `src/lib/server/supabase.ts` (server client)
- [ ] Create `src/lib/supabase.ts` (browser client)
- [ ] Connect to existing tables (bookings, client_profiles, etc.)
- [ ] Test CRUD operations

**Acceptance**: Can read/write to Supabase from app

## Completion Promise

When all tasks pass acceptance criteria:
```
MRGUY SVELTEKIT READY
```
