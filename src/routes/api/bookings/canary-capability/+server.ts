import { error, json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const BOOKING_CANARY_HEADER = 'x-mrguy-booking-canary';

export const GET: RequestHandler = async ({ request }) => {
  const expectedToken = env.BOOKING_CANARY_SECRET;

  if (!expectedToken || request.headers.get(BOOKING_CANARY_HEADER) !== expectedToken) {
    throw error(404, 'Not found');
  }

  return json({
    ok: true,
    canaryProofVersion: '2026-04-30',
  });
};
