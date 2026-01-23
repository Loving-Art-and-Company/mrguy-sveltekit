import { error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { Booking } from '$lib/types/database';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const { data: booking, error: dbError } = await supabaseAdmin
		.from('bookings')
		.select('*')
		.eq('id', id)
		.single();

	if (dbError || !booking) {
		error(404, {
			message: 'Booking not found',
		});
	}

	return { booking: booking as Booking };
};
