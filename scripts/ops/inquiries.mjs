import { loadLocalEnv } from './env.mjs';
import { googleApiFetch } from './google-auth.mjs';

function sanitizeSnippet(value) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function getHeader(headers, name) {
  return headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ?? null;
}

function buildGmailQuery() {
  const businessEmail = process.env.MRGUY_BUSINESS_EMAIL ?? 'info@mrguymobiledetail.com';
  const monitorEmail = process.env.MRGUY_MONITOR_EMAIL ?? 'info@lovingartandcompany.com';
  return `newer_than:7d in:inbox -from:${businessEmail} -from:${monitorEmail}`;
}

async function fetchMessageIds(maxResults = 10) {
  const params = new URLSearchParams({
    q: buildGmailQuery(),
    maxResults: String(maxResults),
  });

  return googleApiFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`);
}

async function fetchMessage(messageId) {
  return googleApiFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
  );
}

export async function getInquirySnapshot() {
  loadLocalEnv();

  const listResponse = await fetchMessageIds(10);
  if (!listResponse.ok) {
    return {
      generatedAt: new Date().toISOString(),
      status: listResponse.status,
      reason: listResponse.reason,
      actions: [
        {
          severity: 'low',
          type: 'inbox_connector',
          message: 'Reconnect Google with Gmail Readonly scope to enable inquiry triage.',
        },
      ],
      recentInquiries: [],
    };
  }

  const messageIds = listResponse.data.messages ?? [];
  const messages = await Promise.all(messageIds.map((message) => fetchMessage(message.id)));
  const recentInquiries = messages
    .filter((item) => item.ok)
    .map((item) => {
      const payload = item.data.payload ?? {};
      const headers = payload.headers ?? [];
      return {
        id: item.data.id,
        threadId: item.data.threadId,
        from: getHeader(headers, 'From'),
        subject: getHeader(headers, 'Subject'),
        date: getHeader(headers, 'Date'),
        snippet: sanitizeSnippet(item.data.snippet),
      };
    });

  const actions = [];
  if (recentInquiries.length > 5) {
    actions.push({
      severity: 'medium',
      type: 'inquiry_backlog',
      message: `${recentInquiries.length} inbox inquiries were received in the last 7 days. Review for response backlog.`,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    status: 'ok',
    reason: 'Gmail inbox snapshot loaded.',
    accountEmail: listResponse.accountEmail ?? null,
    counts: {
      recent7Days: recentInquiries.length,
    },
    recentInquiries,
    actions,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const snapshot = await getInquirySnapshot();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(snapshot, null, 2));
  } else {
    console.log(`# Inquiry Snapshot`);
    console.log(`Status: ${snapshot.status}`);
    console.log(`Reason: ${snapshot.reason}`);
    console.log(`Recent inquiries: ${snapshot.counts?.recent7Days ?? 0}`);
  }
}
