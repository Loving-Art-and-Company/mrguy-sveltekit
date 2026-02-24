// src/lib/repositories/bookingRepo.ts
// Booking data access layer — replaces all supabaseAdmin.from('bookings') calls

import { db } from '$lib/server/db';
import { bookings } from '$lib/server/schema';
import { eq, and, gte, lte, or, ilike, desc, asc, sql, count, inArray } from 'drizzle-orm';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

export type BookingRow = typeof bookings.$inferSelect;
export type BookingInsert = typeof bookings.$inferInsert;

// ============================================================
// QUERIES
// ============================================================

/** Get a single booking by ID */
export async function getById(id: string): Promise<BookingRow | null> {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Count today's bookings */
export async function countToday(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const result = await db
    .select({ count: count() })
    .from(bookings)
    .where(and(eq(bookings.brandId, MRGUY_BRAND_ID), eq(bookings.date, today)));
  return Number(result[0]?.count ?? 0);
}

/** Sum revenue for a date range (paid only) */
export async function sumRevenue(from: string, to: string): Promise<number> {
  const result = await db
    .select({ total: sql<number>`coalesce(sum(${bookings.price}), 0)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.brandId, MRGUY_BRAND_ID),
        eq(bookings.paymentStatus, 'paid'),
        gte(bookings.date, from),
        lte(bookings.date, to)
      )
    );
  return Number(result[0]?.total ?? 0);
}

/** Count pending payment bookings */
export async function countPending(): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(eq(bookings.brandId, MRGUY_BRAND_ID), eq(bookings.paymentStatus, 'pending'))
    );
  return Number(result[0]?.count ?? 0);
}

/** List bookings with optional filters */
export async function list(filters: {
  status?: string | null;
  from?: string | null;
  to?: string | null;
  search?: string | null;
}): Promise<BookingRow[]> {
  const conditions = [eq(bookings.brandId, MRGUY_BRAND_ID)];

  if (filters.status && filters.status !== 'all') {
    conditions.push(eq(bookings.status, filters.status));
  }
  if (filters.from) {
    conditions.push(gte(bookings.date, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(bookings.date, filters.to));
  }
  if (filters.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(bookings.clientName, searchPattern),
        ilike(bookings.contact, searchPattern)
      )!
    );
  }

  return db
    .select()
    .from(bookings)
    .where(and(...conditions))
    .orderBy(desc(bookings.date), desc(bookings.time));
}

/** List bookings for a month (calendar view) */
export async function listByMonth(fromDate: string, toDate: string): Promise<BookingRow[]> {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.brandId, MRGUY_BRAND_ID),
        gte(bookings.date, fromDate),
        lte(bookings.date, toDate)
      )
    )
    .orderBy(asc(bookings.time));
}

/** List paid bookings in a date range (for revenue analytics) */
export async function listPaidInRange(from: string, to: string): Promise<BookingRow[]> {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.brandId, MRGUY_BRAND_ID),
        eq(bookings.paymentStatus, 'paid'),
        gte(bookings.date, from),
        lte(bookings.date, to)
      )
    )
    .orderBy(desc(bookings.date));
}

/** List recent paid bookings (for revenue table) */
export async function listRecentPaid(limit: number): Promise<BookingRow[]> {
  return db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.brandId, MRGUY_BRAND_ID), eq(bookings.paymentStatus, 'paid'))
    )
    .orderBy(desc(bookings.date), desc(bookings.time))
    .limit(limit);
}

/** List bookings by contact phone (client-facing) */
export async function listByContact(
  phone: string,
  statuses: string[]
): Promise<
  Pick<BookingRow, 'id' | 'clientName' | 'serviceName' | 'price' | 'date' | 'time' | 'status' | 'paymentStatus' | 'createdAt'>[]
> {
  return db
    .select({
      id: bookings.id,
      clientName: bookings.clientName,
      serviceName: bookings.serviceName,
      price: bookings.price,
      date: bookings.date,
      time: bookings.time,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.brandId, MRGUY_BRAND_ID),
        eq(bookings.contact, phone),
        inArray(bookings.status, statuses)
      )
    )
    .orderBy(asc(bookings.date));
}

/** Get a booking for reschedule verification */
export async function getForReschedule(
  bookingId: string
): Promise<Pick<BookingRow, 'id' | 'contact' | 'status' | 'date'> | null> {
  const rows = await db
    .select({
      id: bookings.id,
      contact: bookings.contact,
      status: bookings.status,
      date: bookings.date,
    })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.brandId, MRGUY_BRAND_ID)))
    .limit(1);
  return rows[0] ?? null;
}

// ============================================================
// MUTATIONS
// ============================================================

/** Insert a new booking */
export async function insert(data: BookingInsert): Promise<BookingRow | null> {
  const rows = await db.insert(bookings).values(data).returning();
  return rows[0] ?? null;
}

/** Update a booking by ID */
export async function update(
  id: string,
  data: Partial<Pick<BookingRow, 'date' | 'time' | 'status' | 'paymentStatus' | 'notes'>>
): Promise<
  Pick<BookingRow, 'id' | 'serviceName' | 'price' | 'date' | 'time' | 'status'> | null
> {
  const rows = await db
    .update(bookings)
    .set(data)
    .where(eq(bookings.id, id))
    .returning({
      id: bookings.id,
      serviceName: bookings.serviceName,
      price: bookings.price,
      date: bookings.date,
      time: bookings.time,
      status: bookings.status,
    });
  return rows[0] ?? null;
}

/** Generate a booking ID in the format BK-YYYYMMDD-XXXX */
export function generateBookingId(date: string): string {
  const dateStr = date.replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${dateStr}-${randomSuffix}`;
}
