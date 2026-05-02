# Mr. Guy Mobile Detail -- SvelteKit

## Stale Booking Funnel Fence

This directory is not the production booking source of truth. Use
`web/mrguy-sveltekit` for booking create, checkout, and Stripe webhook fixes.

The backoffice-suite booking/payment API endpoints intentionally return `410
Gone` so stale Twilio/SMS-era logic cannot be mistaken for the live funnel.

## Context System

Before starting work, load:
1. `DESIGN.md` - Visual contract for the admin and backoffice surfaces
2. `README.md` - Quick repo orientation
3. Supporting route or component files relevant to the task

For admin UI, dashboard, reporting, or workflow-layout tasks, treat `DESIGN.md` as the source of truth for posture, density, and component styling.

## Overview
Mobile detailing booking platform. White-label SaaS architecture, first tenant: Mr. Guy Mobile Detail (South Florida, West Broward).

**Stack**: SvelteKit + Neon Postgres + Stripe + Twilio Verify

**Target**: $10k monthly revenue. 5 service packages ($45--$2000). "Fresh Start" 25% off first booking.

## Port from React
Previous React version archived at `~/Projects/06_ARCHIVE/mrguy-react-archived-*`. Reference for service packages, pricing, component logic, and API patterns.

## Key Directories
- `src/routes/` -- Landing, booking flow, reschedule portal, admin dashboard, API endpoints
- `src/lib/components/` -- Svelte components
- `src/lib/stores/` -- Svelte 5 runes stores
- `src/lib/server/` -- Server-only code
- `drizzle.config.ts` -- Drizzle configuration

## Database Tables
bookings, admin_users, client_profiles, client_sessions, service_packages, otp_rate_limits

## Patterns
- Modular/functional -- pure functions, no classes
- Svelte 5 runes only
- All data loaded server-side via `+page.server.ts`
- Server-only data access via Drizzle repositories
- Zod schemas for all inputs, server-side validation required

## Business Context
- Location: West Broward, South Florida
- Promo: "Fresh Start" 25% off (first booking)
- 5 service packages ($45--$2000)

## Agent Skills & Memory

Global skills are indexed at `~/.agents/skills/_manifest.json`.
Full conventions and episodic logging live at `~/memory/agents/skills.md`.
