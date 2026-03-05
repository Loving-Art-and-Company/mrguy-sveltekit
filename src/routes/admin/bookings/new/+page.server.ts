import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { SERVICE_PACKAGES } from '$lib/data/services';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import { normalizePhone } from '$lib/server/phone';
import { notifyOwnerOfBooking, sendCustomerConfirmation } from '$lib/server/email';
import { notifyOwnerOfBookingSMS, sendCustomerConfirmationSMS } from '$lib/server/sms';
import { createCalendarEvent } from '$lib/server/calendar';
import type { Actions, PageServerLoad } from './$types';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

const adminBookingSchema = z.object({
	clientName: z.string().min(2, 'Client name is required'),
	phone: z.string().min(10, 'Valid phone number is required'),
	email: z.string().email('Invalid email').optional().or(z.literal('')),
	serviceId: z.string().min(1, 'Service is required'),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date is required'),
	time: z.string().regex(/^\d{2}:\d{2}$/, 'Valid time is required'),
	street: z.string().min(5, 'Street address is required'),
	city: z.string().min(2, 'City is required'),
	state: z.string().length(2).default('FL'),
	zip: z.string().regex(/^\d{5}$/, 'Valid 5-digit ZIP is required'),
	notes: z.string().optional().or(z.literal('')),
});

export const load: PageServerLoad = async () => {
	return {
		services: SERVICE_PACKAGES.map((pkg) => ({
			id: pkg.id,
			name: pkg.name,
			priceLow: pkg.priceLow,
			priceHigh: pkg.priceHigh,
		})),
	};
};

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const raw = {
			clientName: formData.get('clientName') as string,
			phone: formData.get('phone') as string,
			email: formData.get('email') as string,
			serviceId: formData.get('serviceId') as string,
			date: formData.get('date') as string,
			time: formData.get('time') as string,
			street: formData.get('street') as string,
			city: formData.get('city') as string,
			state: (formData.get('state') as string) || 'FL',
			zip: formData.get('zip') as string,
			notes: formData.get('notes') as string,
		};

		const result = adminBookingSchema.safeParse(raw);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				values: raw,
			});
		}

		const data = result.data;

		// Look up service package server-side
		const pkg = SERVICE_PACKAGES.find((p) => p.id === data.serviceId);
		if (!pkg) {
			return fail(400, {
				errors: { serviceId: ['Invalid service selected'] },
				values: raw,
			});
		}

		const cleanPhone = normalizePhone(data.phone);

		// Admin-created bookings: no promo, use full price
		const finalPrice = pkg.priceHigh;

		// Build notes with address info (matches existing pattern — no address columns in schema)
		const notes = [
			`Address: ${data.street}, ${data.city}, ${data.state} ${data.zip}`,
			data.notes ? `Admin notes: ${data.notes}` : null,
			'Created by admin',
		]
			.filter(Boolean)
			.join('\n');

		const bookingId = bookingRepo.generateBookingId(data.date);

		try {
			const newBooking = await bookingRepo.insert({
				id: bookingId,
				brandId: MRGUY_BRAND_ID,
				clientName: data.clientName,
				serviceName: pkg.name,
				price: finalPrice,
				date: data.date,
				time: data.time,
				contact: cleanPhone,
				promoCode: null,
				notes,
				status: 'confirmed',
				paymentStatus: 'unpaid',
			});

			if (!newBooking) {
				return fail(500, {
					errors: { _form: ['Failed to create booking. Please try again.'] },
					values: raw,
				});
			}

			// Build notification payload (matches email/SMS function signatures)
			const notificationPayload = {
				service: { id: pkg.id, name: pkg.name, price: finalPrice },
				schedule: { date: data.date, time: data.time },
				address: { street: data.street, city: data.city, state: data.state, zip: data.zip },
				contact: { name: data.clientName, phone: cleanPhone, email: data.email || undefined },
			};

			// Fire and forget notifications + calendar sync
			Promise.allSettled([
				notifyOwnerOfBooking(notificationPayload),
				sendCustomerConfirmation(notificationPayload),
				notifyOwnerOfBookingSMS(notificationPayload),
				sendCustomerConfirmationSMS(notificationPayload),
				createCalendarEvent({
					id: bookingId,
					service: { name: pkg.name, price: finalPrice },
					schedule: { date: data.date, time: data.time },
					address: { street: data.street, city: data.city, state: data.state, zip: data.zip },
					contact: { name: data.clientName, phone: cleanPhone, email: data.email || undefined },
				}),
			]).then((results) => {
				const labels = ['owner email', 'customer email', 'owner SMS', 'customer SMS', 'calendar'];
				results.forEach((r, i) => {
					if (r.status === 'rejected') {
						console.warn(`Failed to send ${labels[i]} notification for admin booking ${bookingId}`);
					}
				});
			});
		} catch (err) {
			console.error('Admin booking creation error:', err);
			return fail(500, {
				errors: { _form: ['Failed to create booking. Please try again.'] },
				values: raw,
			});
		}

		redirect(303, '/admin/bookings');
	},
} satisfies Actions;
