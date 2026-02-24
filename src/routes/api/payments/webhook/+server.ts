import { json, error } from '@sveltejs/kit';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import * as clientProfileRepo from '$lib/repositories/clientProfileRepo';
import { normalizePhone } from '$lib/server/phone';
import type { RequestHandler } from './$types';
import type { BookingData } from '$lib/types/booking';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

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
  const { metadata } = session;

  if (!metadata) {
    console.error('No metadata in checkout session');
    return;
  }

  const bookingData: BookingData = metadata.booking_data ? JSON.parse(metadata.booking_data) : null;

  if (!bookingData) {
    console.error('No booking data in session metadata');
    return;
  }

  // Normalize phone to canonical 10-digit format
  const phone = normalizePhone(metadata.customer_phone || bookingData.contact.phone);

  // Get service package info
  const pkg = (await import('$lib/data/services')).SERVICE_PACKAGES.find(
    (p) => p.id === bookingData.service.packageId
  );

  const clientName = metadata.customer_name || bookingData.contact.name;

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
  const promoCode = metadata.promo_code || null;
  const booking = await bookingRepo.insert({
    id: bookingId,
    brandId: MRGUY_BRAND_ID,
    clientName,
    serviceName: pkg?.name || 'Unknown Package',
    price: session.amount_total ? session.amount_total / 100 : 0,
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


