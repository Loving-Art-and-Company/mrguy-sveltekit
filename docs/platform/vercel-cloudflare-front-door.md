# Vercel Origin With Cloudflare Front Door

## Status

As of 2026-04-26, MrGuy production stays on Vercel. The Cloud Run staging path was proven, but production Cloud Run cutover is abandoned/deferred.

Cloudflare may be placed in front of Vercel for DNS, security, and traffic-control needs. Start conservatively and keep rollback simple.

## Guardrails

- Vercel remains the production origin.
- Stripe production stays live-mode on Vercel.
- Staging and local development use Stripe test-mode keys and webhooks.
- Do not point production DNS at Cloud Run.
- Do not create or mount production live Stripe secrets in Cloud Run.
- Do not delete the proven Cloud Run staging resources unless cleanup is explicitly approved.
- Treat Cloudflare proxying as reversible. DNS-only is the fallback if proxying causes Vercel firewall, bot, latency, or cache issues.

Vercel's guidance says reverse proxies in front of Vercel are not generally recommended because they can reduce Vercel traffic visibility and complicate cache/security behavior: <https://vercel.com/docs/integrations/cloudflare>.

## Recommended Rollout

1. Add the domain to Cloudflare and import existing DNS records.
2. Keep non-web records, verification records, MX, and TXT records DNS-only.
3. Point the production web host to the existing Vercel target.
4. Begin with DNS-only if the immediate need is DNS management.
5. If proxying is enabled, add cache bypass rules before exposing production traffic through the orange-cloud proxy.
6. Smoke production booking, payment, webhook, reschedule, admin login, and email behavior immediately after DNS/proxy changes.

## Cache Bypass Rules

Bypass Cloudflare cache for dynamic or sensitive routes:

- `/api/*`
- `/admin/*`
- `/auth/*`
- `/book*`
- `/pay/*`
- `/reschedule*`
- `/unsubscribe*`
- Stripe webhook routes, including `/api/payments/webhook`

Also bypass cache when requests include cookies or authorization headers.

Static assets can use normal Vercel/Cloudflare caching, but avoid overriding Vercel cache headers until production behavior is measured.

## SSL/TLS

- Use Full (strict) SSL/TLS mode.
- Keep Vercel-managed TLS valid at the origin.
- Do not use Flexible SSL.

## Production Smoke Checklist

- Homepage loads on the production domain.
- Booking modal opens.
- Availability API returns expected slots.
- Stripe Checkout creates a live-mode session in production.
- Stripe live webhook endpoint receives and verifies events.
- Reschedule verification flow loads.
- Admin login route loads and protected pages remain protected.
- Email side effects work with the production Resend configuration.

## Rollback

If Cloudflare proxying causes issues:

1. Switch the affected web records to DNS-only.
2. Purge Cloudflare cache.
3. Re-smoke booking, payment, webhook, and admin flows.
4. Keep Vercel production deployment unchanged.
