# Mr. Guy Mobile Detail - Project Guidance

## Context System

Before starting substantial work, AI should load:
1. `.agents/context.md` - Current project state and active work
2. `.agents/decisions.md` - Architecture decisions and rationale
3. `AGENTS.md` - Project architecture, commands, and coding rules
4. `README.md` - Quick start and setup guide

At end of session:
- Update `.agents/context.md` with progress when the work changes current status
- Log any new architecture decisions in `.agents/decisions.md`

## Project Overview

Mobile detailing booking platform for West Broward, South Florida.

This is a white-label service-business architecture with Mr. Guy Mobile Detail as the first tenant. The business target is $10k monthly revenue, with five service packages ranging from $45 to $2000 and a "Fresh Start" 25% off first-booking promo.

The codebase was ported from the archived React version at `~/Projects/06_ARCHIVE/mrguy-react-archived-*`. Use that archive only as historical reference for service packages, pricing, component logic, and API patterns.

**Stack:** SvelteKit + Neon Postgres + Drizzle ORM + Stripe + Resend + email-based verification

## Quick Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview build

# Quality
npm run check            # Type check + SvelteKit sync
npm run check:watch      # Watch mode
npm test                 # Vitest unit tests

# Operations
npm run ops:smoke
npm run ops:digest
```

## Key Directories

- `src/routes/` - Landing, booking flow, reschedule portal, admin dashboard, API endpoints
- `src/lib/components/` - Svelte components
- `src/lib/stores/` - Svelte 5 runes stores
- `src/lib/server/` - Server-only code
- `src/lib/repositories/` - Database repository functions
- `drizzle.config.ts` - Drizzle configuration
- `docs/` - Tracking plan and ops specs
- `.agents/` - Agent context, decisions, rules, and project memory

## Database Tables

Core tables include `bookings`, `users`, `sessions`, `admin_users`, `client_profiles`, `client_sessions`, `service_packages`, `otp_rate_limits`, CRM tables, and business ops tables.

## Key Patterns

### Svelte 5 Runes (Required)
```javascript
// State
let count = $state(0);

// Effects
$effect(() => {
  console.log('Count changed:', count);
});

// Props
let { name, age = 18 } = $props();
```

### Server-Side Validation (Required)
```javascript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/)
});

const result = schema.safeParse(data);
```

### Database Access
```javascript
// Keep database access server-side through repositories
import * as bookingRepo from '$lib/repositories/bookingRepo';
```

### Architecture Rules

- Modular/functional code; no classes unless an external API requires one
- Svelte 5 runes only
- Load route data server-side through `+page.server.ts`
- Keep server-only data access behind Drizzle repositories
- Use Zod schemas for all externally supplied input
- Derive pricing server-side from package IDs; never trust client-submitted prices
- Keep customer notifications email-first; do not add phone-provider messaging without an explicit architecture decision

## Security Rules

- Never commit `.env.local` (already in `.gitignore`)
- `DATABASE_URL` stays server-only
- Validate all inputs server-side with Zod
- Validate all access through server routes and repository boundaries
- Use Stripe Checkout redirect for payments; do not store card data
- Verify Stripe webhook signatures
- Use custom bcrypt admin auth with DB-backed sessions
- Use email OTP for client reschedule verification
- Keep Google OAuth tokens isolated to the integration flows that need them

## Business Context

- Location: West Broward, South Florida
- Service area: mobile detailing with a driveway-first workflow
- Promo: "Fresh Start" 25% off first booking
- Packages: Quick Refresh, Family Hauler, Electric/Tesla, Showroom, Ceramic Coating
- Platform thesis: prove the white-label service-business stack with Mr. Guy, then reuse it for additional appointment-service brands

## Deployment Checklist

Before deploying production changes:
1. Run `npm run check`
2. Run `npm run build`
3. Run `npm test` when logic changed
4. Run the relevant browser or ops smoke check for user-facing changes
5. Deploy with `vercel --prod --yes`
6. Inspect the deployment and confirm production aliases are attached

Production environment variables are managed in Vercel. Use production keys only, keep `DATABASE_URL` server-only, and mirror required keys from `.env.example`.

## Workflows

### Rollback Procedures

- For web regressions: revert to the last known good Vercel deployment or redeploy the previous commit
- For bad code deploys: create a forward-fix commit when feasible; use Vercel rollback when production behavior is actively broken
- For database issues: stop writes if needed, preserve logs, and restore from the latest clean backup only after confirming blast radius
- For payment issues: verify Stripe webhook state before replaying or manually adjusting records

### Production Smoke

- Confirm the public site returns `200`
- Check the booking request path on desktop and mobile when booking UI changes
- Confirm admin booking actions still load when admin/server code changes
- Delete any test booking created during smoke tests

## Reference Docs

- Architecture and commands: `AGENTS.md`
- Current context: `.agents/context.md`
- Architecture decisions: `.agents/decisions.md`
- Security: `SECURITY.md`
- Ralph phases: `RALPH-PHASE*.md` (implementation history)
- Tracking plan: `docs/tracking-plan.md`
- Ops agent spec: `docs/mrguy-ops-agent-spec.md`
- Global standards: `~/AGENTS.md`
