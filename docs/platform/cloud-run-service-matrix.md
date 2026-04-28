# Cloud Run Service Matrix

This matrix is historical/parked as of 2026-04-26. MrGuy production remains on Vercel, with Cloudflare planned as the front door. Use this matrix only if Cloud Run work is explicitly resumed.

This matrix keeps the portfolio centralized while preserving project-specific runtime needs and business boundaries.

## Shared Defaults

- Loving Art / MrGuy / CTD staging project: `lovingart-staging`
- Loving Art / MrGuy / CTD production boundary: decide before cutover; `lovingart-prod` exists as the clean target, but existing active LAC/CTD projects must be considered before production migration.
- SillyFarm boundary: keep SillyFarm apps under SillyFarm-owned projects, starting with existing `silly-farm`.
- Region: `us-east1`
- Artifact Registry repository: `cloud-run`
- Deploy model: GitHub Actions + Workload Identity Federation
- Runtime model: one Cloud Run runtime service account per app per environment
- Secrets: Secret Manager, prefixed by service and environment
- Production deploys: manual promotion only
- Database default: keep Neon unless a project has a strong reason to move

## Services

| App | Type | Staging service | Production service | Secret prefix | Runtime default | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| MrGuy | Dynamic SvelteKit web app | `mg-detail` | `mg-detail` | `mg-detail-staging` / `mg-detail-prod` | 1 vCPU, 512MiB-1GiB, concurrency 10 | First proving app for the LAC Cloud Run pattern. |
| Loving Art | Dynamic/static TBD | `lac-web` | `lac-web` | `lac-web-staging` / `lac-web-prod` | TBD after repo audit | Confirm whether fully static hosting is sufficient before Cloud Run. |
| CTD | Existing GCP/Cloud Run-backed web presence | `ctd-web` | `ctd-web` | `ctd-web-staging` / `ctd-web-prod` | TBD after current Cloud Run audit | Existing `carolina-the-doodler-website` has live Cloud Run/Functions/Firestore resources; migrate carefully. |
| SillyFarm CMS | Dynamic SvelteKit web app | `sf-cms` | `sf-cms` | `sf-cms-staging` / `sf-cms-prod` | 1 vCPU, 512MiB, concurrency 10 | Keep under SillyFarm project boundary, not Loving Art. |
| SillyFarm Dashboard | Internal dynamic SvelteKit app | `sf-dashboard` | `sf-dashboard` | `sf-dashboard-staging` / `sf-dashboard-prod` | 1 vCPU, 1GiB, concurrency 8 | Keep under SillyFarm project boundary; Shopify, Google, cron, and webhooks make this operationally more complex. |
| SillyFarm Pro | Public dynamic SvelteKit app | `sf-pro` | `sf-pro` | `sf-pro-staging` / `sf-pro-prod` | 1 vCPU, 1GiB, concurrency 10 | Keep under SillyFarm project boundary; highest external risk due to booking/auth/email flows. |
| Studio API | Mobile backend API | `sf-studio-api` | `sf-studio-api` | `sf-studio-api-staging` / `sf-studio-api-prod` | 1 vCPU, 512MiB, concurrency 20 | Only needed when Gemini/provider calls move behind owned backend; current `silly-farm-studio` project is prototype/Firebase and may be unlinked if approved. |

## Naming Rules

- Cloud Run service names are stable across staging and production.
- Environment boundary is the GCP project, not the service name.
- Secret prefixes must include the environment.
- Runtime service account format: `<service>-runner@<project>.iam.gserviceaccount.com`.
- GitHub deploy service account can be shared per environment if WIF conditions stay repo/environment-scoped.

## Promotion Rule

Do not promote any app to production until:

- staging deploys from GitHub Actions
- app-specific smoke tests pass
- secrets are separated from production values
- budget/alerting exists for production
- rollback path is documented
