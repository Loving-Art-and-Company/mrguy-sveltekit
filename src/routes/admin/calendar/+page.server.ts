import { supabaseAdmin } from '$lib/server/supabase';
import { MRGUY_BRAND_ID, type Booking } from '$lib/types/database';
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
		month = m - 1; // Convert to 0-indexed
	} else {
		year = now.getFullYear();
		month = now.getMonth();
	}

	// Calculate first and last day of month for query
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);

	const fromDate = formatDate(firstDay);
	const toDate = formatDate(lastDay);

	// Fetch all bookings for this month
	const { data: bookingsData, error } = await supabaseAdmin
		.from('bookings')
		.select('*')
		.eq('brand_id', MRGUY_BRAND_ID)
		.gte('date', fromDate)
		.lte('date', toDate)
		.order('time', { ascending: true });

	if (error) {
		console.error('Error fetching calendar bookings:', error);
		return {
			bookings: {} as Record<string, Booking[]>,
			currentMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
		};
	}

	// Group bookings by date
	const bookings: Record<string, Booking[]> = {};
	for (const booking of (bookingsData ?? []) as Booking[]) {
		if (!bookings[booking.date]) {
			bookings[booking.date] = [];
		}
		bookings[booking.date].push(booking);
	}

	return {
		bookings,
		currentMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
	};
};

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
