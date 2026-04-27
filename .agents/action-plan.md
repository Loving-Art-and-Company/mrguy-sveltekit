# Mr. Guy Mobile Detail - Action Plan

**Project:** mrguydetail.com  
**Type:** SvelteKit + Drizzle ORM + `postgres.js` + Stripe + email OTP + custom admin auth
**Status:** 🟢 Production live; ops-agent rollout in progress  
**Last Updated:** 2026-04-26

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
- [x] MrGuy ops agent foundation (`.agents/agents/mrguy-ops-agent.md`, spec, scripts, digest, and scheduler installer)
- [x] Project guidance consolidated in `AGENTS.md`; legacy assistant-specific docs renamed under `.agents/`

---

## Open Items

- [ ] Reauthorize Google with readonly scopes:
  - `gmail.readonly`
  - `analytics.readonly`
  - `webmasters.readonly`
- [ ] Decide the alert recipient for `MRGUY_OPS_ALERT_TO`
- [ ] Install or verify the local `launchd` schedule where daily automation is wanted
- [ ] Keep monitoring live payment, booking, and reschedule flows

---

## Requested Feature Backlog

- [ ] Phase 1 — Mileage tracker
  - Track business miles for tax and reimbursement records
  - Keep the MVP narrow: date, trip purpose, miles/odometer, and job/customer link
  - Rationale: this is the most time-sensitive data and the hardest to reconstruct later
- [ ] Phase 2 — Supply inventory system
  - Track supplies on hand
  - Track supply costs / cost of goods
  - Rationale: creates clean cost inputs and margin visibility before finance reporting
- [ ] Phase 3 — Simple bookkeeping
  - Automate basic taxes support
  - Generate simple P&L visibility
  - Cover core business-finance fundamentals
  - Rationale: bookkeeping should sit on top of clean mileage and cost data, not guesses

### Build Order Principle

Capture the data that disappears first, then build cost visibility, then build reporting on top of clean inputs.

---

## Important Files

- `.agents/context.md`
- `.agents/agents/mrguy-ops-agent.md`
- `.agents/agent-memory/mrguy-ops-agent/MEMORY.md`
- `docs/mrguy-ops-agent-spec.md`
- `scripts/mrguy-ops-digest.mjs`
- `scripts/run-ops-daily.sh`
- `scripts/ops/*.mjs`
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
