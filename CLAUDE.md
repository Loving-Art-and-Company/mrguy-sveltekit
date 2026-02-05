# Mr. Guy Mobile Detail - SvelteKit

## Development Setup

When setting up dev environments or projects, always verify the setup is fully working before moving on - run the dev server, test login flows, and confirm database connections are active.

## Overview

Mobile detailing booking platform. White-label SaaS architecture, first tenant: Mr. Guy Mobile Detail (South Florida).

**Stack**: SvelteKit + Supabase + Stripe + Twilio Verify

## Port from React

Previous React version archived at `~/Projects/06_ARCHIVE/mrguy-react-archived-*`. Reference it for:
- Service packages & pricing
- Component logic
- API endpoint patterns
- Supabase schema

## Key Features to Port

### Client-Facing
- Landing page with packages
- Booking flow (service → vehicle → date → address → payment)
- Stripe Checkout redirect
- Reschedule portal with SMS OTP auth
- "Fresh Start" 25% promo for first booking

### Admin Dashboard
- Login (Supabase Auth)
- Booking list with filters
- Calendar view
- Revenue dashboard
- Marketing AI assistant (Gemini)

## Architecture

```
src/
├── routes/
│   ├── +page.svelte              # Landing
│   ├── book/+page.svelte         # Booking flow
│   ├── reschedule/+page.svelte   # Client portal
│   ├── admin/                    # Admin dashboard
│   └── api/                      # API endpoints
├── lib/
│   ├── components/               # Svelte components
│   ├── stores/                   # Svelte 5 runes stores
│   ├── server/                   # Server-only code
│   └── types/                    # TypeScript types
└── supabase/
    └── schema.sql                # Database schema
```

## Supabase Tables

- `bookings` - Customer appointments
- `admin_users` - Admin accounts
- `client_profiles` - Customer data
- `client_sessions` - OTP sessions
- `service_packages` - Package definitions
- `otp_rate_limits` - Rate limiting

## Patterns

### Auth
- Client: Twilio Verify SMS OTP
- Admin: Supabase Auth email/password
- Google OAuth: Drive, Sheets, Docs integration for team access

After any auth-related changes, test the full login flow including redirects before considering the task complete.

### Payments
- Stripe Checkout (redirect, not embedded)
- Webhook at `/api/payments/webhook`

### Validation
- Zod schemas for all inputs
- Server-side validation required

## Debugging

When troubleshooting or debugging, state the current hypothesis and what evidence would confirm/reject it before making changes.

## Business Context

- Location: West Broward, South Florida
- Target: $10k monthly revenue
- Promo: "Fresh Start" 25% off (first booking)
- 5 service packages ($45-$2000)
