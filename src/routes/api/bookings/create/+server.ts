import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import { notifyOwnerOfBooking, sendCustomerConfirmation } from '$lib/server/email';

// Validation schema for modal booking
const bookingSchema = z.object({
  service: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number()
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

    // Clean phone number (remove formatting)
    const cleanPhone = booking.contact.phone.replace(/\D/g, '');

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

    // Create booking in database — map validated data to actual schema columns
    const newBooking = await bookingRepo.insert({
      id: bookingId,
      clientName: booking.contact.name,
      serviceName: booking.service.name,
      price: booking.service.price,
      date: booking.schedule.date,
      time: booking.schedule.time,
      contact: cleanPhone,
      notes,
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    if (!newBooking) {
      console.error('Database error creating booking');
    }

    // Send email notifications (don't block on these)
    const emailPromises = [
      notifyOwnerOfBooking(booking),
      sendCustomerConfirmation(booking)
    ];

    // Fire and forget - don't wait for emails to complete
    Promise.allSettled(emailPromises).then(results => {
      const [ownerResult, customerResult] = results;
      if (ownerResult.status === 'rejected' || !ownerResult.value) {
        console.warn('Failed to notify owner of booking');
      }
      if (customerResult.status === 'rejected' || !customerResult.value) {
        console.warn('Failed to send customer confirmation email');
      }
    });

    return json({
      success: true,
      bookingId: newBooking?.id || 'pending',
      message: 'Booking created successfully'
    });

  } catch (err) {
    console.error('Booking creation error:', err);
    throw error(500, 'Failed to create booking. Please try again or call 954-804-4747.');
  }
};
