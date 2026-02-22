import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { BookingRow } from '$lib/repositories/bookingRepo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Get month from query param or default to current month
	const monthParam = url.searchParams.get('month');
	const now = new Date();

	let year: number;
	let month: number; // 0-indexed

	if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
		const [y, m] = monthParam.split('-').map(Number);
		year = y;
		month = m - 1;
	} else {
		year = now.getFullYear();
		month = now.getMonth();
	}

	// Calculate first and last day of month
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);

	const fromDate = formatDate(firstDay);
	const toDate = formatDate(lastDay);

	try {
		const bookingsData = await bookingRepo.listByMonth(fromDate, toDate);

		// Group bookings by date
		const bookings: Record<string, BookingRow[]> = {};
		for (const booking of bookingsData) {
			if (!bookings[booking.date]) {
				bookings[booking.date] = [];
			}
			bookings[booking.date].push(booking);
		}

		return {
			bookings,
			currentMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
		};
	} catch (err) {
		console.error('Error fetching calendar bookings:', err);
		return {
			bookings: {} as Record<string, BookingRow[]>,
			currentMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
		};
	}
};

function formatDate(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
