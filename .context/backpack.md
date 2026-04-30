# Backpack

## Authority

This file is the current-state source of truth for this repo.
If this file conflicts with legacy `.claude/` context or `CLAUDE.md`, trust this file for active implementation status and next actions.

## 3-Sentence Status

MrGuy is live in production as a mobile-detailing booking platform with growing admin and business-management capabilities. The current emphasis is operational reliability: booking flow, post-service payment collection, and light-weight business tooling that helps prove the broader white-label service-business stack. The repo has older architecture docs, but active work should stay grounded in current production behavior and this file.

## Current Focus

- Keep booking, payment, and reschedule flows reliable in production
- Stay on Vercel for production hosting and place Cloudflare in front deliberately
- Support the `/admin/business` suite without adding unnecessary complexity
- Preserve the platform thesis while prioritizing the current tenant's real operational needs

## Key Current Truths

- Post-service Stripe Checkout payment collection is live
- Canonical-host, smoke-guard, and cache-hardening fixes are already shipped
- Cloud Run production migration is abandoned/deferred as of 2026-04-26; keep Vercel as the production origin
- Cloudflare front-door planning now lives in `docs/platform/vercel-cloudflare-front-door.md`
- Cloud Run runtime prep has started: the app now builds with `@sveltejs/adapter-node`, has a Dockerfile, applies former Vercel security headers in `src/hooks.server.ts`, and has a manual staging workflow at `.github/workflows/deploy-cloud-run-staging.yml`
- Dedicated GCP projects now exist for the clean portfolio shape: `lovingart-staging` and `lovingart-prod`
- Billing is attached to `lovingart-staging`; `lovingart-prod` is not linked yet
- Do not continue the abandoned temporary deploy path in `loving-art-and-company-website`; its temporary MrGuy Artifact Registry, service accounts, and WIF pool were removed
- Best-practice constraint is explicit: no wrong-project deploys, no broad IAM shortcuts, no mixed staging/prod secrets, no auto-prod deploys during migration, and no billing unlinking without an audit
- Cloud Run platform setup is codified in `scripts/gcp/setup-cloud-run-platform.sh` and documented in `docs/platform/cloud-run-platform-setup.md`; the setup script refuses to run until billing is attached
- Portfolio migration status and the working task list live in `docs/platform/cloud-run-migration-task-list.md`
- Supporting diligence docs now cover the service matrix, MrGuy staging secrets, budgets/alerts, and app migration preflight under `docs/platform/`
- Project grouping was revised to business boundaries: Loving Art / MrGuy / CTD under the Loving Art boundary, SillyFarm apps under the SillyFarm boundary; `silly-farm-studio` is a possible billing-slot candidate only if disabling its prototype Firebase/GCP billing is acceptable
- Billing was unlinked from prototype `silly-farm-studio` and linked to `lovingart-staging`
- MrGuy staging platform setup completed in `lovingart-staging`
- MrGuy staging was deployed on Cloud Run as `mg-detail`; current canonical staging URL is `https://mg-detail-fwrw4xtfsq-ue.a.run.app`
- Current staging revision is `mg-detail-00005-62d`
- Staging health, homepage, booking modal, booking availability, reschedule, invalid-admin-login, Stripe test checkout creation, invalid-checkout 400 handling, and signed Stripe webhook receipt smoke checks pass against Cloud Run
- First-deploy staging secrets are populated for database, CSRF, Upstash, Resend, Stripe test API key, and Stripe webhook signing secret
- Stripe environment split is explicit: staging/test uses Stripe test-mode keys/webhooks, while production uses live Stripe keys/webhooks on Vercel
- Cloud Build direct deploy path needed two narrow IAM fixes for the default build worker: bucket-scoped `roles/storage.objectViewer` on `gs://lovingart-staging_cloudbuild` and repository-scoped `roles/artifactregistry.writer` on Artifact Registry repo `cloud-run`
- The unused text-message provider path was never implemented and has been removed from code, docs, environment declarations, Cloud Run secret setup, and staging Secret Manager containers
- The admin business suite exists for mileage, inventory, and simple bookkeeping
- Google-connected readonly ops scripts may remain degraded until scopes are reauthorized
- 2026-04-26 proof sprint: the public booking modal now asks for the customer's vehicle before submission, stores it in booking notes, and no longer marks booking leads as missing vehicle details. This closes a real owner follow-up leak before using MrGuy as audit proof.
- 2026-04-30 booking migration reconciliation: `web/mrguy-sveltekit` is the production source of truth for booking create, checkout, and Stripe webhook behavior. The old `web/mrguy-sveltekit-backoffice-suite` booking/payment endpoints are fenced with `410 Gone` responses and should not receive future booking-funnel fixes.
- 2026-04-30 ops reliability: a guarded production booking canary now exists at `npm run ops:booking-canary` and can be included in `npm run ops:daily` with `RUN_PROD_BOOKING_CANARY=1`. It requires `MRGUY_BOOKING_CANARY_SUBMIT=1` plus `BOOKING_CANARY_SECRET`, creates one clearly tagged synthetic booking, and writes proof artifacts under `output/ops/`.

## Active Next Options

- A: Configure Cloudflare in front of the existing Vercel production origin with cache bypasses for dynamic/payment/admin routes
- B: Keep Cloud Run staging resources parked until cleanup is explicitly approved
- C: Monitor booking, payment, and reschedule health in production while Cloudflare changes roll out
- D: If Cloudflare proxying causes Vercel firewall, bot, cache, or latency issues, fall back to Cloudflare DNS-only
- E: Continue the CTD/MrGuy proof loop by finding the next measurable booking or quote leak, fixing it, and capturing before/after proof for Loving Art outreach
- F: Keep future booking-funnel fixes scoped to `web/mrguy-sveltekit`; use backoffice-suite only as historical reference unless a new migration plan explicitly reactivates it

## Notes

- Use `AGENTS.md` for repo law and `autoresearch.md` for proof constraints.
- Treat legacy `.claude/` files and `CLAUDE.md` as supporting references during migration, not as startup authority.
