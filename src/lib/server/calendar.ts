// src/lib/server/calendar.ts
// Google Calendar sync — creates events when bookings are made

import { db } from './db';
import { googleTokens } from './schema';
import { eq } from 'drizzle-orm';
import { refreshAccessToken } from '$lib/google/client';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

interface BookingForCalendar {
  id: string;
  service: { name: string; price: number };
  schedule: { date: string; time: string };
  address: { street: string; city: string; state: string; zip: string };
  contact: { name: string; phone: string; email?: string };
}

/**
 * Get a valid access token from the stored refresh token.
 * Returns null if no Google account is connected.
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const rows = await db
      .select()
      .from(googleTokens)
      .limit(1);

    if (rows.length === 0) return null;

    const stored = rows[0];
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 min buffer

    // If access token is still valid, use it
    if (stored.accessToken && stored.expiresAt && stored.expiresAt.getTime() > now.getTime() + bufferMs) {
      return stored.accessToken;
    }

    // Refresh the token
    const refreshed = await refreshAccessToken(stored.refreshToken);

    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

    await db
      .update(googleTokens)
      .set({
        accessToken: refreshed.access_token,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(googleTokens.id, stored.id));

    return refreshed.access_token;
  } catch (err) {
    console.error('[calendar] Failed to get access token:', err);
    return null;
  }
}

/**
 * Create a Google Calendar event for a booking.
 * Fails silently — calendar sync should never block booking creation.
 */
export async function createCalendarEvent(booking: BookingForCalendar): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.warn('[calendar] No Google account connected — skipping calendar sync');
      return false;
    }

    // Parse date and time into start/end
    const startDateTime = `${booking.schedule.date}T${booking.schedule.time || '09:00'}:00`;
    // Default 2 hour appointment
    const startDate = new Date(`${startDateTime}-05:00`); // EST
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const event = {
      summary: `${booking.service.name} — ${booking.contact.name}`,
      description: [
        `Booking ID: ${booking.id}`,
        `Service: ${booking.service.name} ($${booking.service.price})`,
        `Customer: ${booking.contact.name}`,
        `Phone: ${booking.contact.phone}`,
        booking.contact.email ? `Email: ${booking.contact.email}` : null,
        '',
        `Address: ${booking.address.street}, ${booking.address.city}, ${booking.address.state} ${booking.address.zip}`,
      ].filter(Boolean).join('\n'),
      location: `${booking.address.street}, ${booking.address.city}, ${booking.address.state} ${booking.address.zip}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 1440 }, // 24 hours
        ],
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[calendar] Failed to create event:', response.status, errorText);
      return false;
    }

    const created = await response.json();
    console.log(`[calendar] Created event: ${created.id} for booking ${booking.id}`);
    return true;
  } catch (err) {
    console.error('[calendar] Error creating event:', err);
    return false;
  }
}

/**
 * Store Google tokens server-side after OAuth callback.
 */
export async function storeGoogleTokens(
  userId: string,
  refreshToken: string,
  accessToken: string,
  expiresIn: number,
  email: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  // Upsert — replace if exists
  const existing = await db
    .select({ id: googleTokens.id })
    .from(googleTokens)
    .where(eq(googleTokens.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(googleTokens)
      .set({ refreshToken, accessToken, expiresAt, email, updatedAt: new Date() })
      .where(eq(googleTokens.userId, userId));
  } else {
    await db.insert(googleTokens).values({
      userId,
      refreshToken,
      accessToken,
      expiresAt,
      email,
    });
  }
}
