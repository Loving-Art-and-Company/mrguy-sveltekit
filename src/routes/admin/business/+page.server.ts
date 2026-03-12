import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import * as bookingRepo from '$lib/repositories/bookingRepo';
import * as businessRepo from '$lib/repositories/businessRepo';
import { requireAuth } from '$lib/server/auth';
import { ensureBusinessSchema } from '$lib/server/businessSchema';
import type { Actions, PageServerLoad } from './$types';

type Period = 'month' | 'quarter' | 'year';

const PERIODS: readonly Period[] = ['month', 'quarter', 'year'];

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.');

const requiredShortText = (label: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalShortText = (max = 240) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const optionalIdField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const positiveIntegerField = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number.`)
    .transform(Number)
    .refine((value) => value > 0, `${label} must be greater than zero.`);

const nonNegativeIntegerField = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number.`)
    .transform(Number)
    .refine((value) => value >= 0, `${label} cannot be negative.`);

const optionalIntegerField = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((value) => value === undefined || value === '' || /^\d+$/.test(value), {
      message: `${label} must be a whole number.`,
    })
    .transform((value) => (value && value.length > 0 ? Number(value) : null));

const currencyField = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, `${label} must look like 24 or 24.50.`)
    .transform((value) => Math.round(Number(value) * 100));

const optionalCurrencyField = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((value) => value === undefined || value === '' || /^\d+(\.\d{1,2})?$/.test(value), {
      message: `${label} must look like 24 or 24.50.`,
    })
    .transform((value) => (value && value.length > 0 ? Math.round(Number(value) * 100) : null));

const mileageSchema = z
  .object({
    entryDate: dateField,
    purpose: requiredShortText('Purpose'),
    miles: positiveIntegerField('Miles'),
    startOdometer: optionalIntegerField('Starting odometer'),
    endOdometer: optionalIntegerField('Ending odometer'),
    bookingId: optionalIdField,
    notes: optionalShortText(400),
  })
  .superRefine((value, ctx) => {
    const hasStart = value.startOdometer !== null;
    const hasEnd = value.endOdometer !== null;

    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: 'custom',
        path: ['startOdometer'],
        message: 'Enter both odometer values or leave both blank.',
      });
    }

    if (hasStart && hasEnd) {
      if (value.endOdometer! < value.startOdometer!) {
        ctx.addIssue({
          code: 'custom',
          path: ['endOdometer'],
          message: 'Ending odometer must be greater than or equal to the starting odometer.',
        });
      }

      if (value.endOdometer! - value.startOdometer! !== value.miles) {
        ctx.addIssue({
          code: 'custom',
          path: ['miles'],
          message: 'Miles must match the odometer difference.',
        });
      }
    }
  });

const inventoryItemSchema = z.object({
  name: requiredShortText('Item name', 80),
  sku: optionalShortText(60),
  unitLabel: requiredShortText('Unit label', 40),
  quantityOnHand: nonNegativeIntegerField('Starting quantity'),
  reorderThreshold: nonNegativeIntegerField('Reorder threshold'),
  unitCost: currencyField('Unit cost'),
  notes: optionalShortText(240),
});

const inventorySettingsSchema = z.object({
  itemId: requiredShortText('Item'),
  reorderThreshold: nonNegativeIntegerField('Reorder threshold'),
  unitCost: currencyField('Unit cost'),
});

const inventoryMovementSchema = z.object({
  itemId: requiredShortText('Inventory item'),
  occurredOn: dateField,
  movementType: z.enum(['purchase', 'usage', 'adjustment']),
  quantity: positiveIntegerField('Quantity'),
  adjustmentDirection: z.enum(['increase', 'decrease']).default('increase'),
  totalCost: optionalCurrencyField('Total cost'),
  bookingId: optionalIdField,
  notes: optionalShortText(240),
});

const financeEntrySchema = z.object({
  entryDate: dateField,
  entryType: z.enum(['revenue', 'expense', 'tax', 'owner_draw']),
  category: requiredShortText('Category', 60),
  amount: currencyField('Amount'),
  bookingId: optionalIdField,
  notes: optionalShortText(240),
});

