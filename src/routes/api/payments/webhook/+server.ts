import { json, error } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';
import type { BookingData } from '$lib/types/booking';
import type { Database } from '$lib/types/database';

// Lazy-init Stripe to avoid build-time errors
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is required');
    _stripe = new Stripe(STRIPE_SECRET_KEY);
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
    event = getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
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

  // Normalize phone to E.164
  const phone = normalizePhone(metadata.customer_phone || bookingData.contact.phone);

  // Get service package info
  const pkg = (await import('$lib/data/services')).SERVICE_PACKAGES.find(
    (p) => p.id === bookingData.service.packageId
  );
  const { MRGUY_BRAND_ID } = await import('$lib/types/database');

  const clientName = metadata.customer_name || bookingData.contact.name;

  // Upsert client profile
  const { error: clientError } = await supabaseAdmin
    .from('client_profiles')
    .upsert(
      {
        brand_id: MRGUY_BRAND_ID,
        phone,
        name: clientName,
        verified: true,
      } as Database['public']['Tables']['client_profiles']['Insert'],
      { onConflict: 'phone' }
    );

  if (clientError) {
    console.error('Failed to create client:', clientError);
    return;
  }

  // Generate booking ID (BK-YYYYMMDD-XXXX)
  const dateStr = bookingData.schedule.date.replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const bookingId = `BK-${dateStr}-${randomSuffix}`;

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

  // Create booking (using actual Supabase schema with camelCase)
  const { error: bookingError } = await supabaseAdmin.from('bookings').insert({
    id: bookingId,
    brand_id: MRGUY_BRAND_ID,
    clientName,
    serviceName: pkg?.name || 'Unknown Package',
    price: session.amount_total ? session.amount_total / 100 : 0,
    date: bookingData.schedule.date,
    time: bookingData.schedule.time,
    contact: phone,
    transactionId: session.id,
    paymentMethod: 'stripe',
    notes,
    status: 'confirmed',
    paymentStatus: 'paid',
    reminderSent: false,
  } as Database['public']['Tables']['bookings']['Insert']);

  if (bookingError) {
    console.error('Failed to create booking:', bookingError);
    return;
  }

  // Booking created successfully
  // TODO: Send confirmation SMS via Twilio
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}
