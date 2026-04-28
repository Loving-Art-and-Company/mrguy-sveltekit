# Cloud Run Platform Setup

This runbook is historical/parked as of 2026-04-26. MrGuy production remains on Vercel, with Cloudflare planned as the front door. Do not run production Cloud Run setup unless the Cloud Run decision is explicitly reversed.

This is the durable Google Cloud setup path for MrGuy and the broader Loving Art portfolio migration.

For the portfolio-level migration checklist, see `docs/platform/cloud-run-migration-task-list.md`.

## Project Model

- Shared billing account: `019AC9-CFD7B1-01184B`
- Staging project: `lovingart-staging`
- Production project: `lovingart-prod`
- First staging service: `mg-detail`
- Default region: `us-east1`

Use the dedicated environment projects only. Do not deploy portfolio services into `loving-art-and-company-website`.

## Current State

`lovingart-staging` is linked to billing account `019AC9-CFD7B1-01184B`.

The billing slot was freed by unlinking billing from the prototype `silly-farm-studio` project.

The staging platform setup has been run for MrGuy. APIs, Artifact Registry, service accounts, Workload Identity Federation, Secret Manager containers, and GitHub `staging` environment config are in place.

Remaining blocker: add real staging secret values before the first deploy.

Historical fallback if another billing slot is needed later: request a linked-project quota increase for the billing account. Do not unlink billing from existing projects unless they have been audited and explicitly approved for removal.

Use the Google billing quota form:

```txt
https://support.google.com/code/contact/billing_quota_increase
```

Request:

```txt
Billing account: 019AC9-CFD7B1-01184B
Requested linked-project quota: 8

We are consolidating a portfolio of production web and mobile backend services onto a clean Google Cloud Run platform. We need separate dedicated projects for staging and production (`lovingart-staging` and `lovingart-prod`) under billing account 019AC9-CFD7B1-01184B so IAM, secrets, budgets, and deployment boundaries can be managed safely. Existing linked projects contain active or potentially active production/Firebase/Google API resources and should not be unlinked without risking service disruption. Requested quota: 8 linked projects to allow the current five billed projects plus `lovingart-staging`, `lovingart-prod`, and one spare slot for migration safety.
```

## Staging Setup

After billing is linked:

```sh
npm run gcp:setup:staging
```

The setup script is intentionally idempotent. It creates or confirms:

- required Google Cloud APIs
- Artifact Registry repository `cloud-run`
- GitHub deploy service account `github-cloud-run-deployer`
- Cloud Run runtime service account `mg-detail-runner`
- GitHub Workload Identity pool/provider scoped to `Loving-Art-and-Company/mrguy-sveltekit` and GitHub environment `staging`
- Secret Manager secret containers with prefix `mg-detail-staging`
- least-privilege IAM bindings for deploy, runtime, and secret access

The script does not create fake secret versions. Add real staging values after the secret containers exist.

## GitHub Environment

Create or update the GitHub environment `staging`.

Environment variables:

```txt
GCP_PROJECT_ID=lovingart-staging
GCP_REGION=us-east1
CLOUD_RUN_SERVICE=mg-detail
ARTIFACT_REGISTRY_REPOSITORY=cloud-run
IMAGE_NAME=mrguy-sveltekit
SECRET_PREFIX=mg-detail-staging
DB_POOL_MAX=8
PUBLIC_BASE_URL=<staging Cloud Run or custom-domain origin>
CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT=mg-detail-runner@lovingart-staging.iam.gserviceaccount.com
```

Environment secrets:

```txt
GCP_WORKLOAD_IDENTITY_PROVIDER=<printed by npm run gcp:setup:staging>
GCP_SERVICE_ACCOUNT=github-cloud-run-deployer@lovingart-staging.iam.gserviceaccount.com
```

## Production Setup

Do not run production setup until staging has deployed and passed smoke tests.

When ready, use the same script with production-specific inputs:

```sh
PROJECT_ID=lovingart-prod \
ENVIRONMENT=production \
SECRET_PREFIX=mg-detail-prod \
npm run gcp:setup:staging
```

If production Cloud Run work is explicitly resumed before cutover:

- create budgets and billing alerts
- use separate production secret values
- keep production deployment manual
- verify domain mapping, auth/session behavior, booking, payment, reschedule, admin login, Stripe webhook receipt, and email side effects

## Temporary Resource Cleanup

The abandoned fallback resources in `loving-art-and-company-website` have been removed:

- `cloud-run` Artifact Registry repository
- `github-cloud-run-deployer` service account
- `mg-detail-runner` service account
- `github` Workload Identity pool

No Cloud Run service was deployed in that project.