function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  const start = new Date(now);

  if (period === 'month') {
    start.setMonth(now.getMonth() - 1);
  } else if (period === 'quarter') {
    start.setMonth(now.getMonth() - 3);
  } else {
    start.setFullYear(now.getFullYear() - 1);
  }

  return {
    start: start.toISOString().split('T')[0],
    end,
  };
}

function getPeriodLabel(period: Period): string {
  if (period === 'quarter') return 'Last 90 days';
  if (period === 'year') return 'Last 12 months';
  return 'Last 30 days';
}

function firstFieldError(fieldErrors: Record<string, string[] | undefined>, fallback: string): string {
  const first = Object.values(fieldErrors).flat().find(Boolean);
  return first ?? fallback;
}

async function ensureLinkedBookingExists(bookingId: string | null): Promise<boolean> {
  if (!bookingId) {
    return true;
  }

  const booking = await bookingRepo.getById(bookingId);
  return booking !== null;
}

export const load: PageServerLoad = async ({ url }) => {
  await ensureBusinessSchema();

  const periodParam = url.searchParams.get('period');
  const period: Period = PERIODS.includes(periodParam as Period) ? (periodParam as Period) : 'month';
  const range = getPeriodRange(period);

  const [
    linkedBookings,
    mileageEntries,
    mileageSummary,
    inventoryItems,
    recentInventoryMovements,
    supplySpendCents,
    recentFinanceEntries,
    financeEntriesInRange,
    paidBookingsInRange,
    recentPaidBookings,
  ] = await Promise.all([
    businessRepo.listLinkedBookingOptions(30),
    businessRepo.listMileageEntries(12),
    businessRepo.summarizeMileage(range.start, range.end),
    businessRepo.listInventoryItems(),
    businessRepo.listRecentInventoryMovements(12),
    businessRepo.summarizeInventoryPurchases(range.start, range.end),
    businessRepo.listFinanceEntries(12),
    businessRepo.listFinanceEntriesInRange(range.start, range.end),
    bookingRepo.listPaidInRange(range.start, range.end),
    bookingRepo.listRecentPaid(8),
  ]);

  const bookingRevenueCents = paidBookingsInRange.reduce((sum, booking) => sum + booking.price * 100, 0);

  const financeTotals = financeEntriesInRange.reduce(
    (totals, entry) => {
      if (entry.entryType === 'revenue') totals.manualRevenueCents += entry.amountCents;
      if (entry.entryType === 'expense') totals.otherExpenseCents += entry.amountCents;
      if (entry.entryType === 'tax') totals.taxesPaidCents += entry.amountCents;
      if (entry.entryType === 'owner_draw') totals.ownerDrawsCents += entry.amountCents;
      return totals;
    },
    {
      manualRevenueCents: 0,
      otherExpenseCents: 0,
      taxesPaidCents: 0,
      ownerDrawsCents: 0,
    }
  );

  const inventoryValueCents = inventoryItems.reduce(
    (sum, item) => sum + item.quantityOnHand * item.unitCostCents,
    0
  );
  const lowStockItems = inventoryItems.filter(
    (item) => item.reorderThreshold > 0 && item.quantityOnHand <= item.reorderThreshold
  );

  const cashBasisProfitCents =
    bookingRevenueCents +
    financeTotals.manualRevenueCents -
    supplySpendCents -
    financeTotals.otherExpenseCents;

  return {
    period,
    periodLabel: getPeriodLabel(period),
    today: new Date().toISOString().split('T')[0],
    linkedBookings,
    summary: {
      bookingRevenueCents,
      manualRevenueCents: financeTotals.manualRevenueCents,
      supplySpendCents,
      otherExpenseCents: financeTotals.otherExpenseCents,
      taxesPaidCents: financeTotals.taxesPaidCents,
      ownerDrawsCents: financeTotals.ownerDrawsCents,
      cashBasisProfitCents,
      netCashAfterOutflowsCents:
        cashBasisProfitCents - financeTotals.taxesPaidCents - financeTotals.ownerDrawsCents,
      totalMiles: mileageSummary.totalMiles,
      mileageEntryCount: mileageSummary.entryCount,
      inventoryValueCents,
      lowStockCount: lowStockItems.length,
      activeInventoryItems: inventoryItems.length,
    },
    mileage: {
      entries: mileageEntries.map((entry) => ({
        id: entry.id,
        entryDate: entry.entryDate,
        purpose: entry.purpose,
        miles: entry.miles,
        startOdometer: entry.startOdometer,
        endOdometer: entry.endOdometer,
        notes: entry.notes,
        bookingId: entry.bookingId,
        bookingClientName: entry.bookingClientName,
        bookingServiceName: entry.bookingServiceName,
      })),
    },
    inventory: {
      items: inventoryItems.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        unitLabel: item.unitLabel,
        quantityOnHand: item.quantityOnHand,
        reorderThreshold: item.reorderThreshold,
        unitCostCents: item.unitCostCents,
        inventoryValueCents: item.quantityOnHand * item.unitCostCents,
        notes: item.notes,
        isLowStock: item.reorderThreshold > 0 && item.quantityOnHand <= item.reorderThreshold,
      })),
      lowStockItems: lowStockItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantityOnHand: item.quantityOnHand,
        reorderThreshold: item.reorderThreshold,
        unitLabel: item.unitLabel,
      })),
      recentMovements: recentInventoryMovements.map((movement) => ({
        id: movement.id,
        occurredOn: movement.occurredOn,
        movementType: movement.movementType,
        quantityDelta: movement.quantityDelta,
        totalCostCents: movement.totalCostCents,
        notes: movement.notes,
        itemName: movement.itemName,
        bookingId: movement.bookingId,
        bookingClientName: movement.bookingClientName,
      })),
    },
    bookkeeping: {
      recentFinanceEntries: recentFinanceEntries.map((entry) => ({
        id: entry.id,
        entryDate: entry.entryDate,
        entryType: entry.entryType,
        category: entry.category,
        amountCents: entry.amountCents,
        notes: entry.notes,
        bookingId: entry.bookingId,
        bookingClientName: entry.bookingClientName,
      })),
      recentPaidBookings: recentPaidBookings.map((booking) => ({
        id: booking.id,
        date: booking.date,
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        amountCents: booking.price * 100,
      })),
    },
  };
};

