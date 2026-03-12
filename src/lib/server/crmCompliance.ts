import { createHmac, timingSafeEqual } from 'node:crypto';
import { env as privateEnv } from '$env/dynamic/private';
import { MRGUY_CANONICAL_ORIGIN } from '$lib/constants/site';

interface UnsubscribePayload {
	email: string;
	campaignSendId: string;
}

function getSecret(): string {
	const secret = privateEnv.CSRF_SECRET;
	if (!secret || secret.length < 32) {
		throw new Error('CSRF_SECRET must be at least 32 characters');
	}
	return secret;
}

function sign(payload: string): string {
	return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function safeEquals(left: string, right: string): boolean {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);
	if (leftBuffer.length !== rightBuffer.length) return false;
	return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createCrmUnsubscribeToken(email: string, campaignSendId: string): string {
	const payload = JSON.stringify({
		email: email.trim().toLowerCase(),
		campaignSendId
	} satisfies UnsubscribePayload);
	const encoded = Buffer.from(payload).toString('base64url');
	return `${encoded}.${sign(encoded)}`;
}

export function createCrmUnsubscribeUrl(email: string, campaignSendId: string): string {
	const token = createCrmUnsubscribeToken(email, campaignSendId);
	return `${MRGUY_CANONICAL_ORIGIN}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function verifyCrmUnsubscribeToken(token: string): UnsubscribePayload {
	const [encoded, signature] = token.split('.');
	if (!encoded || !signature) {
		throw new Error('Invalid unsubscribe token');
	}

	const expected = sign(encoded);
	if (!safeEquals(signature, expected)) {
		throw new Error('Invalid unsubscribe signature');
	}

	const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<UnsubscribePayload>;
	if (!parsed.email || !parsed.campaignSendId) {
		throw new Error('Invalid unsubscribe payload');
	}

	return {
		email: parsed.email.trim().toLowerCase(),
		campaignSendId: parsed.campaignSendId
	};
}
