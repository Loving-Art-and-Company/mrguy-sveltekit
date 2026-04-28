# Cloud Run Portfolio Migration Task List

This is the historical task list for the Cloud Run migration. As of 2026-04-26, MrGuy production Cloud Run cutover is abandoned/deferred. Production stays on Vercel, with Cloudflare planned as the front door.

## Goal

The original goal was to create a centralized but project-need-based Cloud Run platform:

- one shared billing/account structure
- GCP projects grouped by business boundary
- one Cloud Run service per app per environment
- least-privilege IAM per app
- shared deployment pattern through GitHub Actions and Workload Identity Federation
- app-specific secrets, domains, sizing, and smoke tests
- no wrong-project shortcuts

Supporting docs:

- `docs/platform/cloud-run-platform-setup.md`
- `docs/platform/cloud-run-service-matrix.md`
- `docs/platform/mrguy-staging-secrets.md`
- `docs/platform/budgets-and-alerts.md`
- `docs/platform/app-migration-preflight.md`

## Current Position

Decision:

- Do not continue to MrGuy production Cloud Run cutover.
- Keep the proven Cloud Run staging work parked as reference.
- Use `docs/platform/vercel-cloudflare-front-door.md` for the active hosting/front-door plan.

Done:

- `lovingart-staging` GCP project exists for Loving Art / MrGuy / CTD staging.
- `lovingart-staging` is linked to billing account `019AC9-CFD7B1-01184B`.
- `lovingart-prod` GCP project exists as the clean future Loving Art / MrGuy / CTD production target, but the production boundary can also be revisited against existing active LAC/CTD projects before cutover.
- Billing was unlinked from prototype project `silly-farm-studio` to free the staging slot.
- MrGuy repo is container-ready with `@sveltejs/adapter-node`, Dockerfile, health endpoint, and staging workflow.
- Durable setup script exists: `scripts/gcp/setup-cloud-run-platform.sh`.
- Platform setup runbook exists: `docs/platform/cloud-run-platform-setup.md`.
- Service matrix, secret checklist, budget plan, and app migration preflight exist in `docs/platform/`.
- Abandoned temporary resources were removed from `loving-art-and-company-website`.
- MrGuy staging platform resources exist in `lovingart-staging`: APIs, Artifact Registry, deploy/runtime service accounts, scoped GitHub WIF, and Secret Manager containers.
- GitHub environment `staging` exists with Cloud Run deployment variables and WIF secrets.
- MrGuy staging service `mg-detail` is deployed on Cloud Run.
- Staging health, homepage, booking modal, booking availability, reschedule, invalid-admin-login, Stripe test checkout creation, and signed Stripe webhook receipt smoke checks pass at `https://mg-detail-fwrw4xtfsq-ue.a.run.app`.

Parked:

- Full payment/email side-effect smoke needs an interactive Stripe test payment through Checkout.

Not started:

- Email side-effect smoke on Cloud Run staging.

## Phase 0: Account And Billing Foundation

Status: Complete for MrGuy staging.

Tasks:

- Confirm the shared billing account to use for the portfolio: `019AC9-CFD7B1-01184B`.
- Use business-boundary project grouping:
  - Loving Art / MrGuy / CTD: `lovingart-staging` for staging, production boundary decided before cutover.
  - SillyFarm web apps: keep under SillyFarm-owned GCP boundary, starting with existing `silly-farm`.
  - Studio API: only create/move when backend extraction is real.
- Billing slot was freed by unlinking prototype `silly-farm-studio`.
- Do not unlink existing billed projects unless they are audited and explicitly approved.
- Billing is attached to `lovingart-staging`.
- Decide production billing/project boundary only after MrGuy staging proves the Cloud Run pattern.
- If Cloud Run production work is explicitly resumed, add budgets and alerts before cutover.

Billing-linked project audit:

| Project | Current read | Recommendation |
| --- | --- | --- |
| `gemini-cli-490704` | Has enabled AI/BigQuery/Storage APIs plus service accounts and service account keys. No obvious Compute/Storage/Vertex runtime resources were found in the quick audit. | Weakest unlink candidate, but do not unlink without confirming the service accounts/keys are unused. |
| `silly-farm` | Has SillyFarm dashboard service account, service account keys, Secret Manager, and Google Workspace APIs. | Keep linked. |
| `loving-art-and-company-website` | Has multiple service accounts/keys and broad enabled APIs. Temporary MrGuy resources were removed. | Keep linked until separately audited. |
| `carolina-the-doodler-website` | Has live Cloud Run services, Cloud Functions, Firestore, Artifact Registry, Storage buckets, API keys, and service accounts. | Keep linked. |
| `silly-farm-studio` | Has Firebase project resources, Firebase Admin SDK service account, API key, and related Firebase services. Local Studio app code appears to call Gemini directly from app config, and project memory marks Studio paused/prototype. | Plausible unlink candidate, but only with explicit approval because Firebase/GCP features in this prototype project may stop working. |

Quota request justification:

```txt
We are consolidating a portfolio of production web and mobile backend services onto a clean Google Cloud Run platform. We need separate dedicated projects for staging and production (`lovingart-staging` and `lovingart-prod`) under billing account 019AC9-CFD7B1-01184B so IAM, secrets, budgets, and deployment boundaries can be managed safely. Existing linked projects contain active or potentially active production/Firebase/Google API resources and should not be unlinked without risking service disruption. Requested quota: 8 linked projects to allow the current five billed projects plus `lovingart-staging`, `lovingart-prod`, and one spare slot for migration safety.
```

