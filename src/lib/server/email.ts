import { env } from '$env/dynamic/private';
import { Resend } from 'resend';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email via Resend
 * Fails silently - booking should succeed even if email fails
 */
export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('Resend API key not configured - email not sent');
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    
    const { data, error } = await resend.emails.send({
      from: 'Mr. Guy Detail <bookings@mrguydetail.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend email failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

/**
 * Notify owner of new booking
 */
export async function notifyOwnerOfBooking(booking: {
  service: { name: string; price: number };
  schedule: { date: string; time: string };
  address: { street: string; city: string; state: string; zip: string };
  contact: { name: string; phone: string; email?: string };
}): Promise<boolean> {
  const OWNER_EMAIL = 'info@lovingartandcompany.com';
  
  const html = `
    <h2>New Booking Received!</h2>
    
    <h3>Service Details</h3>
    <p><strong>Service:</strong> ${booking.service.name}<br>
    <strong>Price:</strong> $${booking.service.price}</p>
    
    <h3>Schedule</h3>
    <p><strong>Date:</strong> ${formatDate(booking.schedule.date)}<br>
    <strong>Time:</strong> ${formatTime(booking.schedule.time)}</p>
    
    <h3>Location</h3>
    <p>${booking.address.street}<br>
    ${booking.address.city}, ${booking.address.state} ${booking.address.zip}</p>
    
    <h3>Customer</h3>
    <p><strong>Name:</strong> ${booking.contact.name}<br>
    <strong>Phone:</strong> ${booking.contact.phone}${booking.contact.email ? `<br><strong>Email:</strong> ${booking.contact.email}` : ''}</p>
    
    <p style="color: #666; margin-top: 20px;">
      <em>Note: Vehicle details not collected - follow up with customer to confirm make, model, and year.</em>
    </p>
  `;

  return sendEmail({
    to: OWNER_EMAIL,
    subject: `New Booking: ${booking.service.name} - ${formatDate(booking.schedule.date)}`,
    html,
  });
}

/**
 * Send confirmation email to customer
 */
export async function sendCustomerConfirmation(booking: {
  service: { name: string };
  schedule: { date: string; time: string };
  address: { street: string; city: string };
  contact: { email?: string };
}): Promise<boolean> {
  if (!booking.contact.email) {
    return false;
  }

  const html = `
    <h2>Thanks for booking with Mr. Guy Detail!</h2>
    
    <p>Your <strong>${booking.service.name}</strong> is scheduled for:</p>
    
    <p style="font-size: 16px;">
      <strong>${formatDate(booking.schedule.date)}</strong> at <strong>${formatTime(booking.schedule.time)}</strong><br>
      ${booking.address.street}, ${booking.address.city}
    </p>
    
    <p>We'll contact you 24 hours before your appointment to confirm your vehicle details (make, model, year).</p>
    
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
    to: booking.contact.email,
    subject: `Booking Confirmed - ${booking.service.name}`,
    html,
  });
}

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(timeStr: string): string {
  const [hours] = timeStr.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}
