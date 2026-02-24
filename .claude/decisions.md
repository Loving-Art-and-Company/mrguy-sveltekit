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

## 2026-01-21 - Twilio Verify for OTP (Not Custom)
**Context:** Need SMS authentication for reschedule portal without requiring passwords
**Decision:** Use Twilio Verify service instead of building custom OTP system
**Rationale:**
- Rate limiting built-in
- SMS delivery optimization
- Prevents common OTP vulnerabilities (timing attacks, brute force)
- Handles international numbers properly
- Fraud detection included
**Consequences:** Additional Twilio cost ($0.05/verification), but worth it for security and reliability
**Status:** Active

---

## 2026-01-21 - Supabase RLS for Security
**Context:** Need to secure customer booking data in multi-tenant architecture
**Decision:** Implement Row Level Security (RLS) policies on all Supabase tables
**Rationale:**
- Database-level security (can't bypass with API)
- Prevents accidental data leaks even if app code has bugs
- Required for GDPR/privacy compliance
- Supabase service role key only used server-side
**Consequences:** More complex queries, but security is non-negotiable
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
