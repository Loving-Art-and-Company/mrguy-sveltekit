import { json, error } from '@sveltejs/kit';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { RequestHandler } from './$types';

interface ClientSession {
  phone: string;
  token: string;
  expires: number;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const sessionCookie = cookies.get('client_session');

  if (!sessionCookie) {
    throw error(401, 'Verification required');
  }

  let session: ClientSession;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    throw error(401, 'Invalid session');
  }

  if (session.expires < Date.now()) {
    cookies.delete('client_session', { path: '/' });
    throw error(401, 'Session expired');
  }

  try {
    const bookings = await bookingRepo.listByContact(session.phone, ['pending', 'confirmed', 'rescheduled']);

    return json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        serviceName: b.serviceName,
        price: b.price,
        date: b.date,
        time: b.time,
        status: b.status,
      })),
      message: bookings.length === 0 ? 'No upcoming bookings found for this phone number.' : undefined,
    });
  } catch (err) {
    console.error('Booking lookup error:', err);
    throw error(500, 'Failed to look up bookings');
  }
};
