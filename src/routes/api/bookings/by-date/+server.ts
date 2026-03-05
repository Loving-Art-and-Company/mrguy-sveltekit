import { json, error, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { bookings } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const date = url.searchParams.get('date');
	if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return json([]);
	}

	const rows = await db
		.select({
			id: bookings.id,
			time: bookings.time,
			clientName: bookings.clientName,
			serviceName: bookings.serviceName,
			status: bookings.status,
		})
		.from(bookings)
		.where(
			and(
				eq(bookings.brandId, MRGUY_BRAND_ID),
				eq(bookings.date, date)
			)
		);

	return json(rows);
};
