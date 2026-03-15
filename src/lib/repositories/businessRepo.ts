import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { MRGUY_BRAND_ID } from '$lib/server/brand';
import {
  bookings,
  financeEntries,
  inventoryItems,
  inventoryMovements,
  mileageEntries,
  payrollEntries,
} from '$lib/server/schema';
import * as bookingRepo from '$lib/repositories/bookingRepo';

export type MileageEntryRow = typeof mileageEntries.$inferSelect;
export type InventoryItemRow = typeof inventoryItems.$inferSelect;
export type InventoryMovementRow = typeof inventoryMovements.$inferSelect;
export type FinanceEntryRow = typeof financeEntries.$inferSelect;

export type InventoryMovementType = 'purchase' | 'usage' | 'adjustment';
export type FinanceEntryType = 'revenue' | 'expense' | 'tax' | 'owner_draw';

export interface LinkedBookingOption {
  id: string;
  date: string;
  clientName: string;
  serviceName: string;
  price: number;
  paymentStatus: string | null;
}

export interface MileageListItem {
  id: string;
  entryDate: string;
  purpose: string;
  miles: number;
  startOdometer: number | null;
  endOdometer: number | null;
  notes: string | null;
  bookingId: string | null;
  bookingClientName: string | null;
  bookingServiceName: string | null;
  createdAt: Date;
}

export interface InventoryMovementListItem {
  id: string;
  occurredOn: string;
  movementType: string;
  quantityDelta: number;
  totalCostCents: number;
  notes: string | null;
  itemId: string;
  itemName: string;
  bookingId: string | null;
  bookingClientName: string | null;
  createdAt: Date;
}

export interface FinanceListItem {
  id: string;
  entryDate: string;
  entryType: string;
  category: string;
  amountCents: number;
  notes: string | null;
  bookingId: string | null;
  bookingClientName: string | null;
  createdAt: Date;
}

interface MileageEntryInsertInput {
  bookingId?: string | null;
  createdByUserId: string;
  entryDate: string;
  purpose: string;
  miles: number;
  startOdometer?: number | null;
  endOdometer?: number | null;
  notes?: string | null;
}

interface InventoryItemInsertInput {
  createdByUserId: string;
  name: string;
  sku?: string | null;
  unitLabel: string;
  quantityOnHand: number;
  reorderThreshold: number;
  unitCostCents: number;
  notes?: string | null;
}

interface InventoryMovementInsertInput {
  itemId: string;
  bookingId?: string | null;
  createdByUserId: string;
  occurredOn: string;
  movementType: InventoryMovementType;
  quantityDelta: number;
  totalCostCents?: number | null;
  notes?: string | null;
}

interface FinanceEntryInsertInput {
  bookingId?: string | null;
  createdByUserId: string;
  entryDate: string;
  entryType: FinanceEntryType;
  category: string;
  amountCents: number;
  notes?: string | null;
}

export async function listLinkedBookingOptions(limit: number): Promise<LinkedBookingOption[]> {
  return db
    .select({
      id: bookings.id,
      date: bookings.date,
      clientName: bookings.clientName,
      serviceName: bookings.serviceName,
      price: bookings.price,
      paymentStatus: bookings.paymentStatus,
    })
    .from(bookings)
    .where(eq(bookings.brandId, MRGUY_BRAND_ID))
    .orderBy(desc(bookings.date), desc(bookings.time), desc(bookings.createdAt))
    .limit(limit);
}

export async function listMileageEntries(limit: number): Promise<MileageListItem[]> {
  return db
    .select({
      id: mileageEntries.id,
      entryDate: mileageEntries.entryDate,
      purpose: mileageEntries.purpose,
      miles: mileageEntries.miles,
      startOdometer: mileageEntries.startOdometer,
      endOdometer: mileageEntries.endOdometer,
      notes: mileageEntries.notes,
      bookingId: mileageEntries.bookingId,
      bookingClientName: bookings.clientName,
      bookingServiceName: bookings.serviceName,
      createdAt: mileageEntries.createdAt,
    })
    .from(mileageEntries)
    .leftJoin(bookings, eq(mileageEntries.bookingId, bookings.id))
    .where(eq(mileageEntries.brandId, MRGUY_BRAND_ID))
    .orderBy(desc(mileageEntries.entryDate), desc(mileageEntries.createdAt))
    .limit(limit);
}

