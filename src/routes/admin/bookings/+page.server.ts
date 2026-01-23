import { supabaseAdmin } from '$lib/server/supabase';
import { MRGUY_BRAND_ID, type Booking } from '$lib/types/database';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status');
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');
	const search = url.searchParams.get('search');

	let query = supabaseAdmin
		.from('bookings')
		.select('*')
		.eq('brand_id', MRGUY_BRAND_ID)
		.order('date', { ascending: false })
		.order('time', { ascending: false });

	// Apply status filter
	if (status && status !== 'all') {
		query = query.eq('status', status);
	}

	// Apply date range filters
	if (from) {
		query = query.gte('date', from);
	}
	if (to) {
		query = query.lte('date', to);
	}

	// Apply search filter (client name or phone)
	if (search) {
		query = query.or(`clientName.ilike.%${search}%,contact.ilike.%${search}%`);
	}

	const { data: bookings, error } = await query;

	if (error) {
		console.error('Error fetching bookings:', error);
		return { bookings: [] as Booking[], filters: { status, from, to, search } };
	}

	return {
		bookings: (bookings ?? []) as Booking[],
		filters: { status, from, to, search },
	};
};
