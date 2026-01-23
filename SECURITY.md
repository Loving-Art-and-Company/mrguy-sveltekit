# Security Policy

## Vulnerability Disclosure

**Reporting Security Issues:**
- **Email:** [security@example.com]
- **Response Time:** Within 48 hours
- **Disclosure Policy:** Coordinated disclosure after fix is deployed

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested remediation (if any)

**Do NOT:**
- Publicly disclose the vulnerability before fix is deployed
- Test vulnerabilities on production systems without permission
- Access or modify data that doesn't belong to you

---

## Authentication & Authorization

### Authentication Method

**[Choose applicable method]:**

**Option 1: Supabase Auth**
- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Magic link email authentication
- Session managed via JWT tokens

**Option 2: Twilio Verify (SMS OTP)**
- Phone number-based authentication
- One-time password (OTP) via SMS
- Session tokens for client authentication
- Rate limiting: 5 OTP requests per hour per phone

**Option 3: None**
- No user authentication required
- Public read-only application

### Session Management

**[If applicable]:**
- **Session Duration:** [e.g., 7 days, 30 days]
- **Refresh Token:** [Yes/No, automatic refresh strategy]
- **Logout:** Clears session token and invalidates server-side session
- **Concurrent Sessions:** [Allowed/Single device only]

### Access Control

**[If applicable]:**

**Role-Based Access Control (RBAC):**
| Role | Permissions |
|------|-------------|
| `admin` | Full access to all features |
| `client` | View own bookings, update profile |
| `public` | Read-only access to public content |

**Row-Level Security (RLS) - Supabase:**
- Enabled on all tables containing user data
- Users can only access their own records
- Admin role bypasses RLS via service role key
- See `supabase/migrations/` for policy definitions

---

## Data Protection

### Encryption

**In Transit:**
- ✓ HTTPS enforced on all connections
- ✓ TLS 1.2+ required
- ✓ HSTS headers enabled (HTTP Strict Transport Security)

**At Rest:**
- ✓ Database encryption enabled (Supabase / provider default)
- ✓ Backups encrypted automatically
- ✓ API keys stored in encrypted environment variables

### Personally Identifiable Information (PII)

**PII Collected:**
- [List what PII is collected: email, phone, name, address, etc.]
- Example: Email address, phone number, payment information (via Stripe)

**PII Handling:**
- Payment information processed via Stripe (PCI-compliant, never stored locally)
- Personal data encrypted in database
- GDPR-compliant data deletion on user request
- Logs sanitized (no PII in application logs)

**Data Retention:**
- User data retained while account is active
- Deleted accounts purged after [X days]
- Payment records retained per Stripe's compliance requirements

### Backup Strategy

**[If applicable]:**
- **Frequency:** [Daily / Weekly / Continuous]
- **Provider:** [Supabase automated backups / Custom]
- **Retention:** [30 days / 90 days]
- **Recovery Tested:** [Last test date]

---

## Environment Variables

### All Required Variables

| Variable | Purpose | Client-Safe? | Location | How to Obtain |
|----------|---------|--------------|----------|---------------|
| `PUBLIC_SUPABASE_URL` | Database URL | ✓ Yes | Vercel env | Supabase dashboard |
| `PUBLIC_SUPABASE_ANON_KEY` | Client DB access | ✓ Yes | Vercel env | Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB access | ✗ **SERVER-ONLY** | Vercel secrets | Supabase → Settings → API |
| `STRIPE_SECRET_KEY` | Payment processing | ✗ **SERVER-ONLY** | Vercel secrets | Stripe dashboard → API keys |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Stripe | ✓ Yes | Vercel env | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | ✗ **SERVER-ONLY** | Vercel secrets | Stripe → Webhooks → Signing secret |
| `TWILIO_ACCOUNT_SID` | SMS auth | ✗ **SERVER-ONLY** | Vercel secrets | Twilio dashboard |
| `TWILIO_AUTH_TOKEN` | SMS auth | ✗ **SERVER-ONLY** | Vercel secrets | Twilio dashboard |
| `TWILIO_VERIFY_SERVICE_SID` | OTP service | ✗ **SERVER-ONLY** | Vercel secrets | Twilio Verify service |
| `GEMINI_API_KEY` | AI features | ✗ **SERVER-ONLY** | Vercel secrets | Google AI Studio |

### Variable Naming Conventions

