import { json, type RequestHandler } from '@sveltejs/kit';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import { buildAvailabilitySlots } from '$lib/scheduling';

const NO_STORE_HEADERS = {
  'cache-control': 'no-store, max-age=0',
  pragma: 'no-cache',
  expires: '0',
};

export const GET: RequestHandler = async ({ url }) => {
  const date = url.searchParams.get('date');
  const excludeBookingId = url.searchParams.get('excludeBookingId') ?? undefined;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ date, slots: [] }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const holds = await bookingRepo.listScheduleHoldsByDate(date, { excludeBookingId });

  return json({
    date,
    slots: buildAvailabilitySlots(holds, date, excludeBookingId),
  }, { headers: NO_STORE_HEADERS });
};
