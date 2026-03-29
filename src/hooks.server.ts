// src/hooks.server.ts
// Custom auth, CSRF, CSP, and rate limiting
// Adapted from FPP/Carolina pattern for MrGuy admin auth

import { sequence } from '@sveltejs/kit';
import { type Handle, type HandleServerError, redirect } from '@sveltejs/kit';
import { building } from '$app/environment';
import * as Sentry from '@sentry/sveltekit';
import { verifySession, invalidateSession, SESSION_COOKIE, isAdmin } from '$lib/server/auth';
import { issueToken, requireCsrf } from '$lib/server/csrf';
import { checkRateLimit } from '$lib/server/rateLimit';
import { notifyError } from '$lib/server/email';
import { MRGUY_CANONICAL_ORIGIN } from '$lib/constants/site';
import crypto from 'node:crypto';

/** CSRF: origin-based validation for API routes */
function isValidOrigin(request: Request, url: URL): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === url.origin;
  } catch {
    return false;
  }
}

const securityHandle: Handle = async ({ event, resolve }) => {
  let sessionToken: string | undefined;

  const canonicalUrl = new URL(MRGUY_CANONICAL_ORIGIN);
  if (!building && event.url.hostname === 'mrguymobiledetail.com') {
    const redirectUrl = new URL(event.url);
    redirectUrl.protocol = canonicalUrl.protocol;
    redirectUrl.host = canonicalUrl.host;
    throw redirect(308, redirectUrl.toString());
  }

  // ── CSP nonce ───────────────────────────────────────────
  const nonce = crypto.randomBytes(16).toString('base64');
  event.locals.nonce = nonce;

  // ── CSRF (skip during prerendering — no cookies/secrets available) ──
  if (!building) {
    // Issue a CSRF token cookie on every request (clients read it for headers)
    issueToken(event.cookies);

    // Reject cross-origin state-changing API requests
    if (event.url.pathname.startsWith('/api/') && !isValidOrigin(event.request, event.url)) {
      // Allow Stripe webhooks (verified by signature, not origin)
      if (!event.url.pathname.includes('/webhook')) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate double-submit token on admin API mutations
    if (
      event.url.pathname.startsWith('/api/auth/') &&
      !['GET', 'HEAD', 'OPTIONS'].includes(event.request.method) &&
      !event.url.pathname.includes('/webhook')
    ) {
      try {
        requireCsrf(event.cookies, event.request);
      } catch {
        return new Response(JSON.stringify({ error: 'CSRF validation failed' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  // ── Session resolution (skip during prerendering) ───────
  if (!building) {
    sessionToken = event.cookies.get(SESSION_COOKIE);
    if (sessionToken) {
      const user = await verifySession(sessionToken);
      event.locals.user = user;
    } else {
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }

  // ── Admin route protection ──────────────────────────────
  if (event.url.pathname.startsWith('/admin')) {
    // Allow access to login page without auth
    if (event.url.pathname === '/admin/login') {
      if (event.locals.user) {
        throw redirect(303, '/admin');
      }
      return resolve(event);
    }

    // All other admin routes require auth
    if (!event.locals.user) {
      throw redirect(303, '/admin/login');
    }

    // Verify user is in admin_users table
    const userIsAdmin = await isAdmin(event.locals.user.id);
    if (!userIsAdmin) {
      // Authenticated but not an admin — sign out and redirect
      if (sessionToken) {
        await invalidateSession(sessionToken);
        event.cookies.delete(SESSION_COOKIE, { path: '/' });
      }
      throw redirect(303, '/admin/login');
    }

    // Rate limit admin routes
    const ip =
      event.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      event.request.headers.get('x-real-ip') ||
      '0.0.0.0';
    const rateOk = await checkRateLimit(`admin:${ip}`, 60, 60); // 60 req/min
    if (!rateOk) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ── Resolve with security headers ──────────────────────
  return resolve(event, {
    transformPageChunk({ html }) {
      return html.replace(/%sveltekit.nonce%/g, nonce);
    },
    filterSerializedResponseHeaders(name) {
      return name === 'content-range';
    },
  });
};

/** Send email notification for unhandled server errors and forward to Sentry */
const customHandleError: HandleServerError = async ({ error, event, status, message }) => {
  const err = error instanceof Error ? error : new Error(String(error));

  // Don't notify on 404s or expected client errors
  if (status === 404) return { message };

  console.error('Unhandled server error:', err);

  // Fire-and-forget — don't let notification failure break the error response
  notifyError({
    message: err.message || message,
    stack: err.stack,
    url: event.url.pathname,
    method: event.request.method,
    status,
  }).catch((notifyErr) => {
    console.warn('[handleError] Failed to send error notification:', notifyErr);
  });

  return { message };
};

// Export with Sentry sequence
export const handle = sequence(Sentry.sentryHandle(), securityHandle);

// Combine Sentry error handler with custom email notification
export const handleError = async (input: Parameters<HandleServerError>[0]) => {
  // First run custom email notification
  const result = await customHandleError(input);
  
  // Then forward to Sentry
  const sentryHandler = Sentry.handleErrorWithSentry();
  await sentryHandler(input);
  
  return result;
};
