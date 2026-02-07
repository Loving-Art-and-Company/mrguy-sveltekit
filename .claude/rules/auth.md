# Authentication Systems

Mr. Guy has three independent auth systems.

## 1. Admin Auth (Supabase Email/Password)

**Flow:**
```
/admin/login/+page.svelte -> +page.server.ts -> hooks.server.ts -> Supabase Auth
                                    |
                          +layout.server.ts (protection)
                                    |
                          /api/auth/logout/+server.ts
```

**Key Files:**
- `src/routes/admin/login/+page.svelte` -- login form UI
- `src/routes/admin/login/+page.server.ts` -- validates via `locals.supabase.auth.signInWithPassword()`
- `src/hooks.server.ts` -- initializes Supabase, `safeGetSession()`, protects `/admin` routes
- `src/routes/admin/+layout.server.ts` -- layout-level auth guard (defense in depth)
- `src/routes/api/auth/logout/+server.ts` -- calls `locals.supabase.auth.signOut()`

**Session:** Supabase-managed httpOnly cookie (`sb-*`)

## 2. Client Auth (Twilio SMS OTP)

**Flow:**
```
/reschedule/+page.svelte -> /api/otp/send -> Twilio SMS -> /api/otp/verify
                                                              |
                                                   client_session cookie (30 min)
                                                              |
                                        /api/bookings/mine (validates cookie + phone)
```

**Key Files:**
- `src/routes/api/otp/send/+server.ts` -- normalizes phone to E.164, calls Twilio Verify API
- `src/routes/api/otp/verify/+server.ts` -- verifies code, creates `client_session` cookie
- `src/routes/api/bookings/mine/+server.ts` -- validates session, returns bookings by phone

**Session:** `client_session` cookie -- httpOnly, secure, sameSite=strict, 30 min TTL

## 3. Google OAuth (Drive/Sheets/Docs)

**Flow:**
```
/auth/google -> Google consent -> /auth/callback -> localStorage store
                                                         |
                              googleFetch() wrapper with auto-refresh
```

**Key Files:**
- `src/lib/google/client.ts` -- OAuth utils: `getGoogleAuthUrl()`, `exchangeCodeForTokens()`
- `src/lib/google/token-refresh.ts` -- `getValidToken()` with 5-min refresh buffer
- `src/lib/google/api-client.ts` -- `googleFetch()` wrapper, handles 401s
- `src/lib/stores/google.ts` -- persists tokens to localStorage

**Tokens:** localStorage -- access token 1hr, refresh token indefinite

## Session Storage Summary

| Auth | Storage | Duration | Flags |
|------|---------|----------|-------|
| Admin | Supabase cookie | Configurable | httpOnly, secure, sameSite |
| Client | `client_session` cookie | 30 min | httpOnly, secure, sameSite=strict |
| Google | localStorage | 1hr access / indefinite refresh | Client-side |
