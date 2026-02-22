// src/lib/server/auth.ts
// Custom bcrypt auth with DB sessions, rate limiting, timing-attack mitigation
// Adapted from FPP/Carolina pattern for MrGuy admin auth

import bcrypt from 'bcryptjs';
import { error } from '@sveltejs/kit';
import { db } from './db';
import { users, sessions, loginAttempts, adminUsers } from './schema';
import { eq, and, gt, lt, sql } from 'drizzle-orm';

const SALT_ROUNDS = 12;
const SESSION_DURATION_HOURS = 24;
const SESSION_COOKIE = 'mrguy_session';

export { SESSION_COOKIE };

export interface AuthUser {
  id: string;
  email: string;
  isActive: boolean;
}

// ============================================================
// PASSWORD HASHING
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// ============================================================
// TOKEN GENERATION
// ============================================================

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date } | null> {
  try {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    await db.insert(sessions).values({
      userId,
      token,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return { token, expiresAt };
  } catch (err) {
    console.error('[auth] createSession error:', err);
    return null;
  }
}

export async function verifySession(token: string): Promise<AuthUser | null> {
  try {
    // Clean up expired sessions
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

    // Get session
    const rows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (rows.length === 0) return null;
    const session = rows[0];

    // Get user
    const userRows = await db
      .select({
        id: users.id,
        email: users.email,
        isActive: users.isActive,
      })
      .from(users)
      .where(and(eq(users.id, session.userId), eq(users.isActive, true)))
      .limit(1);

    if (userRows.length === 0) return null;

    const user = userRows[0];
    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
    };
  } catch (err) {
    console.error('[auth] verifySession error:', err);
    return null;
  }
}

export async function invalidateSession(token: string): Promise<boolean> {
  try {
    await db.delete(sessions).where(eq(sessions.token, token));
    return true;
  } catch (err) {
    console.error('[auth] invalidateSession error:', err);
    return false;
  }
}

// ============================================================
// ADMIN CHECK
// ============================================================

/**
 * Check if a user is an admin for any brand.
 * MrGuy uses an admin_users table to link auth users to brands.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.userId, userId))
      .limit(1);
    return rows.length > 0;
  } catch (err) {
    console.error('[auth] isAdmin error:', err);
    return false;
  }
}

// ============================================================
// RATE LIMITING (login-specific, DB-backed)
// ============================================================

export async function checkLoginRateLimit(
  email: string,
  ipAddress: string
): Promise<{ allowed: boolean; remainingAttempts: number }> {
  try {
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.ipAddress, ipAddress),
          eq(loginAttempts.successful, false),
          gt(loginAttempts.createdAt, fifteenMinutesAgo)
        )
      );

    const attemptCount = Number(result[0]?.count ?? 0);
    const maxAttempts = 5;
    const remainingAttempts = Math.max(0, maxAttempts - attemptCount);

    return {
      allowed: attemptCount < maxAttempts,
      remainingAttempts,
    };
  } catch (err) {
    console.error('[auth] checkLoginRateLimit error:', err);
    // Fail closed
    return { allowed: false, remainingAttempts: 0 };
  }
}

export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  successful: boolean
): Promise<void> {
  try {
    await db.insert(loginAttempts).values({ email, ipAddress, successful });

    // Clean up old attempts (> 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, ninetyDaysAgo));
  } catch (err) {
    console.error('[auth] recordLoginAttempt error:', err);
  }
}

// ============================================================
// AUTHENTICATION
// ============================================================

/**
 * Authenticate admin user with email and password.
 * Timing-attack safe: always performs bcrypt comparison, even if user doesn't exist.
 */
export async function authenticate(
  email: string,
  password: string,
  ipAddress?: string
): Promise<{ user: AuthUser; error?: string } | { user: null; error: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const ip = ipAddress || '0.0.0.0';

    // Check rate limiting
    const rateLimit = await checkLoginRateLimit(normalizedEmail, ip);
    if (!rateLimit.allowed) {
      await recordLoginAttempt(normalizedEmail, ip, false);
      return {
        user: null,
        error: 'Too many login attempts. Please try again in 15 minutes.',
      };
    }

    // Get user with password hash
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const user = rows.length > 0 ? rows[0] : null;

    // TIMING ATTACK MITIGATION:
    // Always perform password comparison, even if user doesn't exist
    const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const passwordValid = await verifyPassword(password, hashToCompare);

    const userNotFound = !user;
    const userInactive = user && !user.isActive;
    const passwordInvalid = !passwordValid;

    if (userNotFound || userInactive || passwordInvalid) {
      await recordLoginAttempt(normalizedEmail, ip, false);

      if (userInactive) {
        return { user: null, error: 'Account is deactivated' };
      }
      return { user: null, error: 'Invalid email or password' };
    }

    // Verify this user is an admin
    const userIsAdmin = await isAdmin(user!.id);
    if (!userIsAdmin) {
      await recordLoginAttempt(normalizedEmail, ip, false);
      return { user: null, error: 'Invalid email or password' };
    }

    // Record successful login
    await recordLoginAttempt(normalizedEmail, ip, true);

    return {
      user: {
        id: user!.id,
        email: user!.email,
        isActive: user!.isActive,
      },
    };
  } catch (err) {
    console.error('[auth] authenticate error:', err);
    return { user: null, error: 'Authentication failed' };
  }
}

// ============================================================
// HELPERS
// ============================================================

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '0.0.0.0';
}

/**
 * Require authenticated admin user (middleware helper).
 * Throws 401 if user is not authenticated.
 */
export function requireAuth(locals: App.Locals): AuthUser {
  if (!locals.user) {
    throw error(401, 'Unauthorized: Authentication required');
  }
  return locals.user;
}
