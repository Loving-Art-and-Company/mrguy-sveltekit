import { error } from '@sveltejs/kit';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const booking = await bookingRepo.getById(id);

	if (!booking) {
		error(404, {
			message: 'Booking not found',
		});
	}

	return { booking };
};
