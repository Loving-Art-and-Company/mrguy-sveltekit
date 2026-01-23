import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { MRGUY_BRAND_ID } from '$lib/types/database';
import type { RequestHandler } from './$types';

interface ClientSession {
  phone: string;
  token: string;
  expires: number;
}

interface RescheduleRequest {
  bookingId: string;
  newDate: string;
  newTime?: string;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  // Validate session
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

  if (session.expires < Date.now()) {
    cookies.delete('client_session', { path: '/' });
    throw error(401, 'Session expired');
  }

  const phone = session.phone;

  // Parse request body
  let body: RescheduleRequest;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid request body');
  }

  const { bookingId, newDate, newTime } = body;

  if (!bookingId || !newDate) {
    throw error(400, 'bookingId and newDate are required');
  }

  // Validate date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(newDate + 'T12:00:00');

  if (selectedDate <= today) {
    throw error(400, 'New date must be in the future');
  }

  // Validate date is not a Sunday
  if (selectedDate.getDay() === 0) {
    throw error(400, 'Service is not available on Sundays');
  }

  // Fetch the booking to verify ownership
  const { data: booking, error: fetchError } = await supabaseAdmin
    .from('bookings')
    .select('id, contact, status, date')
    .eq('id', bookingId)
    .eq('brand_id', MRGUY_BRAND_ID)
    .single();

  if (fetchError || !booking) {
    console.error('Booking fetch error:', fetchError);
    throw error(404, 'Booking not found');
  }

  // Verify phone number matches
  if (booking.contact !== phone) {
    throw error(403, 'You do not have permission to reschedule this booking');
  }

  // Verify booking is in a reschedulable status
  if (booking.status !== 'confirmed' && booking.status !== 'pending') {
    throw error(400, `Cannot reschedule a booking with status: ${booking.status}`);
  }

  // Verify original booking date is in the future
  const originalDate = new Date(booking.date + 'T12:00:00');
  if (originalDate <= today) {
    throw error(400, 'Cannot reschedule a past booking');
  }

  // Update the booking
  const updateData: { date: string; time?: string } = {
    date: newDate,
  };

  if (newTime) {
    updateData.time = newTime;
  }

  const { data: updatedBooking, error: updateError } = await supabaseAdmin
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select('id, serviceName, price, date, time, status')
    .single();

  if (updateError) {
    console.error('Booking update error:', updateError);
    throw error(500, 'Failed to reschedule booking');
  }

  return json({
    success: true,
    message: 'Booking rescheduled successfully',
    booking: {
      id: updatedBooking.id,
      serviceName: updatedBooking.serviceName,
      price: updatedBooking.price,
      date: updatedBooking.date,
      time: updatedBooking.time,
      status: updatedBooking.status,
    },
  });
};
