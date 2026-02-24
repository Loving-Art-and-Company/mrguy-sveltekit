import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { env } from '$env/dynamic/private';
import { SERVICE_PACKAGES, getPromoPrice } from '$lib/data/services';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import { isFirstTimeClient } from '$lib/server/promo';
import { normalizePhone } from '$lib/server/phone';
import { notifyOwnerOfBooking, sendCustomerConfirmation } from '$lib/server/email';
import { notifyOwnerOfBookingSMS, sendCustomerConfirmationSMS } from '$lib/server/sms';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

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
    email: z.string().email().optional().or(z.literal(''))
  })
});

export const POST: RequestHandler = async ({ request }) => {
  try {
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

    // Derive service name and price server-side from package ID
    const pkg = SERVICE_PACKAGES.find((p) => p.id === booking.service.id);
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
      booking.address.instructions ? `Instructions: ${booking.address.instructions}` : null,
      'Vehicle info pending',
    ]
      .filter(Boolean)
      .join('\n');

    // Generate booking ID
    const bookingId = bookingRepo.generateBookingId(booking.schedule.date);

    // Create booking in database — derive all pricing server-side
    const newBooking = await bookingRepo.insert({
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
    });

    if (!newBooking) {
      console.error('Database error creating booking');
    }

    // Build notification payload with server-derived values
    const notificationPayload = {
      ...booking,
      service: { id: pkg.id, name: pkg.name, price: finalPrice },
    };

    // Send email + SMS notifications (don't block on these)
    const notificationPromises = [
      notifyOwnerOfBooking(notificationPayload),
      sendCustomerConfirmation(notificationPayload),
      notifyOwnerOfBookingSMS(notificationPayload),
      sendCustomerConfirmationSMS(notificationPayload),
    ];

    // Fire and forget - don't wait for notifications to complete
    Promise.allSettled(notificationPromises).then(results => {
      const [ownerEmail, customerEmail, ownerSMS, customerSMS] = results;
      if (ownerEmail.status === 'rejected' || !ownerEmail.value) {
        console.warn('Failed to notify owner of booking (email)');
      }
      if (customerEmail.status === 'rejected' || !customerEmail.value) {
        console.warn('Failed to send customer confirmation (email)');
      }
      if (ownerSMS.status === 'rejected' || !ownerSMS.value) {
        console.warn('Failed to notify owner of booking (SMS)');
      }
      if (customerSMS.status === 'rejected' || !customerSMS.value) {
        console.warn('Failed to send customer confirmation (SMS)');
      }
    });

    return json({
      success: true,
      bookingId: newBooking?.id || 'pending',
      message: 'Booking created successfully',
      promoApplied: firstTime,
      price: finalPrice,
    });

  } catch (err) {
    console.error('Booking creation error:', err);
    throw error(500, 'Failed to create booking. Please try again or call 954-804-4747.');
  }
};
