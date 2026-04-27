import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { env } from '$env/dynamic/private';
import { getPromoPrice, resolveServiceSelection } from '$lib/data/services';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import { isFirstTimeClient } from '$lib/server/promo';
import { normalizePhone } from '$lib/server/phone';
import { checkRateLimit } from '$lib/server/rateLimit';
import { bookings } from '$lib/server/schema';
import {
  buildBookableTimeSlots,
  findConflictingHold,
  formatTimeLabel,
  isBookableDate,
} from '$lib/scheduling';
import {
  notifyOwnerOfBookingRequest,
  sendCustomerBookingRequestReceived,
} from '$lib/server/email';
import { sendLeadToSink } from '$lib/server/leadSink';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';
const BOOKING_ACK_TEMPLATE_ID = 'mrguy-booking-request-received-v1';

// Validation schema for modal booking
const bookingSchema = z.object({
  service: z.object({
    id: z.string(),
  }),
  schedule: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/)
  }),
  address: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().length(2).default('FL'),
    zip: z.string().regex(/^\d{5}$/),
    instructions: z.string().optional()
  }),
  contact: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional().or(z.literal('')),
    vehicle: z.string().trim().min(3).max(120)
  })
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const rateLimit = await checkRateLimit(
      `rl:booking-create:${getClientIp(request)}`,
      6,
      60
    );

    if (!rateLimit.success) {
      throw error(429, 'Too many requests. Please wait a moment and try again.');
    }

    const body = await request.json();

    // Validate input
    const result = bookingSchema.safeParse(body);
    if (!result.success) {
      return json(
        { message: 'Invalid booking data', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const booking = result.data;
    const validTimeValues = new Set(buildBookableTimeSlots(booking.schedule.date).map((slot) => slot.value));

    if (!isBookableDate(booking.schedule.date)) {
      return json({ message: 'Service is not available on Sundays.' }, { status: 400 });
    }

    if (!validTimeValues.has(booking.schedule.time)) {
      return json({ message: 'Selected time is outside booking hours for that day.' }, { status: 400 });
    }

    // Derive service name and price server-side from package ID
    const pkg = resolveServiceSelection(booking.service.id);
    if (!pkg) {
      return json({ message: 'Invalid service selected' }, { status: 400 });
    }

    // Normalize phone to canonical 10-digit format
    const cleanPhone = normalizePhone(booking.contact.phone);

    // Check promo eligibility: is promo enabled + is this a first-time client?
    const promoEnabled = env.PROMO_ENABLED !== 'false';
    const firstTime = promoEnabled ? await isFirstTimeClient(cleanPhone) : false;
    const finalPrice = firstTime ? getPromoPrice(pkg.priceHigh) : pkg.priceHigh;
    const promoCode = firstTime ? 'fresh_start_25' : null;

    // Build notes with address info (no address columns in bookings schema)
    const notes = [
      `Address: ${booking.address.street}, ${booking.address.city}, ${booking.address.state} ${booking.address.zip}`,
      booking.contact.email ? `Email: ${booking.contact.email}` : null,
      booking.address.instructions ? `Instructions: ${booking.address.instructions}` : null,
      `Vehicle: ${booking.contact.vehicle}`,
    ]
      .filter(Boolean)
      .join('\n');

    // Generate booking ID
    const bookingId = bookingRepo.generateBookingId(booking.schedule.date);

    const newBooking = await bookingRepo.withScheduleLock(booking.schedule.date, async (tx) => {
      const holds = await bookingRepo.listScheduleHoldsByDate(booking.schedule.date, { executor: tx });
      const conflict = findConflictingHold(holds, booking.schedule.time);

      if (conflict) {
        return { conflict };
      }

      const rows = await tx
        .insert(bookings)
        .values({
          id: bookingId,
          brandId: MRGUY_BRAND_ID,
          clientName: booking.contact.name,
          serviceName: pkg.name,
          price: finalPrice,
          date: booking.schedule.date,
          time: booking.schedule.time,
          contact: cleanPhone,
          promoCode,
          notes,
          status: 'pending',
          paymentStatus: 'unpaid',
        })
        .returning();

      return rows[0] ?? null;
    });

    if (newBooking && 'conflict' in newBooking) {
      return json(
        {
          message: `That ${formatTimeLabel(booking.schedule.time)} slot is no longer available. Please choose a different time.`,
          conflict: true,
        },
        { status: 409 }
      );
    }

    if (!newBooking) {
      console.error('Database error creating booking');
      throw error(500, 'Failed to create booking. Please try again or call 954-804-4747.');
    }

    // Build notification payload with server-derived values
    const notificationPayload = {
      ...booking,
      service: { id: pkg.id, name: pkg.name, price: finalPrice },
    };

    await sendLeadToSink({
      schemaVersion: '2026-03-08',
      brand: 'mrguy',
      leadId: newBooking.id,
      sourceChannel: 'booking_form',
      sourceMessageId: newBooking.id,
      sourceThreadId: newBooking.id,
      receivedAt: new Date().toISOString(),
      contactName: booking.contact.name,
      contactEmail: booking.contact.email || undefined,
      contactPhone: cleanPhone,
      serviceType: pkg.name,
      requestedDate: `${booking.schedule.date}T${booking.schedule.time}:00`,
      requestedLocation: `${booking.address.street}, ${booking.address.city}, ${booking.address.state} ${booking.address.zip}`,
      freeformNotes: notes,
      missingFields: [],
      qualificationStatus: 'human_review',
      escalationReasons: [
        'booking_confirmation_requires_human',
      ],
      autoResponseSent: Boolean(booking.contact.email),
      autoResponseTemplateId: booking.contact.email ? BOOKING_ACK_TEMPLATE_ID : undefined,
      humanOwner: 'Pablo',
      auditEntries: [
        {
          at: new Date().toISOString(),
          kind: 'lead_received',
          note: 'Booking request created from website form',
        },
        ...(booking.contact.email
          ? [{
              at: new Date().toISOString(),
              kind: 'auto_response_sent' as const,
              templateId: BOOKING_ACK_TEMPLATE_ID,
            }]
          : []),
      ],
    });

    // Send email notifications (don't block booking creation)
    const notificationPromises = [
      notifyOwnerOfBookingRequest(notificationPayload),
      sendCustomerBookingRequestReceived(notificationPayload),
    ];

    // Fire and forget - don't wait for notifications to complete
    Promise.allSettled(notificationPromises).then(results => {
      const [ownerEmail, customerEmail] = results;
      if (ownerEmail.status === 'rejected' || !ownerEmail.value) {
        console.warn('Failed to notify owner of booking (email)');
      }
      if (customerEmail.status === 'rejected' || !customerEmail.value) {
        console.warn('Failed to send booking request email to customer');
      }
    });

    return json({
      success: true,
      bookingId: newBooking?.id || 'pending',
      message: 'Booking request received. Pablo will review and confirm your selected time.',
      promoApplied: firstTime,
      price: finalPrice,
    });

  } catch (err) {
    // Re-throw SvelteKit HttpErrors (429, 400, etc.) as-is
    if (isHttpError(err)) throw err;

    console.error('Booking creation error:', err);
    throw error(500, 'Failed to create booking. Please try again or call 954-804-4747.');
  }
};

function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  const direct = request.headers.get('x-real-ip');
  return xff?.split(',')[0]?.trim() || direct || 'unknown';
}
