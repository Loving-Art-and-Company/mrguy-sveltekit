import { env } from '$env/dynamic/private';

interface SMSParams {
  to: string;
  message: string;
}

/**
 * Send SMS via Twilio
 * Fails silently - booking should succeed even if SMS fails
 */
export async function sendSMS({ to, message }: SMSParams): Promise<boolean> {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio credentials not configured - SMS not sent');
    return false;
  }

  // Clean phone number - ensure it has +1 prefix for US
  const cleanPhone = to.replace(/\D/g, '');
  const formattedTo = cleanPhone.length === 10 ? `+1${cleanPhone}` : `+${cleanPhone}`;

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Twilio SMS failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
}

/**
 * Notify Pablo of new booking
 */
export async function notifyPabloOfBooking(booking: {
  service: { name: string; price: number };
  schedule: { date: string; time: string };
  address: { street: string; city: string; state: string; zip: string };
  contact: { name: string; phone: string; email?: string };
}): Promise<boolean> {
  const PABLO_PHONE = '9548044747';
  
  const message = `New booking received!

Service: ${booking.service.name} - $${booking.service.price}
Date: ${formatDate(booking.schedule.date)} at ${formatTime(booking.schedule.time)}
Location: ${booking.address.street}, ${booking.address.city} ${booking.address.state} ${booking.address.zip}

Customer: ${booking.contact.name}
Phone: ${booking.contact.phone}
${booking.contact.email ? `Email: ${booking.contact.email}` : ''}

Note: Vehicle details not collected - follow up via SMS`;

  return sendSMS({ to: PABLO_PHONE, message });
}

/**
 * Send confirmation SMS to customer
 */
export async function sendCustomerConfirmation(booking: {
  service: { name: string };
  schedule: { date: string; time: string };
  address: { street: string; city: string };
  contact: { phone: string };
}): Promise<boolean> {
  const message = `Thanks for booking with Mr. Guy Detail!

Your ${booking.service.name} is scheduled for:
${formatDate(booking.schedule.date)} at ${formatTime(booking.schedule.time)}
${booking.address.street}, ${booking.address.city}

We'll text you 24 hours before to confirm your vehicle details (make, model, year).

Questions? Reply to this text or call 954-804-4747.

- Mr. Guy Team`;

  return sendSMS({ to: booking.contact.phone, message });
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
