/**
 * Promo eligibility logic — server-only
 * Checks if a phone number has any existing bookings (first-time client check)
 */

import { db } from '$lib/server/db';
import { bookings } from '$lib/server/schema';
import { eq, and, or, count } from 'drizzle-orm';
import { normalizePhone } from '$lib/server/phone';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

/**
 * Check if a phone number belongs to a first-time client.
 * Returns true if no existing bookings found for this phone number.
 * Handles both 10-digit and +1 E.164 formats in the database for backwards compatibility.
 */
export async function isFirstTimeClient(rawPhone: string): Promise<boolean> {
  const phone10 = normalizePhone(rawPhone);
  if (phone10.length !== 10) return false; // invalid phone, deny promo

  const e164 = `+1${phone10}`;

  const result = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.brandId, MRGUY_BRAND_ID),
        or(
          eq(bookings.contact, phone10),
          eq(bookings.contact, e164)
        )
      )
    );
  return Number(result[0]?.count ?? 0) === 0;
}
