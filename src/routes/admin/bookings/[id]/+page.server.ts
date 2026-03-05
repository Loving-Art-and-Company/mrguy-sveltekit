import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';
import { SERVICE_PACKAGES } from '$lib/data/services';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import { normalizePhone } from '$lib/server/phone';
import type { PageServerLoad, Actions } from './$types';

const VALID_STATUSES = ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'];
const VALID_PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

export const load: PageServerLoad = async ({ params }) => {
	const booking = await bookingRepo.getById(params.id);
	if (!booking) {
		error(404, { message: 'Booking not found' });
	}

	return {
		booking,
		services: SERVICE_PACKAGES.map((p) => ({ id: p.id, name: p.name, priceLow: p.priceLow, priceHigh: p.priceHigh })),
	};
};

const editSchema = z.object({
	clientName: z.string().min(2),
	phone: z.string().min(10),
	email: z.string().email().optional().or(z.literal('')),
	serviceId: z.string().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	time: z.string().regex(/^\d{2}:\d{2}$/),
	street: z.string().min(3),
	city: z.string().min(2),
	state: z.string().length(2).default('FL'),
	zip: z.string().regex(/^\d{5}$/),
	notes: z.string().optional().or(z.literal('')),
	price: z.coerce.number().min(0),
});

export const actions = {
	updateStatus: async ({ request, params }) => {
		const formData = await request.formData();
		const status = formData.get('status') as string;

		if (!VALID_STATUSES.includes(status)) {
			return fail(400, { error: 'Invalid status' });
		}

		await bookingRepo.update(params.id, { status });
		return { success: true };
	},

	updatePaymentStatus: async ({ request, params }) => {
		const formData = await request.formData();
		const paymentStatus = formData.get('paymentStatus') as string;

		if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
			return fail(400, { error: 'Invalid payment status' });
		}

		await bookingRepo.update(params.id, { paymentStatus });
		return { success: true };
	},

	edit: async ({ request, params }) => {
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);

		const result = editSchema.safeParse(raw);
		if (!result.success) {
			return fail(400, { error: 'Invalid data', fieldErrors: result.error.flatten().fieldErrors });
		}

		const d = result.data;
		const pkg = SERVICE_PACKAGES.find((p) => p.id === d.serviceId);
		if (!pkg) {
			return fail(400, { error: 'Invalid service' });
		}

		const cleanPhone = normalizePhone(d.phone);

		const notes = [
			`Address: ${d.street}, ${d.city}, ${d.state} ${d.zip}`,
			d.email ? `Email: ${d.email}` : null,
			d.notes || null,
		].filter(Boolean).join('\n');

		await bookingRepo.update(params.id, {
			clientName: d.clientName,
			serviceName: pkg.name,
			price: d.price,
			date: d.date,
			time: d.time,
			contact: cleanPhone,
			notes,
		});

		return { success: true, edited: true };
	},
} satisfies Actions;
