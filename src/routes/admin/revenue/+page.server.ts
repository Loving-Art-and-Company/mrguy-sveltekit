import * as bookingRepo from '$lib/repositories/bookingRepo';
import type { BookingRow } from '$lib/repositories/bookingRepo';
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

function aggregateByService(bookings: BookingRow[]): ServiceBreakdown[] {
	const serviceMap = new Map<string, { revenue: number; count: number }>();

	for (const booking of bookings) {
		const existing = serviceMap.get(booking.serviceName) || { revenue: 0, count: 0 };
		existing.revenue += booking.price;
		existing.count += 1;
		serviceMap.set(booking.serviceName, existing);
	}

	const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);

	return Array.from(serviceMap.entries())
		.map(([serviceName, data]) => ({
			serviceName,
			revenue: data.revenue,
			count: data.count,
			percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
		}))
		.sort((a, b) => b.revenue - a.revenue);
}

function aggregateByTime(bookings: BookingRow[], period: Period): TimeDataPoint[] {
	const grouped = new Map<string, number>();

	for (const booking of bookings) {
		let key: string;
		const date = new Date(booking.date);

		if (period === 'week') {
			key = booking.date;
		} else if (period === 'month') {
			const dayOfWeek = date.getDay();
			const monday = new Date(date);
			monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
			key = monday.toISOString().split('T')[0];
		} else {
			key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		}

		grouped.set(key, (grouped.get(key) || 0) + booking.price);
	}

	return Array.from(grouped.entries())
		.map(([date, revenue]) => {
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
			return { label, revenue, date };
		})
		.sort((a, b) => a.date.localeCompare(b.date));
}

export const load: PageServerLoad = async ({ url }) => {
	const periodParam = url.searchParams.get('period');
	const period: Period =
		periodParam === 'week' || periodParam === 'month' || periodParam === 'year'
			? periodParam
			: 'month';

	const currentRange = getPeriodRange(period);
	const previousRange = getPreviousPeriodRange(period);

	// Parallel fetch: current period, previous period, and recent paid bookings
	const [current, previous, recent] = await Promise.all([
		bookingRepo.listPaidInRange(currentRange.start, currentRange.end),
		bookingRepo.listPaidInRange(previousRange.start, previousRange.end),
		bookingRepo.listRecentPaid(10),
	]);

	const totalRevenue = current.reduce((sum, b) => sum + b.price, 0);
	const previousRevenue = previous.reduce((sum, b) => sum + b.price, 0);
	const bookingCount = current.length;
	const previousCount = previous.length;
	const averageValue = bookingCount > 0 ? Math.round(totalRevenue / bookingCount) : 0;

	const serviceBreakdown = aggregateByService(current);
	const topService = serviceBreakdown.length > 0 ? serviceBreakdown[0].serviceName : null;
	const timeData = aggregateByTime(current, period);

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
