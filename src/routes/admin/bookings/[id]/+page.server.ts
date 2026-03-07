import { error, fail } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import { z } from 'zod';
import { SERVICE_PACKAGES } from '$lib/data/services';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import { normalizePhone } from '$lib/server/phone';
import { getStripe } from '$lib/server/stripe';
import type { PageServerLoad, Actions } from './$types';

const VALID_STATUSES = ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'];
const VALID_PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];
type BookingRecord = NonNullable<Awaited<ReturnType<typeof bookingRepo.getById>>>;

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

function parseEmail(notes: string | null): string | undefined {
	const match = notes?.match(/Email:\s*(\S+)/);
	return match?.[1];
}

async function createOrReusePaymentLink(booking: BookingRecord) {
	if (booking.transactionId?.startsWith('cs_')) {
		const existingSession = await getStripe().checkout.sessions.retrieve(booking.transactionId);
		if (
			existingSession.status === 'open' &&
			existingSession.payment_status !== 'paid' &&
			existingSession.url
		) {
			return {
				paymentUrl: existingSession.url,
				paymentSessionId: existingSession.id
			};
		}
	}

	const session = await getStripe().checkout.sessions.create({
		mode: 'payment',
		payment_method_types: ['card'],
		client_reference_id: booking.id,
		customer_email: parseEmail(booking.notes),
		line_items: [
			{
				price_data: {
					currency: 'usd',
					product_data: {
						name: `${booking.serviceName} - Mobile Detailing`,
						description: `Payment for completed booking ${booking.id}`
					},
					unit_amount: Math.round(booking.price * 100)
				},
				quantity: 1
			}
		],
		metadata: {
			payment_flow: 'existing_booking',
			booking_id: booking.id,
			customer_name: booking.clientName,
			customer_phone: booking.contact
		},
		payment_intent_data: {
			metadata: {
				payment_flow: 'existing_booking',
				booking_id: booking.id,
				customer_phone: booking.contact
			}
		},
		success_url: `${publicEnv.PUBLIC_BASE_URL}/pay/success?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${publicEnv.PUBLIC_BASE_URL}/`
	});

	if (!session.url) {
		throw new Error('Stripe did not return a payment link.');
	}

	await bookingRepo.update(booking.id, { transactionId: session.id });

	return {
		paymentUrl: session.url,
		paymentSessionId: session.id
	};
}

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

	createPaymentLink: async ({ params }) => {
		const booking = await bookingRepo.getById(params.id);
		if (!booking) {
			throw error(404, 'Booking not found');
		}

		if (booking.paymentStatus === 'paid') {
			return fail(400, { paymentLinkError: 'This booking is already marked paid.' });
		}

		if (booking.paymentStatus === 'refunded') {
			return fail(400, {
				paymentLinkError: 'Refunded bookings should be reviewed manually before collecting payment again.'
			});
		}

		if (booking.status !== 'completed') {
			return fail(400, {
				paymentLinkError: 'Mark the booking completed before generating a payment link.'
			});
		}

		if (booking.price <= 0) {
			return fail(400, {
				paymentLinkError: 'Booking price must be greater than $0 to create a payment link.'
			});
		}

		try {
			const result = await createOrReusePaymentLink(booking);
			return {
				success: true,
				paymentUrl: result.paymentUrl,
				paymentSessionId: result.paymentSessionId
			};
		} catch (err) {
			console.error('[admin] createPaymentLink error:', err);
			return fail(500, { paymentLinkError: 'Failed to create payment link. Please try again.' });
		}
	},

	completeAndCreatePaymentLink: async ({ params }) => {
		let booking = await bookingRepo.getById(params.id);
		if (!booking) {
			throw error(404, 'Booking not found');
		}

		if (booking.paymentStatus === 'paid') {
			return fail(400, { paymentLinkError: 'This booking is already marked paid.' });
		}

		if (booking.paymentStatus === 'refunded') {
			return fail(400, {
				paymentLinkError: 'Refunded bookings should be reviewed manually before collecting payment again.'
			});
		}

		if (booking.status === 'cancelled') {
			return fail(400, {
				paymentLinkError: 'Cancelled bookings must be reviewed manually before collecting payment.'
			});
		}

		if (booking.price <= 0) {
			return fail(400, {
				paymentLinkError: 'Booking price must be greater than $0 to create a payment link.'
			});
		}

		try {
			if (booking.status !== 'completed') {
				const updatedBooking = await bookingRepo.update(params.id, { status: 'completed' });
				if (!updatedBooking) {
					return fail(500, {
						paymentLinkError: 'Could not mark the booking completed. Please try again.'
					});
				}
				booking = updatedBooking;
			}

			const result = await createOrReusePaymentLink(booking);
			return {
				success: true,
				paymentUrl: result.paymentUrl,
				paymentSessionId: result.paymentSessionId
			};
		} catch (err) {
			console.error('[admin] completeAndCreatePaymentLink error:', err);
			return fail(500, { paymentLinkError: 'Failed to create payment link. Please try again.' });
		}
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