**SvelteKit:**
- `PUBLIC_*` - Exposed to client (browser)
- No prefix - Server-only

**Vite/React:**
- `VITE_*` - Exposed to client
- No prefix - Server-only (backend API only)

**Important:** Client-safe variables are embedded in the browser bundle. NEVER prefix sensitive keys with `PUBLIC_` or `VITE_`.

### Storage Locations

**Local Development:**
- `.env.local` (NEVER commit to git)
- See `.env.example` for required variables

**Production:**
- Vercel: Environment Variables dashboard
- GitHub: Repository Secrets (for GitHub Actions)
- Shopify: App configuration (if using Shopify APIs)

**Secrets Management:**
- No secrets in code or git history
- Rotate keys quarterly or after suspected compromise
- Use different keys for development/staging/production

---

## Pre-Deployment Security Checklist

### Code Security

- [ ] No secrets committed to git
  ```bash
  git log -p | grep -E "(sk_live|sk_test|secret_key|api_key.*=)" | wc -l
  # Should return 0 (except in .env.example with placeholder values)
  ```
- [ ] `.env`, `.env.local`, `.env.production` in `.gitignore`
- [ ] No API keys hardcoded in source code
- [ ] No `console.log()` statements with sensitive data
- [ ] No commented-out credentials in code
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)

### Infrastructure Security

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured:
  - [ ] `Content-Security-Policy` (CSP)
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `Strict-Transport-Security` (HSTS)
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] CORS properly configured (whitelist specific origins)
- [ ] API rate limiting enabled
- [ ] DDoS protection enabled (via Vercel/Cloudflare)

### Database Security (if applicable)

- [ ] Row-Level Security (RLS) enabled on all tables with user data
- [ ] Service role key ONLY used server-side (never exposed to client)
- [ ] Database connection pooling configured
- [ ] Database backups verified and tested
- [ ] No public tables containing PII
- [ ] SQL injection prevented (use parameterized queries)

### Authentication Security (if applicable)

- [ ] Password requirements enforced (min length, complexity)
- [ ] Passwords hashed with bcrypt/Argon2 (never stored in plaintext)
- [ ] Session expiration configured (max 30 days)
- [ ] Brute-force protection enabled (rate limiting on login)
- [ ] MFA/2FA available for admin accounts
- [ ] OAuth redirect URLs whitelisted
- [ ] Account lockout after failed attempts
- [ ] Password reset tokens expire (15 minutes)

### Third-Party Services Security

- [ ] **Stripe:** Webhook signature verification enabled
- [ ] **Stripe:** Production keys (not test keys) in production
- [ ] **Stripe:** Checkout session validates amount server-side
- [ ] **Twilio:** Request validation enabled (signature verification)
- [ ] **Supabase:** RLS policies reviewed and tested
- [ ] **All APIs:** API keys rotated to production values

### Input Validation & Sanitization

- [ ] All user inputs validated (Zod / Joi / validation library)
- [ ] XSS prevention (DOMPurify or equivalent)
- [ ] SQL injection prevention (ORM or parameterized queries)
- [ ] File upload validation (type, size, content)
- [ ] Email validation on forms
- [ ] Phone number validation (libphonenumber)

### Logging & Monitoring

- [ ] Error logging configured (Sentry / logging service)
- [ ] No PII in application logs
- [ ] No credentials in error messages
- [ ] Failed login attempts logged
- [ ] Suspicious activity monitoring enabled
- [ ] Uptime monitoring configured

---

## Implemented Security Measures

**Current Protections:**

✓ **Stripe Checkout** - PCI-compliant payment processing (no card data stored locally)  
✓ **Supabase Row-Level Security (RLS)** - Database-level access control (see `supabase/migrations/`)  
✓ **Zod Validation** - All form inputs validated before processing  
✓ **DOMPurify Sanitization** - XSS prevention on user-generated content  
✓ **Server-Side API Key Verification** - All sensitive operations server-only  
✓ **HTTPS-Only Cookies** - Session cookies marked `Secure` and `HttpOnly`  
✓ **OTP Rate Limiting** - Max 5 SMS OTP requests per hour per phone  
✓ **Webhook Signature Verification** - Stripe webhooks validated before processing  
✓ **Automated Backups** - Daily database backups via Supabase  
✓ **Dependency Scanning** - Dependabot enabled for vulnerability detection

