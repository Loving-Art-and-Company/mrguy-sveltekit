import { createHash, createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';

type LeadQualificationStatus = 'new' | 'needs_info' | 'human_review' | 'not_fit';

interface LeadAuditEntry {
  at: string;
  kind: 'lead_received' | 'auto_response_sent' | 'sink_delivery_failed';
  templateId?: string;
  note?: string;
}

export interface LeadSinkPayload {
  schemaVersion: '2026-03-08';
  brand: 'mrguy';
  leadId: string;
  sourceChannel: 'booking_form' | 'email';
  sourceMessageId?: string;
  sourceThreadId?: string;
  receivedAt: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  serviceType?: string;
  requestedDate?: string;
  requestedLocation?: string;
  freeformNotes?: string;
  missingFields: string[];
  qualificationStatus: LeadQualificationStatus;
  escalationReasons: string[];
  autoResponseSent: boolean;
  autoResponseTemplateId?: string;
  humanOwner?: string;
  auditEntries: LeadAuditEntry[];
}

interface LeadSinkResult {
  ok: boolean;
  skipped?: boolean;
}

const LEAD_SINK_TIMEOUT_MS = 5000;

export function createLeadSinkSignature(
  secret: string,
  timestamp: string,
  body: string,
): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

function hashForLogs(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

function redactLeadForLogs(payload: LeadSinkPayload) {
  return {
    brand: payload.brand,
    leadId: payload.leadId,
    sourceChannel: payload.sourceChannel,
    qualificationStatus: payload.qualificationStatus,
    missingFields: payload.missingFields,
    escalationReasons: payload.escalationReasons,
    contactNameHash: hashForLogs(payload.contactName),
    contactEmailHash: hashForLogs(payload.contactEmail),
    contactPhoneHash: hashForLogs(payload.contactPhone),
  };
}

export async function sendLeadToSink(payload: LeadSinkPayload): Promise<LeadSinkResult> {
  const webhookUrl = env.LEAD_SINK_WEBHOOK_URL;
  const webhookSecret = env.LEAD_SINK_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    console.warn('[leadSink] skipped: LEAD_SINK_WEBHOOK_URL or LEAD_SINK_WEBHOOK_SECRET missing');
    return { ok: false, skipped: true };
  }

  const timestamp = new Date().toISOString();
  const body = JSON.stringify(payload);
  const signature = createLeadSinkSignature(webhookSecret, timestamp, body);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-lac-signature': signature,
        'x-lac-timestamp': timestamp,
        'x-lac-brand': payload.brand,
      },
      body,
      signal: AbortSignal.timeout(LEAD_SINK_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn('[leadSink] delivery failed', {
        status: response.status,
        lead: redactLeadForLogs(payload),
      });
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    console.warn('[leadSink] request error', {
      error: error instanceof Error ? error.message : 'unknown error',
      lead: redactLeadForLogs(payload),
    });
    return { ok: false };
  }
}
