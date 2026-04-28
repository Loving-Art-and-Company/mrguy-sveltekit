#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-lovingart-staging}"
ENVIRONMENT="${ENVIRONMENT:-staging}"
REGION="${REGION:-us-east1}"
REPOSITORY="${REPOSITORY:-cloud-run}"
SERVICE_NAME="${SERVICE_NAME:-mg-detail}"
SECRET_PREFIX="${SECRET_PREFIX:-mg-detail-staging}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-Loving-Art-and-Company/mrguy-sveltekit}"
WIF_POOL_ID="${WIF_POOL_ID:-github}"
WIF_PROVIDER_ID="${WIF_PROVIDER_ID:-github-actions}"
DEPLOYER_SA_ID="${DEPLOYER_SA_ID:-github-cloud-run-deployer}"
RUNTIME_SA_ID="${RUNTIME_SA_ID:-mg-detail-runner}"

DEPLOYER_SA="${DEPLOYER_SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
RUNTIME_SA="${RUNTIME_SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"

required_secrets=(
  DATABASE_URL
  CSRF_SECRET
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
  RESEND_API_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
)

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

ensure_billing_enabled() {
  local billing_enabled
  billing_enabled="$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)' 2>/dev/null || true)"
  if [[ "$billing_enabled" != "True" ]]; then
    echo "Billing is not enabled for project ${PROJECT_ID}." >&2
    echo "Link billing before running platform setup:" >&2
    echo "  gcloud billing projects link ${PROJECT_ID} --billing-account=<BILLING_ACCOUNT_ID>" >&2
    exit 1
  fi
}

enable_services() {
  gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    iam.googleapis.com \
    iamcredentials.googleapis.com \
    sts.googleapis.com \
    cloudresourcemanager.googleapis.com \
    cloudbuild.googleapis.com \
    --project="$PROJECT_ID"
}

ensure_artifact_registry() {
  if gcloud artifacts repositories describe "$REPOSITORY" \
    --project="$PROJECT_ID" \
    --location="$REGION" >/dev/null 2>&1; then
    echo "Artifact Registry repository exists: ${REPOSITORY}"
    return
  fi

  gcloud artifacts repositories create "$REPOSITORY" \
    --project="$PROJECT_ID" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Cloud Run container images"
}

ensure_service_account() {
  local account_id="$1"
  local email="${account_id}@${PROJECT_ID}.iam.gserviceaccount.com"
  local display_name="$2"

  if gcloud iam service-accounts describe "$email" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "Service account exists: ${email}"
    return
  fi

  gcloud iam service-accounts create "$account_id" \
    --project="$PROJECT_ID" \
    --display-name="$display_name"
}

ensure_secret() {
  local secret_name="$1"

  if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "Secret exists: ${secret_name}"
  else
    gcloud secrets create "$secret_name" \
      --project="$PROJECT_ID" \
      --replication-policy=automatic
  fi

  gcloud secrets add-iam-policy-binding "$secret_name" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role='roles/secretmanager.secretAccessor' >/dev/null
}

ensure_workload_identity() {
  local pool_resource
  local provider_resource
  pool_resource="projects/$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')/locations/global/workloadIdentityPools/${WIF_POOL_ID}"
  provider_resource="${pool_resource}/providers/${WIF_PROVIDER_ID}"

  if ! gcloud iam workload-identity-pools describe "$WIF_POOL_ID" \
    --project="$PROJECT_ID" \
    --location=global >/dev/null 2>&1; then
    gcloud iam workload-identity-pools create "$WIF_POOL_ID" \
      --project="$PROJECT_ID" \
      --location=global \
      --display-name='GitHub Actions'
  fi

  if ! gcloud iam workload-identity-pools providers describe "$WIF_PROVIDER_ID" \
    --project="$PROJECT_ID" \
    --location=global \
    --workload-identity-pool="$WIF_POOL_ID" >/dev/null 2>&1; then
    gcloud iam workload-identity-pools providers create-oidc "$WIF_PROVIDER_ID" \
      --project="$PROJECT_ID" \
      --location=global \
      --workload-identity-pool="$WIF_POOL_ID" \
      --display-name='GitHub Actions OIDC' \
      --issuer-uri='https://token.actions.githubusercontent.com' \
      --attribute-mapping='google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref,attribute.workflow=assertion.workflow,attribute.environment=assertion.environment' \
      --attribute-condition="assertion.sub == 'repo:${GITHUB_REPOSITORY}:environment:${ENVIRONMENT}'"
  fi

  gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" \
    --project="$PROJECT_ID" \
    --role='roles/iam.workloadIdentityUser' \
    --member="principalSet://iam.googleapis.com/${pool_resource}/attribute.repository/${GITHUB_REPOSITORY}" >/dev/null

  echo "GCP_WORKLOAD_IDENTITY_PROVIDER=${provider_resource}"
}

grant_project_role() {
  local member="$1"
  local role="$2"

  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="$member" \
    --role="$role" \
    --condition=None >/dev/null
}

main() {
  require_command gcloud
  ensure_billing_enabled
  enable_services
  ensure_artifact_registry

  ensure_service_account "$DEPLOYER_SA_ID" 'GitHub Cloud Run Deployer'
  ensure_service_account "$RUNTIME_SA_ID" 'MrGuy Cloud Run Runtime'

  grant_project_role "serviceAccount:${DEPLOYER_SA}" 'roles/run.admin'
  grant_project_role "serviceAccount:${DEPLOYER_SA}" 'roles/artifactregistry.writer'

  gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:${DEPLOYER_SA}" \
    --role='roles/iam.serviceAccountUser' >/dev/null

  for key in "${required_secrets[@]}"; do
    ensure_secret "${SECRET_PREFIX}-${key}"
  done

  ensure_workload_identity

  echo "GCP_PROJECT_ID=${PROJECT_ID}"
  echo "GCP_REGION=${REGION}"
  echo "CLOUD_RUN_SERVICE=${SERVICE_NAME}"
  echo "ARTIFACT_REGISTRY_REPOSITORY=${REPOSITORY}"
  echo "SECRET_PREFIX=${SECRET_PREFIX}"
  echo "GCP_SERVICE_ACCOUNT=${DEPLOYER_SA}"
  echo "CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT=${RUNTIME_SA}"
  echo "Secret resources were created if missing, but secret versions still need real staging values."
}

main "$@"
