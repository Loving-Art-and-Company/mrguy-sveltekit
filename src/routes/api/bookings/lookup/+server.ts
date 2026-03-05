import { json, error } from '@sveltejs/kit';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import { checkRateLimit } from '$lib/server/rateLimit';
import { normalizePhone } from '$lib/server/phone';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const rateLimit = await checkRateLimit(
			`rl:booking-lookup:${getClientIp(request)}`,
			8,
			60
		);

		if (!rateLimit.success) {
			throw error(429, 'Too many requests. Please wait a moment and try again.');
		}

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

function getClientIp(request: Request): string {
	const xff = request.headers.get('x-forwarded-for');
	const direct = request.headers.get('x-real-ip');
	return xff?.split(',')[0]?.trim() || direct || 'unknown';
}

function generateSessionToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
