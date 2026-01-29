import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { supabaseAdmin } from '$lib/server/supabase';
import { notifyOwnerOfBooking, sendCustomerConfirmation } from '$lib/server/email';

// Validation schema for promo booking
const promoBookingSchema = z.object({
  promo_code: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  upgrades: z.array(z.string()).default([])
});

const PROMO_SERVICES: Record<string, { name: string; price: number; id: string }> = {
  kores: {
    id: 'exterior_wash',
    name: 'Exterior Wash (KoRes Promo)',
    price: 0 // Free promo
  }
};

const UPGRADE_PRICES: Record<string, { name: string; price: number }> = {
  interior: { name: 'Interior Wash', price: 37 },
  wax: { name: 'Full Wax', price: 127 },
  ceramic_windows: { name: 'Window Ceramic', price: 77 }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate input
    const result = promoBookingSchema.safeParse(body);
    if (!result.success) {
      return json(
        { message: 'Invalid booking data', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Get promo service details
    const promoService = PROMO_SERVICES[data.promo_code];
    if (!promoService) {
      return json(
        { message: 'Invalid promo code' },
        { status: 400 }
      );
    }

    // Calculate total from upgrades
    const upgradeTotal = data.upgrades.reduce((sum, upgradeId) => {
      const upgrade = UPGRADE_PRICES[upgradeId];
      return sum + (upgrade?.price || 0);
    }, 0);

    const totalPrice = promoService.price + upgradeTotal;

    // Build service description
    const upgradeNames = data.upgrades
      .map(id => UPGRADE_PRICES[id]?.name)
      .filter(Boolean);
    
    const serviceName = upgradeNames.length > 0
      ? `${promoService.name} + ${upgradeNames.join(', ')}`
      : promoService.name;

    // Clean phone number
    const cleanPhone = data.phone.replace(/\D/g, '');

    // Parse address (basic parsing - just store as-is for now)
    const addressParts = data.address.split(',').map(s => s.trim());
    const street = addressParts[0] || data.address;
    const city = addressParts[1] || 'Weston';
    const state = 'FL';
    const zip = addressParts[2]?.match(/\d{5}/)?.[0] || '33326';

    // Create booking in database
    const { data: newBooking, error: dbError } = await supabaseAdmin
      .from('bookings')
      .insert({
        service_id: promoService.id,
        service_name: serviceName,
        service_price: totalPrice,
        scheduled_date: null, // Promo bookings - we'll contact to schedule
        scheduled_time: null,
        address_street: street,
        address_city: city,
        address_state: state,
        address_zip: zip,
        address_instructions: `Promo: ${data.promo_code}`,
        customer_name: data.name,
        customer_phone: cleanPhone,
        customer_email: data.email,
        status: 'pending',
        vehicle_info_pending: true,
        promo_code: data.promo_code,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating promo booking:', dbError);
      throw error(500, 'Failed to create booking');
    }

    // Prepare booking data for emails
    const emailBooking = {
      service: { 
        name: serviceName, 
        price: totalPrice 
      },
      schedule: { 
        date: 'To be scheduled', 
        time: 'We will contact you'
      },
      address: { 
        street, 
        city, 
        state, 
        zip 
      },
      contact: { 
        name: data.name, 
        phone: cleanPhone, 
        email: data.email 
      }
    };

    // Send email notifications (don't block on these)
    const emailPromises = [
      notifyOwnerOfBooking(emailBooking),
      sendPromoConfirmation(data.name, data.email, promoService.name, data.promo_code)
    ];

    // Fire and forget - don't wait for emails
    Promise.allSettled(emailPromises).then(results => {
      const [ownerResult, customerResult] = results;
      if (ownerResult.status === 'rejected' || !ownerResult.value) {
        console.warn('Failed to notify owner of promo booking');
      }
      if (customerResult.status === 'rejected' || !customerResult.value) {
        console.warn('Failed to send customer promo confirmation');
      }
    });

    return json({
      success: true,
      bookingId: newBooking.id,
      message: 'Booking created successfully! We\'ll contact you within 24 hours to schedule.'
    });

  } catch (err) {
    console.error('Promo booking creation error:', err);
    throw error(500, 'Failed to create booking. Please try again or call 954-804-4747.');
  }
};

/**
 * Send promo confirmation email to customer
 */
async function sendPromoConfirmation(
  name: string,
  email: string,
  serviceName: string,
  promoCode: string
): Promise<boolean> {
  const { sendEmail } = await import('$lib/server/email');
  
  const html = `
    <h2>Thanks for claiming your free wash, ${name}!</h2>
    
    <p>We've received your request for a <strong>${serviceName}</strong>.</p>
    
    <h3>What's Next?</h3>
    <ol>
      <li>We'll contact you within <strong>24 hours</strong> to schedule your service</li>
      <li>We'll confirm your vehicle details (make, model, year)</li>
      <li>You pick a convenient date and time</li>
      <li>We come to you and handle the rest!</li>
    </ol>
    
    <p style="background: #f8f8f8; border-left: 4px solid #c41e3a; padding: 1rem; margin: 1.5rem 0;">
      <strong>Promo Code:</strong> ${promoCode.toUpperCase()}<br>
      <strong>Service:</strong> ${serviceName}
    </p>
    
    <p style="margin-top: 30px;">
      <strong>Questions?</strong><br>
      Call or text: <a href="tel:9548044747">954-804-4747</a><br>
      Email: <a href="mailto:bookings@mrguydetail.com">bookings@mrguydetail.com</a>
    </p>
    
    <p style="color: #666; margin-top: 20px;">
      - The Mr. Guy Team
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `Your Free Wash is Confirmed! - Mr. Guy Detail`,
    html,
  });
}
