import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { normalizePhone, normalizePhoneE164 } from '$lib/server/phone';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      throw error(400, 'Phone and verification code are required');
    }

    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_VERIFY_SERVICE_SID) {
      throw error(503, 'OTP service not configured');
    }

    const normalizedPhone = normalizePhoneE164(phone);
    const canonicalPhone = normalizePhone(phone);

    if (!canonicalPhone) {
      throw error(400, 'Invalid phone number');
    }

    // Verify OTP via Twilio Verify
    const twilioUrl = `https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
      },
      body: new URLSearchParams({
        To: normalizedPhone,
        Code: code,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.status !== 'approved') {
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
    if (err instanceof Error && 'status' in err) {
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