export async function summarizeMileage(from: string, to: string): Promise<{
  totalMiles: number;
  entryCount: number;
}> {
  const result = await db
    .select({
      totalMiles: sql<number>`coalesce(sum(${mileageEntries.miles}), 0)`,
      entryCount: sql<number>`count(*)`,
    })
    .from(mileageEntries)
    .where(
      and(
        eq(mileageEntries.brandId, MRGUY_BRAND_ID),
        gte(mileageEntries.entryDate, from),
        lte(mileageEntries.entryDate, to)
      )
    );

  return {
    totalMiles: Number(result[0]?.totalMiles ?? 0),
    entryCount: Number(result[0]?.entryCount ?? 0),
  };
}

export async function createMileageEntry(input: MileageEntryInsertInput): Promise<MileageEntryRow> {
  const [row] = await db
    .insert(mileageEntries)
    .values({
      brandId: MRGUY_BRAND_ID,
      bookingId: input.bookingId ?? null,
      createdByUserId: input.createdByUserId,
      entryDate: input.entryDate,
      purpose: input.purpose,
      miles: input.miles,
      startOdometer: input.startOdometer ?? null,
      endOdometer: input.endOdometer ?? null,
      notes: input.notes ?? null,
    })
    .returning();

  return row;
}

export async function deleteMileageEntry(id: string): Promise<boolean> {
  const rows = await db
    .delete(mileageEntries)
    .where(and(eq(mileageEntries.id, id), eq(mileageEntries.brandId, MRGUY_BRAND_ID)))
    .returning({ id: mileageEntries.id });

  return rows.length > 0;
}

export async function listInventoryItems(): Promise<InventoryItemRow[]> {
  return db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.brandId, MRGUY_BRAND_ID), eq(inventoryItems.isActive, true)))
    .orderBy(asc(inventoryItems.name));
}

export async function listRecentInventoryMovements(limit: number): Promise<InventoryMovementListItem[]> {
  return db
    .select({
      id: inventoryMovements.id,
      occurredOn: inventoryMovements.occurredOn,
      movementType: inventoryMovements.movementType,
      quantityDelta: inventoryMovements.quantityDelta,
      totalCostCents: inventoryMovements.totalCostCents,
      notes: inventoryMovements.notes,
      itemId: inventoryMovements.itemId,
      itemName: inventoryItems.name,
      bookingId: inventoryMovements.bookingId,
      bookingClientName: bookings.clientName,
      createdAt: inventoryMovements.createdAt,
    })
    .from(inventoryMovements)
    .innerJoin(inventoryItems, eq(inventoryMovements.itemId, inventoryItems.id))
    .leftJoin(bookings, eq(inventoryMovements.bookingId, bookings.id))
    .where(eq(inventoryMovements.brandId, MRGUY_BRAND_ID))
    .orderBy(desc(inventoryMovements.occurredOn), desc(inventoryMovements.createdAt))
    .limit(limit);
}

export async function summarizeInventoryPurchases(from: string, to: string): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`coalesce(sum(${inventoryMovements.totalCostCents}), 0)`,
    })
    .from(inventoryMovements)
    .where(
      and(
        eq(inventoryMovements.brandId, MRGUY_BRAND_ID),
        eq(inventoryMovements.movementType, 'purchase'),
        gte(inventoryMovements.occurredOn, from),
        lte(inventoryMovements.occurredOn, to)
      )
    );

  return Number(result[0]?.total ?? 0);
}

