import { db } from '$lib/server/db';
import { bookings } from '$lib/server/schema';
import { desc, eq } from 'drizzle-orm';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

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

export async function listForCrm(): Promise<CrmBookingRecord[]> {
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
		.orderBy(desc(bookings.date), desc(bookings.createdAt));
}
