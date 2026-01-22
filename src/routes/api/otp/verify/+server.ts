import { json, error } from '@sveltejs/kit';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      throw error(400, 'Phone and verification code are required');
    }

    // Normalize phone number to E.164 format
    const normalizedPhone = normalizePhone(phone);

    // Verify OTP via Twilio Verify
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
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
      phone: normalizedPhone,
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

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
