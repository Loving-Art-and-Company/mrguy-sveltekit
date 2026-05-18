// src/lib/repositories/bookingRepo.ts
// Booking data access layer

import { db } from '$lib/server/db';
import { bookings } from '$lib/server/schema';
import { eq, and, gte, lte, or, ilike, desc, asc, sql, count, inArray, ne } from 'drizzle-orm';
import { BLOCKING_BOOKING_STATUSES, type ScheduleHold } from '$lib/scheduling';
import { MRGUY_BRAND_ID } from '$lib/server/brand';

export type BookingRow = typeof bookings.$inferSelect;
export type BookingInsert = typeof bookings.$inferInsert;
export type BookingScheduleHold = Pick<BookingRow, 'id' | 'date' | 'time' | 'status'>;

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
      and(eq(bookings.brandId, MRGUY_BRAND_ID), eq(bookings.paymentStatus, 'unpaid'))
    );
  return Number(result[0]?.count ?? 0);
}

/** List bookings with optional filters */
export async function list(
	filters: {
		status?: string | null;
		from?: string | null;
		to?: string | null;
		search?: string | null;
		limit?: number;
		offset?: number;
	}
): Promise<BookingRow[]> {
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

	const limit = filters.limit ?? 100;
	const offset = filters.offset ?? 0;

	return db
		.select()
		.from(bookings)
		.where(and(...conditions))
		.orderBy(desc(bookings.date), desc(bookings.time))
		.limit(limit)
		.offset(offset);
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

function parseEmailFromNotes(notes: string | null): string | null {
  const match = notes?.match(/Email:\s*(\S+)/i);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

export async function getRescheduleEmailByPhone(
  phone: string,
  statuses: string[]
): Promise<
  | { ok: true; email: string }
  | { ok: false; reason: 'missing' | 'multiple' }
> {
  const rows = await db
    .select({
      notes: bookings.notes,
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
    .orderBy(desc(bookings.createdAt));

  const emails = new Set<string>();

  for (const row of rows) {
    const email = parseEmailFromNotes(row.notes);
    if (email) {
      emails.add(email);
    }
  }

  if (emails.size === 0) {
    return { ok: false, reason: 'missing' };
  }

  if (emails.size > 1) {
    return { ok: false, reason: 'multiple' };
  }

  return { ok: true, email: Array.from(emails)[0] };
}

/** Get a booking for reschedule verification */
export async function getForReschedule(
  bookingId: string
): Promise<Pick<BookingRow, 'id' | 'contact' | 'status' | 'date' | 'time'> | null> {
  const rows = await db
    .select({
      id: bookings.id,
      contact: bookings.contact,
      status: bookings.status,
      date: bookings.date,
      time: bookings.time,
    })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.brandId, MRGUY_BRAND_ID)))
    .limit(1);
  return rows[0] ?? null;
}

/** List bookings that should block public availability for a given date */
export async function listScheduleHoldsByDate(
  date: string,
  options?: {
    statuses?: readonly string[];
    excludeBookingId?: string;
    executor?: typeof db;
  }
): Promise<BookingScheduleHold[]> {
  const executor = options?.executor ?? db;
  const statuses = options?.statuses ?? BLOCKING_BOOKING_STATUSES;

  const conditions = [
    eq(bookings.brandId, MRGUY_BRAND_ID),
    eq(bookings.date, date),
    inArray(bookings.status, [...statuses]),
  ];

  if (options?.excludeBookingId) {
    conditions.push(ne(bookings.id, options.excludeBookingId));
  }

  return executor
    .select({
      id: bookings.id,
      date: bookings.date,
      time: bookings.time,
      status: bookings.status,
    })
    .from(bookings)
    .where(and(...conditions));
}

export async function withScheduleLock<T>(
  date: string,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`booking-schedule:${MRGUY_BRAND_ID}:${date}`}))`
    );
    return callback(tx as unknown as typeof db);
  });
}

// ============================================================
// MUTATIONS
// ============================================================

/** Insert a new booking */
export async function insert(data: BookingInsert): Promise<BookingRow | null> {
  const rows = await db.insert(bookings).values(data).returning();
  return rows[0] ?? null;
}

/** Update a booking by ID (any editable field) */
export async function update(
  id: string,
  data: Partial<
    Pick<
      BookingRow,
      | 'clientName'
      | 'serviceName'
      | 'price'
      | 'date'
      | 'time'
      | 'contact'
      | 'status'
      | 'paymentStatus'
      | 'notes'
      | 'transactionId'
      | 'paymentMethod'
    >
  >
): Promise<BookingRow | null> {
  const rows = await db
    .update(bookings)
    .set(data)
    .where(eq(bookings.id, id))
    .returning();
  return rows[0] ?? null;
}

/** Generate a booking ID in the format BK-YYYYMMDD-XXXX */
export function generateBookingId(date: string): string {
  const dateStr = date.replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${dateStr}-${randomSuffix}`;
}

/** Delete a booking */
export async function deleteById(id: string): Promise<boolean> {
  const result = await db.delete(bookings).where(eq(bookings.id, id)).returning();
  return result.length > 0;
}
