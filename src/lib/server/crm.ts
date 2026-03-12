import { MRGUY_CANONICAL_ORIGIN } from '$lib/constants/site';
import type { CrmBookingRecord } from '$lib/repositories/crmRepo';

export interface CrmContact {
	phone: string;
	name: string;
	email: string | null;
	city: string | null;
	lastServiceName: string;
	lastServiceDate: string;
	lastServiceStatus: string;
	lastCompletedDate: string | null;
	totalBookings: number;
	completedBookings: number;
	totalRevenue: number;
	hasUpcomingBooking: boolean;
	pendingLeadHours: number | null;
	services: string[];
}

export interface CrmSegmentSummary {
	id: string;
	name: string;
	description: string;
	bestPractice: string;
	recommendedTemplateId: string;
	count: number;
}

export interface CrmCampaignTemplateSummary {
	id: string;
	name: string;
	segmentId: string;
	description: string;
	bestPractice: string;
	goal: string;
	subjectPreview: string;
	bodyPreview: string[];
	ctaLabel: string;
}

type CrmCampaignTemplateDefinition = CrmCampaignTemplateSummary & {
	subjectTemplate: string;
	introTemplate: string;
	closingTemplate: string;
	ctaUrl: string;
};

type TokenMap = Record<string, string>;

const DAY_MS = 24 * 60 * 60 * 1000;

const CRM_SEGMENTS = [
	{
		id: 'pending-follow-up',
		name: 'Pending follow-up',
		description: 'Leads with a pending or rescheduled booking request that still needs a response.',
		bestPractice: 'Follow up fast while intent is still high.',
		recommendedTemplateId: 'pending-follow-up'
	},
	{
		id: 'review-referral',
		name: 'Review + referral ask',
		description: 'Recent completed customers who should be nudged for a review and referral.',
		bestPractice: 'Ask for reviews while the result is still fresh.',
		recommendedTemplateId: 'review-referral'
	},
	{
		id: 'maintenance-reminder',
		name: 'Maintenance reminder',
		description: 'Customers likely ready for another wash or interior refresh.',
		bestPractice: 'Detailing businesses grow when rebooks become a habit.',
		recommendedTemplateId: 'maintenance-reminder'
	},
	{
		id: 'win-back',
		name: 'Win-back',
		description: 'Lapsed customers who have not booked in a while and need a reason to return.',
		bestPractice: 'Lead with convenience and a clear next step.',
		recommendedTemplateId: 'win-back'
	},
	{
		id: 'membership-upsell',
		name: 'Membership upsell',
		description: 'Repeat customers who are good candidates for recurring maintenance plans.',
		bestPractice: 'Pitch monthly convenience after proving service quality.',
		recommendedTemplateId: 'membership-upsell'
	}
] as const;

