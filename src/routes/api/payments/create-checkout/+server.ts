import { json, error } from '@sveltejs/kit';
import Stripe from 'stripe';
import { SERVICE_PACKAGES, getPromoPrice } from '$lib/data/services';
import { env } from '$env/dynamic/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { isFirstTimeClient } from '$lib/server/promo';
import { normalizePhone } from '$lib/server/phone';
import type { RequestHandler } from './$types';

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
  try {
    const data = await request.json();
    const { packageId, customerName, customerPhone, customerEmail, bookingData } = data;

    // Validate package
    const pkg = SERVICE_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      throw error(400, 'Invalid package selected');
    }

    // Normalize phone and check promo eligibility
    const cleanPhone = normalizePhone(customerPhone || '');
    const promoEnabled = env.PROMO_ENABLED !== 'false';
    const firstTime = promoEnabled && cleanPhone.length === 10
      ? await isFirstTimeClient(cleanPhone)
      : false;

    // Use priceHigh as the canonical price, apply discount only if eligible
    const basePrice = pkg.priceHigh;
    const finalPrice = firstTime ? getPromoPrice(basePrice) : basePrice;
    const priceInCents = finalPrice * 100;
    const promoCode = firstTime ? 'fresh_start_25' : null;

    // Create Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.name} - Mobile Detailing`,
              description: `${pkg.includes.join(', ')}. Service at your location.`,
              metadata: {
                package_id: pkg.id,
              },
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        package_id: packageId,
        customer_name: customerName,
        customer_phone: customerPhone,
        promo_code: promoCode || '',
        booking_data: JSON.stringify(bookingData),
      },
      success_url: `${PUBLIC_BASE_URL}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_BASE_URL}/book?cancelled=true`,
    });

    return json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    if (err instanceof Stripe.errors.StripeError) {
      throw error(400, err.message);
    }
    throw error(500, 'Failed to create checkout session');
  }
};