export async function createInventoryItem(input: InventoryItemInsertInput): Promise<InventoryItemRow> {
  const [row] = await db
    .insert(inventoryItems)
    .values({
      brandId: MRGUY_BRAND_ID,
      createdByUserId: input.createdByUserId,
      name: input.name,
      sku: input.sku ?? null,
      unitLabel: input.unitLabel,
      quantityOnHand: input.quantityOnHand,
      reorderThreshold: input.reorderThreshold,
      unitCostCents: input.unitCostCents,
      notes: input.notes ?? null,
    })
    .returning();

  return row;
}

export async function updateInventoryItemSettings(input: {
  itemId: string;
  reorderThreshold: number;
  unitCostCents: number;
}): Promise<InventoryItemRow | null> {
  const [row] = await db
    .update(inventoryItems)
    .set({
      reorderThreshold: input.reorderThreshold,
      unitCostCents: input.unitCostCents,
      updatedAt: new Date(),
    })
    .where(and(eq(inventoryItems.id, input.itemId), eq(inventoryItems.brandId, MRGUY_BRAND_ID)))
    .returning();

  return row ?? null;
}

export async function recordInventoryMovement(
  input: InventoryMovementInsertInput
): Promise<InventoryItemRow | null> {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, input.itemId), eq(inventoryItems.brandId, MRGUY_BRAND_ID)))
      .limit(1);

    if (!item) {
      return null;
    }

    const nextQuantity = item.quantityOnHand + input.quantityDelta;
    if (nextQuantity < 0) {
      throw new Error(`Cannot reduce ${item.name} below zero on hand.`);
    }

    const totalCostCents =
      input.movementType === 'purchase'
        ? (input.totalCostCents ?? item.unitCostCents * Math.abs(input.quantityDelta))
        : 0;

    await tx.insert(inventoryMovements).values({
      brandId: MRGUY_BRAND_ID,
      itemId: input.itemId,
      bookingId: input.bookingId ?? null,
      createdByUserId: input.createdByUserId,
      occurredOn: input.occurredOn,
      movementType: input.movementType,
      quantityDelta: input.quantityDelta,
      totalCostCents,
      notes: input.notes ?? null,
    });

    const nextUnitCostCents =
      input.movementType === 'purchase' && input.quantityDelta > 0 && totalCostCents > 0
        ? Math.round(totalCostCents / input.quantityDelta)
        : item.unitCostCents;

    const [updated] = await tx
      .update(inventoryItems)
      .set({
        quantityOnHand: nextQuantity,
        unitCostCents: nextUnitCostCents,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, input.itemId))
      .returning();

    return updated ?? null;
  });
}

export async function listFinanceEntries(limit: number): Promise<FinanceListItem[]> {
  return db
    .select({
      id: financeEntries.id,
      entryDate: financeEntries.entryDate,
      entryType: financeEntries.entryType,
      category: financeEntries.category,
      amountCents: financeEntries.amountCents,
      notes: financeEntries.notes,
      bookingId: financeEntries.bookingId,
      bookingClientName: bookings.clientName,
      createdAt: financeEntries.createdAt,
    })
    .from(financeEntries)
    .leftJoin(bookings, eq(financeEntries.bookingId, bookings.id))
    .where(eq(financeEntries.brandId, MRGUY_BRAND_ID))
    .orderBy(desc(financeEntries.entryDate), desc(financeEntries.createdAt))
    .limit(limit);
}

export async function listFinanceEntriesInRange(from: string, to: string): Promise<FinanceEntryRow[]> {
  return db
    .select()
    .from(financeEntries)
    .where(
      and(
        eq(financeEntries.brandId, MRGUY_BRAND_ID),
        gte(financeEntries.entryDate, from),
        lte(financeEntries.entryDate, to)
      )
    )
    .orderBy(desc(financeEntries.entryDate), desc(financeEntries.createdAt));
}

export async function createFinanceEntry(input: FinanceEntryInsertInput): Promise<FinanceEntryRow> {
  const [row] = await db
    .insert(financeEntries)
    .values({
      brandId: MRGUY_BRAND_ID,
      bookingId: input.bookingId ?? null,
      createdByUserId: input.createdByUserId,
      entryDate: input.entryDate,
      entryType: input.entryType,
      category: input.category,
      amountCents: input.amountCents,
      notes: input.notes ?? null,
    })
    .returning();

  return row;
}

