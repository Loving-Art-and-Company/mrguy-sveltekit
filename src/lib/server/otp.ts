import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { normalizePhone } from '$lib/server/phone';

const OTP_COOKIE = 'client_otp';
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

interface OtpPayload {
  phone: string;
  codeHash: string;
  expires: number;
  attempts: number;
}

function getSecret(): string {
  const secret = privateEnv.CSRF_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('CSRF_SECRET must be configured for OTP signing');
  }
  return secret;
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex');
}

function hashCode(phone: string, code: string, expires: number): string {
  return sign(`${phone}:${code}:${expires}`);
}

function encodePayload(payload: OtpPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodePayload(value: string): OtpPayload | null {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as OtpPayload;
  } catch {
    return null;
  }
}

function serialize(payload: OtpPayload): string {
  const encoded = encodePayload(payload);
  return `${encoded}.${sign(encoded)}`;
}

function parse(token: string): OtpPayload | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  return decodePayload(encoded);
}

function setCookie(cookies: Cookies, payload: OtpPayload): void {
  cookies.set(OTP_COOKIE, serialize(payload), {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: OTP_TTL_MS / 1000,
  });
}

export function clearOtpSession(cookies: Cookies): void {
  cookies.delete(OTP_COOKIE, { path: '/' });
}

export function createOtpSession(cookies: Cookies, phone: string): string {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || normalizedPhone.length !== 10) {
    throw new Error('Invalid phone number');
  }

  const code = randomInt(100000, 1000000).toString();
  const expires = Date.now() + OTP_TTL_MS;

  setCookie(cookies, {
    phone: normalizedPhone,
    codeHash: hashCode(normalizedPhone, code, expires),
    expires,
    attempts: 0,
  });

  return code;
}

export function verifyOtpSession(cookies: Cookies, phone: string, code: string): boolean {
  const token = cookies.get(OTP_COOKIE);
  if (!token) return false;

  const payload = parse(token);
  if (!payload) {
    clearOtpSession(cookies);
    return false;
  }

  if (payload.expires < Date.now()) {
    clearOtpSession(cookies);
    return false;
  }

  const normalizedPhone = normalizePhone(phone);
  if (payload.phone !== normalizedPhone) {
    clearOtpSession(cookies);
    return false;
  }

  const expectedHash = hashCode(payload.phone, code, payload.expires);
  const isMatch = timingSafeEqual(Buffer.from(payload.codeHash), Buffer.from(expectedHash));

  if (isMatch) {
    clearOtpSession(cookies);
    return true;
  }

  const nextAttempts = payload.attempts + 1;
  if (nextAttempts >= OTP_MAX_ATTEMPTS) {
    clearOtpSession(cookies);
    return false;
  }

  setCookie(cookies, { ...payload, attempts: nextAttempts });
  return false;
}
