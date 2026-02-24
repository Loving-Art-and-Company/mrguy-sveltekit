/**
 * Canonical phone normalization — server-only
 * All phone numbers stored in bookings.contact should use this format: 10 digits, no prefix.
 * Example: "9548044747"
 */

/**
 * Normalize any phone input to a canonical 10-digit string.
 * Strips all non-digits, removes leading country code if present.
 * Returns empty string if input doesn't contain 10 usable digits.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  // Fallback: take last 10 digits
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}