export async function deleteFinanceEntry(id: string): Promise<boolean> {
  const rows = await db
    .delete(financeEntries)
    .where(and(eq(financeEntries.id, id), eq(financeEntries.brandId, MRGUY_BRAND_ID)))
    .returning({ id: financeEntries.id });

  return rows.length > 0;
}

// ============================================================
// PAYROLL
// ============================================================

export type PayrollEntryRow = typeof payrollEntries.$inferSelect;
export type PayrollStatus = 'draft' | 'approved' | 'paid';

export interface PayrollListItem {
  id: string;
  workerName: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  totalJobs: number;
  grossRevenueCents: number;
  payoutRatePercent: number;
  payoutCents: number;
  mileageMiles: number;
  mileageDeductionCents: number;
  supplyCostCents: number;
  netToBusinessCents: number;
  status: string;
  paidDate: string | null;
  paidMethod: string | null;
  notes: string | null;
  createdAt: Date;
}

interface GeneratePayrollInput {
  createdByUserId: string;
  workerName: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payoutRatePercent: number;
}

export async function listPayrollEntries(limit: number): Promise<PayrollListItem[]> {
  return db
    .select({
      id: payrollEntries.id,
      workerName: payrollEntries.workerName,
      payPeriodStart: payrollEntries.payPeriodStart,
      payPeriodEnd: payrollEntries.payPeriodEnd,
      totalJobs: payrollEntries.totalJobs,
      grossRevenueCents: payrollEntries.grossRevenueCents,
      payoutRatePercent: payrollEntries.payoutRatePercent,
      payoutCents: payrollEntries.payoutCents,
      mileageMiles: payrollEntries.mileageMiles,
      mileageDeductionCents: payrollEntries.mileageDeductionCents,
      supplyCostCents: payrollEntries.supplyCostCents,
      netToBusinessCents: payrollEntries.netToBusinessCents,
      status: payrollEntries.status,
      paidDate: payrollEntries.paidDate,
      paidMethod: payrollEntries.paidMethod,
      notes: payrollEntries.notes,
      createdAt: payrollEntries.createdAt,
    })
    .from(payrollEntries)
    .where(eq(payrollEntries.brandId, MRGUY_BRAND_ID))
    .orderBy(desc(payrollEntries.payPeriodStart))
    .limit(limit);
}

export async function generatePayroll(input: GeneratePayrollInput): Promise<PayrollEntryRow> {
  // 1. Query completed+paid bookings in the date range
  const paidBookings = await bookingRepo.listPaidInRange(input.payPeriodStart, input.payPeriodEnd);
  const totalJobs = paidBookings.length;
  const grossRevenueCents = paidBookings.reduce((sum, b) => sum + b.price * 100, 0);

  // 2. Query mileage in the range
  const mileageSummary = await summarizeMileage(input.payPeriodStart, input.payPeriodEnd);
  const mileageMiles = mileageSummary.totalMiles;
  const mileageDeductionCents = mileageMiles * 70; // $0.70/mile

  // 3. Query supply purchases in the range
  const supplyCostCents = await summarizeInventoryPurchases(input.payPeriodStart, input.payPeriodEnd);

  // 4. Calculate payout and net to business
  const payoutCents = Math.round((grossRevenueCents * input.payoutRatePercent) / 100);
  const netToBusinessCents = grossRevenueCents - payoutCents - mileageDeductionCents - supplyCostCents;

  const [row] = await db
    .insert(payrollEntries)
    .values({
      brandId: MRGUY_BRAND_ID,
      createdByUserId: input.createdByUserId,
      workerName: input.workerName,
      payPeriodStart: input.payPeriodStart,
      payPeriodEnd: input.payPeriodEnd,
      totalJobs,
      grossRevenueCents,
      payoutRatePercent: input.payoutRatePercent,
      payoutCents,
      mileageMiles,
      mileageDeductionCents,
      supplyCostCents,
      netToBusinessCents,
    })
    .returning();

  return row;
}