const CRM_CAMPAIGN_TEMPLATES: CrmCampaignTemplateDefinition[] = [
	{
		id: 'pending-follow-up',
		name: 'Pending booking follow-up',
		segmentId: 'pending-follow-up',
		description: 'A quick, helpful nudge for leads still waiting on a booking confirmation.',
		bestPractice: 'Use short, service-first copy and a direct booking CTA.',
		goal: 'Recover warm leads before they go cold.',
		subjectPreview: 'Still want that detail this week?',
		subjectTemplate: 'Still want that detail this week, {{firstName}}?',
		introTemplate:
			'I wanted to follow up on your detailing request for {{serviceName}}. If you still want the appointment, reply to this email or book your preferred time below and I’ll get it locked in.',
		bodyPreview: [
			'Quick follow-up on the detail request.',
			'Reassure them that you can confirm timing fast.',
			'One clear CTA back to booking.'
		],
		closingTemplate: 'Thanks, Pablo',
		ctaLabel: 'Book your detail',
		ctaUrl: `${MRGUY_CANONICAL_ORIGIN}/#services`
	},
	{
		id: 'review-referral',
		name: 'Review + referral request',
		segmentId: 'review-referral',
		description: 'Ask happy customers for a Google review and a referral.',
		bestPractice: 'Keep the ask simple and tie it to a recent service.',
		goal: 'Increase reviews and word-of-mouth referrals.',
		subjectPreview: 'Quick favor after your detail',
		subjectTemplate: 'Quick favor after your detail, {{firstName}}',
		introTemplate:
			'Taking care of your {{serviceName}} in {{city}} was a pleasure. If the detail looked great, the best help you can give is a quick Google review — and if a friend needs their car cleaned up, feel free to send them my way.',
		bodyPreview: [
			'Reference the recent detail.',
			'Ask for a Google review.',
			'Add a soft referral ask.'
		],
		closingTemplate: 'Appreciate you, Pablo',
		ctaLabel: 'Leave a Google review',
		ctaUrl: 'https://www.google.com/search?q=Mr.+Guy+Mobile+Detail'
	},
	{
		id: 'maintenance-reminder',
		name: 'Maintenance reminder',
		segmentId: 'maintenance-reminder',
		description: 'Invite customers back before the car gets too far gone again.',
		bestPractice: 'Position it as convenience, not a hard sell.',
		goal: 'Drive repeat bookings from existing customers.',
		subjectPreview: 'Ready for your next detail?',
		subjectTemplate: 'Ready for your next detail, {{firstName}}?',
		introTemplate:
			'It’s been a little while since your last detail. If your car is ready for a fresh wash, interior reset, or showroom cleanup, I can come straight to you and make it easy.',
		bodyPreview: [
			'Remind them that maintenance is easier than a full reset.',
			'Offer mobile convenience.',
			'Give one booking CTA.'
		],
		closingTemplate: 'Talk soon, Pablo',
		ctaLabel: 'Book your next visit',
		ctaUrl: `${MRGUY_CANONICAL_ORIGIN}/#services`
	},
	{
		id: 'win-back',
		name: 'Win-back campaign',
		segmentId: 'win-back',
		description: 'Re-engage older customers with a simple, direct return offer.',
		bestPractice: 'Win-back emails should be low-friction and specific.',
		goal: 'Bring lapsed customers back into the booking cycle.',
		subjectPreview: 'Want me to bring your car back to life?',
		subjectTemplate: 'Want me to bring your car back to life, {{firstName}}?',
		introTemplate:
			'It’s been a while since I detailed your vehicle. If the car could use a reset, I can handle the wash, interior, or full detail right in your driveway so you don’t have to lose part of your day.',
		bodyPreview: [
			'Lead with convenience and familiarity.',
			'Reassure them you already know the job.',
			'Offer a clear path back to booking.'
		],
		closingTemplate: 'Best, Pablo',
		ctaLabel: 'Schedule a return visit',
		ctaUrl: `${MRGUY_CANONICAL_ORIGIN}/#services`
	},
	{
		id: 'membership-upsell',
		name: 'Monthly plan upsell',
		segmentId: 'membership-upsell',
		description: 'Pitch recurring care to repeat customers who already trust the service.',
		bestPractice: 'Sell the time saved and consistency, not just the discount.',
		goal: 'Turn repeat buyers into recurring revenue.',
		subjectPreview: 'Want to stop thinking about car washes?',
		subjectTemplate: 'Want to stop thinking about car washes, {{firstName}}?',
		introTemplate:
			'Since you’ve already booked with me a few times, you might be a great fit for a monthly maintenance plan. It keeps the car clean without you having to remember when it’s time again.',
		bodyPreview: [
			'Use convenience as the main pitch.',
			'Position the plan after trust is established.',
			'Invite them to reply for the best-fit option.'
		],
		closingTemplate: 'If you want the details, hit reply — Pablo',
		ctaLabel: 'See plan options',
		ctaUrl: `${MRGUY_CANONICAL_ORIGIN}/#services`
	}
];

