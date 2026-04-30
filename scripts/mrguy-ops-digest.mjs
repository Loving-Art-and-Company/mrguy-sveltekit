import fs from 'node:fs';
import path from 'node:path';
import { loadLocalEnv } from './ops/env.mjs';
import { getBookingOpsSnapshot } from './ops/bookings.mjs';
import { runSmokeSuite } from './ops/smoke.mjs';
import { sendOpsAlert } from './ops/alert.mjs';
import { getInquirySnapshot } from './ops/inquiries.mjs';
import { getAnalyticsSnapshot } from './ops/analytics.mjs';
import { getSeoSnapshot } from './ops/seo.mjs';
import { getMarketingSnapshot } from './ops/marketing/marketing-digest.mjs';
import { runProductionBookingCanary } from './ops/booking-canary.mjs';

loadLocalEnv();

function rankActions(smoke, bookings, marketing, bookingCanary, sections) {
  const actions = [];

  if (!smoke.ok) {
    actions.push({
      severity: 'critical',
      owner: 'Pablo',
      action: 'Review the failed production smoke checks immediately.',
    });
  }

  if (bookingCanary && !bookingCanary.ok) {
    actions.push({
      severity: 'critical',
      owner: 'Pablo',
      action: 'Review the failed production booking canary proof artifact.',
    });
  }

  for (const item of bookings.actions) {
    actions.push({
      severity: item.severity,
      owner: 'Pablo',
      action: item.message,
    });
  }

  for (const item of marketing.actions ?? []) {
    actions.push({
      severity: item.severity,
      owner: 'Marketing',
      action: item.message,
    });
  }

  for (const section of sections) {
    for (const item of section.actions ?? []) {
      actions.push({
        severity: item.severity,
        owner: item.owner ?? 'Ops',
        action: item.message,
      });
    }
  }

  return actions.slice(0, 6);
}

function toMarkdown({ smoke, bookings, inquiries, analytics, seo, marketing, bookingCanary, actions }) {
  const smokeLines = smoke.checks.map((check) => `- ${check.name}: ${check.status} - ${check.detail}`).join('\n');
  const canaryLines = bookingCanary
    ? bookingCanary.proofPoints.map((check) => `- ${check.name}: ${check.status} - ${check.detail}`).join('\n')
    : '- skipped - set RUN_PROD_BOOKING_CANARY=1 and MRGUY_BOOKING_CANARY_SUBMIT=1 to run';
  const actionLines = actions.map((item) => `- [${item.severity}] ${item.owner}: ${item.action}`).join('\n');
  const awaitingResponseLines = bookings.awaitingResponse.slice(0, 5).map((item) =>
    `- ${item.id}: ${item.client_name} • ${item.service_name} • ${item.date} ${item.time ?? 'TBD'}`
  ).join('\n') || '- none';
  const upcomingConfirmationLines = bookings.upcomingNeedsConfirmation.slice(0, 5).map((item) =>
    `- ${item.id}: ${item.client_name} • ${item.service_name} • ${item.date} ${item.time ?? 'TBD'}`
  ).join('\n') || '- none';
  const staleLines = bookings.stalePending.slice(0, 5).map((item) =>
    `- ${item.id}: ${item.client_name} • ${item.service_name} • ${item.date} ${item.time ?? 'TBD'}`
  ).join('\n') || '- none';
  const inquiryLines = (inquiries.recentInquiries ?? []).slice(0, 5).map((item) =>
    `- ${item.from ?? 'Unknown sender'} • ${item.subject ?? '(no subject)'} • ${item.date ?? 'Unknown date'}`
  ).join('\n') || '- none';
  const seoLines = (seo.searchConsole?.topPages ?? []).slice(0, 5).map((item) =>
    `- ${item.page} • clicks ${item.clicks} • impressions ${item.impressions} • position ${item.position.toFixed(1)}`
  ).join('\n') || '- unavailable';

  return `# MrGuy Daily Ops Digest

Generated: ${new Date().toISOString()}

## Revenue Signals
- Bookings today: ${bookings.counts.today}
- Next 7 days: ${bookings.counts.next7Days}
- Recent 24 hours: ${bookings.counts.recent24Hours}
- Awaiting response (>2h): ${bookings.counts.awaitingResponse}
- Upcoming needs confirmation (48h): ${bookings.counts.upcomingNeedsConfirmation}
- Paid pending: ${bookings.counts.paidPending}
- Stale pending: ${bookings.counts.stalePending}

## Site Health
- Overall smoke status: ${smoke.ok ? 'healthy' : 'failed'}
${smokeLines}
- Production booking canary: ${bookingCanary ? (bookingCanary.ok ? 'passed' : 'failed') : 'skipped'}
${canaryLines}

## Lead / Booking Queue
### Needs Response Now
${awaitingResponseLines}

### Upcoming Needs Confirmation
${upcomingConfirmationLines}

### Stale Pending
${staleLines}

## Customer Queue
- Status: ${inquiries.status}
- Reason: ${inquiries.reason}
- Recent inquiries (7d): ${inquiries.counts?.recent7Days ?? 'n/a'}
${inquiryLines}

## Growth
- Status: ${analytics.status}
- Reason: ${analytics.reason}
- Sessions (7d): ${analytics.traffic?.current7Days?.sessions ?? 'n/a'}
- Sessions delta: ${analytics.traffic?.sessionDeltaPercent != null ? `${analytics.traffic.sessionDeltaPercent.toFixed(1)}%` : 'n/a'}
- Booking success (7d): ${analytics.funnel?.bookingSuccess ?? 'n/a'}
- Booking open -> success: ${analytics.funnel?.bookingOpenToSuccessRate ?? 'n/a'}
- Reschedule completion: ${analytics.funnel?.rescheduleCompletionRate ?? 'n/a'}

## SEO
- Status: ${seo.status}
- Reason: ${seo.reason}
- robots.txt: ${seo.technical?.robots?.status ?? 'n/a'}
- sitemap.xml: ${seo.technical?.sitemap?.status ?? 'n/a'}
${seoLines}

## AI Marketing Agents
### Review Harvester
- Status: ${marketing.status}
- Review requests sent (7d): ${marketing.reviews?.sentLast7Days ?? 'n/a'}
- Total reviews received: ${marketing.reviews?.receivedTotal ?? 'n/a'}
- Conversion: ${marketing.reviews?.sentTotal > 0 ? ((marketing.reviews.receivedTotal / marketing.reviews.sentTotal) * 100).toFixed(1) + '%' : 'n/a'}

### GBP Bot
- Status: ${marketing.status}
- Draft posts queued: ${marketing.gbp?.drafts ?? 'n/a'}
- Posts published: ${marketing.gbp?.published ?? 'n/a'}
- Generated (7d): ${marketing.gbp?.generatedLast7Days ?? 'n/a'}
${marketing.gbp?.recentDrafts?.length > 0 ? '- Recent drafts:\n' + marketing.gbp.recentDrafts.map(d => `  - [${d.type}] ${d.preview}`).join('\n') : ''}

## Today's Actions
${actionLines}
`;
}

