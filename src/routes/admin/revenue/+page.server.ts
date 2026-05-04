import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { BookingRow } from '$lib/repositories/bookingRepo';
import { MRGUY_BRAND_ID } from '$lib/server/brand';
import { db } from '$lib/server/db';
import { bookings } from '$lib/server/schema';
import { and, eq, gte, lte, sql, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

type Period = 'week' | 'month' | 'year';

interface DateRange {
	start: string;
	end: string;
}

interface ServiceBreakdown {
	serviceName: string;
	revenue: number;
	count: number;
	percentage: number;
}

interface TimeDataPoint {
	label: string;
	revenue: number;
	date: string;
}

export interface RevenueData {
	period: Period;
	totalRevenue: number;
	bookingCount: number;
	averageValue: number;
	previousRevenue: number;
	previousCount: number;
	revenueChange: number;
	countChange: number;
	topService: string | null;
	serviceBreakdown: ServiceBreakdown[];
	timeData: TimeDataPoint[];
	recentBookings: BookingRow[];
}

function getPeriodRange(period: Period): DateRange {
	const now = new Date();
	const end = now.toISOString().split('T')[0];
	let start: Date;

	switch (period) {
		case 'week':
			start = new Date(now);
			start.setDate(now.getDate() - 7);
			break;
		case 'month':
			start = new Date(now);
			start.setMonth(now.getMonth() - 1);
			break;
		case 'year':
			start = new Date(now);
			start.setFullYear(now.getFullYear() - 1);
			break;
	}

	return { start: start.toISOString().split('T')[0], end };
}

function getPreviousPeriodRange(period: Period): DateRange {
	const current = getPeriodRange(period);
	const currentStart = new Date(current.start);
	const currentEnd = new Date(current.end);
	const duration = currentEnd.getTime() - currentStart.getTime();

	const previousEnd = new Date(currentStart);
	previousEnd.setDate(previousEnd.getDate() - 1);
	const previousStart = new Date(previousEnd.getTime() - duration);

	return {
		start: previousStart.toISOString().split('T')[0],
		end: previousEnd.toISOString().split('T')[0],
	};
}

function calculatePercentChange(current: number, previous: number): number {
	if (previous === 0) return current > 0 ? 100 : 0;
	return Math.round(((current - previous) / previous) * 100);
}

async function aggregateByService(
	brandId: string,
	startDate: string,
	endDate: string
): Promise<ServiceBreakdown[]> {
	const results = await db
		.select({
			serviceName: bookings.serviceName,
			revenue: sql<number>`coalesce(sum(${bookings.price}), 0)`.as('revenue'),
			count: sql<number>`count(*)`.as('count')
		})
		.from(bookings)
		.where(
			and(
				eq(bookings.brandId, brandId),
				eq(bookings.paymentStatus, 'paid'),
				gte(bookings.date, startDate),
				lte(bookings.date, endDate)
			)
		)
		.groupBy(bookings.serviceName)
		.orderBy(desc(sql`revenue`));

	const totalRevenue = results.reduce((sum, r) => sum + Number(r.revenue), 0);

	return results.map((row) => ({
		serviceName: row.serviceName,
		revenue: Number(row.revenue),
		count: Number(row.count),
		percentage: totalRevenue > 0 ? Math.round((Number(row.revenue) / totalRevenue) * 100) : 0
	}));
}

async function aggregateByTime(
	brandId: string,
	startDate: string,
	endDate: string,
	period: Period
): Promise<TimeDataPoint[]> {
	let groupBy: ReturnType<typeof sql>;

	if (period === 'week') {
		groupBy = sql`${bookings.date}`;
	} else if (period === 'month') {
		groupBy = sql`date_trunc('week', ${bookings.date}::date)`;
	} else {
		groupBy = sql`to_char(${bookings.date}::date, 'YYYY-MM')`;
	}

	const rawResults = await db
		.select({
			dateKey: groupBy.as('date_key'),
			revenue: sql<number>`coalesce(sum(${bookings.price}), 0)`.as('revenue')
		})
		.from(bookings)
		.where(
			and(
				eq(bookings.brandId, brandId),
				eq(bookings.paymentStatus, 'paid'),
				gte(bookings.date, startDate),
				lte(bookings.date, endDate)
			)
		)
		.groupBy(groupBy)
		.orderBy(groupBy);

	return rawResults.map((row) => {
		const date = String(row.dateKey);
		let label: string;
		if (period === 'week') {
			const d = new Date(date);
			label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
		} else if (period === 'month') {
			const d = new Date(date);
			label = `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
		} else {
			const [year, month] = date.split('-');
			const d = new Date(parseInt(year), parseInt(month) - 1);
			label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
		}
		return { label, revenue: Number(row.revenue), date };
	});
}

export const load: PageServerLoad = async ({ url }) => {
	const periodParam = url.searchParams.get('period');
	const period: Period =
		periodParam === 'week' || periodParam === 'month' || periodParam === 'year'
			? periodParam
			: 'month';

	const currentRange = getPeriodRange(period);
	const previousRange = getPreviousPeriodRange(period);

	const [current, previous, recent, serviceBreakdown, timeData] = await Promise.all([
		bookingRepo.listPaidInRange(currentRange.start, currentRange.end),
		bookingRepo.listPaidInRange(previousRange.start, previousRange.end),
		bookingRepo.listRecentPaid(10),
		aggregateByService(MRGUY_BRAND_ID, currentRange.start, currentRange.end),
		aggregateByTime(MRGUY_BRAND_ID, currentRange.start, currentRange.end, period)
	]);

	const totalRevenue = current.reduce((sum, b) => sum + b.price, 0);
	const previousRevenue = previous.reduce((sum, b) => sum + b.price, 0);
	const bookingCount = current.length;
	const previousCount = previous.length;
	const averageValue = bookingCount > 0 ? Math.round(totalRevenue / bookingCount) : 0;

	const topService = serviceBreakdown.length > 0 ? serviceBreakdown[0].serviceName : null;

	const revenueData: RevenueData = {
		period,
		totalRevenue,
		bookingCount,
		averageValue,
		previousRevenue,
		previousCount,
		revenueChange: calculatePercentChange(totalRevenue, previousRevenue),
		countChange: calculatePercentChange(bookingCount, previousCount),
		topService,
		serviceBreakdown,
		timeData,
		recentBookings: recent,
	};

	return { revenue: revenueData };
};
