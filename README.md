# Mr. Guy Mobile Detail - SvelteKit Platform

> Mobile car detailing booking platform for West Broward, South Florida

## Overview

**Mr. Guy Mobile Detail** is a SvelteKit-based booking platform for mobile car detailing services. Customers can book appointments, make payments via Stripe, and reschedule via email verification.

**Domain:** mrguydetail.com  
**Market:** West Broward / Broward County families  
**Tagline:** "We Know a Guy." — Premium detailing, right in your driveway.

## Features

- ✓ **Service Booking** - Multi-step booking flow with vehicle details
- ✓ **Stripe Payments** - Secure checkout with Stripe integration
- ✓ **Email Verification Reschedule** - Email-based customer verification
- ✓ **Admin Dashboard** - Booking management and analytics
- ✓ **Neon Postgres Backend** - Dedicated Postgres database via Drizzle ORM
- ✓ **Mobile-First Design** - Responsive across all devices

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | SvelteKit | 2.50+ |
| **UI Library** | Svelte | 5.47+ |
| **Database** | Neon Postgres | Latest |
| **Auth** | Email verification | Latest |
| **Payments** | Stripe Checkout | Latest |
| **Deployment** | Vercel origin + planned Cloudflare front door | Latest |
| **Validation** | Zod | 4.3+ |

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Stripe account (test mode)
- Resend account (email delivery)

### Installation

```bash
# Clone repository
cd mrguy-sveltekit

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in .env.local with your credentials
```

### Environment Setup

Create `.env.local` with:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Stripe
STRIPE_SECRET_KEY=sk_test_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# App
PUBLIC_BASE_URL=http://localhost:5173
```

**See `.env.example` for complete list.**

### Running Locally

```bash
# Start development server
npm run dev

# Opens at http://localhost:5173
```

## Documentation

- **Current Architecture & Context:** [`AGENTS.md`](./AGENTS.md), [`.context/backpack.md`](./.context/backpack.md), [`.context/decisions.md`](./.context/decisions.md)
- **Code Guidelines:** [`AGENTS.md`](./AGENTS.md) + `~/AGENTS.md`
- **Security Policies:** [`SECURITY.md`](./SECURITY.md)
- **Analytics Tracking Plan:** [`docs/tracking-plan.md`](./docs/tracking-plan.md)
- **Ops Agent Spec:** [`docs/mrguy-ops-agent-spec.md`](./docs/mrguy-ops-agent-spec.md)

## Project Structure

```
mrguy-sveltekit/
├── src/
│   ├── lib/
│   │   ├── components/    # Reusable UI components
│   │   ├── stores/        # Svelte stores (if used)
│   │   └── server/        # Database, email, lead sink
│   ├── routes/
│   │   ├── +page.svelte   # Homepage
│   │   ├── book/          # Booking flow
│   │   ├── reschedule/    # OTP reschedule portal
│   │   └── api/           # Server endpoints
│   │       ├── payments/  # Stripe webhook
│   │       └── auth/      # OTP verification
│   └── app.css            # Global styles
├── static/                # Static assets
├── tests/                 # Vitest tests
├── scripts/               # Utility and verification scripts
└── drizzle.config.ts      # Drizzle configuration
```

## Development

### Available Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview production build

# Quality
npm run check            # SvelteKit sync + type checking
npm run check:watch      # Watch mode

# Ops agent foundation
npm run ops:bookings     # Booking/pending queue snapshot
npm run ops:smoke        # Safe non-mutating production smoke
npm run ops:inquiries    # Gmail inbox triage snapshot
npm run ops:analytics    # GA4 funnel snapshot
npm run ops:seo          # Search Console + technical SEO snapshot
npm run ops:digest       # Daily ops digest to output/ops/
npm run ops:daily        # Wrapped daily digest with logs
npm run ops:schedule:install # Install local macOS daily run

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode
```

## Deployment

### Vercel + Cloudflare

Production stays on Vercel. The Cloud Run migration was proven in staging, but production cutover is abandoned for now in favor of keeping Vercel as the origin and putting Cloudflare in front where useful.

See [`docs/platform/vercel-cloudflare-front-door.md`](./docs/platform/vercel-cloudflare-front-door.md) for the Cloudflare guardrails and DNS/cache rules.

### Environment Variables

Use Vercel environment variables for server-side secrets and project settings.

