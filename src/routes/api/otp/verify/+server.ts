import { json, error } from '@sveltejs/kit';
import { normalizePhone } from '$lib/server/phone';
import { verifyOtpSession } from '$lib/server/otp';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      throw error(400, 'Phone and verification code are required');
    }

    const canonicalPhone = normalizePhone(phone);

    if (!canonicalPhone || canonicalPhone.length !== 10) {
      throw error(400, 'Invalid phone number');
    }

    if (!/^\d{6}$/.test(String(code))) {
      throw error(400, 'Invalid or expired verification code');
    }

    if (!verifyOtpSession(cookies, canonicalPhone, String(code))) {
      throw error(400, 'Invalid or expired verification code');
    }

    // Set a session cookie for the verified phone
    const sessionToken = generateSessionToken();
    cookies.set('client_session', JSON.stringify({
      phone: canonicalPhone,
      token: sessionToken,
      expires: Date.now() + 30 * 60 * 1000, // 30 minutes
    }), {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 60, // 30 minutes
    });

    return json({ success: true, verified: true });
  } catch (err) {
    console.error('OTP verify error:', err);
    if (typeof err === 'object' && err !== null && 'status' in err) {
      throw err;
    }
    throw error(500, 'Verification failed');
  }
};

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
