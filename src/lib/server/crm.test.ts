import { describe, expect, it } from 'vitest';
import { buildCrmContacts, getSegmentRecipients, renderCampaignSubject } from './crm';

describe('crm helpers', () => {
	it('builds deduplicated contacts from booking records', () => {
		const contacts = buildCrmContacts([
			{
				id: '1',
				clientName: 'Jane Driver',
				serviceName: 'Quick Refresh',
				price: 75,
				date: '2026-03-01',
				time: '10:00',
				contact: '9545551111',
				status: 'completed',
				paymentStatus: 'paid',
				notes: 'Address: 123 Main St, Weston, FL 33326\nEmail: jane@example.com',
				createdAt: new Date('2026-03-01T12:00:00Z')
			},
			{
				id: '2',
				clientName: 'Jane Driver',
				serviceName: 'Showroom',
				price: 250,
				date: '2026-03-10',
				time: '11:00',
				contact: '9545551111',
				status: 'pending',
				paymentStatus: 'unpaid',
				notes: 'Address: 123 Main St, Weston, FL 33326\nEmail: jane@example.com',
				createdAt: new Date('2026-03-10T12:00:00Z')
			}
		], new Date('2026-03-12T12:00:00Z'));

		expect(contacts).toHaveLength(1);
		expect(contacts[0].email).toBe('jane@example.com');
		expect(contacts[0].totalBookings).toBe(2);
		expect(contacts[0].completedBookings).toBe(1);
		expect(contacts[0].hasUpcomingBooking).toBe(false);
	});

	it('segments lapsed customers into win-back recipients', () => {
		const contacts = buildCrmContacts([
			{
				id: '1',
				clientName: 'Chris Clean',
				serviceName: 'Family Hauler',
				price: 180,
				date: '2025-11-20',
				time: '14:00',
				contact: '9545552222',
				status: 'completed',
				paymentStatus: 'paid',
				notes: 'Address: 88 Palm Ave, Davie, FL 33314\nEmail: chris@example.com',
				createdAt: new Date('2025-11-20T12:00:00Z')
			}
		], new Date('2026-03-12T12:00:00Z'));

		const recipients = getSegmentRecipients(contacts, 'win-back', new Date('2026-03-12T12:00:00Z'));
		expect(recipients).toHaveLength(1);
		expect(recipients[0].name).toBe('Chris Clean');
	});

	it('renders campaign subjects with contact tokens', () => {
		const subject = renderCampaignSubject('maintenance-reminder', {
			phone: '9545553333',
			name: 'Maria Shine',
			email: 'maria@example.com',
			city: 'Plantation',
			lastServiceName: 'Quick Refresh',
			lastServiceDate: '2026-02-01',
			lastServiceStatus: 'completed',
			lastCompletedDate: '2026-02-01',
			totalBookings: 1,
			completedBookings: 1,
			totalRevenue: 75,
			hasUpcomingBooking: false,
			pendingLeadHours: null,
			services: ['Quick Refresh']
		});

		expect(subject).toContain('Maria');
	});
});