- All required app values are listed in `.env.example`.
- `DATABASE_URL`, `CSRF_SECRET`, API keys, and webhook secrets stay server-only.
- Stripe production must use live-mode keys and webhooks. Staging/test environments must use test-mode Stripe keys and webhooks.

**See `AGENTS.md`, `.context/backpack.md`, and `docs/platform/vercel-cloudflare-front-door.md` for the current deployment context and checklist references.**

## Service Packages

- **Quick Refresh** - $45-75 (exterior wash, tire shine)
- **Family Hauler** - $130-220 (interior + exterior)
- **Electric/Tesla** - $150-250 (specialized electric vehicle care)
- **Showroom** - $220-350 (premium detail)
- **Ceramic Coating** - $450-2000 (protection package)

## Security

- **Stripe Checkout** - PCI-compliant payment processing
- **Email verification** - customer verification for reschedule access
- **Server-side Drizzle access** - Database access stays on the server
- **Zod Validation** - Input validation on all forms
- **Environment Variables** - Secrets in Vercel, not in code

**See `SECURITY.md` for comprehensive security policies.**

## Testing

```bash
# Run all tests
npm run test

# Watch mode (during development)
npm run test:watch
```

### Production E2E

Production Playwright runs skip the local dev server automatically.

One-command full production suite:

```bash
npm run test:prod:headed
```

Booking flow:

```bash
# Full booking loop against production
npm run test:booking:prod:headed

# Faster production smoke run (2 bookings)
npm run test:booking:prod:smoke:headed
```

Reschedule flow:

```bash
# Requires a real inbox for the booking created by the test
RESCHEDULE_TEST_EMAIL=you@example.com npm run test:reschedule:prod:headed
```

Optional support-path env vars for the reschedule suite:

```bash
# A production booking phone with no email on file
RESCHEDULE_MISSING_EMAIL_PHONE=9545550001

# A production phone linked to bookings under multiple different emails
RESCHEDULE_MULTI_EMAIL_PHONE=9545550002
```

What the reschedule suite covers:
- Create a fresh production booking and reach the masked-email verification step
- Reject an invalid 6-digit verification code
- Show the support message when no email is on file
- Show the support message when multiple emails are linked to one phone

Combined production suite examples:

```bash
# Full headed run across booking + reschedule
RESCHEDULE_TEST_EMAIL=you@example.com npm run test:prod:headed

# Faster booking smoke + reschedule checks
BOOKING_LIMIT=2 RESCHEDULE_TEST_EMAIL=you@example.com npm run test:prod:headed
```

### Daily Ops Agent Commands

These are the first implementation layer for the MrGuy ops agent:

```bash
# Read booking queue state from production data
npm run ops:bookings

# Run safe production smoke without creating bookings or sending reschedule codes
npm run ops:smoke

# Read inbox / customer inquiry queue
npm run ops:inquiries

# Read analytics funnel state
npm run ops:analytics

# Read SEO / webmaster state
npm run ops:seo

# Generate a daily digest in output/ops/latest-digest.md
npm run ops:digest

# Wrapped daily run with log output
npm run ops:daily
```

Optional env vars:

```bash
# Deliver urgent digest alerts by email
MRGUY_OPS_ALERT_TO=you@example.com # optional; falls back to the MrGuy business email if omitted
SEND_ALERTS=1

# Override target environment
BASE_URL=https://mrguydetail.com

# Google-backed reporting
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://mrguydetail.com/
```

Important:
- Gmail, GA4, and Search Console snapshots reuse the app's connected Google account.
- Reconnect Google once from the admin flow so the stored refresh token includes the new readonly scopes:
  - `gmail.readonly`
  - `analytics.readonly`
  - `webmasters.readonly`
- Until that reconnect happens, those connectors will report `degraded`.

Local daily scheduler on macOS:

```bash
# Install a launchd job that runs daily at 7:00 AM local by default
npm run ops:schedule:install

# Override the schedule at install time
OPS_RUN_HOUR=8 OPS_RUN_MINUTE=30 npm run ops:schedule:install
```

**Test Coverage:**
- Booking flow validation
- Payment integration (mocked)
- Email-based reschedule verification
- Component rendering

## License

**Proprietary** - © 2026 Loving Art & Company. All rights reserved.

## Support

- **Documentation:** `AGENTS.md`, `.context/backpack.md`, `.context/decisions.md`, `SECURITY.md`
- **Issues:** Contact development team
- **Production:** mrguydetail.com

---

**Status:** Production  
**Version:** 1.0  
**Last Updated:** 2026-01-21
