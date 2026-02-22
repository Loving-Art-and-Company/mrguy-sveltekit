// src/lib/server/csrf.ts
// HMAC-SHA256 double-submit cookie CSRF protection

import { createHmac, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

function getSecret(): string {
  const secret = privateEnv.CSRF_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('CSRF_SECRET must be at least 32 characters');
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

/**
 * Issue a CSRF token and set it as a cookie.
 * Returns the token so it can also be rendered in a meta tag or form field.
 */
export function issueToken(cookies: Cookies): string {
  const payload = randomBytes(32).toString('hex');
  const signature = sign(payload);
  const token = `${payload}.${signature}`;

  cookies.set(CSRF_COOKIE, token, {
    path: '/',
    httpOnly: false, // client JS must read this for double-submit
    sameSite: 'strict',
    secure: true,
    maxAge: 60 * 60, // 1 hour
  });

  return token;
}

/**
 * Validate a CSRF token from the request header against the cookie.
 * Throws if validation fails.
 */
export function requireCsrf(cookies: Cookies, request: Request): void {
  const cookieToken = cookies.get(CSRF_COOKIE);
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    throw new Error('CSRF token missing');
  }

  if (cookieToken !== headerToken) {
    throw new Error('CSRF token mismatch');
  }

  const [payload, signature] = cookieToken.split('.');
  if (!payload || !signature) {
    throw new Error('CSRF token malformed');
  }

  const expected = sign(payload);
  if (signature !== expected) {
    throw new Error('CSRF token signature invalid');
  }
}
