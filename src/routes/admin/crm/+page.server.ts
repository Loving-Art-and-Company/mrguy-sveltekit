import { fail } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';
import * as crmRepo from '$lib/repositories/crmRepo';
import * as crmCampaignRepo from '$lib/repositories/crmCampaignRepo';
import {
	buildCrmContacts,
	filterUnsubscribedContacts,
	getCampaignTemplate,
	getCampaignTemplateSummaries,
	getCrmSegmentDefinition,
	getCrmSegmentSummaries,
	getSegmentRecipients,
	renderCampaignHtml,
	renderCampaignSubject
} from '$lib/server/crm';
import { createCrmUnsubscribeUrl } from '$lib/server/crmCompliance';
import { sendEmail } from '$lib/server/email';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const sendCampaignSchema = z.object({
	segmentId: z.string().min(1),
	templateId: z.string().min(1),
	confirmation: z.literal('SEND')
});

export const load: PageServerLoad = async () => {
	const [crmRecords, unsubscribedEmails, recentCampaigns, recentUnsubscribes] = await Promise.all([
		crmRepo.listForCrm({ limit: 5000 }),
		crmCampaignRepo.listUnsubscribedEmails(),
		crmCampaignRepo.listRecentCampaignSends(),
		crmCampaignRepo.listRecentUnsubscribes()
	]);

	const contacts = buildCrmContacts(crmRecords);
	const activeContacts = filterUnsubscribedContacts(contacts, unsubscribedEmails);
	const unsubscribedSet = new Set(unsubscribedEmails);
	const segments = getCrmSegmentSummaries(activeContacts);
	const templates = getCampaignTemplateSummaries();

	const recipientsBySegment = Object.fromEntries(
		segments.map((segment) => [
			segment.id,
			{
				count: segment.count,
				sampleRecipients: getSegmentRecipients(activeContacts, segment.id)
					.slice(0, 5)
					.map((contact) => ({
						name: contact.name,
						email: contact.email,
						lastServiceName: contact.lastServiceName,
						lastServiceDate: contact.lastServiceDate
					}))
			}
		])
	);

	return {
		stats: {
			totalContacts: contacts.length,
			emailableContacts: activeContacts.length,
			repeatCustomers: contacts.filter((contact) => contact.completedBookings >= 2).length,
			upcomingActionNeeded: segments.find((segment) => segment.id === 'pending-follow-up')?.count ?? 0,
			unsubscribedContacts: unsubscribedEmails.length
		},
		segments,
		templates,
		recipientsBySegment,
		contacts: contacts.slice(0, 60).map((contact) => ({
			...contact,
			unsubscribed: contact.email ? unsubscribedSet.has(contact.email.toLowerCase()) : false
		})),
		recentCampaigns: recentCampaigns.map((campaign) => ({
			...campaign,
			createdAt: campaign.createdAt.toISOString(),
			completedAt: campaign.completedAt?.toISOString() ?? null
		})),
		recentUnsubscribes: recentUnsubscribes.map((row) => ({
			...row,
			unsubscribedAt: row.unsubscribedAt.toISOString()
		}))
	};
};

export const actions = {
	sendCampaign: async ({ request, locals }) => {
		const user = requireAuth(locals);
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);
		const parsed = sendCampaignSchema.safeParse(raw);

		if (!parsed.success) {
			return fail(400, {
				campaignError: 'Confirm SEND before launching a campaign.'
			});
		}

		const { segmentId, templateId } = parsed.data;
		const template = getCampaignTemplate(templateId);
		if (!template) {
			return fail(400, { campaignError: 'Unknown campaign template.' });
		}

		if (template.segmentId !== segmentId) {
			return fail(400, { campaignError: 'Template does not match the selected segment.' });
		}

		const segmentDefinition = getCrmSegmentDefinition(segmentId);
		if (!segmentDefinition) {
			return fail(400, { campaignError: 'Unknown segment.' });
		}

		const [crmRecords, unsubscribedEmails] = await Promise.all([
			crmRepo.listForCrm({ limit: 5000 }),
			crmCampaignRepo.listUnsubscribedEmails()
		]);
		const contacts = buildCrmContacts(crmRecords);
		const segmentRecipients = getSegmentRecipients(contacts, segmentId).filter((contact) => Boolean(contact.email));
		const recipients = filterUnsubscribedContacts(segmentRecipients, unsubscribedEmails);
		const suppressedCount = segmentRecipients.length - recipients.length;

		if (recipients.length === 0) {
			return fail(400, {
				campaignError:
					suppressedCount > 0
						? 'Everyone in that segment is already unsubscribed.'
						: 'No recipients currently match that segment.'
			});
		}

		if (recipients.length > 150) {
			return fail(400, {
				campaignError: `That campaign would send to ${recipients.length} recipients. Narrow the segment before sending.`
			});
		}

		const campaignSend = await crmCampaignRepo.createCampaignSend({
			createdByUserId: user.id,
			segmentId,
			segmentName: segmentDefinition.name,
			templateId,
			templateName: template.name,
			requestedRecipientCount: segmentRecipients.length,
			suppressedRecipientCount: suppressedCount
		});

		let sentCount = 0;
		const failedRecipients: string[] = [];

		for (const recipient of recipients) {
			const unsubscribeUrl = createCrmUnsubscribeUrl(recipient.email!, campaignSend.id);
			const delivered = await sendEmail({
				to: recipient.email!,
				subject: renderCampaignSubject(templateId, recipient),
				html: renderCampaignHtml(templateId, recipient, { unsubscribeUrl })
			});

			if (delivered) {
				sentCount += 1;
			} else {
				failedRecipients.push(recipient.email!);
			}
		}

		await crmCampaignRepo.completeCampaignSend(campaignSend.id, {
			sentCount,
			failedCount: failedRecipients.length,
			failedRecipients,
			status: sentCount === 0 ? 'failed' : failedRecipients.length > 0 ? 'partial' : 'completed'
		});

		return {
			campaignResult: {
				campaignId: campaignSend.id,
				templateName: template.name,
				segmentName: segmentDefinition.name,
				suppressedCount,
				sentCount,
				failedCount: failedRecipients.length,
				failedRecipients: failedRecipients.slice(0, 5)
			}
		};
	}
} satisfies Actions;
