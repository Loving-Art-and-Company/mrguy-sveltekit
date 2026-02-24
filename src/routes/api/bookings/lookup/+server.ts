import { json, error } from '@sveltejs/kit';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { phone } = await request.json();

		if (!phone) {
			throw error(400, 'Phone number is required');
		}

		const normalizedPhone = normalizePhone(phone);

		const bookings = await bookingRepo.listByContact(normalizedPhone, ['pending', 'confirmed']);

		if (bookings.length === 0) {
			return json({
				success: true,
				bookings: [],
				message: 'No upcoming bookings found for this phone number.',
			});
		}

		// Set session cookie so /api/bookings/mine and /api/bookings/reschedule work
		const sessionToken = generateSessionToken();
		cookies.set(
			'client_session',
			JSON.stringify({
				phone: normalizedPhone,
				token: sessionToken,
				expires: Date.now() + 30 * 60 * 1000, // 30 minutes
			}),
			{
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 30 * 60,
			}
		);

		return json({
			success: true,
			bookings: bookings.map((b) => ({
				id: b.id,
				serviceName: b.serviceName,
				price: b.price,
				date: b.date,
				time: b.time,
				status: b.status,
			})),
		});
	} catch (err) {
		console.error('Booking lookup error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to look up bookings');
	}
};

function normalizePhone(phone: string): string {
	const digits = phone.replace(/\D/g, '');
	if (digits.length === 10) {
		return `+1${digits}`;
	}
	if (digits.length === 11 && digits.startsWith('1')) {
		return `+${digits}`;
	}
	return `+${digits}`;
}

function generateSessionToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
