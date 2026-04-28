import { json, error } from '@sveltejs/kit';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import * as clientProfileRepo from '$lib/repositories/clientProfileRepo';
import { normalizePhone } from '$lib/server/phone';
import { getStripe } from '$lib/server/stripe';
import { db } from '$lib/server/db';
import { SERVICE_PACKAGES } from '$lib/data/services';
import { bookings, processedWebhookEvents } from '$lib/server/schema';
import { findConflictingHold } from '$lib/scheduling';
import {
  notifyOwnerOfBookingRequest,
  sendCustomerBookingRequestReceived,
  sendEmail,
} from '$lib/server/email';
import { bookingSchema, type BookingData } from '$lib/types/booking';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

const checkoutMetadataSchema = z.object({
  package_id: z.string().min(1),
  customer_name: z.string().trim().optional(),
  customer_phone: z.string().trim().optional(),
  promo_code: z.string().trim().optional(),
  booking_data: z.string().min(1),
});

const existingBookingCheckoutSchema = z.object({
  payment_flow: z.literal('existing_booking'),
  booking_id: z.string().min(1),
});

interface ParsedCheckoutData {
  bookingData: BookingData;
  packageId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  promoCode: string | null;
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    throw error(400, 'Missing stripe-signature header');
  }

  let event: Stripe.Event;

  try {
    if (!env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET is required');
    event = getStripe().webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw error(400, 'Invalid signature');
  }

  // Idempotency check: skip already-processed events (Stripe retries)
  const [existing] = await db
    .select({ id: processedWebhookEvents.id })
    .from(processedWebhookEvents)
    .where(eq(processedWebhookEvents.eventId, event.id))
    .limit(1);

  if (existing) {
    return json({ received: true });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }

    case 'payment_intent.succeeded': {
      // Payment succeeded - no action needed, checkout.session.completed handles booking creation
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message);
      break;
    }

    default:
      // Ignore other event types silently
      break;
  }

  // Record processed event for idempotency
  await db
    .insert(processedWebhookEvents)
    .values({ eventId: event.id, eventType: event.type })
    .onConflictDoNothing();

  return json({ received: true });
};

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') {
    console.error('Checkout session completed without paid status:', session.id);
    return;
  }

  const existingBookingMetadata = existingBookingCheckoutSchema.safeParse(session.metadata);
  if (existingBookingMetadata.success) {
    await handleExistingBookingCheckout(session, existingBookingMetadata.data.booking_id);
    return;
  }

  const parsed = parseCheckoutMetadata(session);
  if (!parsed) {
    return;
  }

  const { bookingData, packageId, customerName, customerPhone, customerEmail, promoCode } = parsed;

  const phone = normalizePhone(customerPhone || bookingData.contact.phone);
  if (!phone) {
    console.error('Invalid phone number in checkout session metadata');
    return;
  }

  // Get package info
  const pkg = SERVICE_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    console.error('Invalid package in checkout metadata:', packageId);
    return;
  }

  const clientName = customerName || bookingData.contact.name;

  // Upsert client profile
  const client = await clientProfileRepo.upsert({
    phone,
    name: clientName,
    verified: true,
  });

  if (!client) {
    console.error('Failed to create client profile');
    return;
  }

  const amountCents = typeof session.amount_total === 'number' ? session.amount_total : null;
  if (amountCents === null) {
    console.error('Missing amount_total for checkout session:', session.id);
    return;
  }

  // Generate booking ID (BK-YYYYMMDD-XXXX)
  const bookingId = bookingRepo.generateBookingId(bookingData.schedule.date);

  // Build notes with vehicle and address info
  const notes = [
    `Vehicle: ${bookingData.vehicle.year} ${bookingData.vehicle.make} ${bookingData.vehicle.model}`,
    bookingData.vehicle.color ? `Color: ${bookingData.vehicle.color}` : null,
    bookingData.vehicle.notes ? `Notes: ${bookingData.vehicle.notes}` : null,
    `Address: ${bookingData.address.street}, ${bookingData.address.city}, ${bookingData.address.state} ${bookingData.address.zip}`,
    customerEmail ? `Email: ${customerEmail}` : null,
    bookingData.address.instructions ? `Instructions: ${bookingData.address.instructions}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const booking = await bookingRepo.withScheduleLock(bookingData.schedule.date, async (tx) => {
    const holds = await bookingRepo.listScheduleHoldsByDate(bookingData.schedule.date, {
      executor: tx,
    });
    const conflict = findConflictingHold(holds, bookingData.schedule.time);

    if (conflict) {
      return { conflict: true };
    }

    const rows = await tx
      .insert(bookings)
      .values({
        id: bookingId,
        brandId: MRGUY_BRAND_ID,
        clientName,
        serviceName: pkg.name,
        price: amountCents / 100,
        date: bookingData.schedule.date,
        time: bookingData.schedule.time,
        contact: phone,
        transactionId: session.id,
        paymentMethod: 'stripe_checkout',
        promoCode,
        notes,
        status: 'pending',
        paymentStatus: 'paid',
        reminderSent: false,
      })
      .returning();

    return rows[0] ?? null;
  });

  if (booking && 'conflict' in booking) {
    await handleCheckoutConflict(session, packageId, bookingData, customerEmail);
    return;
  }

  if (!booking) {
    console.error('Failed to create booking from checkout session');
    return;
  }

  const notificationPayload = {
    service: { name: pkg.name, price: amountCents / 100 },
    schedule: bookingData.schedule,
    address: bookingData.address,
    contact: {
      name: clientName,
      phone,
      email: customerEmail ?? undefined,
    },
  };

  Promise.allSettled([
    notifyOwnerOfBookingRequest(notificationPayload),
    sendCustomerBookingRequestReceived(notificationPayload),
  ]).then((results) => {
    const [ownerEmail, customerEmailResult] = results;
    if (ownerEmail.status === 'rejected' || !ownerEmail.value) {
      console.warn('Failed to send paid booking request email to owner');
    }
    if (customerEmailResult.status === 'rejected' || !customerEmailResult.value) {
      console.warn('Failed to send paid booking request email to customer');
    }
  });
}

async function handleExistingBookingCheckout(
  session: Stripe.Checkout.Session,
  bookingId: string
) {
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) {
    console.error('Booking not found for checkout session:', bookingId);
    return;
  }

  if (booking.paymentStatus === 'paid') {
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

  const updated = await bookingRepo.update(bookingId, {
    paymentStatus: 'paid',
    paymentMethod: 'stripe_checkout',
    transactionId: paymentIntentId || session.id,
  });

  if (!updated) {
    console.error('Failed to update booking payment status:', bookingId);
  }
}

function parseCheckoutMetadata(session: Stripe.Checkout.Session): ParsedCheckoutData | null {
  const metadata = session.metadata;
  const validatedMetadata = checkoutMetadataSchema.safeParse(metadata);
  if (!validatedMetadata.success) {
    console.error('Invalid checkout metadata format', validatedMetadata.error.flatten().fieldErrors);
    return null;
  }

  let bookingData: BookingData;
  try {
    const parsed = JSON.parse(validatedMetadata.data.booking_data);
    const validatedBookingData = bookingSchema.safeParse(parsed);

    if (!validatedBookingData.success) {
      console.error('Invalid booking_data format:', validatedBookingData.error.flatten().fieldErrors);
      return null;
    }

    bookingData = validatedBookingData.data;
  } catch (err) {
    console.error('Unable to parse booking_data JSON:', err);
    return null;
  }

  if (bookingData.service.packageId !== validatedMetadata.data.package_id) {
    console.error('Package mismatch in checkout metadata');
    return null;
  }

  return {
    bookingData,
    packageId: validatedMetadata.data.package_id,
    customerName: validatedMetadata.data.customer_name || null,
    customerPhone: validatedMetadata.data.customer_phone || null,
    customerEmail:
      session.customer_details?.email ||
      session.customer_email ||
      bookingData.contact.email ||
      null,
    promoCode: validatedMetadata.data.promo_code || null,
  };
}

async function handleCheckoutConflict(
  session: Stripe.Checkout.Session,
  packageId: string,
  bookingData: BookingData,
  customerEmail: string | null
) {
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    console.error('Paid checkout slot conflict without payment_intent:', session.id);
    return;
  }

  try {
    await getStripe().refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        conflict: 'schedule_slot_unavailable',
        package_id: packageId,
        requested_date: bookingData.schedule.date,
        requested_time: bookingData.schedule.time,
      },
    });
  } catch (err) {
    console.error('Failed to refund conflicted checkout session:', session.id, err);
    return;
  }

  const subject = 'Payment Refunded: Selected Time No Longer Available';
  const message = `A paid booking request for ${bookingData.schedule.date} at ${bookingData.schedule.time} was automatically refunded because the slot was no longer available.`;

  await Promise.allSettled([
    sendEmail({
      to: 'info@mrguymobiledetail.com',
      cc: 'info@lovingartandcompany.com',
      subject,
      html: `<p>${message}</p><p>Session: ${session.id}</p>`,
    }),
    customerEmail
      ? sendEmail({
          to: customerEmail,
          subject,
          html: `<p>Your payment was automatically refunded because the requested appointment time was no longer available.</p><p>Please book again and choose another time, or reply to this email for help.</p>`,
        })
      : Promise.resolve(false),
  ]);
}
