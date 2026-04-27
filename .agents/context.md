# Mr. Guy Mobile Detail - Project Context

> Last Updated: 2026-04-26

## Ownership

LAC-owned brand/app; optimize for leverage and growth.

## Current Status

**Live in production** at `https://mrguydetail.com`. The current focus is operational reliability: post-service payment collection is live, the canonical-host/caching fixes are shipped, the bounded ops agent foundation is in place, and the codebase now includes a new `/admin/business` suite for mileage, supply inventory, and simple bookkeeping. The business route now bootstraps its own tables on first request using the existing app database connection so it can go live without a separate schema-push step.

## Active Work

- [x] Post-service Stripe Checkout payment collection shipped for completed unpaid bookings
- [x] Canonical-host redirect, smoke guard, and cache-hardening fixes shipped
- [x] Inline delete controls added to the admin bookings calendar for fast lead cleanup
- [x] MrGuy ops agent foundation added (`.agents/agents/mrguy-ops-agent.md`, `docs/mrguy-ops-agent-spec.md`, `scripts/ops/*`, `scripts/mrguy-ops-digest.mjs`, `scripts/run-ops-daily.sh`)
- [x] Admin business suite added at `/admin/business` for mileage logging, inventory tracking, and cash-basis bookkeeping
- [ ] Reauthorize the connected Google account once so Gmail, GA4, and Search Console readonly scopes become available to the ops scripts
- [ ] Install or verify the optional local `launchd` schedule on machines that should run the daily digest automatically
- [ ] Keep monitoring booking, payment, and reschedule health in production

## Requested Future Features

- [ ] Phase 1: Mileage tracker for business driving and reimbursement/tax records
- [ ] Phase 2: Supply inventory system for tracking supplies on hand plus cost of goods
- [ ] Phase 3: Simple bookkeeping function covering taxes, P&L, and core business-finance basics

## Recent Changes

- 2026-03-09: Added inline delete controls to `src/routes/admin/bookings/+page.svelte` and `src/routes/admin/bookings/+page.server.ts`
- 2026-03-09: Added bounded ops agent docs plus the read-only ops command surface and digest pipeline
- 2026-03-09: Shipped mobile-first Stripe payment collection for existing bookings and hardened canonical-host behavior in production
- 2026-02-23: Implemented the "Fresh Start" first-time-client promo with server-side eligibility
- 2026-03-12: Built `/admin/business` with mileage tracking, inventory management, and simple bookkeeping summaries/forms
- 2026-03-12: Added runtime business-table bootstrap so `/admin/business` can initialize its own schema on first request in production
- 2026-04-26: Consolidated root project guidance in `AGENTS.md` and renamed tracked assistant-specific notes to `.agents/`

## Tech Stack

- Framework: SvelteKit 2.50+ with Svelte 5 runes
- Database: Drizzle ORM + `postgres.js` over `DATABASE_URL`
- Auth:
  - Admin: custom bcrypt + DB-backed sessions
  - Client: email OTP
  - Integrations/reporting: Google OAuth
- Payments: Stripe Checkout + webhook reconciliation
- Analytics and monitoring: PostHog, optional GA4/Search Console via Google reconnect, Sentry
- Email and alerts: Resend
- Deployment: Vercel

## Ops Agent Notes

- Command surface:
  - `npm run ops:bookings`
  - `npm run ops:smoke`
  - `npm run ops:inquiries`
  - `npm run ops:analytics`
  - `npm run ops:seo`
  - `npm run ops:digest`
  - `npm run ops:daily`
  - `npm run ops:schedule:install`
- Digests write to `output/ops/latest-digest.md` and archive copies under `output/ops/`
- Alerts send when `SEND_ALERTS=1` and `RESEND_API_KEY` are configured; `MRGUY_OPS_ALERT_TO` is optional and falls back to the MrGuy business email
- Gmail, GA4, and Search Console stay degraded until the Google reconnect adds:
  - `gmail.readonly`
  - `analytics.readonly`
  - `webmasters.readonly`

## Quick Reference

- Dev server: `npm run dev`
- Type check: `npm run check`
- Build: `npm run build`
- Tests: `npm test`
- Production smoke: `npm run ops:smoke`
- Daily digest: `npm run ops:digest`

## Important Files

- `.agents/agents/mrguy-ops-agent.md`
- `.agents/action-plan.md`
- `docs/mrguy-ops-agent-spec.md`
- `scripts/mrguy-ops-digest.mjs`
- `scripts/run-ops-daily.sh`
- `scripts/ops/*.mjs`
- `src/routes/admin/business/+page.server.ts`
- `src/routes/admin/business/+page.svelte`
- `src/lib/repositories/businessRepo.ts`
- `src/lib/server/brand.ts`
- `src/lib/server/businessSchema.ts`
- `src/routes/admin/bookings/[id]/+page.server.ts`
- `src/routes/api/payments/webhook/+server.ts`
- `src/lib/server/db.ts`
- `src/lib/server/auth.ts`

## Business Context

- Target market: West Broward County families in South Florida
- Service area: mobile detailing (driveway-first workflow)
- Revenue target: $10k/month
- Platform thesis: prove the white-label service-business stack with MrGuy, then reuse it for additional tenants
