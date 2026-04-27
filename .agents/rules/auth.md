# Authentication Systems

Mr. Guy has three independent auth systems.

## 1. Admin Auth (Custom Email/Password)

**Flow:**
```text
/admin/login/+page.svelte -> +page.server.ts -> src/lib/server/auth.ts -> hooks.server.ts
                                    |
                          +layout.server.ts (protection)
                                    |
                          /api/auth/logout/+server.ts
```

**Key Files:**
- `src/routes/admin/login/+page.svelte` - login form UI
- `src/routes/admin/login/+page.server.ts` - validates credentials through `authenticate()`
- `src/lib/server/auth.ts` - bcrypt password verification, login attempts, DB-backed sessions
- `src/hooks.server.ts` - verifies sessions and protects `/admin` routes
- `src/routes/admin/+layout.server.ts` - layout-level auth guard
- `src/routes/api/auth/logout/+server.ts` - invalidates admin session

**Session:** `session` cookie backed by the `sessions` table.

## 2. Client Auth (Email OTP)

**Flow:**
```text
/reschedule/+page.svelte -> /api/otp/send -> email code -> /api/otp/verify
                                                              |
                                                   client_session cookie (30 min)
                                                              |
                                        /api/bookings/mine (validates cookie + phone)
```

**Key Files:**
- `src/routes/api/otp/send/+server.ts` - finds the email address linked to the booking phone and sends the code
- `src/routes/api/otp/verify/+server.ts` - verifies the code and creates `client_session`
- `src/lib/server/otp.ts` - creates and verifies the signed OTP cookie
- `src/routes/api/bookings/mine/+server.ts` - validates session and returns bookings by phone

**Session:** `client_session` cookie: httpOnly, secure, sameSite=strict, 30 min TTL.

## 3. Google OAuth (Workspace Integrations)

**Flow:**
```text
/auth/google -> Google consent -> /auth/callback -> localStorage store
                                                         |
                              googleFetch() wrapper with auto-refresh
```

**Key Files:**
- `src/lib/google/client.ts` - OAuth utilities: `getGoogleAuthUrl()`, `exchangeCodeForTokens()`
- `src/lib/google/token-refresh.ts` - `getValidToken()` with 5-minute refresh buffer
- `src/lib/google/api-client.ts` - `googleFetch()` wrapper, handles 401s
- `src/lib/stores/google.ts` - persists tokens to localStorage

**Tokens:** localStorage: access token 1 hour, refresh token indefinite.

## Session Storage Summary

| Auth | Storage | Duration | Flags |
|------|---------|----------|-------|
| Admin | `session` cookie + `sessions` table | Configured in `src/lib/server/auth.ts` | httpOnly, secure, sameSite |
| Client | `client_session` cookie | 30 min | httpOnly, secure, sameSite=strict |
| Google | localStorage | 1 hour access / indefinite refresh | Client-side |
