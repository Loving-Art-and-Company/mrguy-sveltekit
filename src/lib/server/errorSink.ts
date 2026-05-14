import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';

const ERROR_SINK_TIMEOUT_MS = 3000;

export async function sendErrorToSink(opts: {
  message: string;
  status: number;
  path: string;
  method: string;
  stack?: string;
}): Promise<void> {
  const webhookUrl = env.LEAD_SINK_WEBHOOK_URL?.replace('/webhooks/lead', '/webhooks/error');
  const webhookSecret = env.LEAD_SINK_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) return;

  const timestamp = new Date().toISOString();
  const body = JSON.stringify({
    source: 'mrguy',
    domain: 'mrguymobiledetail.com',
    message: `[${opts.status}] ${opts.method} ${opts.path} — ${opts.message}`.slice(0, 200),
    stack: opts.stack?.slice(0, 500),
    severity: opts.status >= 500 ? 'warning' : 'info',
    count: 1,
  });

  const signature = createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-lac-signature': signature,
        'x-lac-timestamp': timestamp,
        'x-lac-brand': 'mrguy',
      },
      body,
      signal: AbortSignal.timeout(ERROR_SINK_TIMEOUT_MS),
    });
  } catch {
    // fire-and-forget, never block the error response
  }
}
