# Architecture Decisions

This is the neutral decisions file for the repo.
The legacy `.claude/decisions.md` file can remain as a mirror during migration, but new references should point here.

## 2026-01-21 - SvelteKit Over React
**Context:** Porting from an existing React version
**Decision:** Use SvelteKit 2.x with Svelte 5 runes
**Rationale:** Simpler reactivity, smaller bundles, built-in SSR, cleaner long-term codebase
**Consequences:** Team must learn Svelte patterns
**Status:** Active

## 2026-01-21 - Stripe Checkout Redirect
**Context:** Need secure payment processing for bookings
**Decision:** Use Stripe Checkout redirect mode
**Rationale:** PCI handled by Stripe, faster to ship, good mobile UX
**Consequences:** User leaves site briefly during payment
**Status:** Active

## 2026-01-21 - Zod For Server-Side Validation
**Context:** Need strong input validation for booking flows
**Decision:** Validate on the server with Zod
**Rationale:** Never trust client validation, reusable schemas, clearer safety boundaries
**Consequences:** Slight duplication across client/server validation layers
**Status:** Active

## 2026-02-23 - Server-Side Promo Pricing
**Context:** First-time-client promo could be manipulated if client-submitted prices were trusted
**Decision:** Derive pricing server-side from canonical package data
**Rationale:** Prevents price-manipulation attacks and keeps the server as source of truth
**Consequences:** More server logic, but safer pricing
**Status:** Active

## 2026-02-23 - Shared Phone Normalization
**Context:** Booking and payment flows stored phone values inconsistently
**Decision:** Normalize to one canonical format and keep backward-compatible lookup support
**Rationale:** Fixes promo eligibility lookups and identity matching
**Consequences:** Old data may still need backfill cleanup
**Status:** Active

## 2026-04-23 - Cloud Run Runtime Uses Adapter Node
**Context:** The portfolio migration is moving dynamic SvelteKit apps from Vercel runtime assumptions to Cloud Run containers.
**Decision:** Use `@sveltejs/adapter-node`, run the generated server with `node build`, and package MrGuy with a repo-local Dockerfile.
**Rationale:** Cloud Run expects a long-running HTTP server listening on `PORT`; adapter-node gives the app that shape without changing booking, payment, or admin behavior.
**Consequences:** Vercel-specific headers must live in application code, and production deploys should not rely on the old Vercel adapter path after this migration slice.
**Status:** Superseded by the 2026-04-26 Vercel origin + Cloudflare front door decision

## 2026-04-24 - Dedicated Portfolio GCP Projects
**Context:** The first MrGuy Cloud Run setup attempt found that the app-specific `mr-guy-mobile-detail` project has no billing and the existing LAC website project is not the right long-term boundary for all portfolio apps.
**Decision:** Use dedicated shared portfolio projects, `lovingart-staging` and `lovingart-prod`, instead of deploying MrGuy into `loving-art-and-company-website`.
**Rationale:** A shared billing account is fine, but staging/prod GCP projects give cleaner IAM, secrets, observability, and blast-radius boundaries than mixing unrelated sites into a website project.
**Consequences:** Cloud Run provisioning waits on billing linked-project quota for billing account `019AC9-CFD7B1-01184B`; after quota is resolved, attach billing to the dedicated projects and continue staging setup there.
**Status:** Parked for staging reference; production Cloud Run cutover is not active

## 2026-04-24 - Unused Messaging Provider Removed
**Context:** A text-message provider was documented in older project plans but was never implemented as an active runtime dependency.
**Decision:** Remove unused messaging-provider assumptions from code, docs, environment declarations, Cloud Run secret setup, and staging Secret Manager.
**Rationale:** Keeping unused provider dependencies creates secret-management burden, migration noise, and false smoke-test requirements.
**Consequences:** Customer communications remain email-based unless a future messaging feature is intentionally designed and implemented.
**Status:** Active

## 2026-04-26 - Keep Vercel Origin And Add Cloudflare Front Door
**Context:** Cloud Run staging proved the container path, but production cutover adds operational work that is not needed for the current business goal. The desired direction is to keep the existing Vercel production host and put Cloudflare in front for DNS/security/control where useful.
**Decision:** Abandon/defer MrGuy production Cloud Run migration. Keep Vercel as the production origin and plan Cloudflare as the front door.
**Rationale:** This preserves the stable production runtime while reducing the immediate migration burden. Cloudflare can be introduced incrementally, starting with DNS-only or carefully scoped proxying.
**Consequences:** Cloud Run staging remains a proven but parked path. Dynamic, admin, auth, booking, payment, and webhook routes need explicit Cloudflare cache bypass rules if proxying is enabled. Vercel cautions that reverse proxies can reduce Vercel firewall/bot visibility and add cache/latency complexity, so DNS-only remains the fallback.
**Status:** Active

## 2026-04-26 - Cloud Build IAM Stays Resource-Scoped
**Context:** Direct `gcloud builds submit` for MrGuy staging failed because the default Cloud Build worker service account could not read the uploaded source archive or push the built image.
**Decision:** Grant only the missing resource-scoped permissions: `roles/storage.objectViewer` on the staging Cloud Build source bucket and `roles/artifactregistry.writer` on the staging `cloud-run` Artifact Registry repository.
**Rationale:** This preserves least privilege while allowing Cloud Build to perform the exact source-read and image-push operations required for container deployment.
**Consequences:** Future projects should follow the same pattern only after observing the same failure mode, using each project's own build worker, source bucket, and Artifact Registry repository.
**Status:** Active

## 2026-04-30 - Production Booking Canary Must Be Explicitly Armed
**Context:** The daily ops flow needs proof that production booking creation, database persistence, lead-sink delivery, and customer acknowledgement still work end to end.
**Decision:** Add a standalone `ops:booking-canary` runner and optional daily digest integration gated by `RUN_PROD_BOOKING_CANARY=1`, `MRGUY_BOOKING_CANARY_SUBMIT=1`, and `BOOKING_CANARY_SECRET`.
**Rationale:** Production booking proof is valuable, but it creates a real synthetic booking and sends real side effects, so it must not run during ordinary smoke checks or daily ops unless explicitly armed.
**Consequences:** The canary writes compact JSON/Markdown proof artifacts under `output/ops/`, and production must have the same `BOOKING_CANARY_SECRET` configured for the booking API to expose private proof metadata.
**Status:** Active
