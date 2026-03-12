# Mr. Guy Mobile Detail - Action Plan

**Project:** mrguydetail.com  
**Type:** SvelteKit + Drizzle ORM + `postgres.js` + Stripe + Twilio Verify + custom admin auth  
**Status:** 🟢 Production live; ops-agent rollout in progress  
**Last Updated:** 2026-03-10

---

## Current Priorities

1. **Operationalize the bounded ops agent**
   - Keep the read-only digest flow healthy
   - Reauthorize Google once for Gmail, GA4, and Search Console readonly scopes
   - Install or verify the optional daily `launchd` schedule on machines that should run it
2. **Protect payment and booking reliability**
   - Watch the live Stripe payment-link flow for regressions
   - Keep the canonical-host redirect and production smoke checks green
   - Surface stale pending bookings and urgent customer issues quickly
3. **Turn monitoring into clear daily action**
   - Use `output/ops/latest-digest.md` as the single daily brief
   - Send alert emails only for high-severity failures

---

## Recently Completed

- [x] Mobile-first Stripe payment collection for existing bookings
- [x] Canonical-host redirect, smoke guard, and cache hardening
- [x] Inline delete controls on the admin bookings calendar
- [x] MrGuy ops agent foundation (`.claude/agents/mrguy-ops-agent.md`, spec, scripts, digest, and scheduler installer)
- [x] Admin business suite (`/admin/business`) with mileage logging, inventory tracking, and simple bookkeeping

---

## Open Items

- [ ] Reauthorize Google with readonly scopes:
  - `gmail.readonly`
  - `analytics.readonly`
  - `webmasters.readonly`
- [ ] Decide the alert recipient for `MRGUY_OPS_ALERT_TO`
- [ ] Install or verify the local `launchd` schedule where daily automation is wanted
- [ ] Keep monitoring live payment, booking, and reschedule flows
- [ ] Push the updated schema with `npx drizzle-kit push` before using the business suite on a live database

---

## Business Suite Details

- [x] Mileage tracker
  - Tracks business miles, trip purpose, optional odometer readings, notes, and optional booking links
- [x] Supply inventory
  - Tracks items on hand, reorder thresholds, unit cost, stock movements, and purchase spend
- [x] Simple bookkeeping
  - Auto-pulls paid booking revenue and layers in manual expense/tax/owner-draw entries for a cash-basis view

---

## Important Files

- `.claude/context.md`
- `.claude/agents/mrguy-ops-agent.md`
- `.claude/agent-memory/mrguy-ops-agent/MEMORY.md`
- `docs/mrguy-ops-agent-spec.md`
- `scripts/mrguy-ops-digest.mjs`
- `scripts/run-ops-daily.sh`
- `scripts/ops/*.mjs`
- `src/routes/admin/business/+page.server.ts`
- `src/routes/admin/business/+page.svelte`
- `src/lib/repositories/businessRepo.ts`
- `src/lib/server/brand.ts`
- `src/routes/admin/bookings/[id]/+page.server.ts`
- `src/routes/api/payments/webhook/+server.ts`

---

## Quick Commands

```bash
cd ~/Projects/loving-art/mrguy/web/mrguy-sveltekit
npm run check
npm run build
npm test
npm run ops:smoke
npm run ops:digest
```
