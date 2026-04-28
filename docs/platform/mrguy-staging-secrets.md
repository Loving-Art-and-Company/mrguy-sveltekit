# MrGuy Staging Secret Checklist

This checklist is historical/parked as of 2026-04-26. MrGuy production stays on Vercel, and production live Stripe secrets must remain in Vercel unless Cloud Run work is explicitly resumed.

This checklist defines the staging secrets needed before the first MrGuy Cloud Run deployment.

Do not paste secret values into docs, commits, chat, or GitHub Actions logs.

## Required For First Infrastructure Deploy

Secret prefix: `mg-detail-staging`

| Secret | Required | Source | Notes |
| --- | --- | --- | --- |
| `mg-detail-staging-DATABASE_URL` | Yes | Neon staging database | Prefer a separate Neon branch/database from production. |
| `mg-detail-staging-CSRF_SECRET` | Yes | Generated random value | Created in Secret Manager. |
| `mg-detail-staging-UPSTASH_REDIS_REST_URL` | Yes | Upstash staging database | Do not reuse prod rate-limit state. |
| `mg-detail-staging-UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash staging token | Pair with staging Redis URL. |
| `mg-detail-staging-RESEND_API_KEY` | Yes | Resend test/staging key if available | Use safe sender/domain behavior for staging. |

## Required Before Payment Smoke

| Secret | Required | Source | Notes |
| --- | --- | --- | --- |
| `mg-detail-staging-STRIPE_SECRET_KEY` | Yes | Stripe test mode | Needed for checkout creation. Never use a live Stripe key in staging. |
| `mg-detail-staging-STRIPE_WEBHOOK_SECRET` | Yes | Stripe test webhook endpoint | Must match the staging Cloud Run webhook URL. |

Production must use separate live-mode Stripe API and webhook secrets on Vercel. Do not promote the staging test-mode Stripe secrets to production, and do not mount live Stripe secrets in Cloud Run unless Cloud Run work is explicitly resumed.

## Optional After First Deploy

Add only when the feature path is included in staging smoke tests:

| Secret | Trigger |
| --- | --- |
| `mg-detail-staging-GOOGLE_CLIENT_ID` | Google OAuth/admin login staging test |
| `mg-detail-staging-GOOGLE_CLIENT_SECRET` | Google OAuth/admin login staging test |
| `mg-detail-staging-GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google workspace server-to-server integration |
| `mg-detail-staging-GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Google workspace server-to-server integration |
| `mg-detail-staging-LEAD_SINK_WEBHOOK_URL` | Lead sink staging test |
| `mg-detail-staging-LEAD_SINK_WEBHOOK_SECRET` | Lead sink staging test |
| `mg-detail-staging-POSTHOG_PERSONAL_API_KEY` | Analytics/admin reporting staging test |

## Safe Value Creation

Generate a CSRF secret locally:

```sh
openssl rand -base64 48
```

Add a secret version without printing the value:

```sh
printf '%s' '<secret-value>' | gcloud secrets versions add mg-detail-staging-CSRF_SECRET \
  --project=lovingart-staging \
  --data-file=-
```

## Rules

- Staging secrets must be separate from production unless explicitly approved.
- Secret containers can be created by automation; secret values must be supplied deliberately.
- Runtime service accounts get `secretAccessor`; deploy service accounts do not need to read secret values.
- Rotate any secret that was pasted into chat, logs, shell history, or committed files.

## Current Status

Created:

- Secret containers for all required first-deploy keys.
- Secret version for `mg-detail-staging-CSRF_SECRET`.
- Secret versions for `mg-detail-staging-DATABASE_URL`, `mg-detail-staging-UPSTASH_REDIS_REST_URL`, `mg-detail-staging-UPSTASH_REDIS_REST_TOKEN`, and `mg-detail-staging-RESEND_API_KEY` were populated from approved local values on 2026-04-26.
- Secret version for `mg-detail-staging-STRIPE_SECRET_KEY` was populated from the approved Stripe CLI test-mode API key on 2026-04-26.
- Secret version for `mg-detail-staging-STRIPE_WEBHOOK_SECRET` was populated from Stripe test webhook endpoint `we_1TQUDV37LTMPLSRCa7c5Rfes` on 2026-04-26.

Still needed for first infrastructure deploy:

- None.

Still needed before payment smoke:

- None for non-interactive smoke.

Parked items if Cloud Run production work is explicitly resumed:

- Complete an interactive Stripe test payment through staging Checkout and verify booking/email side effects.
