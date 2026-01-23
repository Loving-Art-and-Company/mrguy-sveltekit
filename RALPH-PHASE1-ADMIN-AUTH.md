# Ralph Loop PRD: Phase 1 - Admin Authentication

## Overview
Implement admin login system using Supabase Auth for the Mr. Guy Mobile Detail dashboard.

## Tech Stack
- SvelteKit (already configured)
- Supabase Auth (email/password)
- Existing `supabaseAdmin` client in `$lib/server/supabase.ts`

## Files to Create

### 1. `/src/routes/admin/login/+page.svelte`
Admin login form with:
- Email input (required, type="email")
- Password input (required, type="password")
- Submit button "Sign In"
- Error message display
- Redirect to `/admin` on success
- Simple, clean styling matching existing site

### 2. `/src/routes/admin/login/+page.server.ts`
Server actions:
- `default` action handles form submission
- Call Supabase `signInWithPassword`
- Set auth cookie on success
- Return error on failure
- Redirect to `/admin` on success

### 3. `/src/routes/admin/+layout.svelte`
Admin layout with:
- Header: "Mr. Guy Admin" + Logout button
- Sidebar navigation (placeholder links for now):
  - Dashboard
  - Bookings
  - Calendar
  - Revenue
- Main content slot
- Dark/professional styling

### 4. `/src/routes/admin/+layout.server.ts`
Auth guard:
- Check for valid Supabase session
- If no session, redirect to `/admin/login`
- Pass user data to layout

### 5. `/src/routes/admin/+page.svelte`
Dashboard home:
- Welcome message with admin email
- Placeholder cards for:
  - "Today's Bookings" (count)
  - "This Week's Revenue" ($)
  - "Pending Bookings" (count)
- Links to other admin pages

### 6. `/src/routes/api/auth/logout/+server.ts`
Logout endpoint:
- POST handler
- Call Supabase `signOut`
- Clear cookies
- Return redirect to `/admin/login`

### 7. `/src/hooks.server.ts` (modify existing or create)
Request handler:
- Create Supabase client with cookies
- Attach session to `event.locals`

## Supabase Setup Required
The admin user should already exist in Supabase Auth. If not:
```sql
-- Run in Supabase SQL Editor if needed
-- Admin user is created via Supabase Dashboard > Authentication > Users
```

## Acceptance Criteria

### AC1: Login Page Renders
- [ ] Navigate to `/admin/login` shows login form
- [ ] Form has email and password fields
- [ ] Submit button is visible

### AC2: Invalid Login Shows Error
- [ ] Enter wrong credentials
- [ ] Form shows "Invalid login credentials" error
- [ ] User stays on login page

### AC3: Valid Login Redirects
- [ ] Enter valid admin credentials
- [ ] User redirected to `/admin`
- [ ] Dashboard page renders

### AC4: Auth Guard Works
- [ ] Visit `/admin` without logging in
- [ ] Redirected to `/admin/login`

### AC5: Logout Works
- [ ] Click logout button in admin header
- [ ] Redirected to `/admin/login`
- [ ] Cannot access `/admin` without logging in again

### AC6: Session Persists
- [ ] Login successfully
- [ ] Refresh page
- [ ] Still logged in (not redirected to login)

## Verification Commands

```bash
# Build succeeds
npm run build

# Type check passes
npm run check

# Dev server starts
npm run dev

# Test endpoints (manual)
# 1. Visit http://localhost:5173/admin → should redirect to /admin/login
# 2. Login with valid credentials → should redirect to /admin
# 3. Refresh → should stay on /admin
# 4. Click logout → should redirect to /admin/login
```

## Dependencies
No new dependencies required. Uses existing:
- `@supabase/supabase-js`
- `@supabase/ssr` (may need to install for cookie handling)

## Notes
- Use Svelte 5 runes syntax (`$state`, `$derived`)
- Follow existing code patterns in the codebase
- Keep styling consistent with landing page (Tailwind)

## Admin Credentials (for testing)
```
Email: admin@mrguydetail.com
Password: MrGuy2024!
```

## Exit Conditions for Ralph
1. `npm run build` succeeds with no errors
2. `npm run check` passes TypeScript validation
3. All 6 acceptance criteria verified manually or via test
