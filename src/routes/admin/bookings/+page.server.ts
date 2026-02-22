import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status');
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');
	const search = url.searchParams.get('search');

	try {
		const bookings = await bookingRepo.list({ status, from, to, search });

		return {
			bookings,
			filters: { status, from, to, search },
		};
	} catch (err) {
		console.error('Error fetching bookings:', err);
		return {
			bookings: [],
			filters: { status, from, to, search },
		};
	}
};
