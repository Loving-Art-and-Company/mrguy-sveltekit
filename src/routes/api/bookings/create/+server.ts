import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { supabaseAdmin } from '$lib/server/supabase';
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

    // Create booking in database
    const { data: newBooking, error: dbError } = await supabaseAdmin
      .from('bookings')
      .insert({
        service_id: booking.service.id,
        service_name: booking.service.name,
        service_price: booking.service.price,
        scheduled_date: booking.schedule.date,
        scheduled_time: booking.schedule.time,
        address_street: booking.address.street,
        address_city: booking.address.city,
        address_state: booking.address.state,
        address_zip: booking.address.zip,
        address_instructions: booking.address.instructions || null,
        customer_name: booking.contact.name,
        customer_phone: cleanPhone,
        customer_email: booking.contact.email || null,
        status: 'pending',
        vehicle_info_pending: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating booking:', dbError);
      // Don't expose DB errors to client, but still try to send notifications
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