export function buildCrmContacts(records: CrmBookingRecord[], now = new Date()): CrmContact[] {
	const contacts = new Map<string, CrmContact>();
	const todayStr = formatDate(now);

	for (const record of records) {
		const current = contacts.get(record.contact);
		const email = parseEmailFromNotes(record.notes);
		const city = parseCityFromNotes(record.notes);
		const createdAt = record.createdAt instanceof Date ? record.createdAt : record.createdAt ? new Date(record.createdAt) : null;
		const pendingHours =
			(record.status === 'pending' || record.status === 'rescheduled') && createdAt
				? Math.floor((now.getTime() - createdAt.getTime()) / (60 * 60 * 1000))
				: null;

		if (!current) {
			contacts.set(record.contact, {
				phone: record.contact,
				name: record.clientName,
				email,
				city,
				lastServiceName: record.serviceName,
				lastServiceDate: record.date,
				lastServiceStatus: record.status ?? 'pending',
				lastCompletedDate: record.status === 'completed' ? record.date : null,
				totalBookings: 1,
				completedBookings: record.status === 'completed' ? 1 : 0,
				totalRevenue: record.status === 'completed' ? record.price : 0,
				hasUpcomingBooking: isUpcoming(record, todayStr),
				pendingLeadHours: pendingHours,
				services: [record.serviceName]
			});
			continue;
		}

		current.totalBookings += 1;
		if (record.status === 'completed') {
			current.completedBookings += 1;
			current.totalRevenue += record.price;
			if (!current.lastCompletedDate || record.date > current.lastCompletedDate) {
				current.lastCompletedDate = record.date;
			}
		}

		if (isUpcoming(record, todayStr)) {
			current.hasUpcomingBooking = true;
		}

		if (pendingHours != null && (current.pendingLeadHours == null || pendingHours > current.pendingLeadHours)) {
			current.pendingLeadHours = pendingHours;
		}

		if (!current.email && email) current.email = email;
		if (!current.city && city) current.city = city;
		if (!current.services.includes(record.serviceName)) current.services.push(record.serviceName);

		if (record.date >= current.lastServiceDate) {
			current.lastServiceDate = record.date;
			current.lastServiceName = record.serviceName;
			current.lastServiceStatus = record.status ?? current.lastServiceStatus;
			current.name = record.clientName || current.name;
			if (email) current.email = email;
			if (city) current.city = city;
		}
	}

	return Array.from(contacts.values())
		.filter((contact) => Boolean(contact.email))
		.sort((a, b) => b.lastServiceDate.localeCompare(a.lastServiceDate));
}

export function getSegmentRecipients(contacts: CrmContact[], segmentId: string, now = new Date()): CrmContact[] {
	return contacts.filter((contact) => matchesSegment(contact, segmentId, now));
}

export function getCrmSegmentSummaries(contacts: CrmContact[], now = new Date()): CrmSegmentSummary[] {
	return CRM_SEGMENTS.map((segment) => ({
		...segment,
		count: getSegmentRecipients(contacts, segment.id, now).length
	}));
}

export function getCampaignTemplateSummaries(): CrmCampaignTemplateSummary[] {
	return CRM_CAMPAIGN_TEMPLATES.map(({ subjectTemplate: _subjectTemplate, introTemplate: _introTemplate, closingTemplate: _closingTemplate, ctaUrl: _ctaUrl, ...summary }) => summary);
}

export function getCampaignTemplate(id: string): CrmCampaignTemplateDefinition | undefined {
	return CRM_CAMPAIGN_TEMPLATES.find((template) => template.id === id);
}

export function getCrmSegmentDefinition(id: string) {
	return CRM_SEGMENTS.find((segment) => segment.id === id);
}

export function renderCampaignSubject(templateId: string, contact: CrmContact): string {
	const template = getCampaignTemplate(templateId);
	if (!template) {
		throw new Error(`Unknown CRM template: ${templateId}`);
	}

	return replaceTokens(template.subjectTemplate, buildTokens(contact));
}

export function filterUnsubscribedContacts(
	contacts: CrmContact[],
	unsubscribedEmails: Iterable<string>
): CrmContact[] {
	const suppressed = new Set(Array.from(unsubscribedEmails, (email) => normalizeEmail(email)));
	return contacts.filter((contact) => !contact.email || !suppressed.has(normalizeEmail(contact.email)));
}

