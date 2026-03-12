import fs from 'node:fs';
import path from 'node:path';
import { loadLocalEnv } from './ops/env.mjs';
import { getBookingOpsSnapshot } from './ops/bookings.mjs';
import { runSmokeSuite } from './ops/smoke.mjs';
import { sendOpsAlert } from './ops/alert.mjs';
import { getInquirySnapshot } from './ops/inquiries.mjs';
import { getAnalyticsSnapshot } from './ops/analytics.mjs';
import { getSeoSnapshot } from './ops/seo.mjs';

loadLocalEnv();

function rankActions(smoke, bookings, sections) {
  const actions = [];

  if (!smoke.ok) {
    actions.push({
      severity: 'critical',
      owner: 'Pablo',
      action: 'Review the failed production smoke checks immediately.',
    });
  }

  for (const item of bookings.actions) {
    actions.push({
      severity: item.severity,
      owner: 'Pablo',
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

function toMarkdown({ smoke, bookings, inquiries, analytics, seo, actions }) {
  const smokeLines = smoke.checks.map((check) => `- ${check.name}: ${check.status} - ${check.detail}`).join('\n');
  const actionLines = actions.map((item) => `- [${item.severity}] ${item.owner}: ${item.action}`).join('\n');
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
- Paid pending: ${bookings.counts.paidPending}
- Stale pending: ${bookings.counts.stalePending}

## Site Health
- Overall smoke status: ${smoke.ok ? 'healthy' : 'failed'}
${smokeLines}

## Lead / Booking Queue
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

## Today's Actions
${actionLines}
`;
}

const [smoke, bookings, inquiries, analytics, seo] = await Promise.all([
  runSmokeSuite(),
  getBookingOpsSnapshot(),
  getInquirySnapshot(),
  getAnalyticsSnapshot(),
  getSeoSnapshot(),
]);

const actions = rankActions(smoke, bookings, [inquiries, analytics, seo]);
const markdown = toMarkdown({ smoke, bookings, inquiries, analytics, seo, actions });

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
  bookings.actions.some((item) => item.severity === 'high')
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