const [smoke, bookings, inquiries, analytics, seo, marketing, bookingCanary] = await Promise.all([
  runSmokeSuite(),
  getBookingOpsSnapshot(),
  getInquirySnapshot(),
  getAnalyticsSnapshot(),
  getSeoSnapshot(),
  getMarketingSnapshot(),
  process.env.RUN_PROD_BOOKING_CANARY === '1' ? runProductionBookingCanary() : Promise.resolve(null),
]);

const actions = rankActions(smoke, bookings, marketing, bookingCanary, [inquiries, analytics, seo]);
const markdown = toMarkdown({ smoke, bookings, inquiries, analytics, seo, marketing, bookingCanary, actions });

const outputDir = path.join(process.cwd(), 'output', 'ops');
fs.mkdirSync(outputDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const latestPath = path.join(outputDir, 'latest-digest.md');
const archivePath = path.join(outputDir, `digest-${timestamp}.md`);

fs.writeFileSync(latestPath, markdown);
fs.writeFileSync(archivePath, markdown);

const shouldAlert = process.env.SEND_ALERTS === '1' && (
  !smoke.ok ||
  [bookings, inquiries, analytics, seo].some((section) => (section.actions ?? []).some((item) => item.severity === 'high')) ||
  bookings.actions.some((item) => item.severity === 'high') ||
  (bookingCanary && !bookingCanary.ok)
);
let alertResult = { delivered: false, reason: 'not_requested' };

if (shouldAlert) {
  alertResult = await sendOpsAlert({
    subject: `[MrGuy Ops] ${!smoke.ok ? 'Production smoke failed' : 'High-priority booking queue items'}`,
    text: markdown,
    html: `<pre>${markdown.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]))}</pre>`,
  });
}

const result = {
  generatedAt: new Date().toISOString(),
  outputs: {
    latestPath,
    archivePath,
  },
  smoke,
  bookings,
  inquiries,
  analytics,
  seo,
  bookingCanary,
  actions,
  alertResult,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(markdown);
  console.log(`\nSaved digest to ${latestPath}`);
  console.log(`Archived digest to ${archivePath}`);
  if (process.env.SEND_ALERTS === '1') {
    console.log(`Alert delivery: ${alertResult.delivered ? 'sent' : `skipped (${alertResult.reason})`}`);
  }
}
