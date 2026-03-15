import { error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';
import { ensureBusinessSchema } from '$lib/server/businessSchema';
import * as businessRepo from '$lib/repositories/businessRepo';
import type { RequestHandler } from './$types';

function centsToUsd(cents: number): string {
  return (cents / 100).toFixed(2);
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const GET: RequestHandler = async ({ url, locals }) => {
  await ensureBusinessSchema();
  requireAuth(locals);

  const year = url.searchParams.get('year') ?? new Date().getFullYear().toString();

  if (!/^\d{4}$/.test(year)) {
    throw error(400, 'Invalid year parameter.');
  }

  const [entries, ytd] = await Promise.all([
    businessRepo.listPaidPayrollForYear(year),
    businessRepo.summarizePayrollYTD(year),
  ]);

  const headers = [
    'Worker Name',
    'Period Start',
    'Period End',
    'Total Jobs',
    'Gross Revenue',
    'Payout Rate %',
    'Payout (W-2 Wages)',
    'Mileage Miles',
    'Mileage Deduction',
    'Supply Costs',
    'Net to Business',
    'Paid Date',
    'Paid Method',
    'Notes',
  ];

  const rows = entries.map((entry) => [
    escapeCsv(entry.workerName),
    entry.payPeriodStart,
    entry.payPeriodEnd,
    String(entry.totalJobs),
    centsToUsd(entry.grossRevenueCents),
    String(entry.payoutRatePercent),
    centsToUsd(entry.payoutCents),
    String(entry.mileageMiles),
    centsToUsd(entry.mileageDeductionCents),
    centsToUsd(entry.supplyCostCents),
    centsToUsd(entry.netToBusinessCents),
    entry.paidDate ?? '',
    entry.paidMethod ?? '',
    escapeCsv(entry.notes ?? ''),
  ]);

  // Add summary row
  rows.push([]);
  rows.push([
    'YEAR-TO-DATE TOTALS',
    `${year}-01-01`,
    `${year}-12-31`,
    String(ytd.totalJobs),
    '', // gross revenue not tracked in YTD summary
    '',
    centsToUsd(ytd.totalWagesCents),
    '',
    '',
    '',
    '',
    '',
    '',
    `${ytd.entryCount} pay periods`,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mrguy-payroll-${year}.csv"`,
    },
  });
};
