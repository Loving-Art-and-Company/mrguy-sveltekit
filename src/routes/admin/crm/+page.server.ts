import { fail } from '@sveltejs/kit';
import * as crmRepo from '$lib/repositories/crmRepo';
import {
	buildCrmContacts,
	getCampaignTemplate,
	getCampaignTemplateSummaries,
	getCrmSegmentSummaries,
	getSegmentRecipients,
	renderCampaignHtml,
	renderCampaignSubject
} from '$lib/server/crm';
import { sendEmail } from '$lib/server/email';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const sendCampaignSchema = z.object({
	segmentId: z.string().min(1),
	templateId: z.string().min(1),
	confirmation: z.literal('SEND')
});

export const load: PageServerLoad = async () => {
	const crmRecords = await crmRepo.listForCrm();
	const contacts = buildCrmContacts(crmRecords);
	const segments = getCrmSegmentSummaries(contacts);
	const templates = getCampaignTemplateSummaries();

	const recipientsBySegment = Object.fromEntries(
		segments.map((segment) => [
			segment.id,
			{
				count: segment.count,
				sampleRecipients: getSegmentRecipients(contacts, segment.id)
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
			emailableContacts: contacts.filter((contact) => Boolean(contact.email)).length,
			repeatCustomers: contacts.filter((contact) => contact.completedBookings >= 2).length,
			upcomingActionNeeded: segments.find((segment) => segment.id === 'pending-follow-up')?.count ?? 0
		},
		segments,
		templates,
		recipientsBySegment,
		contacts: contacts.slice(0, 60)
	};
};

export const actions = {
	sendCampaign: async ({ request }) => {
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

		const crmRecords = await crmRepo.listForCrm();
		const contacts = buildCrmContacts(crmRecords);
		const recipients = getSegmentRecipients(contacts, segmentId).filter((contact) => Boolean(contact.email));

		if (recipients.length === 0) {
			return fail(400, { campaignError: 'No recipients currently match that segment.' });
		}

		if (recipients.length > 150) {
			return fail(400, {
				campaignError: `That campaign would send to ${recipients.length} recipients. Narrow the segment before sending.`
			});
		}

		let sentCount = 0;
		const failedRecipients: string[] = [];

		for (const recipient of recipients) {
			const delivered = await sendEmail({
				to: recipient.email!,
				subject: renderCampaignSubject(templateId, recipient),
				html: renderCampaignHtml(templateId, recipient)
			});

			if (delivered) {
				sentCount += 1;
			} else {
				failedRecipients.push(recipient.email!);
			}
		}

		return {
			campaignResult: {
				templateName: template.name,
				segmentName: segmentId,
				sentCount,
				failedCount: failedRecipients.length,
				failedRecipients: failedRecipients.slice(0, 5)
			}
		};
	}
} satisfies Actions;
