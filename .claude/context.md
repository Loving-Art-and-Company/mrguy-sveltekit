# Mr. Guy Mobile Detail - Project Context

> Last Updated: 2026-02-23 by Claude Opus 4

## Current Status
**Live in production** at mrguydetail.com. Platform stable and operational. All core features complete.

## Active Work
- [x] Initial development complete (all 6 Ralph Loop phases)
- [x] Removed Model 3/Y Kit service package
- [x] 25% first-time client promo ("Fresh Start") — full-stack implementation
- [ ] Set PROMO_ENABLED=true in Vercel environment variables
- [ ] Monitoring production metrics
- [ ] Optimization based on real user data (when needed)

## Recent Changes
- 2026-02-23: Implemented 25% first-time client promo with server-side eligibility (ea27f9f)
  - New: `src/lib/server/promo.ts` (isFirstTimeClient), `src/lib/server/phone.ts` (normalizePhone), `src/routes/+page.server.ts` (promoEnabled toggle)
  - Fixed: phone format inconsistency (10-digit vs E.164), missing brandId on booking inserts, promoCode column in Drizzle schema
  - Env-driven: PROMO_ENABLED toggle (defaults to enabled, set 'false' to disable)
  - Codex-reviewed: 4 rounds, all findings addressed
- 2026-02-23: Removed Model 3/Y Kit (tesla_3y_special) service package (dc110fc)
- 2026-01-29: Added promo_code column to bookings table (DB migration)
- 2026-01-25: SMS notifications wired into booking flow
- 2026-01-22: Completed all 6 Ralph Loop implementation phases
- 2026-01-21: Deployed to Vercel production
- 2026-01-21: Set up Stripe webhooks and Twilio Verify

## Tech Stack
- Framework: SvelteKit 2.50+ (Svelte 5 with runes)
- Database: Supabase (PostgreSQL + realtime)
- Payments: Stripe Checkout (redirect mode)
- Auth: Twilio Verify (SMS OTP for clients), Supabase Auth (admin)
- Deployment: Vercel
- Validation: Zod 4.3+

## Blockers / Issues
- PROMO_ENABLED env var needs to be set in Vercel to activate the promo in production

## Next Steps
1. Set PROMO_ENABLED=true in Vercel environment variables
2. Monitor promo usage — watch for abuse (multiple phone numbers, etc.)
3. Future: add race condition protection on first-time check (Codex suggestion)
4. Future: add regression tests for promo eligibility and pricing
5. Future: centralize MRGUY_BRAND_ID constant (currently duplicated in 4+ files)
6. Future: backfill old phone formats in bookings table for consistent lookups

## Quick Reference
- Dev server: `npm run dev` (port 5173)
- Build: `npm run build`
- Type check: `npm run check`
- Deploy: Auto-deploy on push to main branch
- Logs: Check Vercel dashboard

## Important Files
- `src/routes/+page.svelte`: Landing page with service packages + promo banner
- `src/routes/+page.server.ts`: Server load — passes promoEnabled flag
- `src/routes/book/+page.svelte`: Multi-step booking flow
- `src/routes/reschedule/+page.svelte`: Client OTP reschedule portal
- `src/routes/admin/+layout.svelte`: Admin dashboard auth wrapper
- `src/routes/api/bookings/create/+server.ts`: Booking creation with server-side pricing + promo eligibility
- `src/routes/api/payments/create-checkout/+server.ts`: Stripe checkout with promo pricing
- `src/routes/api/payments/webhook/+server.ts`: Stripe webhook handler
- `src/lib/server/promo.ts`: First-time client eligibility check
- `src/lib/server/phone.ts`: Shared phone normalization utility
- `CLAUDE.md`: Comprehensive architecture documentation
- `SECURITY.md`: Security policies and RLS setup

## Environment
- Local: http://localhost:5173
- Production: https://mrguydetail.com
- Supabase: Project at qtskudtsfbwdahjhpphh
- Stripe: Live mode connected

## Business Context
- Target Market: West Broward County families (South Florida)
- Service Area: Mobile detailing (comes to customer)
- Revenue Target: $10k/month
- Key Promo: "Fresh Start" 25% off first booking
- Packages: 4 tiers from $45 (Quick Refresh) to $2000 (Ceramic Coating) — Model 3/Y Kit removed

## Model Handoff Notes
- 2026-02-23 (Opus 4): Promo system is code-complete but needs PROMO_ENABLED=true in Vercel. Stripe checkout endpoint exists but is not wired to UI — BookingModal submits to /api/bookings/create (unpaid bookings). Phone normalization was inconsistent (now fixed with shared normalizer). npm install has NOT been run on this machine.
