import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLeadSinkSignature } from '$lib/server/leadSink';
import { POST } from './+server';

const { appendLeadToSheetMock } = vi.hoisted(() => ({
  appendLeadToSheetMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/server/googleSheetsLeadSink', async () => {
  const actual = await vi.importActual<typeof import('$lib/server/googleSheetsLeadSink')>(
    '$lib/server/googleSheetsLeadSink'
  );

  return {
    ...actual,
    appendLeadToSheet: appendLeadToSheetMock,
  };
});

const payload = {
  schemaVersion: '2026-03-08' as const,
  brand: 'mrguy' as const,
  leadId: 'lead_123',
  sourceChannel: 'booking_form' as const,
  receivedAt: '2026-03-08T21:00:00.000Z',
  contactName: 'John Smith',
  contactEmail: 'john@example.com',
  contactPhone: '9548044747',
  serviceType: 'Quick Refresh',
  requestedDate: '2026-03-10T10:00:00',
  requestedLocation: '123 Main St, Weston, FL 33326',
  freeformNotes: 'Vehicle info pending',
  missingFields: ['vehicle_details'],
  qualificationStatus: 'human_review' as const,
  escalationReasons: ['booking_confirmation_requires_human'],
  autoResponseSent: true,
  autoResponseTemplateId: 'mrguy-booking-request-received-v1',
  humanOwner: 'Pablo',
  auditEntries: [
    {
      at: '2026-03-08T21:00:00.000Z',
      kind: 'lead_received' as const,
      note: 'Booking request created from website form',
    },
  ],
};

describe('/api/lead-sink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LEAD_SINK_WEBHOOK_SECRET = 'test-secret';
  });

  it('accepts a valid signed request', async () => {
    const rawBody = JSON.stringify(payload);
    const timestamp = new Date().toISOString();
    const signature = createLeadSinkSignature('test-secret', timestamp, rawBody);

    const request = new Request('http://localhost/api/lead-sink', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-lac-timestamp': timestamp,
        'x-lac-signature': signature,
      },
      body: rawBody,
    });

    const response = await POST({ request } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(200);
    expect(appendLeadToSheetMock).toHaveBeenCalledTimes(1);
    expect(appendLeadToSheetMock).toHaveBeenCalledWith(payload);
  });

  it('rejects an invalid signature', async () => {
    const request = new Request('http://localhost/api/lead-sink', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-lac-timestamp': new Date().toISOString(),
        'x-lac-signature': 'bad-signature',
      },
      body: JSON.stringify(payload),
    });

    await expect(() => POST({ request } as Parameters<typeof POST>[0])).rejects.toMatchObject({
      status: 401,
    });
    expect(appendLeadToSheetMock).not.toHaveBeenCalled();
  });
});
