# App Migration Preflight

Use this checklist before moving any app to Cloud Run.

## 1. App Classification

- Is the app fully static?
- Does it have server-side rendering?
- Does it have auth?
- Does it have API routes?
- Does it use a database?
- Does it receive webhooks?
- Does it run cron/scheduled jobs?
- Does it hold provider secrets?

Decision:

- Fully static only: consider static hosting/CDN.
- Any dynamic/server/backend need: use Cloud Run.
- Native mobile app: Cloud Run only for owned backend/API surfaces.

## 2. Runtime Readiness

For SvelteKit apps:

- Use `@sveltejs/adapter-node`.
- Confirm `node build` starts the app.
- App listens on `HOST=0.0.0.0`.
- App listens on Cloud Run `PORT`.
- Dockerfile exists.
- `.dockerignore` exists.
- Health endpoint exists.
- Build passes.
- Type-check passes.
- Unit tests pass.

## 3. Provider Assumption Cleanup

- Remove Vercel-only adapters.
- Remove Vercel-only cron config.
- Move security headers into app code or Cloud Run-compatible config.
- Replace provider env detection with explicit env vars.
- Make DB pool sizing explicit.
- Confirm base URL/origin values are explicit.

## 4. Secrets

- Create staging secret prefix.
- Create production secret prefix.
- Separate staging values from production values.
- Store values in Secret Manager.
- Grant runtime service account access only to required secrets.
- Do not expose secret values in GitHub Actions variables, logs, commits, docs, or chat.

## 5. IAM

- One deploy identity per environment or repo/environment boundary.
- One runtime identity per app per environment.
- GitHub OIDC condition includes repository and environment.
- No service account JSON keys.
- No project Owner/Editor role for deploy identities.
- Runtime service account has only required permissions.

## 6. Networking And Domains

- Decide whether staging uses default Cloud Run URL or custom staging domain.
- Preserve production hostname where possible.
- Validate OAuth callback URLs before cutover.
- Validate webhook endpoint URLs before cutover.
- Keep previous host rollback path available until post-cutover smoke passes.

## 7. Scheduling

- Replace Vercel cron with Cloud Scheduler.
- Keep cron endpoint auth in place.
- Start schedulers paused.
- Unpause only after production service is live and smoke-tested.

## 8. Smoke Tests

Every app:

- Health endpoint.
- Home/app shell.
- Login/logout if applicable.
- Primary write path if applicable.
- Primary webhook path if applicable.
- Cron endpoint if applicable.
- Error reporting check.

MrGuy:

- Booking submit.
- Reschedule.
- Admin login.
- Stripe webhook.
- Email side effect.

## 9. Rollback

- Previous host remains available.
- DNS rollback path is documented.
- Scheduler can be paused.
- Webhook endpoints can be repointed.
- Production smoke has a clear pass/fail window.

## 10. Promotion Gate

Do not promote to production until:

- Staging deploy is from GitHub Actions.
- Staging smoke passes.
- Staging soaks without elevated errors.
- Production secrets are ready.
- Production budget exists.
- Rollback path is ready.
