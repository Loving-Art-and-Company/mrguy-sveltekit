import { json, error } from '@sveltejs/kit';
import { normalizePhone } from '$lib/server/phone';
import { clearOtpSession, createOtpSession } from '$lib/server/otp';
import { sendEmail } from '$lib/server/email';
import { getRescheduleEmailByPhone } from '$lib/repositories/bookingRepo';
import type { RequestHandler } from './$types';

const RESCHEDULE_STATUSES = ['pending', 'confirmed', 'rescheduled'];

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local.slice(0, 1)}***@${domain}`;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { phone } = await request.json();

    if (!phone) {
      throw error(400, 'Phone number is required');
    }

    const canonicalPhone = normalizePhone(phone);
    if (!canonicalPhone || canonicalPhone.length !== 10) {
      throw error(400, 'Invalid phone number');
    }

    const emailLookup = await getRescheduleEmailByPhone(canonicalPhone, RESCHEDULE_STATUSES);
    if (!emailLookup.ok) {
      if (emailLookup.reason === 'multiple') {
        throw error(400, 'We found multiple emails for this phone number. Please call 954-804-4747 for help.');
      }
      throw error(400, 'We could not find an email address for this booking. Please call 954-804-4747 for help.');
    }

    const code = createOtpSession(cookies, canonicalPhone);
    const sent = await sendEmail({
      to: emailLookup.email,
      subject: 'Your Mr. Guy Detail verification code',
      html: `
        <h2>Your verification code</h2>
        <p>Use this code to view your booking and request a reschedule:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    if (!sent) {
      clearOtpSession(cookies);
      throw error(503, 'Failed to send verification code');
    }

    return json({
      success: true,
      message: 'Verification code sent',
      maskedDestination: maskEmail(emailLookup.email),
    });
  } catch (err) {
    console.error('OTP send error:', err);
    if (typeof err === 'object' && err !== null && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to send verification code');
  }
};
