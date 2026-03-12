import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import { checkRateLimit } from '$lib/server/rateLimit';
import type { RequestHandler } from './$types';
import { buildBookableTimeSlots, findConflictingHold, formatTimeLabel, isBookableDate } from '$lib/scheduling';
import { bookings } from '$lib/server/schema';
import { z } from 'zod';

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

const rescheduleSchema = z.object({
  bookingId: z.string().min(1),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

export const POST: RequestHandler = async ({ request, cookies }) => {
  const rateLimit = await checkRateLimit(
    `rl:booking-reschedule:${getClientIp(request)}`,
    10,
    60
  );

  if (!rateLimit.success) {
    throw error(429, 'Too many requests. Please wait a moment and try again.');
  }

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
    const rawBody = await request.json();
    const parsed = rescheduleSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw error(400, 'Invalid reschedule request');
    }
    body = parsed.data;
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

  if (!isBookableDate(newDate)) {
    throw error(400, 'Service is not available on Sundays');
  }

  const validTimeValues = new Set(buildBookableTimeSlots(newDate).map((slot) => slot.value));

  // Fetch the booking to verify ownership
  const booking = await bookingRepo.getForReschedule(bookingId);

  if (!booking) {
    throw error(404, 'Booking not found');
  }

  // Verify phone number matches
  if (booking.contact !== phone) {
    throw error(403, 'You do not have permission to reschedule this booking');
  }

  // Verify booking is in a reschedulable status
  if (booking.status !== 'confirmed' && booking.status !== 'pending' && booking.status !== 'rescheduled') {
    throw error(400, `Cannot reschedule a booking with status: ${booking.status}`);
  }

  // Verify original booking date is in the future
  const originalDate = new Date(booking.date + 'T12:00:00');
  if (originalDate <= today) {
    throw error(400, 'Cannot reschedule a past booking');
  }

  // Update the booking
  const requestedTime = newTime || booking.time || '';
  if (!requestedTime || !validTimeValues.has(requestedTime)) {
    throw error(400, 'Selected time is outside booking hours for that day');
  }

  const updateData: { date: string; time?: string } = {
    date: newDate,
  };

  if (newTime) {
    updateData.time = newTime;
  }

  const updatedBooking = await bookingRepo.withScheduleLock(newDate, async (tx) => {
    const holds = await bookingRepo.listScheduleHoldsByDate(newDate, {
      executor: tx,
      excludeBookingId: bookingId,
    });
    const conflict = findConflictingHold(holds, requestedTime);

    if (conflict) {
      return { conflict };
    }

    const rows = await tx
      .update(bookings)
      .set({
        ...updateData,
        status: 'rescheduled',
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    return rows[0] ?? null;
  });

  if (updatedBooking && 'conflict' in updatedBooking) {
    throw error(409, `That ${formatTimeLabel(requestedTime)} slot is no longer available.`);
  }

  if (!updatedBooking) {
    throw error(500, 'Failed to reschedule booking');
  }

  return json({
    success: true,
    message: 'Reschedule request received. Pablo still needs to confirm your new time.',
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

function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  const direct = request.headers.get('x-real-ip');
  return xff?.split(',')[0]?.trim() || direct || 'unknown';
}
