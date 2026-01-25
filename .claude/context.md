# Mr. Guy Mobile Detail - Project Context

> Last Updated: 2026-01-25 by Claude Sonnet 4.5

## Current Status
Production-ready SvelteKit booking platform. All Ralph Loop phases completed. Live at mrguydetail.com.

## Active Work
- [x] Ralph Phase 1: Admin Auth
- [x] Ralph Phase 2: Bookings
- [x] Ralph Phase 3: Calendar
- [x] Ralph Phase 4: Revenue Dashboard
- [x] Ralph Phase 5: Reschedule Portal
- [x] Ralph Phase 6: QA & Polish
- [ ] Post-launch monitoring and optimization

## Recent Changes
- 2026-01-22: Completed all 6 Ralph Loop implementation phases
- 2026-01-21: Deployed to Vercel production
- 2026-01-21: Set up Stripe webhooks and Twilio Verify

## Tech Stack
- Framework: SvelteKit 2.50+ (Svelte 5 with runes)
- Database: Supabase (PostgreSQL + realtime)
- Payments: Stripe Checkout (redirect mode)
- Auth: Twilio Verify (SMS OTP for clients), Supabase Auth (admin)
- Deployment: Vercel
- Validation: Zod 4.3+

## Blockers / Issues
None currently. Platform is stable in production.

## Next Steps
1. Monitor production metrics and user feedback
2. Optimize booking conversion funnel if needed
3. Consider A/B testing promo copy
4. Plan expansion features based on usage data

## Quick Reference
- Dev server: `npm run dev` (port 5173)
- Build: `npm run build`
- Type check: `npm run check`
- Deploy: Auto-deploy on push to main branch
- Logs: Check Vercel dashboard

## Important Files
- `src/routes/+page.svelte`: Landing page with service packages
- `src/routes/book/+page.svelte`: Multi-step booking flow
- `src/routes/reschedule/+page.svelte`: Client OTP reschedule portal
- `src/routes/admin/+layout.svelte`: Admin dashboard auth wrapper
- `src/routes/api/payments/webhook/+server.ts`: Stripe webhook handler
- `CLAUDE.md`: Comprehensive architecture documentation
- `SECURITY.md`: Security policies and RLS setup

## Environment
- Local: http://localhost:5173
- Production: https://mrguydetail.com
- Supabase: Project at qtskudtsfbwdahjhpphh
- Stripe: Live mode connected

## Business Context
- Target Market: West Broward County families (South Florida)
- Service Area: Mobile detailing (comes to customer)
- Revenue Target: $10k/month
- Key Promo: "Fresh Start" 25% off first booking
- Packages: 5 tiers from $45 (Quick Refresh) to $2000 (Ceramic Coating)

## Model Handoff Notes
None yet. This is the initial context creation.
