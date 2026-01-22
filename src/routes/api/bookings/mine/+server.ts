import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { MRGUY_BRAND_ID } from '$lib/types/database';
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

  // Fetch bookings for this phone from Supabase
  const { data: bookings, error: dbError } = await supabaseAdmin
    .from('bookings')
    .select('id, clientName, serviceName, price, date, time, status, paymentStatus, created_at')
    .eq('brand_id', MRGUY_BRAND_ID)
    .eq('contact', phone)
    .in('status', ['pending', 'confirmed']) // Only upcoming bookings
    .order('date', { ascending: true });

  if (dbError) {
    console.error('Failed to fetch bookings:', dbError);
    throw error(500, 'Failed to fetch bookings');
  }

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
};
