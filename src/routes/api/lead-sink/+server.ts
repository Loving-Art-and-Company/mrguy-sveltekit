import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { appendLeadToSheet, verifyLeadSinkRequest } from '$lib/server/googleSheetsLeadSink';

const auditEntrySchema = z.object({
  at: z.string().datetime(),
  kind: z.enum(['lead_received', 'auto_response_sent', 'sink_delivery_failed']),
  templateId: z.string().optional(),
  note: z.string().optional(),
});

const leadSinkPayloadSchema = z.object({
  schemaVersion: z.literal('2026-03-08'),
  brand: z.literal('mrguy'),
  leadId: z.string().min(1),
  sourceChannel: z.enum(['booking_form', 'email']),
  sourceMessageId: z.string().optional(),
  sourceThreadId: z.string().optional(),
  receivedAt: z.string().datetime(),
  contactName: z.string().min(1),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  serviceType: z.string().optional(),
  requestedDate: z.string().optional(),
  requestedLocation: z.string().optional(),
  freeformNotes: z.string().optional(),
  missingFields: z.array(z.string()),
  qualificationStatus: z.enum(['new', 'needs_info', 'human_review', 'not_fit']),
  escalationReasons: z.array(z.string()),
  autoResponseSent: z.boolean(),
  autoResponseTemplateId: z.string().optional(),
  humanOwner: z.string().optional(),
  auditEntries: z.array(auditEntrySchema),
});

export const POST: RequestHandler = async ({ request }) => {
  const secret = process.env.LEAD_SINK_WEBHOOK_SECRET;
  if (!secret) {
    throw error(503, 'Lead sink is not configured');
  }

  const rawBody = await request.text();
  const timestamp = request.headers.get('x-lac-timestamp');
  const signature = request.headers.get('x-lac-signature');

  if (!verifyLeadSinkRequest({ secret, timestamp, signature, rawBody })) {
    throw error(401, 'Invalid lead sink signature');
  }

  const payload = leadSinkPayloadSchema.parse(JSON.parse(rawBody));
  await appendLeadToSheet(payload);

  return json({ success: true });
};
