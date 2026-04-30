import { notifyError } from '$lib/server/email';
import { sendLeadToSink, type LeadSinkPayload } from '$lib/server/leadSink';

const BOOKING_ACK_TEMPLATE_ID = 'mrguy-booking-request-received-v1';

interface BookingLeadPayloadInput {
  bookingId: string;
  sourceMessageId: string;
  sourceThreadId?: string;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string;
  serviceName: string;
  requestedDate: string;
  requestedLocation: string;
  freeformNotes: string;
  autoResponseSent: boolean;
  receivedAt?: string;
  auditNote: string;
}

interface ReportBookingLeadOptions {
  bookingId: string;
  url: string;
  method: string;
}

export function buildBookingLeadSinkPayload(input: BookingLeadPayloadInput): LeadSinkPayload {
  const receivedAt = input.receivedAt ?? new Date().toISOString();

  return {
    schemaVersion: '2026-03-08',
    brand: 'mrguy',
    leadId: input.bookingId,
    sourceChannel: 'booking_form',
    sourceMessageId: input.sourceMessageId,
    sourceThreadId: input.sourceThreadId ?? input.sourceMessageId,
    receivedAt,
    contactName: input.contactName,
    contactEmail: input.contactEmail || undefined,
    contactPhone: input.contactPhone,
    serviceType: input.serviceName,
    requestedDate: input.requestedDate,
    requestedLocation: input.requestedLocation,
    freeformNotes: input.freeformNotes,
    missingFields: [],
    qualificationStatus: 'human_review',
    escalationReasons: ['booking_confirmation_requires_human'],
    autoResponseSent: input.autoResponseSent,
    autoResponseTemplateId: input.autoResponseSent ? BOOKING_ACK_TEMPLATE_ID : undefined,
    humanOwner: 'Pablo',
    auditEntries: [
      {
        at: receivedAt,
        kind: 'lead_received',
        note: input.auditNote,
      },
      ...(input.autoResponseSent
        ? [
            {
              at: receivedAt,
              kind: 'auto_response_sent' as const,
              templateId: BOOKING_ACK_TEMPLATE_ID,
            },
          ]
        : []),
    ],
  };
}

export async function reportBookingLeadToSink(
  payload: LeadSinkPayload,
  options: ReportBookingLeadOptions,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const leadSinkResult = await sendLeadToSink(payload);
  if (leadSinkResult.ok) return leadSinkResult;

  console.warn('[booking] lead sink delivery incomplete', {
    bookingId: options.bookingId,
    skipped: Boolean(leadSinkResult.skipped),
  });

  notifyError({
    message: `Lead sink delivery ${leadSinkResult.skipped ? 'skipped' : 'failed'} for booking ${options.bookingId}`,
    url: options.url,
    method: options.method,
    status: 502,
  }).catch((notifyErr) => {
    console.warn('[booking] failed to send lead sink failure alert', notifyErr);
  });

  return leadSinkResult;
}
