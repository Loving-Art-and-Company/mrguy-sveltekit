# Mr. Guy Mobile Detail -- SvelteKit

## Overview
Mobile detailing booking platform. White-label SaaS architecture, first tenant: Mr. Guy Mobile Detail (South Florida, West Broward).

**Stack**: SvelteKit + Supabase + Stripe + Twilio Verify

**Target**: $10k monthly revenue. 5 service packages ($45--$2000). "Fresh Start" 25% off first booking.

## Port from React
Previous React version archived at `~/Projects/06_ARCHIVE/mrguy-react-archived-*`. Reference for service packages, pricing, component logic, API patterns, and Supabase schema.

## Key Directories
- `src/routes/` -- Landing, booking flow, reschedule portal, admin dashboard, API endpoints
- `src/lib/components/` -- Svelte components
- `src/lib/stores/` -- Svelte 5 runes stores
- `src/lib/server/` -- Server-only code
- `supabase/` -- Schema and migrations

## Supabase Tables
bookings, admin_users, client_profiles, client_sessions, service_packages, otp_rate_limits

## Patterns
- Modular/functional -- pure functions, no classes
- Svelte 5 runes only
- All data loaded server-side via `+page.server.ts`
- Supabase client from `locals` (SSR-safe)
- Zod schemas for all inputs, server-side validation required

## Business Context
- Location: West Broward, South Florida
- Promo: "Fresh Start" 25% off (first booking)
- 5 service packages ($45--$2000)
