const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendOpsAlert({ subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.MRGUY_OPS_ALERT_TO
    ?? process.env.MRGUY_BUSINESS_EMAIL
    ?? 'info@mrguymobiledetail.com';

  if (!apiKey) {
    return {
      delivered: false,
      reason: 'missing_config',
    };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Mr. Guy Ops <info@mrguymobiledetail.com>',
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      delivered: false,
      reason: errorText || 'send_failed',
    };
  }

  return {
    delivered: true,
  };
}
