# Architecture Decisions

## 2026-01-21 - SvelteKit Over React
**Context:** Porting from existing React version to modern framework
**Decision:** Use SvelteKit 2.x with Svelte 5 runes instead of continuing with React
**Rationale:**
- Simpler reactivity model with Svelte 5 runes ($state, $effect, $props)
- Better performance out of the box
- Server-side rendering built-in with SvelteKit
- Smaller bundle sizes
- More intuitive data flow for booking wizard
**Consequences:** Team needs to learn Svelte patterns, but cleaner codebase long-term
**Status:** Active

---

## 2026-01-21 - Stripe Checkout Redirect (Not Embedded)
**Context:** Need secure payment processing for booking flow
**Decision:** Use Stripe Checkout redirect mode, not embedded Checkout or Payment Elements
**Rationale:**
- PCI compliance handled entirely by Stripe
- Faster implementation (redirect vs iframe integration)
- Stripe handles all UI, validation, error states
- Mobile-optimized out of the box
- Future payment methods (Apple Pay, Google Pay) work automatically
**Consequences:** Users leave site during payment (slight UX trade-off for massive security/dev speed win)
**Status:** Active

---

## 2026-04-26 - Email OTP for Client Reschedule Verification
**Context:** Clients need to access reschedule flows without passwords, and the current operating model is email-based.
**Decision:** Use email OTP tied to the booking email found from the submitted phone number.
**Rationale:**
- Removes the old phone-provider dependency
- Uses the email address already captured in the booking flow
- Keeps reschedule access passwordless
- Avoids sending booking access codes to unknown destinations
**Consequences:** Bookings without email require manual help, and customers with multiple emails on one phone need support fallback.
**Status:** Active

---

## 2026-04-26 - Neon/Drizzle Server-Side Data Access
**Context:** The production stack uses Neon Postgres with Drizzle repositories, not client-side database SDK access.
**Decision:** Keep database access server-side through SvelteKit server routes and repository modules.
**Rationale:**
- Prevents customer data exposure through browser-side database clients
- Keeps auth, validation, and mutation rules in one server boundary
- Fits the current Vercel + Neon deployment model
- Makes tests and operational scripts use the same schema layer
**Consequences:** Client flows must call server endpoints instead of querying the database directly.
**Status:** Active

---

## 2026-01-21 - Zod for Server-Side Validation
**Context:** Need to validate all booking form inputs
**Decision:** Use Zod schemas for validation on server endpoints, not just client
**Rationale:**
- Never trust client-side validation alone
- Zod provides TypeScript type inference (types from schemas)
- Reusable schemas across endpoints
- Clear error messages for debugging
**Consequences:** Slight code duplication (validate client + server), but prevents malicious submissions
**Status:** Active

---

## 2026-01-21 - White-Label Architecture (Future-Proof)
**Context:** First tenant is Mr. Guy, but want to support multiple detailing businesses
**Decision:** Structure database with tenant isolation from day one
**Rationale:**
- Easier to add tenant B than refactor entire app later
- Table structure supports multi-tenancy (service_packages per tenant, etc.)
- Environment variables can swap tenants
**Consequences:** Slightly more complex schema, but future-ready
**Status:** Active (not fully implemented, but structure in place)

---

## 2026-01-22 - Ralph Loop for Autonomous Implementation
**Context:** Need to port React version quickly with minimal supervision
**Decision:** Use Ralph Loop methodology with 6 phased PRDs
**Rationale:**
- Break large port into verifiable milestones
- Each phase has clear acceptance criteria
- Can iterate on phase before moving to next
- Max iterations prevent infinite loops
**Consequences:** More upfront planning, but autonomous execution worked well
**Status:** Complete (all 6 phases shipped)

---

## 2026-02-23 - Server-Side Promo Pricing (Never Trust Client)
**Context:** Implementing 25% first-time client discount ("Fresh Start" promo)
**Decision:** All pricing derived server-side from packageId lookup; client-submitted prices ignored
**Rationale:**
- Client can manipulate prices in POST body — server must be source of truth
- Server looks up package by ID, applies promo discount if eligible
- First-time eligibility checked via phone number lookup against bookings table
- Codex review flagged client-trusted pricing as critical security issue
**Consequences:** Slightly more server logic, but prevents price manipulation attacks
**Status:** Active

---

## 2026-02-23 - Shared Phone Normalization
**Context:** Phone stored as 10-digit in /api/bookings/create but as +1XXXXXXXXXX (E.164) in /api/payments/webhook
**Decision:** Create shared `normalizePhone()` utility, always store canonical 10-digit format
**Rationale:**
- Inconsistent formats caused first-time client lookups to miss existing bookings
- Single normalizer ensures all booking writers store the same format
- Lookup queries check both formats for backward compatibility
**Consequences:** Need to eventually backfill old E.164 entries in bookings table
**Status:** Active

---

## 2026-02-23 - Environment-Driven Promo Toggle
**Context:** Need ability to enable/disable promo without code changes
**Decision:** Use PROMO_ENABLED environment variable (defaults to enabled, only 'false' disables)
**Rationale:**
- Ops can toggle promo in Vercel dashboard without redeploying
- Server load function passes flag to client via page data
- Server endpoints independently verify eligibility (don't trust client flag)
**Consequences:** Must remember to set env var in Vercel; defaults-to-enabled means promo is live unless explicitly disabled
**Status:** Active
