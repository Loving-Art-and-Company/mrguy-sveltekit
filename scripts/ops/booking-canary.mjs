import fs from 'node:fs';
import path from 'node:path';
import { createPrivateKey, createSign, randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { loadLocalEnv } from './env.mjs';

const BRAND_ID = '074ccc70-e8b5-4284-907b-82571f4a2e45';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const ACK_TEMPLATE_ID = 'mrguy-booking-request-received-v1';

function getBaseUrl() {
  return process.env.BASE_URL || 'https://mrguydetail.com';
}

function utcStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function localDateFromOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function normalizePrivateKey(key) {
  return key.replace(/\\n/g, '\n');
}

function proof(name, passed, detail, extra = {}) {
  return {
    name,
    status: passed ? 'passed' : 'failed',
    detail,
    ...extra,
  };
}

function failDetail(error) {
  return error instanceof Error ? error.message : String(error);
}

function getRequiredEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function assertSubmitGuard() {
  if (process.env.MRGUY_BOOKING_CANARY_SUBMIT !== '1') {
    throw new Error('MRGUY_BOOKING_CANARY_SUBMIT=1 is required before submitting a production booking canary');
  }

  getRequiredEnv('BOOKING_CANARY_SECRET');
  getRequiredEnv('DATABASE_URL');
}

async function getGoogleAccessToken() {
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
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Google access token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function readSheetRange(range) {
  const spreadsheetId = getRequiredEnv('LEAD_SINK_SPREADSHEET_ID');
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `${GOOGLE_SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?majorDimension=ROWS`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    throw new Error(`Failed to read ${range}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.values ?? [];
}

async function chooseAvailableSlot() {
  const baseUrl = getBaseUrl();

  for (let offset = 1; offset <= 21; offset += 1) {
    const date = localDateFromOffset(offset);
    const response = await fetch(`${baseUrl}/api/bookings/availability?date=${date}`, {
      headers: { 'user-agent': 'mrguy-production-booking-canary/1.0' },
    });

    if (!response.ok) continue;

    const data = await response.json();
    const slot = [...(data.slots ?? [])].reverse().find((candidate) => candidate.available);
    if (slot?.value) {
      return { date, time: slot.value };
    }
  }

  throw new Error('No available booking slot found in the next 21 days');
}

async function verifyCanaryCapability() {
  const response = await fetch(`${getBaseUrl()}/api/bookings/canary-capability`, {
    headers: {
      'user-agent': 'mrguy-production-booking-canary/1.0',
      'x-mrguy-booking-canary': process.env.BOOKING_CANARY_SECRET,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Target app does not expose booking canary capability (${response.status}); deploy the canary code and configure BOOKING_CANARY_SECRET before submitting`,
    );
  }

  const body = await response.json();
  if (body.ok !== true) {
    throw new Error('Target app returned an invalid booking canary capability response');
  }
}

function buildCanaryPayload(runId, slot) {
  return {
    service: { id: 'basic' },
    schedule: slot,
    address: {
      street: '123 Canary Proof Way',
      city: 'Davie',
      state: 'FL',
      zip: '33325',
      instructions: `SYNTHETIC_BOOKING_CANARY_DO_NOT_SERVICE run_id=${runId}`,
    },
    contact: {
      name: `MRGUY CANARY ${runId}`,
      phone: process.env.MRGUY_BOOKING_CANARY_PHONE || '9545550199',
      email:
        process.env.MRGUY_BOOKING_CANARY_EMAIL ||
        `mrguy-canary+${runId}@lovingartandcompany.com`,
      vehicle: `Synthetic canary vehicle - do not service - ${runId}`,
    },
  };
}

async function submitCanary(payload) {
  const response = await fetch(`${getBaseUrl()}/api/bookings/create`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'mrguy-production-booking-canary/1.0',
      'x-mrguy-booking-canary': process.env.BOOKING_CANARY_SECRET,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let body;
  try {
    body = JSON.parse(responseText);
  } catch {
    body = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(`Booking create returned ${response.status}: ${responseText}`);
  }

  return { status: response.status, body };
}

async function verifyDatabaseBooking(bookingId, runId, slot) {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
  try {
    const [row] = await sql`
      select id, brand_id, "clientName" as client_name, "serviceName" as service_name, date, time, contact, status, "paymentStatus" as payment_status, notes, created_at
      from bookings
      where brand_id = ${BRAND_ID} and id = ${bookingId}
      limit 1
    `;

    if (!row) {
      return proof('database_booking_row', false, `No booking row found for ${bookingId}`);
    }

    const checks = [
      row.client_name?.includes(runId),
      row.notes?.includes(runId),
      row.date === slot.date,
      row.time === slot.time,
      row.status === 'pending',
      row.payment_status === 'unpaid',
    ];

    return proof(
      'database_booking_row',
      checks.every(Boolean),
      checks.every(Boolean)
        ? `Found tagged pending booking ${bookingId}`
        : `Found ${bookingId}, but one or more expected fields did not match`,
      {
        bookingId,
        createdAt: row.created_at,
      },
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function verifyLeadSinkRows(bookingId) {
  const required = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    'LEAD_SINK_SPREADSHEET_ID',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return [
      proof('lead_sink_sheet_row', false, `Missing env for sheet verification: ${missing.join(', ')}`),
      proof('lead_sink_audit_row', false, `Missing env for sheet verification: ${missing.join(', ')}`),
    ];
  }

  const [leadRows, auditRows] = await Promise.all([
    readSheetRange('Leads!A:Q'),
    readSheetRange('Audit Log!A:G'),
  ]);

  const leadRow = leadRows.find((row) => row[1] === bookingId);
  const auditLeadReceived = auditRows.find((row) => row[1] === bookingId && row[4] === 'lead_received');
  const auditAutoResponse = auditRows.find(
    (row) => row[1] === bookingId && row[4] === 'auto_response_sent' && row[5] === ACK_TEMPLATE_ID,
  );

  return [
    proof(
      'lead_sink_sheet_row',
      Boolean(leadRow),
      leadRow ? `Found lead sink row for ${bookingId}` : `No lead sink row found for ${bookingId}`,
    ),
    proof(
      'lead_sink_audit_row',
      Boolean(auditLeadReceived && auditAutoResponse),
      auditLeadReceived && auditAutoResponse
        ? `Found lead_received and ${ACK_TEMPLATE_ID} audit entries`
        : `Missing lead_received or ${ACK_TEMPLATE_ID} audit entry for ${bookingId}`,
    ),
  ];
}

function writeArtifacts(report) {
  const outputDir = path.join(process.cwd(), 'output', 'ops');
  fs.mkdirSync(outputDir, { recursive: true });

  const latestJsonPath = path.join(outputDir, 'booking-canary-latest.json');
  const latestMarkdownPath = path.join(outputDir, 'booking-canary-latest.md');
  const archiveJsonPath = path.join(outputDir, `booking-canary-${report.runId}.json`);
  const archiveMarkdownPath = path.join(outputDir, `booking-canary-${report.runId}.md`);

  const markdown = `# MrGuy Production Booking Canary

Generated: ${report.generatedAt}
Base URL: ${report.baseUrl}
Run ID: ${report.runId}
Booking ID: ${report.bookingId ?? 'n/a'}
Status: ${report.ok ? 'passed' : 'failed'}

${report.proofPoints.map((item) => `- ${item.name}: ${item.status} - ${item.detail}`).join('\n')}
`;

  fs.writeFileSync(latestJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(archiveJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(latestMarkdownPath, markdown);
  fs.writeFileSync(archiveMarkdownPath, markdown);

  return {
    latestJsonPath,
    latestMarkdownPath,
    archiveJsonPath,
    archiveMarkdownPath,
  };
}

export async function runProductionBookingCanary() {
  loadLocalEnv();

  const generatedAt = new Date().toISOString();
  const runId = `canary-${utcStamp()}-${randomUUID().slice(0, 8)}`;
  const proofPoints = [];
  let bookingId = null;

  try {
    assertSubmitGuard();
    await verifyCanaryCapability();
    proofPoints.push(proof('canary_capability', true, 'Target app exposes guarded booking canary proof mode'));

    const slot = await chooseAvailableSlot();
    proofPoints.push(proof('booking_slot_selected', true, `${slot.date} ${slot.time}`));

    const payload = buildCanaryPayload(runId, slot);
    const submission = await submitCanary(payload);
    bookingId = submission.body.bookingId ?? null;

    proofPoints.push(
      proof(
        'booking_request_acknowledged',
        submission.body.success === true && submission.body.message?.includes('Booking request received'),
        submission.body.message ?? 'Missing booking request acknowledgement message',
        { httpStatus: submission.status },
      ),
    );

    proofPoints.push(
      proof(
        'lead_sink_delivery_accepted',
        submission.body.canaryProof?.leadSink?.ok === true,
        submission.body.canaryProof?.leadSink?.ok
          ? 'Booking endpoint reported lead sink delivery ok'
          : `Lead sink was not accepted: ${JSON.stringify(submission.body.canaryProof?.leadSink ?? null)}`,
      ),
    );

    proofPoints.push(
      proof(
        'customer_acknowledgement_email',
        submission.body.canaryProof?.customerBookingRequestAcknowledgement === true,
        submission.body.canaryProof?.customerBookingRequestAcknowledgement
          ? `Customer acknowledgement email path returned true for ${ACK_TEMPLATE_ID}`
          : 'Customer acknowledgement email path did not return true',
      ),
    );

    if (!bookingId) {
      throw new Error('Booking response did not include bookingId');
    }

    proofPoints.push(await verifyDatabaseBooking(bookingId, runId, slot));
    proofPoints.push(...(await verifyLeadSinkRows(bookingId)));
  } catch (error) {
    proofPoints.push(proof('booking_canary_run', false, failDetail(error)));
  }

  const failedProof = proofPoints.filter((item) => item.status === 'failed');
  const report = {
    generatedAt,
    baseUrl: getBaseUrl(),
    runId,
    bookingId,
    ok: failedProof.length === 0,
    proofPoints,
  };
  report.outputs = writeArtifacts(report);

  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = await runProductionBookingCanary();

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`# Production Booking Canary`);
    console.log(`Base URL: ${report.baseUrl}`);
    console.log(`Run ID: ${report.runId}`);
    console.log(`Booking ID: ${report.bookingId ?? 'n/a'}`);
    console.log(`Status: ${report.ok ? 'OK' : 'FAILED'}`);
    for (const item of report.proofPoints) {
      console.log(`- ${item.name}: ${item.status} (${item.detail})`);
    }
    console.log(`Artifact: ${report.outputs.latestMarkdownPath}`);
  }

  if (!report.ok) {
    process.exitCode = 1;
  }
}
