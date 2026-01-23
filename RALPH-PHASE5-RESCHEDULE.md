# Ralph Loop PRD: Phase 5 - Client Reschedule Portal

## Overview
Create a client-facing reschedule portal where customers can look up their booking by phone number, verify via SMS OTP (Twilio Verify), and reschedule their appointment to a new date.

## Tech Stack
- SvelteKit (existing)
- Supabase (existing `supabaseAdmin` client)
- Twilio Verify (existing API endpoints at `/api/otp/send` and `/api/otp/verify`)
- Existing public layout (not admin)

## Existing API Endpoints
The OTP endpoints already exist:
- `POST /api/otp/send` - Body: `{ phone: string }` - Sends OTP via Twilio
- `POST /api/otp/verify` - Body: `{ phone: string, code: string }` - Verifies OTP

## Files to Create/Modify

### 1. `/src/routes/reschedule/+page.svelte`
Multi-step reschedule flow (all client-side state, no server load needed):

**Step 1: Phone Entry**
- Input field for phone number
- "Look Up My Booking" button
- Calls `/api/otp/send` to send verification code
- Shows error if phone not found or rate limited

**Step 2: OTP Verification**
- 6-digit code input
- "Verify" button
- Calls `/api/otp/verify`
- On success, fetches booking via `/api/bookings/mine`

**Step 3: Booking Display**
- Shows current booking details:
  - Service name
  - Current date & time
  - Price (already paid)
- "Reschedule" button to proceed
- "Cancel" link to start over

**Step 4: Date Selection**
- Calendar picker for new date (reuse calendar logic from Phase 3)
- Only allow dates in the future
- Time slot selection (if applicable)
- "Confirm Reschedule" button

**Step 5: Confirmation**
- Success message
- New booking details displayed
- "Done" button returns to home

### 2. `/src/routes/api/bookings/mine/+server.ts`
**Already exists** - Returns bookings for authenticated phone number.
If not complete, ensure it:
- Accepts session token or verified phone from request
- Returns booking(s) for that phone number
- Filters by `brand_id`

### 3. `/src/routes/api/bookings/reschedule/+server.ts`
New endpoint for rescheduling:
- `POST` with body: `{ bookingId: string, newDate: string, newTime?: string, phone: string }`
- Verify the phone matches the booking's contact
- Update booking date/time in Supabase
- Return updated booking

### 4. Create `/src/lib/components/PhoneInput.svelte`
Reusable phone input component:
- Formats as user types: (555) 555-5555
- Validates US phone format
- Exposes clean number (just digits)

### 5. Create `/src/lib/components/OtpInput.svelte`
Reusable OTP input component:
- 6 individual digit boxes
- Auto-advance on input
- Paste support
- Backspace handling

## State Machine

```
PHONE_ENTRY -> (send OTP) -> OTP_VERIFY -> (verify) -> BOOKING_DISPLAY
                                                            |
                                                      (reschedule)
                                                            v
                                               DATE_SELECT -> CONFIRMATION
```

## Styling Guidelines
- Clean, mobile-first design
- Large touch targets for inputs
- Clear step indicators
- Brand colors (#e94560 primary)
- Success states in green
- Error messages in red below inputs
- Loading spinners during API calls

## Acceptance Criteria

### AC1: Phone Entry Works
- [ ] Navigate to `/reschedule`
- [ ] Enter phone number
- [ ] Click "Look Up My Booking"
- [ ] OTP is sent (check Twilio logs or phone)

### AC2: OTP Verification Works
- [ ] Enter 6-digit code
- [ ] Click "Verify"
- [ ] On valid code, booking details appear

### AC3: Booking Details Display
- [ ] Shows service name, date, time, price
- [ ] "Reschedule" button visible
- [ ] Can cancel and start over

### AC4: Date Selection Works
- [ ] Calendar shows future dates only
- [ ] Can select a new date
- [ ] Time selection available (if applicable)

### AC5: Reschedule Completes
- [ ] Click "Confirm Reschedule"
- [ ] Booking updated in database
- [ ] Confirmation message shown

### AC6: Error Handling
- [ ] Invalid phone shows error
- [ ] Wrong OTP shows error
- [ ] Rate limiting message displays
- [ ] No booking found shows appropriate message

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
- Phone stored in bookings as `contact` field
- Use `MRGUY_BRAND_ID` for filtering
- Only allow rescheduling `confirmed` status bookings
- Don't allow rescheduling past dates
- Keep it simple - no time slot complexity unless already in schema

## Exit Conditions for Ralph
1. `npm run build` succeeds with no errors
2. `npm run check` passes TypeScript validation
3. All 6 acceptance criteria can be verified