**Framework-Specific:**
- [Add framework-specific security features]
- Example (SvelteKit): CSRF protection via origin checks
- Example (iOS): Keychain storage for sensitive credentials

---

## Incident Response Plan

### Severity Levels

| Level | Definition | Example | Response Time |
|-------|------------|---------|---------------|
| **P0 - Critical** | Data breach, service completely down | Database compromised | Immediate (< 1 hour) |
| **P1 - High** | Security vulnerability, partial outage | API keys exposed | < 4 hours |
| **P2 - Medium** | Suspicious activity, degraded service | Unusual traffic pattern | < 24 hours |
| **P3 - Low** | Minor issue, no immediate risk | Outdated dependency | < 1 week |

### Response Procedure

**1. Identify & Assess (< 15 minutes)**
- Determine severity level (P0-P3)
- Identify scope of breach/incident
- Assess potential damage

**2. Contain (Immediate)**
- **P0:** Take affected service offline if necessary
- **P1:** Rotate compromised credentials immediately
- **P2:** Enable additional monitoring
- Preserve logs and evidence

**3. Notify (Per Severity)**
- **P0/P1:** Notify [team lead / security officer] immediately
- **P2/P3:** Create incident ticket, notify during business hours
- External notification if user data compromised (GDPR/legal requirements)

**4. Execute Rollback (if needed)**
- See `CLAUDE.md` → Workflows → Rollback Procedures
- For web apps: Revert to last known good deployment
- For databases: Restore from latest clean backup

**5. Remediate**
- Patch vulnerability
- Update affected dependencies
- Rotate all potentially compromised credentials
- Review and update RLS policies if database breach

**6. Document & Learn**
- Document incident in [location: incident log, Notion, etc.]
- Root cause analysis
- Update security policies
- Implement preventative measures

**7. Notify Users (if P0/P1)**
- Notify affected users within [X hours/days] per GDPR/compliance
- Provide clear steps for users to protect themselves
- Offer remediation (password reset, account monitoring, etc.)

### Rollback Procedure

**Web Applications (Vercel/Netlify):**
1. Go to deployment dashboard
2. Select previous working deployment
3. Click "Promote to Production"
4. Verify rollback successful
5. Investigate issue in development environment

**iOS Applications:**
1. Revert problematic commit: `git revert <commit-hash>`
2. Increment build number
3. Submit emergency update to App Store (expedited review)
4. Monitor crash reports

**Shopify Themes:**
1. Shopify Admin → Online Store → Themes
2. Find previous version in "Theme history"
3. Click "Publish" on last known good version
4. Verify theme loads correctly

**Database (Supabase):**
1. Identify last clean backup (Supabase dashboard → Database → Backups)
2. Restore from backup (creates new project)
3. Update connection strings in application
4. Verify data integrity

---

## Security Audits

**Audit Schedule:**
- **Quarterly:** Dependency vulnerability scan (`npm audit`)
- **Bi-annually:** Code security review
- **Annually:** Third-party penetration testing (if budget allows)

**Last Security Audit:**
- **Date:** [Last audit date]
- **Findings:** [Summary or link to report]
- **Remediation Status:** [All fixed / X items pending]

**Next Scheduled Audit:**
- **Date:** [Next audit date]

**Automated Scanning:**
- [x] Dependabot enabled (GitHub)
- [ ] Snyk integration
- [ ] SonarQube (optional)
- [ ] OWASP ZAP (optional)

---

## Compliance

**Applicable Regulations:**
- [x] GDPR (General Data Protection Regulation) - if serving EU users
- [ ] CCPA (California Consumer Privacy Act) - if serving California users
- [ ] PCI DSS (Payment Card Industry) - handled by Stripe, not applicable to app
- [ ] HIPAA - Not applicable

**Data Subject Rights (GDPR):**
- Right to access: [User can export data via settings]
- Right to deletion: [Account deletion available in settings]
- Right to portability: [Data export in JSON format]
- Right to rectification: [Users can update profile information]

---

## Additional Resources

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Supabase Security Best Practices:** https://supabase.com/docs/guides/platform/going-into-prod#security
- **Stripe Security:** https://stripe.com/docs/security
- **Vercel Security:** https://vercel.com/docs/security

---

## Security Contact

**Primary Contact:** [security@example.com]  
**Team Lead:** [Name / Slack / Email]  
**On-Call Rotation:** [PagerDuty / schedule link]

---

**Last Updated:** [Date]  
**Version:** 1.0
