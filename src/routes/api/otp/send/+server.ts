import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { normalizePhone, normalizePhoneE164 } from '$lib/server/phone';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { phone } = await request.json();

    if (!phone) {
      throw error(400, 'Phone number is required');
    }

    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_VERIFY_SERVICE_SID) {
      throw error(503, 'OTP service not configured');
    }

    const normalizedPhone = normalizePhoneE164(phone);
    const canonicalPhone = normalizePhone(phone);

    if (!canonicalPhone) {
      throw error(400, 'Invalid phone number');
    }

    // Send OTP via Twilio Verify
    const twilioUrl = `https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/Verifications`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
      },
      body: new URLSearchParams({
        To: normalizedPhone,
        Channel: 'sms',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twilio error:', errorData);
      throw error(400, 'Failed to send verification code');
    }

    return json({ success: true, message: 'Verification code sent' });
  } catch (err) {
    console.error('OTP send error:', err);
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to send verification code');
  }
};
