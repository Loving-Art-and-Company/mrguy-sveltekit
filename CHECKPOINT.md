# MrGuy Neon Migration — Checkpoint

## Status: Code Complete, Awaiting Infrastructure

**Branch:** `feat/neon-migration`
**Commits:** 2 (migration commit + cleanup/scripts)

## What's Done (Code)

### Infrastructure (8 new server modules)
- `src/lib/server/db.ts` — Lazy Proxy singleton, postgres-js driver
- `src/lib/server/schema.ts` — 11 Drizzle tables (3 auth + 8 business)
- `src/lib/server/env.ts` — Zod env validation
- `src/lib/server/auth.ts` — bcrypt(12) + DB sessions(24h) + rate limiting
- `src/lib/server/csrf.ts` — HMAC-SHA256 double-submit cookie
- `src/lib/server/redis.ts` — Upstash lazy singleton
- `src/lib/server/rateLimit.ts` — Circuit breaker, fail-closed
- `drizzle.config.ts` — Drizzle Kit config

### Repositories (2 new)
- `src/lib/repositories/bookingRepo.ts` — 12 functions, brand-scoped
- `src/lib/repositories/clientProfileRepo.ts` — upsert + getByPhone

### Routes Migrated (6 API + 5 admin + hooks)
- `src/hooks.server.ts` — Full rewrite (CSP, CSRF, sessions, rate limiting)
- `src/routes/api/auth/logout/+server.ts`
- `src/routes/api/bookings/create/+server.ts`
- `src/routes/api/bookings/mine/+server.ts`
- `src/routes/api/bookings/promo/+server.ts`
- `src/routes/api/bookings/reschedule/+server.ts`
- `src/routes/api/payments/webhook/+server.ts`
- All 5 admin routes (bookings list, detail, calendar, dashboard, login)

### Cleanup
- Deleted: `src/lib/server/supabase.ts`, `src/lib/types/database.ts`
- Removed deps: `@supabase/ssr`, `@supabase/supabase-js`
- Updated Svelte imports: `Booking` → `BookingRow` from bookingRepo
- Fixed: `booking.created_at` → `booking.createdAt`, timestamp types
- Zero supabase imports remain in `src/` (only comments explaining migration origin)

### Scripts
- `scripts/migrate-data.ts` — Full data migration (9 tables, FK-ordered, verification)
- `scripts/create-admin.ts` — Updated to use bcrypt + Neon (was Supabase)

### svelte-check
- 31 errors, 25 warnings — ALL pre-existing (PackageMenu, BentoSlideshow, BookingModal)
- Zero migration-related errors

## What's Needed (Infrastructure)

1. **Provision Neon DB** — Create `mrguy` project at neon.tech, get `DATABASE_URL`
2. **Push schema** — `npx drizzle-kit push`
3. **Run data migration:**
   ```bash
   SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@..." \
   DATABASE_URL="postgresql://..." \
   npx tsx scripts/migrate-data.ts
   ```
4. **Create admin user:**
   ```bash
   DATABASE_URL="..." npx tsx scripts/create-admin.ts admin@mrguydetail.com YourPassword
   ```
5. **Set env vars** in `.env.local` and Vercel:
   - `DATABASE_URL` (Neon)
   - `CSRF_SECRET` (32+ random chars)
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
6. **Test full app** — login, booking CRUD, webhook, promo flow
7. **Merge PR** when verified

## Key Technical Notes

- Bookings table uses mixed camelCase DB columns (`"clientName"`, `"serviceName"`) — quoted identifiers
- Bookings use text PK format: `BK-YYYYMMDD-XXXX`
- `MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45'` filters all queries
- Supabase bcrypt hashes are standard — `bcryptjs.compare()` works directly, no re-hashing
- Drizzle returns `Date` objects (not ISO strings) for timestamp columns
