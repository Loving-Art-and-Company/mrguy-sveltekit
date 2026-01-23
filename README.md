# Mr. Guy Mobile Detail - SvelteKit Platform

> Mobile car detailing booking platform for West Broward, South Florida

## Overview

**Mr. Guy Mobile Detail** is a SvelteKit-based booking platform for mobile car detailing services. Customers can book appointments, make payments via Stripe, and reschedule via SMS OTP authentication.

**Domain:** mrguydetail.com  
**Market:** West Broward / Broward County families  
**Tagline:** "We Know a Guy." — Premium detailing, right in your driveway.

## Features

- ✓ **Service Booking** - Multi-step booking flow with vehicle details
- ✓ **Stripe Payments** - Secure checkout with Stripe integration
- ✓ **SMS OTP Reschedule** - Twilio Verify for customer authentication
- ✓ **Admin Dashboard** - Booking management and analytics
- ✓ **Supabase Backend** - Real-time database with RLS policies
- ✓ **Mobile-First Design** - Responsive across all devices

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | SvelteKit | 2.50+ |
| **UI Library** | Svelte | 5.47+ |
| **Database** | Supabase | Latest |
| **Auth** | Twilio Verify (OTP) | Latest |
| **Payments** | Stripe Checkout | Latest |
| **Deployment** | Vercel | Latest |
| **Validation** | Zod | 4.3+ |

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account (test mode)
- Twilio account (Verify service)

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
# Supabase
PUBLIC_SUPABASE_URL=your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...

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

- **Architecture & Commands:** [`CLAUDE.md`](./CLAUDE.md)
- **Code Guidelines:** [`AGENTS.md`](./AGENTS.md) + `~/AGENTS.md`
- **Security Policies:** [`SECURITY.md`](./SECURITY.md)

## Project Structure

```
mrguy-sveltekit/
├── src/
│   ├── lib/
│   │   ├── components/    # Reusable UI components
│   │   ├── stores/        # Svelte stores (if used)
│   │   └── services/      # Supabase, Stripe clients
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
└── supabase/              # Database migrations (if local dev)
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

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode
```

## Deployment

### Vercel (Automatic)

```bash
# Push to main branch
git push origin main

# Vercel auto-deploys
# Check logs at vercel.com
```

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy
vercel --prod
```

### Environment Variables (Production)

Set in Vercel dashboard:
- All variables from `.env.example`
- Use production keys (not test keys)
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is kept secret

**See `CLAUDE.md` for complete deployment checklist.**

## Service Packages

- **Quick Refresh** - $45-75 (exterior wash, tire shine)
- **Family Hauler** - $130-220 (interior + exterior)
- **Electric/Tesla** - $150-250 (specialized electric vehicle care)
- **Showroom** - $220-350 (premium detail)
- **Ceramic Coating** - $450-2000 (protection package)

## Security

- **Stripe Checkout** - PCI-compliant payment processing
- **Twilio Verify** - SMS OTP for client authentication
- **Supabase RLS** - Row-level security on all tables
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

**Test Coverage:**
- Booking flow validation
- Payment integration (mocked)
- OTP authentication flow
- Component rendering

## License

**Proprietary** - © 2026 Loving Art & Company. All rights reserved.

## Support

- **Documentation:** `CLAUDE.md`, `AGENTS.md`, `SECURITY.md`
- **Issues:** Contact development team
- **Production:** mrguydetail.com

---

**Status:** Production  
**Version:** 1.0  
**Last Updated:** 2026-01-21
