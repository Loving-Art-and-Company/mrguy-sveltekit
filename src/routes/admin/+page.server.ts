import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Get start of current week (Sunday)
	const now = new Date();
	const dayOfWeek = now.getDay();
	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() - dayOfWeek);
	const weekStartStr = weekStart.toISOString().split('T')[0];
	const today = now.toISOString().split('T')[0];

	// Parallel fetch for dashboard stats
	const [todaysBookings, weekRevenue, pendingBookings] = await Promise.all([
		bookingRepo.countToday(),
		bookingRepo.sumRevenue(weekStartStr, today),
		bookingRepo.countPending(),
	]);

	return {
		stats: {
			todaysBookings,
			weekRevenue,
			pendingBookings,
		},
	};
};
