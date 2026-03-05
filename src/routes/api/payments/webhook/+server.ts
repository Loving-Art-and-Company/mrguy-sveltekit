import { json, error } from '@sveltejs/kit';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import * as clientProfileRepo from '$lib/repositories/clientProfileRepo';
import { normalizePhone } from '$lib/server/phone';
import { SERVICE_PACKAGES } from '$lib/data/services';
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

interface ParsedCheckoutData {
  bookingData: BookingData;
  packageId: string;
  customerName: string | null;
  customerPhone: string | null;
  promoCode: string | null;
}

// Lazy-init Stripe to avoid build-time errors
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is required');
    _stripe = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return _stripe;
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

  return json({ received: true });
};

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const parsed = parseCheckoutMetadata(session);
  if (!parsed) {
    return;
  }

  const { bookingData, packageId, customerName, customerPhone, promoCode } = parsed;

  if (session.payment_status !== 'paid') {
    console.error('Checkout session completed without paid status:', session.id);
    return;
  }

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
    bookingData.address.instructions ? `Instructions: ${bookingData.address.instructions}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  // Create booking
  const booking = await bookingRepo.insert({
    id: bookingId,
    brandId: MRGUY_BRAND_ID,
    clientName,
    serviceName: pkg.name,
    price: amountCents / 100,
    date: bookingData.schedule.date,
    time: bookingData.schedule.time,
    contact: phone,
    transactionId: session.id,
    paymentMethod: 'stripe',
    promoCode,
    notes,
    status: 'confirmed',
    paymentStatus: 'paid',
    reminderSent: false,
  });

  if (!booking) {
    console.error('Failed to create booking');
    return;
  }

  // Booking created successfully
  // TODO: Send confirmation SMS via Twilio
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
    promoCode: validatedMetadata.data.promo_code || null,
  };
}
