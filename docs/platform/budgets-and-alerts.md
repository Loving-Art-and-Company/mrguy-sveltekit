# Cloud Run Budgets And Alerts

This budget plan is historical/parked as of 2026-04-26. MrGuy production remains on Vercel, so these Cloud Run production budget items only apply if Cloud Run work is explicitly resumed.

Budgets are required before any future Cloud Run production cutover. Staging can be low-cost, but it still needs guardrails because Cloud Run, logs, Artifact Registry, and external services can all create spend.

## Budget Model

Use one billing account budget with project filters at minimum:

- `lovingart-staging`
- `lovingart-prod`

If Google Cloud budget filters are not granular enough for the desired view, add labels and billing export later. Do not block the first staging deploy on a perfect cost dashboard.

## Initial Thresholds

Staging:

- Monthly budget: `$25`
- Alert thresholds: `50%`, `90%`, `100%`
- Purpose: catch runaway deploy loops, excessive logs, or accidental traffic.

Production:

- Monthly budget: `$100` initial portfolio cap
- Alert thresholds: `50%`, `75%`, `90%`, `100%`
- Purpose: catch cost spikes during migration while traffic is still being validated.

Adjust after one billing cycle with real usage data.

## Required Before Future Cloud Run Production

- Billing is linked to `lovingart-prod`.
- Budget exists for `lovingart-prod`.
- Alerts route to an actively monitored email.
- Cloud Run max instances are capped per app.
- Logging volume is checked after staging soak.
- Artifact Registry cleanup policy is considered after deploy cadence is known.

## Cost Controls Per Service

MrGuy initial Cloud Run production defaults:

- Min instances: `0` until cold starts are proven unacceptable.
- Max instances: `3` during first cutover.
- Concurrency: `10`.
- CPU/memory: start at `1 vCPU`, `512MiB`; raise to `1GiB` only if memory pressure appears.

Staging defaults:

- Min instances: `0`.
- Max instances: `2`.
- Concurrency: `10`.

## Follow-Up

After the first successful staging deploy:

- Check Cloud Run request count and latency.
- Check log volume.
- Check Artifact Registry image storage.
- Check external service side effects: Neon, Upstash, Stripe, and Resend.
- Adjust max instances before any future production cutover.
