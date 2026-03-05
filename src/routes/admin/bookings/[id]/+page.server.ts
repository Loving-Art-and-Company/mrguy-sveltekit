import { error, fail } from '@sveltejs/kit';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { PageServerLoad, Actions } from './$types';

const VALID_STATUSES = ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'];
const VALID_PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const booking = await bookingRepo.getById(id);

	if (!booking) {
		error(404, { message: 'Booking not found' });
	}

	return { booking };
};

export const actions = {
	updateStatus: async ({ request, params }) => {
		const formData = await request.formData();
		const status = formData.get('status') as string;

		if (!VALID_STATUSES.includes(status)) {
			return fail(400, { error: 'Invalid status' });
		}

		const updated = await bookingRepo.update(params.id, { status });
		if (!updated) {
			return fail(500, { error: 'Failed to update status' });
		}

		return { success: true };
	},

	updatePaymentStatus: async ({ request, params }) => {
		const formData = await request.formData();
		const paymentStatus = formData.get('paymentStatus') as string;

		if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
			return fail(400, { error: 'Invalid payment status' });
		}

		const updated = await bookingRepo.update(params.id, { paymentStatus });
		if (!updated) {
			return fail(500, { error: 'Failed to update payment status' });
		}

		return { success: true };
	},
} satisfies Actions;
