import type { RequestHandler } from './$types';
import * as crmCampaignRepo from '$lib/repositories/crmCampaignRepo';
import { verifyCrmUnsubscribeToken } from '$lib/server/crmCompliance';

function pageHtml(title: string, body: string): string {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 2rem; }
      .card { max-width: 560px; margin: 4rem auto; background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
      h1 { margin-top: 0; }
      p { line-height: 1.6; color: #475569; }
      a { color: #0ea5e9; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      ${body}
    </div>
  </body>
</html>`;
}

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');
	if (!token) {
		return new Response(
			pageHtml('Invalid unsubscribe link', '<p>This unsubscribe link is missing required information.</p>'),
			{ status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } }
		);
	}

	try {
		const payload = verifyCrmUnsubscribeToken(token);
		await crmCampaignRepo.unsubscribeEmail({
			email: payload.email,
			source: 'self-service',
			reason: 'Clicked unsubscribe link',
			campaignSendId: payload.campaignSendId
		});

		return new Response(
			pageHtml(
				'You’re unsubscribed',
				`<p><strong>${payload.email}</strong> will no longer receive Mr. Guy CRM reminder campaigns.</p><p>Booking confirmations and other transactional service emails can still be sent when needed.</p>`
			),
			{ headers: { 'content-type': 'text/html; charset=utf-8' } }
		);
	} catch {
		return new Response(
			pageHtml(
				'Invalid unsubscribe link',
				'<p>This unsubscribe link is invalid or has been tampered with.</p><p>If you still want to be removed, email <a href="mailto:info@mrguymobiledetail.com">info@mrguymobiledetail.com</a>.</p>'
			),
			{ status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } }
		);
	}
};
