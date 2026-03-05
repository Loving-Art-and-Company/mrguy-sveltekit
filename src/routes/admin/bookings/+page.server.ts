import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { BookingRow } from '$lib/repositories/bookingRepo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status');
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');
	const search = url.searchParams.get('search');

	// Calendar month (default to current)
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

	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const calFrom = fmtDate(firstDay);
	const calTo = fmtDate(lastDay);

	try {
		// Parallel: filtered list + calendar month data
		const [bookings, calendarBookings] = await Promise.all([
			bookingRepo.list({ status, from, to, search }),
			bookingRepo.listByMonth(calFrom, calTo),
		]);

		// Group calendar bookings by date
		const calendarByDate: Record<string, Pick<BookingRow, 'id' | 'time' | 'clientName' | 'serviceName' | 'status'>[]> = {};
		for (const b of calendarBookings) {
			if (!calendarByDate[b.date]) calendarByDate[b.date] = [];
			calendarByDate[b.date].push({
				id: b.id,
				time: b.time,
				clientName: b.clientName,
				serviceName: b.serviceName,
				status: b.status,
			});
		}

		return {
			bookings,
			filters: { status, from, to, search },
			calendarByDate,
			currentMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
		};
	} catch (err) {
		console.error('Error fetching bookings:', err);
		return {
			bookings: [],
			filters: { status, from, to, search },
			calendarByDate: {} as Record<string, Pick<BookingRow, 'id' | 'time' | 'clientName' | 'serviceName' | 'status'>[]>,
			currentMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
		};
	}
};

function fmtDate(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
