# MrGuy Cloud Run Staging

This repo was prepared and proven to deploy the MrGuy SvelteKit app to Cloud Run as the `mg-detail` staging service.

As of 2026-04-26, production Cloud Run cutover is abandoned/deferred. Production stays on Vercel, with Cloudflare planned as the front door. Keep this document as a record of the proven staging path and do not resume Cloud Run production work unless that decision is explicitly reversed.

## Current Status

- SvelteKit runtime: `@sveltejs/adapter-node`
- Container entrypoint: `node build`
- Container port: `8080`
- Health endpoint: `/api/health`
- GitHub workflow: `.github/workflows/deploy-cloud-run-staging.yml`
- Planned service name: `mg-detail`
- Planned secret prefix: `mg-detail-staging`
- Current staging URL: `https://mg-detail-fwrw4xtfsq-ue.a.run.app`
- Current deployed revision: `mg-detail-00005-62d`
- Production cutover status: abandoned/deferred; Vercel remains the production origin

## Best-Practice Guardrails

These apply only if Cloud Run work is intentionally resumed.

- Use dedicated environment projects: `lovingart-staging` for staging and `lovingart-prod` for production.
- Do not deploy MrGuy into `loving-art-and-company-website`, even temporarily.
- Do not attach broad owner/editor roles to deploy identities.
- Use one GitHub deploy service account and one Cloud Run runtime service account per environment.
- Scope GitHub Workload Identity Federation to the exact repository and environment/branch that deploys the service.
- Grant the runtime service account access only to the secrets the service actually needs.
- Keep production deploys manual until staging has passed smoke tests.
- Keep prod secrets separate from staging secrets; do not seed staging from production unless explicitly approved.
- Use Stripe test-mode keys and webhooks in staging; use live Stripe keys and live webhooks only in production.
- Add budgets/alerts before any future production Cloud Run cutover.
- Treat billing quota resolution as a platform prerequisite, not a reason to use the wrong project.

## Required GCP Setup

Use the staging project from the portfolio plan: `lovingart-staging`.

Current GCP state:

- `lovingart-staging` exists and is labeled for the LAC Cloud Run staging environment.
- `lovingart-prod` exists and is labeled for the LAC Cloud Run production environment, but it is not the active MrGuy production target.
- Billing is linked to `lovingart-staging`.
- The staging platform setup has been run: required APIs, Artifact Registry, service accounts, Workload Identity Federation, and Secret Manager containers exist.
- First-deploy staging secret values exist for database, CSRF, Upstash, Resend, Stripe test API key, and Stripe webhook signing secret.
- Stripe test webhook endpoint: `we_1TQUDV37LTMPLSRCa7c5Rfes` for `https://mg-detail-fwrw4xtfsq-ue.a.run.app/api/payments/webhook`.
- Stripe checkout creation is proven in staging with a `cs_test_...` session, and invalid package requests return HTTP 400.
- The remaining payment proof is an interactive Stripe test payment through Checkout to verify booking creation and email side effects end-to-end.
- Direct Cloud Build deploys required narrow IAM additions for the default build worker:
  - bucket-scoped `roles/storage.objectViewer` on `gs://lovingart-staging_cloudbuild`
  - repository-scoped `roles/artifactregistry.writer` on Artifact Registry repo `cloud-run`
- Do not use `loving-art-and-company-website` as the final MrGuy Cloud Run target. It was only evaluated as a temporary fallback and should be avoided for the clean setup.

If infrastructure needs to be repaired, prefer the idempotent setup script:

```sh
npm run gcp:setup:staging
```

The manual commands below document what the script creates and can be used for inspection or recovery.

Enable the required APIs:

```sh
gcloud config set project lovingart-staging
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  cloudresourcemanager.googleapis.com \
  cloudbuild.googleapis.com
```

Create the Artifact Registry repository:

```sh
gcloud artifacts repositories create cloud-run \
  --repository-format=docker \
  --location=us-east1 \
  --description="Cloud Run container images"
```

Create or confirm these Secret Manager secrets. The GitHub workflow expects this naming pattern:

```txt
mg-detail-staging-DATABASE_URL
mg-detail-staging-CSRF_SECRET
mg-detail-staging-UPSTASH_REDIS_REST_URL
mg-detail-staging-UPSTASH_REDIS_REST_TOKEN
mg-detail-staging-RESEND_API_KEY
mg-detail-staging-STRIPE_SECRET_KEY
mg-detail-staging-STRIPE_WEBHOOK_SECRET
```

Optional integration secrets can be added to the Cloud Run service after the first deploy:

```txt
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_SHARED_DRIVE_ID
GOOGLE_ANALYTICS_PROPERTY_ID
GOOGLE_SEARCH_CONSOLE_SITE_URL
LEAD_SINK_WEBHOOK_URL
LEAD_SINK_WEBHOOK_SECRET
LEAD_SINK_SPREADSHEET_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
POSTHOG_PROJECT_ID
POSTHOG_PERSONAL_API_KEY
```

## Required GitHub Environment

Create a GitHub environment named `staging`.

Environment variables:

```txt
GCP_PROJECT_ID=lovingart-staging
GCP_REGION=us-east1
CLOUD_RUN_SERVICE=mg-detail
ARTIFACT_REGISTRY_REPOSITORY=cloud-run
IMAGE_NAME=mrguy-sveltekit
SECRET_PREFIX=mg-detail-staging
DB_POOL_MAX=8
PUBLIC_BASE_URL=<staging origin>
CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT=mg-detail-runner@lovingart-staging.iam.gserviceaccount.com
```

Environment secrets:

```txt
GCP_WORKLOAD_IDENTITY_PROVIDER=<projects/.../providers/...>
GCP_SERVICE_ACCOUNT=<deploy service account email>
```

The deploy service account needs permission to push Artifact Registry images, deploy Cloud Run revisions, and read the listed Secret Manager secrets.

## Deploy

Run the manual GitHub Actions workflow:

```txt
Deploy Cloud Run Staging
```

The workflow installs dependencies, runs type-checks, runs unit tests, builds the adapter-node app, builds/pushes the Docker image, verifies required Secret Manager versions, deploys Cloud Run with the required database, CSRF, Upstash, and Resend secrets, and smokes `/api/health` plus `/`.

Stripe secrets are mounted automatically when enabled versions exist. `STRIPE_WEBHOOK_SECRET` is intentionally added after the first service URL exists, because the Stripe webhook endpoint must be bound to the staging Cloud Run webhook URL.

## Post-Deploy Smoke

After staging deploys, verify:

```sh
curl -fsS "$STAGING_URL/api/health"
curl -fsSI "$STAGING_URL/"
BASE_URL="$STAGING_URL" npm run ops:smoke
```

If production Cloud Run work is ever resumed, also verify booking, reschedule, admin login, Stripe webhook receipt, and email side effects against staging before cutover.