Alternative billing-slot action:

```sh
gcloud billing projects unlink silly-farm-studio
gcloud billing projects link lovingart-staging --billing-account=019AC9-CFD7B1-01184B
```

Only run this if disabling billable Firebase/GCP features in the prototype `silly-farm-studio` project is acceptable.

Exit criteria:

- `lovingart-staging` shows `BILLING_ENABLED=True`. Complete.
- Production project boundary is explicitly confirmed before any production migration.

## Phase 1: Shared Cloud Run Platform In Staging

Status: Complete for MrGuy staging platform.

Tasks:

- Run `npm run gcp:setup:staging` from the MrGuy repo.
- Enable required APIs in `lovingart-staging`.
- Create Artifact Registry repository `cloud-run`.
- Create GitHub deploy service account.
- Create Cloud Run runtime service account for MrGuy.
- Create Workload Identity Federation scoped to `repo:Loving-Art-and-Company/mrguy-sveltekit:environment:staging`.
- Create Secret Manager secret containers with prefix `mg-detail-staging`.
- Grant runtime secret access only to required MrGuy staging secrets.
- Configure GitHub environment `staging` with printed WIF provider and service account values.

Exit criteria:

- Staging project has required APIs enabled.
- Artifact Registry exists.
- Runtime/deploy service accounts exist.
- GitHub Actions can authenticate without JSON keys.
- Secret containers exist, with real staging values populated for database, CSRF, Upstash, Resend, Stripe test API key, and Stripe webhook signing secret.

## Phase 2: MrGuy Staging Migration

Status: First deploy complete; core staging smoke coverage passes. Full interactive payment/email side-effect proof remains pending.

Tasks:

- Add real staging secret values to Secret Manager. Complete for database, CSRF, Upstash, Resend, Stripe test API key, and Stripe webhook signing secret.
- Set GitHub `staging` environment variables and secrets.
- Run the manual `Deploy Cloud Run Staging` workflow. Direct `gcloud builds submit` + `gcloud run deploy` path has been proven.
- Smoke `/api/health`. Complete.
- Smoke `/`. Complete.
- Smoke booking flow. Partial complete: booking modal and availability pass.
- Smoke reschedule flow. Complete.
- Smoke admin login. Complete for route/auth failure path.
- Smoke Stripe webhook behavior with staging/test configuration. Complete for signed webhook receipt; full checkout-completed booking path still pending.
- Keep Stripe environment split explicit: staging uses test-mode keys/webhooks, while production must use live keys/webhooks before cutover.
- Smoke email side effects with staging-safe configuration.
- Record staging service URL and any required custom domain decision. URL recorded; custom domain decision still open.

Exit criteria:

- MrGuy staging deploys from GitHub Actions.
- Health and user-facing smoke tests pass.
- No production traffic is changed.

## Phase 3: MrGuy Production Migration

Status: Abandoned/deferred.

Tasks:

- Do not repeat platform setup in `lovingart-prod` for MrGuy unless the Cloud Run decision is explicitly reversed.
- Do not create or mount production Stripe live secrets in Cloud Run.
- Do not cut over DNS to Cloud Run.
- Keep Vercel as production origin.

Exit criteria:

- Production remains stable on Vercel.
- Cloudflare front-door changes are configured with dynamic route cache bypasses.
- Booking, payment, reschedule, admin login, webhook, and email flows pass after Cloudflare changes.

## Phase 4: Repeat For Other Projects

Status: Pending after MrGuy proves the pattern.

Default order:

1. MrGuy
2. Loving Art
3. CTD
4. SillyFarm CMS
5. SillyFarm Dashboard
6. SillyFarm Pro
7. Studio API if/when backend extraction is ready

Per-project tasks:

- Confirm whether the app is dynamic or static.
- Confirm database and external services.
- Switch SvelteKit apps to `adapter-node` where needed.
- Add Dockerfile and health endpoint.
- Add project-specific setup variables.
- Create one service per app per environment.
- Create app-specific runtime service account.
- Create app-specific secret prefix.
- Add app-specific smoke checklist.
- Deploy staging first.
- Promote production manually only after staging passes.

## Decisions Already Made

- Use Cloud Run for dynamic apps and owned backends.
- Keep Neon for current Postgres databases unless there is a specific reason to move.
- Use GitHub Actions with Workload Identity Federation, not JSON service account keys.
- Use Secret Manager for secrets.
- Use one service per app per environment.
- Keep production deploys manual during migration.
- Do not deploy portfolio apps into `loving-art-and-company-website`.

## Open Decisions

- Whether to use default Cloud Run URLs for staging or assign staging custom domains.
- Final service names for Loving Art and CTD.
- Final migration order after MrGuy proves the pattern.
- Which billed projects, if any, are safe to unlink instead of requesting quota increase.
- Production budget thresholds.

## Immediate Next Actions

1. Complete an interactive Stripe test payment through staging Checkout.
2. Verify the resulting booking creation and email side effects.
3. Decide whether staging needs a custom domain.
4. Re-authenticate GitHub CLI or use the GitHub connector before relying on manual workflow dispatch from this machine.
