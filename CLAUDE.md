# Mr. Guy Mobile Detail - SvelteKit

## Development Setup

When setting up dev environments or projects, always verify the setup is fully working before moving on - run the dev server, test login flows, and confirm database connections are active.

## Overview

Mobile detailing booking platform. White-label SaaS architecture, first tenant: Mr. Guy Mobile Detail (South Florida).

**Stack**: SvelteKit + Supabase + Stripe + Twilio Verify

## Port from React

Previous React version archived at `~/Projects/06_ARCHIVE/mrguy-react-archived-*`. Reference it for:
- Service packages & pricing
- Component logic
- API endpoint patterns
- Supabase schema

## Key Features to Port

### Client-Facing
- Landing page with packages
- Booking flow (service → vehicle → date → address → payment)
- Stripe Checkout redirect
- Reschedule portal with SMS OTP auth
- "Fresh Start" 25% promo for first booking

### Admin Dashboard
- Login (Supabase Auth)
- Booking list with filters
- Calendar view
- Revenue dashboard
- Marketing AI assistant (Gemini)

## Architecture

```
src/
├── routes/
│   ├── +page.svelte              # Landing
│   ├── book/+page.svelte         # Booking flow
│   ├── reschedule/+page.svelte   # Client portal
│   ├── admin/                    # Admin dashboard
│   └── api/                      # API endpoints
├── lib/
│   ├── components/               # Svelte components
│   ├── stores/                   # Svelte 5 runes stores
│   ├── server/                   # Server-only code
│   └── types/                    # TypeScript types
└── supabase/
    └── schema.sql                # Database schema
```

## Supabase Tables

- `bookings` - Customer appointments
- `admin_users` - Admin accounts
- `client_profiles` - Customer data
- `client_sessions` - OTP sessions
- `service_packages` - Package definitions
- `otp_rate_limits` - Rate limiting

## Patterns

### Auth
- Client: Twilio Verify SMS OTP
- Admin: Supabase Auth email/password
- Google OAuth: Drive, Sheets, Docs integration for team access

After any auth-related changes, test the full login flow including redirects before considering the task complete.

## Auth Flow Details

### 1. Admin Auth (Supabase Email/Password)

**Flow:**
```
/admin/login/+page.svelte → +page.server.ts → hooks.server.ts → Supabase Auth
                                    ↓
                          +layout.server.ts (protection)
                                    ↓
                          /api/auth/logout/+server.ts
```

**Key Files:**
| File | Role |
|------|------|
| `src/routes/admin/login/+page.svelte` | Login form UI |
| `src/routes/admin/login/+page.server.ts` | Validates credentials via `locals.supabase.auth.signInWithPassword()` |
| `src/hooks.server.ts` | Initializes Supabase client, `safeGetSession()`, protects `/admin` routes |
| `src/routes/admin/+layout.server.ts` | Layout-level auth guard (defense in depth) |
| `src/routes/api/auth/logout/+server.ts` | Calls `locals.supabase.auth.signOut()` |

**Session:** Supabase-managed httpOnly cookie (`sb-*`)

### 2. Client Auth (Twilio SMS OTP)

**Flow:**
```
/reschedule/+page.svelte → /api/otp/send → Twilio SMS → /api/otp/verify
                                                              ↓
                                                   client_session cookie (30 min)
                                                              ↓
                                        /api/bookings/mine (validates cookie + phone)
```

**Key Files:**
| File | Role |
|------|------|
| `src/routes/reschedule/+page.svelte` | Client portal with phone/OTP inputs |
| `src/routes/api/otp/send/+server.ts` | Normalizes phone to E.164, calls Twilio Verify API |
| `src/routes/api/otp/verify/+server.ts` | Verifies code, creates `client_session` cookie |
| `src/routes/api/bookings/mine/+server.ts` | Validates session, returns bookings by phone |
| `src/routes/api/bookings/reschedule/+server.ts` | Validates session + phone ownership |

**Session:** `client_session` cookie with `{ phone, token, expires }` - httpOnly, secure, sameSite=strict, 30 min TTL

### 3. Google OAuth (Drive/Sheets/Docs)

**Flow:**
```
/auth/google → Google consent → /auth/callback → localStorage store
                                                        ↓
                              googleFetch() wrapper with auto-refresh
                                                        ↓
                              /api/google/drive|sheets|docs (server proxies)
```

**Key Files:**
| File | Role |
|------|------|
| `src/routes/auth/google/+server.ts` | Redirects to Google with scopes & state param |
| `src/routes/auth/callback/+page.server.ts` | Exchanges code for tokens, gets user info |
| `src/routes/auth/callback/+page.svelte` | Stores tokens via `setGoogleTokens()`, redirects |
| `src/lib/google/client.ts` | OAuth utilities: `getGoogleAuthUrl()`, `exchangeCodeForTokens()`, `refreshAccessToken()` |
| `src/lib/google/token-refresh.ts` | `getValidToken()` with 5-min refresh buffer |
| `src/lib/google/api-client.ts` | `googleFetch()` wrapper, handles auth headers & 401s |
| `src/lib/stores/google.ts` | Persists tokens to localStorage, derived stores for status |
| `src/routes/api/google/*/+server.ts` | Server proxies that refresh tokens on 401 |

**Tokens:** localStorage (`google_tokens`) - access token 1hr, refresh token indefinite

### Session Storage Summary

| Auth | Storage | Duration | Flags |
|------|---------|----------|-------|
| Admin | Supabase cookie | Configurable | httpOnly, secure, sameSite |
| Client | `client_session` cookie | 30 min | httpOnly, secure, sameSite=strict |
| Google | localStorage | 1hr access / indefinite refresh | Client-side |

### Environment Variables

**Public:**
- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`

**Private:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_SHARED_DRIVE_ID`

### Payments
- Stripe Checkout (redirect, not embedded)
- Webhook at `/api/payments/webhook`

### Validation
- Zod schemas for all inputs
- Server-side validation required

## Debugging

When troubleshooting or debugging, state the current hypothesis and what evidence would confirm/reject it before making changes.

## Business Context

- Location: West Broward, South Florida
- Target: $10k monthly revenue
- Promo: "Fresh Start" 25% off (first booking)
- 5 service packages ($45-$2000)