export async function updatePayrollStatus(
  id: string,
  status: PayrollStatus,
  paidDate?: string,
  paidMethod?: string,
  userId?: string
): Promise<PayrollEntryRow | null> {
  const [updated] = await db
    .update(payrollEntries)
    .set({
      status,
      paidDate: paidDate ?? null,
      paidMethod: paidMethod ?? null,
    })
    .where(and(eq(payrollEntries.id, id), eq(payrollEntries.brandId, MRGUY_BRAND_ID)))
    .returning();

  if (!updated) return null;

  // If marking as paid, also create a finance entry for the owner_draw
  if (status === 'paid' && userId) {
    await createFinanceEntry({
      createdByUserId: userId,
      entryDate: paidDate ?? new Date().toISOString().split('T')[0],
      entryType: 'owner_draw',
      category: 'Payroll',
      amountCents: updated.payoutCents,
      notes: `Payroll payout for ${updated.workerName} (${updated.payPeriodStart} to ${updated.payPeriodEnd})`,
    });
  }

  return updated;
}

export async function deletePayrollEntry(id: string): Promise<boolean> {
  const rows = await db
    .delete(payrollEntries)
    .where(
      and(
        eq(payrollEntries.id, id),
        eq(payrollEntries.brandId, MRGUY_BRAND_ID),
        eq(payrollEntries.status, 'draft')
      )
    )
    .returning({ id: payrollEntries.id });

  return rows.length > 0;
}

export async function listPaidPayrollForYear(year: string): Promise<PayrollListItem[]> {
  return db
    .select({
      id: payrollEntries.id,
      workerName: payrollEntries.workerName,
      payPeriodStart: payrollEntries.payPeriodStart,
      payPeriodEnd: payrollEntries.payPeriodEnd,
      totalJobs: payrollEntries.totalJobs,
      grossRevenueCents: payrollEntries.grossRevenueCents,
      payoutRatePercent: payrollEntries.payoutRatePercent,
      payoutCents: payrollEntries.payoutCents,
      mileageMiles: payrollEntries.mileageMiles,
      mileageDeductionCents: payrollEntries.mileageDeductionCents,
      supplyCostCents: payrollEntries.supplyCostCents,
      netToBusinessCents: payrollEntries.netToBusinessCents,
      status: payrollEntries.status,
      paidDate: payrollEntries.paidDate,
      paidMethod: payrollEntries.paidMethod,
      notes: payrollEntries.notes,
      createdAt: payrollEntries.createdAt,
    })
    .from(payrollEntries)
    .where(
      and(
        eq(payrollEntries.brandId, MRGUY_BRAND_ID),
        eq(payrollEntries.status, 'paid'),
        gte(payrollEntries.payPeriodStart, `${year}-01-01`),
        lte(payrollEntries.payPeriodStart, `${year}-12-31`)
      )
    )
    .orderBy(asc(payrollEntries.payPeriodStart));
}

export async function summarizePayrollYTD(year: string): Promise<{
  totalWagesCents: number;
  totalJobs: number;
  entryCount: number;
}> {
  const result = await db
    .select({
      totalWagesCents: sql<number>`coalesce(sum(${payrollEntries.payoutCents}), 0)`,
      totalJobs: sql<number>`coalesce(sum(${payrollEntries.totalJobs}), 0)`,
      entryCount: sql<number>`count(*)`,
    })
    .from(payrollEntries)
    .where(
      and(
        eq(payrollEntries.brandId, MRGUY_BRAND_ID),
        eq(payrollEntries.status, 'paid'),
        gte(payrollEntries.payPeriodStart, `${year}-01-01`),
        lte(payrollEntries.payPeriodStart, `${year}-12-31`)
      )
    );

  return {
    totalWagesCents: Number(result[0]?.totalWagesCents ?? 0),
    totalJobs: Number(result[0]?.totalJobs ?? 0),
    entryCount: Number(result[0]?.entryCount ?? 0),
  };
}
