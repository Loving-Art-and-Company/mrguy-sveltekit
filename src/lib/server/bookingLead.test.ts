import { describe, expect, it } from 'vitest';
import { buildBookingLeadSinkPayload } from './bookingLead';

describe('buildBookingLeadSinkPayload', () => {
  it('builds a complete human-review lead for a booking request', () => {
    const payload = buildBookingLeadSinkPayload({
      bookingId: 'BK-20260430-ABCD',
      sourceMessageId: 'cs_test_123',
      sourceThreadId: 'pi_test_123',
      contactName: 'John Smith',
      contactEmail: 'john@example.com',
      contactPhone: '9545551212',
      serviceName: 'Family Hauler',
      requestedDate: '2026-05-01T10:00:00',
      requestedLocation: '123 Main St, Weston, FL 33326',
      freeformNotes: 'Vehicle: 2024 Toyota Sienna',
      autoResponseSent: true,
      receivedAt: '2026-04-30T12:00:00.000Z',
      auditNote: 'Paid booking request created from Stripe checkout webhook',
    });

    expect(payload).toMatchObject({
      schemaVersion: '2026-03-08',
      brand: 'mrguy',
      leadId: 'BK-20260430-ABCD',
      sourceChannel: 'booking_form',
      sourceMessageId: 'cs_test_123',
      sourceThreadId: 'pi_test_123',
      contactEmail: 'john@example.com',
      missingFields: [],
      qualificationStatus: 'human_review',
      escalationReasons: ['booking_confirmation_requires_human'],
      autoResponseSent: true,
      autoResponseTemplateId: 'mrguy-booking-request-received-v1',
      humanOwner: 'Pablo',
    });
    expect(payload.auditEntries).toEqual([
      {
        at: '2026-04-30T12:00:00.000Z',
        kind: 'lead_received',
        note: 'Paid booking request created from Stripe checkout webhook',
      },
      {
        at: '2026-04-30T12:00:00.000Z',
        kind: 'auto_response_sent',
        templateId: 'mrguy-booking-request-received-v1',
      },
    ]);
  });

  it('omits auto-response template data when no customer email was sent', () => {
    const payload = buildBookingLeadSinkPayload({
      bookingId: 'BK-20260430-WXYZ',
      sourceMessageId: 'BK-20260430-WXYZ',
      contactName: 'Jane Smith',
      contactPhone: '9545553434',
      serviceName: 'Quick Refresh',
      requestedDate: '2026-05-02T09:00:00',
      requestedLocation: '456 Oak St, Davie, FL 33314',
      freeformNotes: 'Vehicle: Ford F-150',
      autoResponseSent: false,
      receivedAt: '2026-04-30T12:30:00.000Z',
      auditNote: 'Booking request created from website form',
    });

    expect(payload.contactEmail).toBeUndefined();
    expect(payload.autoResponseTemplateId).toBeUndefined();
    expect(payload.auditEntries).toHaveLength(1);
  });
});
