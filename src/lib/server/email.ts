import { env } from '$env/dynamic/private';

const BUSINESS_EMAIL = 'info@mrguymobiledetail.com';
const MONITOR_EMAIL = 'info@lovingartandcompany.com';
const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  cc?: string | string[];
}

interface BookingNotification {
  service: { name: string; price?: number };
  schedule: { date: string; time: string };
  address: { street: string; city: string; state?: string; zip?: string };
  contact: { name?: string; phone?: string; email?: string };
}

async function sendViaResendApi(params: {
  apiKey: string;
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  cc?: string[];
}): Promise<boolean> {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.cc?.length ? { cc: params.cc } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Resend email failed:', errorText);
    return false;
  }

  return true;
}

/**
 * Send email via Resend
 * Fails silently - booking should succeed even if email fails
 */
export async function sendEmail({ to, subject, html, cc }: EmailParams): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('Resend API key not configured - email not sent');
    return false;
  }

  try {
    return await sendViaResendApi({
      apiKey,
      from: 'Mr. Guy Detail <info@mrguymobiledetail.com>',
      to,
      subject,
      html,
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
    });
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
    to: BUSINESS_EMAIL,
    cc: MONITOR_EMAIL,
    subject: `New Booking: ${booking.service.name} - ${formatDate(booking.schedule.date)}`,
    html,
  });
}

export async function notifyOwnerOfBookingRequest(booking: BookingNotification): Promise<boolean> {
  const html = `
    <h2>New Booking Request</h2>

    <p><strong>Status:</strong> Awaiting Pablo confirmation</p>

    <h3>Requested Service</h3>
    <p><strong>Service:</strong> ${booking.service.name}${typeof booking.service.price === 'number' ? `<br><strong>Quoted Price:</strong> $${booking.service.price}` : ''}</p>

    <h3>Requested Time</h3>
    <p><strong>Date:</strong> ${formatDate(booking.schedule.date)}<br>
    <strong>Preferred Time:</strong> ${formatTime(booking.schedule.time)}</p>

    <h3>Location</h3>
    <p>${booking.address.street}<br>
    ${booking.address.city}${booking.address.state ? `, ${booking.address.state}` : ''}${booking.address.zip ? ` ${booking.address.zip}` : ''}</p>

    <h3>Customer</h3>
    <p><strong>Name:</strong> ${booking.contact.name ?? 'N/A'}<br>
    <strong>Phone:</strong> ${booking.contact.phone ?? 'N/A'}${booking.contact.email ? `<br><strong>Email:</strong> ${booking.contact.email}` : ''}</p>

    <p style="color: #666; margin-top: 20px;">
      <em>The customer-selected time is being held on the site until Pablo confirms or changes it.</em>
    </p>
  `;

  return sendEmail({
    to: BUSINESS_EMAIL,
    cc: MONITOR_EMAIL,
    subject: `Booking Request: ${booking.service.name} - ${formatDate(booking.schedule.date)}`,
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
      Email: <a href="mailto:info@mrguymobiledetail.com">info@mrguymobiledetail.com</a>
    </p>
    
    <p style="color: #666; margin-top: 20px;">
      - The Mr. Guy Team
    </p>
  `;

  return sendEmail({
    to: booking.contact.email,
    cc: [BUSINESS_EMAIL, MONITOR_EMAIL],
    subject: `Booking Confirmed - ${booking.service.name}`,
    html,
  });
}

export async function sendCustomerBookingRequestReceived(booking: BookingNotification): Promise<boolean> {
  if (!booking.contact.email) {
    return false;
  }

  const html = `
    <h2>Your booking request is in.</h2>

    <p>We’re holding your requested time for <strong>${booking.service.name}</strong> while Pablo reviews it.</p>

    <p style="font-size: 16px;">
      <strong>Requested Date:</strong> ${formatDate(booking.schedule.date)}<br>
      <strong>Requested Time:</strong> ${formatTime(booking.schedule.time)}<br>
      ${booking.address.street}, ${booking.address.city}
    </p>

    <p><strong>Important:</strong> your appointment is not confirmed yet. Pablo still needs to approve this time and we’ll text or email you once it’s confirmed.</p>

    <p style="margin-top: 30px;">
      <strong>Questions?</strong><br>
      Call or text: <a href="tel:9548044747">954-804-4747</a><br>
      Email: <a href="mailto:info@mrguymobiledetail.com">info@mrguymobiledetail.com</a>
    </p>

    <p style="color: #666; margin-top: 20px;">
      - Pablo & the Mr. Guy Team
    </p>
  `;

  return sendEmail({
    to: booking.contact.email,
    cc: [BUSINESS_EMAIL, MONITOR_EMAIL],
    subject: `Booking Request Received - ${booking.service.name}`,
    html,
  });
}

/**
 * Send error/crash notification to the team.
 * Rate-limited to max 10 emails per 5-minute window to prevent flooding.
 */
const errorEmailWindow: number[] = [];
const ERROR_EMAIL_LIMIT = 10;
const ERROR_EMAIL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function notifyError(details: {
  message: string;
  stack?: string;
  url?: string;
  method?: string;
  status?: number;
}): Promise<boolean> {
  // Rate limiting — drop if too many recent error emails
  const now = Date.now();
  while (errorEmailWindow.length > 0 && errorEmailWindow[0] < now - ERROR_EMAIL_WINDOW_MS) {
    errorEmailWindow.shift();
  }
  if (errorEmailWindow.length >= ERROR_EMAIL_LIMIT) {
    console.warn(`[notifyError] Rate limited — ${errorEmailWindow.length} error emails in last 5min`);
    return false;
  }
  errorEmailWindow.push(now);

  // Scrub sensitive patterns from stack traces (tokens, keys, secrets)
  const scrubbed = details.stack ? scrubSensitive(details.stack) : undefined;

  const html = `
    <h2 style="color: #dc2626;">Bug/Crash Report</h2>
    
    <p><strong>Error:</strong> ${escapeHtml(details.message)}</p>
    ${details.url ? `<p><strong>URL:</strong> ${escapeHtml(details.url)}</p>` : ''}
    ${details.method ? `<p><strong>Method:</strong> ${details.method}</p>` : ''}
    ${details.status ? `<p><strong>Status:</strong> ${details.status}</p>` : ''}
    
    ${scrubbed ? `
    <h3>Stack Trace</h3>
    <pre style="background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 12px;">${escapeHtml(scrubbed)}</pre>
    ` : ''}

    <p style="color: #666; margin-top: 20px;">
      <em>Reported at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</em>
    </p>
  `;

  return sendEmail({
    to: MONITOR_EMAIL,
    subject: `[MrGuy] Error: ${details.message.slice(0, 80)}`,
    html,
  });
}

/** Remove tokens, API keys, and secrets from stack traces */
function scrubSensitive(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [REDACTED]')
    .replace(/re_[A-Za-z0-9]{20,}/g, '[REDACTED_RESEND_KEY]')
    .replace(/sk_[A-Za-z0-9]{20,}/g, '[REDACTED_STRIPE_KEY]')
    .replace(/postgres(ql)?:\/\/[^\s"']+/g, '[REDACTED_DB_URL]')
    .replace(/eyJ[A-Za-z0-9\-._]{30,}/g, '[REDACTED_JWT]');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
