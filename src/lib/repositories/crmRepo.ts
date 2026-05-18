import { db } from '$lib/server/db';
import { bookings } from '$lib/server/schema';
import { desc, eq } from 'drizzle-orm';
import { MRGUY_BRAND_ID } from '$lib/server/brand';

export interface CrmBookingRecord {
	id: string;
	clientName: string;
	serviceName: string;
	price: number;
	date: string;
	time: string | null;
	contact: string;
	status: string | null;
	paymentStatus: string | null;
	notes: string | null;
	createdAt: Date | null;
}

export interface CrmListOptions {
	limit?: number;
	offset?: number;
}

export async function listForCrm(options: CrmListOptions = {}): Promise<CrmBookingRecord[]> {
	const limit = options.limit ?? 1000;
	const offset = options.offset ?? 0;

	return db
		.select({
			id: bookings.id,
			clientName: bookings.clientName,
			serviceName: bookings.serviceName,
			price: bookings.price,
			date: bookings.date,
			time: bookings.time,
			contact: bookings.contact,
			status: bookings.status,
			paymentStatus: bookings.paymentStatus,
			notes: bookings.notes,
			createdAt: bookings.createdAt
		})
		.from(bookings)
		.where(eq(bookings.brandId, MRGUY_BRAND_ID))
		.orderBy(desc(bookings.date), desc(bookings.createdAt))
		.limit(limit)
		.offset(offset);
}
