import { createHmac, createPrivateKey, createSign, timingSafeEqual } from 'node:crypto';
import type { LeadSinkPayload } from './leadSink';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000;

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePrivateKey(getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'));

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: GOOGLE_SHEETS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );

  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claimSet}`);
  signer.end();
  const signature = signer.sign(createPrivateKey(privateKey));
  const assertion = `${header}.${claimSet}.${base64UrlEncode(signature)}`;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Google access token: ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

function buildLeadRow(payload: LeadSinkPayload): string[] {
  return [
    payload.receivedAt,
    payload.leadId,
    payload.brand,
    payload.sourceChannel,
    payload.qualificationStatus,
    payload.contactName,
    payload.contactEmail ?? '',
    payload.contactPhone ?? '',
    payload.serviceType ?? '',
    payload.requestedDate ?? '',
    payload.requestedLocation ?? '',
    payload.missingFields.join(', '),
    payload.escalationReasons.join(', '),
    payload.autoResponseSent ? 'yes' : 'no',
    payload.autoResponseTemplateId ?? '',
    payload.humanOwner ?? '',
    payload.freeformNotes ?? '',
  ];
}

function buildAuditRows(payload: LeadSinkPayload): string[][] {
  return payload.auditEntries.map((entry) => [
    payload.receivedAt,
    payload.leadId,
    payload.brand,
    entry.at,
    entry.kind,
    entry.templateId ?? '',
    entry.note ?? '',
  ]);
}

async function appendRows(range: string, values: string[][]): Promise<void> {
  const spreadsheetId = getRequiredEnv('LEAD_SINK_SPREADSHEET_ID');
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `${GOOGLE_SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ values }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to append rows to Google Sheets: ${errorText}`);
  }
}

export async function appendLeadToSheet(payload: LeadSinkPayload): Promise<void> {
  await appendRows('Leads!A:Q', [buildLeadRow(payload)]);

  const auditRows = buildAuditRows(payload);
  if (auditRows.length > 0) {
    await appendRows('Audit Log!A:G', auditRows);
  }
}

export function verifyLeadSinkRequest(args: {
  secret: string;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
}): boolean {
  const { secret, timestamp, signature, rawBody } = args;
  if (!timestamp || !signature) return false;

  const parsedTimestamp = Date.parse(timestamp);
  if (Number.isNaN(parsedTimestamp)) return false;
  if (Math.abs(Date.now() - parsedTimestamp) > MAX_TIMESTAMP_AGE_MS) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const actualBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}
