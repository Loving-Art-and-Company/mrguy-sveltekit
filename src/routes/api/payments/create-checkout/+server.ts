import { json, error } from '@sveltejs/kit';
import Stripe from 'stripe';
import { SERVICE_PACKAGES, getPromoPrice } from '$lib/data/services';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

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
  try {
    const data = await request.json();
    const { packageId, customerName, customerPhone, customerEmail, bookingData } = data;

    // Validate package
    const pkg = SERVICE_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      throw error(400, 'Invalid package selected');
    }

    // Calculate price with promo discount
    const priceInCents = getPromoPrice(pkg.avgPrice) * 100;

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
