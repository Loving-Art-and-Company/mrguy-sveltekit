import { db } from '$lib/server/db';
import { crmCampaignSends, crmEmailUnsubscribes } from '$lib/server/schema';
import { desc, eq } from 'drizzle-orm';

const MRGUY_BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';

export interface CrmCampaignSendRow {
	id: string;
	segmentId: string;
	segmentName: string;
	templateId: string;
	templateName: string;
	requestedRecipientCount: number;
	suppressedRecipientCount: number;
	sentCount: number;
	failedCount: number;
	status: string;
	createdAt: Date;
	completedAt: Date | null;
}

export interface CrmUnsubscribeRow {
	id: string;
	email: string;
	source: string;
	reason: string | null;
	campaignSendId: string | null;
	unsubscribedAt: Date;
}

interface CreateCampaignSendInput {
	createdByUserId: string;
	segmentId: string;
	segmentName: string;
	templateId: string;
	templateName: string;
	requestedRecipientCount: number;
	suppressedRecipientCount: number;
}

interface CompleteCampaignSendInput {
	sentCount: number;
	failedCount: number;
	failedRecipients: string[];
	status: string;
}

interface UnsubscribeEmailInput {
	email: string;
	source: string;
	reason?: string;
	campaignSendId?: string | null;
	createdByUserId?: string | null;
}

export async function createCampaignSend(input: CreateCampaignSendInput): Promise<CrmCampaignSendRow> {
	const [campaign] = await db
		.insert(crmCampaignSends)
		.values({
			brandId: MRGUY_BRAND_ID,
			createdByUserId: input.createdByUserId,
			segmentId: input.segmentId,
			segmentName: input.segmentName,
			templateId: input.templateId,
			templateName: input.templateName,
			requestedRecipientCount: input.requestedRecipientCount,
			suppressedRecipientCount: input.suppressedRecipientCount
		})
		.returning();

	return campaign;
}

export async function completeCampaignSend(
	id: string,
	input: CompleteCampaignSendInput
): Promise<CrmCampaignSendRow> {
	const [campaign] = await db
		.update(crmCampaignSends)
		.set({
			sentCount: input.sentCount,
			failedCount: input.failedCount,
			failedRecipients: input.failedRecipients,
			status: input.status,
			completedAt: new Date()
		})
		.where(eq(crmCampaignSends.id, id))
		.returning();

	return campaign;
}

export async function listRecentCampaignSends(limit = 8): Promise<CrmCampaignSendRow[]> {
	return db
		.select()
		.from(crmCampaignSends)
		.where(eq(crmCampaignSends.brandId, MRGUY_BRAND_ID))
		.orderBy(desc(crmCampaignSends.createdAt))
		.limit(limit);
}

export async function listUnsubscribedEmails(): Promise<string[]> {
	const rows = await db
		.select({ email: crmEmailUnsubscribes.email })
		.from(crmEmailUnsubscribes)
		.where(eq(crmEmailUnsubscribes.brandId, MRGUY_BRAND_ID));

	return rows.map((row) => row.email.toLowerCase());
}

export async function listRecentUnsubscribes(limit = 12): Promise<CrmUnsubscribeRow[]> {
	return db
		.select({
			id: crmEmailUnsubscribes.id,
			email: crmEmailUnsubscribes.email,
			source: crmEmailUnsubscribes.source,
			reason: crmEmailUnsubscribes.reason,
			campaignSendId: crmEmailUnsubscribes.campaignSendId,
			unsubscribedAt: crmEmailUnsubscribes.unsubscribedAt
		})
		.from(crmEmailUnsubscribes)
		.where(eq(crmEmailUnsubscribes.brandId, MRGUY_BRAND_ID))
		.orderBy(desc(crmEmailUnsubscribes.unsubscribedAt))
		.limit(limit);
}

export async function unsubscribeEmail(input: UnsubscribeEmailInput): Promise<void> {
	const email = input.email.trim().toLowerCase();

	await db
		.insert(crmEmailUnsubscribes)
		.values({
			brandId: MRGUY_BRAND_ID,
			email,
			source: input.source,
			reason: input.reason ?? null,
			campaignSendId: input.campaignSendId ?? null,
			createdByUserId: input.createdByUserId ?? null,
			unsubscribedAt: new Date()
		})
		.onConflictDoUpdate({
			target: [crmEmailUnsubscribes.brandId, crmEmailUnsubscribes.email],
			set: {
				source: input.source,
				reason: input.reason ?? null,
				campaignSendId: input.campaignSendId ?? null,
				createdByUserId: input.createdByUserId ?? null,
				unsubscribedAt: new Date()
			}
		});
}
