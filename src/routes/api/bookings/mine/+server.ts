import { json, error } from '@sveltejs/kit';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { RequestHandler } from './$types';

interface ClientSession {
  phone: string;
  token: string;
  expires: number;
}

export const GET: RequestHandler = async ({ cookies }) => {
  // Check for valid session cookie
  const sessionCookie = cookies.get('client_session');

  if (!sessionCookie) {
    throw error(401, 'Not authenticated');
  }

  let session: ClientSession;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    throw error(401, 'Invalid session');
  }

  // Check if session is expired
  if (session.expires < Date.now()) {
    cookies.delete('client_session', { path: '/' });
    throw error(401, 'Session expired');
  }

  const phone = session.phone;

  // Fetch bookings for this phone via repository
  try {
    const bookings = await bookingRepo.listByContact(phone, ['pending', 'confirmed']);

    return json({
      bookings: bookings.map((b) => ({
        id: b.id,
        serviceName: b.serviceName,
        price: b.price,
        date: b.date,
        time: b.time,
        status: b.status,
      })),
    });
  } catch (err) {
    console.error('Failed to fetch bookings:', err);
    throw error(500, 'Failed to fetch bookings');
  }
};
