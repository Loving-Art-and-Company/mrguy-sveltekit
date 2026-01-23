import { supabaseAdmin } from '$lib/server/supabase';
import { MRGUY_BRAND_ID } from '$lib/types/database';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Get today's date in YYYY-MM-DD format
	const today = new Date().toISOString().split('T')[0];

	// Get start of current week (Sunday)
	const now = new Date();
	const dayOfWeek = now.getDay();
	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() - dayOfWeek);
	const weekStartStr = weekStart.toISOString().split('T')[0];

	// Fetch today's bookings count
	const { count: todaysBookingsCount } = await supabaseAdmin
		.from('bookings')
		.select('*', { count: 'exact', head: true })
		.eq('brand_id', MRGUY_BRAND_ID)
		.eq('date', today);

	// Fetch this week's revenue (sum of prices for bookings this week with paid status)
	const { data: weekBookings } = await supabaseAdmin
		.from('bookings')
		.select('price')
		.eq('brand_id', MRGUY_BRAND_ID)
		.gte('date', weekStartStr)
		.lte('date', today)
		.eq('paymentStatus', 'paid');

	const weekRevenue = weekBookings?.reduce((sum, b) => sum + (b.price || 0), 0) ?? 0;

	// Fetch pending payment bookings count
	const { count: pendingCount } = await supabaseAdmin
		.from('bookings')
		.select('*', { count: 'exact', head: true })
		.eq('brand_id', MRGUY_BRAND_ID)
		.eq('paymentStatus', 'pending');

	return {
		stats: {
			todaysBookings: todaysBookingsCount ?? 0,
			weekRevenue,
			pendingBookings: pendingCount ?? 0,
		},
	};
};
