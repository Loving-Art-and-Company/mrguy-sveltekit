import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { MRGUY_BRAND_ID } from '$lib/types/database';

export const load: PageServerLoad = async ({ cookies, locals }) => {
	// Check for client session (stored in cookie after OTP verification)
	const clientId = cookies.get('client_id');
	const clientPhone = cookies.get('client_phone');

	if (!clientId || !clientPhone) {
		redirect(303, '/portal/login');
	}

	const { supabase } = locals;

	// Get client profile
	const { data: client } = await supabase
		.from('client_profiles')
		.select('*')
		.eq('id', clientId)
		.single();

	if (!client) {
		// Invalid session, clear cookies and redirect
		cookies.delete('client_id', { path: '/' });
		cookies.delete('client_phone', { path: '/' });
		redirect(303, '/portal/login');
	}

	// Get client's subscriptions with package info
	const { data: subscriptions } = await supabase
		.from('client_subscriptions')
		.select(`
			*,
			package:subscription_packages(*)
		`)
		.eq('client_id', clientId)
		.order('purchased_at', { ascending: false });

	// Get client's bookings
	const { data: bookings } = await supabase
		.from('bookings')
		.select('*')
		.eq('contact', clientPhone)
		.eq('brand_id', MRGUY_BRAND_ID)
		.order('date', { ascending: false });

	// Get available packages for purchase
	const { data: packages } = await supabase
		.from('subscription_packages')
		.select('*')
		.eq('brand_id', MRGUY_BRAND_ID)
		.eq('is_active', true)
		.order('sort_order', { ascending: true });

	return {
		client,
		subscriptions: subscriptions ?? [],
		bookings: bookings ?? [],
		packages: packages ?? []
	};
};
