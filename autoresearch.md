# Autoresearch Brief
<!-- AUTORESEARCH_STANDARD_VERSION: 1 -->

## Project

- Name: MrGuy
- Summary: Operations and booking system for MrGuy Mobile Detail.
- Stack: SvelteKit + Drizzle + postgres.js + custom auth

## Key Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `not configured`
- Type check: `npm run check`
- Test: `npm test`

## Objective

Protect the booking funnel and operator workflows so the business can keep converting leads and running day-to-day without surprises.

## Primary Metric

- `CHECK booking_flow_passed=true` on the public scheduling path
- `CHECK ops_daily_passed=true` for the core business/ops scripts

## Current Workstream

- Owner: Abdias
- Status: Standing brief
- Trigger / ticket: Booking reliability and operations leverage after payroll and payout work shipped
- Baseline date: 2026-04-16

## Scope

- In bounds: Public booking, ops scripts, admin/business views, and business-health calculations.
- Out of bounds: Nice-to-have UI flourishes that do not improve bookings or operator leverage.

## Known Regressions / Constraints

- Production booking must stay stable; test the real flow before broad edits.
- Prefer operational leverage (`ops:*` scripts, daily digest, smoke checks) over more dashboards.
- Keep the app simple enough for one-operator use.

## Candidate Experiments

1. Keep a reliable booking smoke test in the loop before changes land.
2. Find the next manual ops task that can move into a daily script or digest.
3. Validate domain/canonical/production readiness with the existing ops and smoke scripts.

## Proof Runner

- `./autoresearch.sh` — standard entrypoint
- `./autoresearch.checks.sh` — validation gate
- `./autoresearch.bench.sh` — optional deeper benchmark or probe

## Notes

- The win condition is dependable first-dollar and repeat-ops behavior.