export const actions = {
  addMileage: async ({ request, locals }) => {
    await ensureBusinessSchema();
    const user = requireAuth(locals);
    const formData = await request.formData();
    const raw = Object.fromEntries(formData);
    const parsed = mileageSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return fail(400, {
        mileageError: firstFieldError(fieldErrors, 'Please fix the mileage entry and try again.'),
        mileageValues: raw,
      });
    }

    if (!(await ensureLinkedBookingExists(parsed.data.bookingId))) {
      return fail(400, {
        mileageError: 'The selected booking could not be found.',
        mileageValues: raw,
      });
    }

    await businessRepo.createMileageEntry({
      createdByUserId: user.id,
      bookingId: parsed.data.bookingId,
      entryDate: parsed.data.entryDate,
      purpose: parsed.data.purpose,
      miles: parsed.data.miles,
      startOdometer: parsed.data.startOdometer,
      endOdometer: parsed.data.endOdometer,
      notes: parsed.data.notes,
    });

    return { mileageSuccess: 'Mileage entry saved.' };
  },

  deleteMileage: async ({ request, locals }) => {
    await ensureBusinessSchema();
    requireAuth(locals);
    const formData = await request.formData();
    const mileageId = formData.get('mileageId');

    if (typeof mileageId !== 'string' || mileageId.length === 0) {
      return fail(400, { mileageError: 'Missing mileage entry.' });
    }

    const deleted = await businessRepo.deleteMileageEntry(mileageId);
    if (!deleted) {
      return fail(500, { mileageError: 'Could not delete that mileage entry.' });
    }

    return { mileageSuccess: 'Mileage entry removed.' };
  },

  addInventoryItem: async ({ request, locals }) => {
    await ensureBusinessSchema();
    const user = requireAuth(locals);
    const formData = await request.formData();
    const raw = Object.fromEntries(formData);
    const parsed = inventoryItemSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return fail(400, {
        inventoryItemError: firstFieldError(fieldErrors, 'Please fix the inventory item and try again.'),
        inventoryItemValues: raw,
      });
    }

    await businessRepo.createInventoryItem({
      createdByUserId: user.id,
      name: parsed.data.name,
      sku: parsed.data.sku,
      unitLabel: parsed.data.unitLabel,
      quantityOnHand: parsed.data.quantityOnHand,
      reorderThreshold: parsed.data.reorderThreshold,
      unitCostCents: parsed.data.unitCost,
      notes: parsed.data.notes,
    });

    return { inventoryItemSuccess: 'Inventory item added.' };
  },

  updateInventoryItem: async ({ request, locals }) => {
    await ensureBusinessSchema();
    requireAuth(locals);
    const formData = await request.formData();
    const raw = Object.fromEntries(formData);
    const parsed = inventorySettingsSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return fail(400, {
        inventorySettingsError: firstFieldError(fieldErrors, 'Could not update item settings.'),
      });
    }

    const updated = await businessRepo.updateInventoryItemSettings({
      itemId: parsed.data.itemId,
      reorderThreshold: parsed.data.reorderThreshold,
      unitCostCents: parsed.data.unitCost,
    });

    if (!updated) {
      return fail(400, { inventorySettingsError: 'That inventory item no longer exists.' });
    }

    return { inventorySettingsSuccess: `Updated ${updated.name}.` };
  },

  recordInventoryMovement: async ({ request, locals }) => {
    await ensureBusinessSchema();
    const user = requireAuth(locals);
    const formData = await request.formData();
    const raw = Object.fromEntries(formData);
    const parsed = inventoryMovementSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return fail(400, {
        movementError: firstFieldError(fieldErrors, 'Please fix the stock movement and try again.'),
        movementValues: raw,
      });
    }

    if (!(await ensureLinkedBookingExists(parsed.data.bookingId))) {
      return fail(400, {
        movementError: 'The selected booking could not be found.',
        movementValues: raw,
      });
    }

    const quantityDelta =
      parsed.data.movementType === 'purchase'
        ? parsed.data.quantity
        : parsed.data.movementType === 'usage'
          ? -parsed.data.quantity
          : parsed.data.adjustmentDirection === 'increase'
            ? parsed.data.quantity
            : -parsed.data.quantity;

    try {
      const updated = await businessRepo.recordInventoryMovement({
        itemId: parsed.data.itemId,
        bookingId: parsed.data.bookingId,
        createdByUserId: user.id,
        occurredOn: parsed.data.occurredOn,
        movementType: parsed.data.movementType,
        quantityDelta,
        totalCostCents: parsed.data.totalCost,
        notes: parsed.data.notes,
      });

      if (!updated) {
        return fail(400, {
          movementError: 'That inventory item no longer exists.',
          movementValues: raw,
        });
      }
    } catch (error) {
      return fail(400, {
        movementError: error instanceof Error ? error.message : 'Could not record the stock movement.',
        movementValues: raw,
      });
    }

    return { movementSuccess: 'Stock movement recorded.' };
  },

  addFinanceEntry: async ({ request, locals }) => {
    await ensureBusinessSchema();
    const user = requireAuth(locals);
    const formData = await request.formData();
    const raw = Object.fromEntries(formData);
    const parsed = financeEntrySchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return fail(400, {
        financeError: firstFieldError(fieldErrors, 'Please fix the bookkeeping entry and try again.'),
        financeValues: raw,
      });
    }

    if (!(await ensureLinkedBookingExists(parsed.data.bookingId))) {
      return fail(400, {
        financeError: 'The selected booking could not be found.',
        financeValues: raw,
      });
    }

    await businessRepo.createFinanceEntry({
      createdByUserId: user.id,
      bookingId: parsed.data.bookingId,
      entryDate: parsed.data.entryDate,
      entryType: parsed.data.entryType,
      category: parsed.data.category,
      amountCents: parsed.data.amount,
      notes: parsed.data.notes,
    });

    return { financeSuccess: 'Bookkeeping entry saved.' };
  },

  deleteFinanceEntry: async ({ request, locals }) => {
    await ensureBusinessSchema();
    requireAuth(locals);
    const formData = await request.formData();
    const financeId = formData.get('financeId');

    if (typeof financeId !== 'string' || financeId.length === 0) {
      return fail(400, { financeError: 'Missing bookkeeping entry.' });
    }

    const deleted = await businessRepo.deleteFinanceEntry(financeId);
    if (!deleted) {
      return fail(500, { financeError: 'Could not delete that bookkeeping entry.' });
    }

    return { financeSuccess: 'Bookkeeping entry removed.' };
  },
} satisfies Actions;