export function renderCampaignHtml(
	templateId: string,
	contact: CrmContact,
	options?: { unsubscribeUrl?: string }
): string {
	const template = getCampaignTemplate(templateId);
	if (!template) {
		throw new Error(`Unknown CRM template: ${templateId}`);
	}

	const tokens = buildTokens(contact);
	const intro = replaceTokens(template.introTemplate, tokens);
	const closing = replaceTokens(template.closingTemplate, tokens);

	return `
		<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto;">
			<h2 style="margin-bottom: 16px; color: #111827;">${escapeHtml(template.name)}</h2>
			<p>Hi ${escapeHtml(tokens.firstName)},</p>
			<p>${escapeHtml(intro)}</p>
			<p style="margin: 24px 0;">
				<a
					href="${escapeHtml(template.ctaUrl)}"
					style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 700;"
				>${escapeHtml(template.ctaLabel)}</a>
			</p>
			<p>${escapeHtml(closing)}</p>
			<hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
			<p style="font-size: 12px; color: #6b7280;">
				Mr. Guy Mobile Detail · 954-804-4747 · info@mrguymobiledetail.com<br />
				${
					options?.unsubscribeUrl
						? `If you’d rather not get future reminder emails, <a href="${escapeHtml(options.unsubscribeUrl)}" style="color: #6b7280;">unsubscribe here</a>.`
						: 'If you’d rather not get future reminder emails, just reply and we’ll take you off the list.'
				}
			</p>
		</div>
	`;
}

function matchesSegment(contact: CrmContact, segmentId: string, now: Date): boolean {
	const daysSinceCompleted = contact.lastCompletedDate ? daysBetween(contact.lastCompletedDate, now) : null;
	const neverHadCeramic = !contact.services.some((service) => service.toLowerCase().includes('ceramic'));

	switch (segmentId) {
		case 'pending-follow-up':
			return !contact.hasUpcomingBooking && contact.pendingLeadHours != null && contact.pendingLeadHours >= 24;
		case 'review-referral':
			return daysSinceCompleted != null && daysSinceCompleted >= 1 && daysSinceCompleted <= 14;
		case 'maintenance-reminder':
			return !contact.hasUpcomingBooking && daysSinceCompleted != null && daysSinceCompleted >= 30 && daysSinceCompleted <= 75;
		case 'win-back':
			return !contact.hasUpcomingBooking && daysSinceCompleted != null && daysSinceCompleted >= 90;
		case 'membership-upsell':
			return !contact.hasUpcomingBooking && contact.completedBookings >= 2 && neverHadCeramic;
		default:
			return false;
	}
}

function buildTokens(contact: CrmContact): TokenMap {
	const firstName = contact.name.split(' ')[0] || 'there';

	return {
		firstName,
		fullName: contact.name,
		city: contact.city ?? 'West Broward',
		serviceName: contact.lastServiceName,
		lastServiceDate: contact.lastServiceDate
	};
}

function replaceTokens(template: string, tokens: TokenMap): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, token: string) => tokens[token] ?? '');
}

function parseEmailFromNotes(notes: string | null): string | null {
	const match = notes?.match(/Email:\s*(\S+)/i);
	return match?.[1]?.trim().toLowerCase() ?? null;
}

function parseCityFromNotes(notes: string | null): string | null {
	const match = notes?.match(/Address:\s*[^\n,]+,\s*([^,\n]+)/i);
	return match?.[1]?.trim() ?? null;
}

function isUpcoming(record: CrmBookingRecord, todayStr: string): boolean {
	return Boolean(record.status && ['pending', 'confirmed', 'rescheduled'].includes(record.status) && record.date >= todayStr);
}

function daysBetween(dateStr: string, now: Date): number {
	const date = new Date(`${dateStr}T12:00:00`);
	return Math.floor((now.getTime() - date.getTime()) / DAY_MS);
}

function formatDate(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function normalizeEmail(value: string): string {
	return value.trim().toLowerCase();
}
